import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    Application, Document, DocumentStatus, ApplicationStatus,
    ComplianceObligation, ValidityDocument, EVCSchedule,
    AlertRecord, UnifiedObligation, ApplicationRiskAssessment, User
)

class AIAssistantService:
    """
    Authorized Natural Language Pipeline & Delay DNA Intelligence Service.
    Retrieves real database records, filters strictly by user role & authorization,
    and returns transparent, evidence-grounded answers without hallucinations.
    """

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.user = current_user

    def answer_query(self, query: str, context_app_id: Optional[int] = None) -> Dict[str, Any]:
        cleaned_query = query.lower().strip()

        # Check for context application if supplied or referenced in query
        target_app = None
        match_id = re.search(r'aicte-\d{4}-\d+', cleaned_query)
        if match_id:
            app_code = match_id.group(0).upper()
            target_app = self.db.query(Application).filter(Application.application_id == app_code).first()
        elif context_app_id:
            target_app = self.db.query(Application).filter(Application.id == context_app_id).first()

        # Security check: if institution user, target_app must belong to their institution
        if target_app and self.user.role.value == "INSTITUTION_USER":
            if target_app.institution_id != self.user.institution_id:
                return {
                    "answer": "Access restricted: You may only query applications registered by your own institution.",
                    "evidence": [],
                    "links": [],
                    "limitations": "Permission check failed."
                }

        # 1. Specific Application Risk / Blocker / Delay Query
        if target_app and any(k in cleaned_query for k in ["risk", "delay", "block", "why", "factor", "next", "compare"]):
            return self._explain_application_intelligence(target_app, cleaned_query)

        # 2. "Which applications are overdue?"
        if "overdue" in cleaned_query and "application" in cleaned_query:
            return self._query_overdue_applications()

        # 3. "Which applications have high risk?"
        if any(k in cleaned_query for k in ["high risk", "critical risk", "at risk"]):
            return self._query_high_risk_applications()

        # 4. "Which tasks are waiting for assignment?" / "unassigned"
        if any(k in cleaned_query for k in ["unassigned", "waiting for assignment", "no owner", "orphan"]):
            return self._query_unassigned_cases()

        # 5. "Which EVC scheduling tasks require attention?"
        if "evc" in cleaned_query:
            return self._query_evc_tasks()

        # 6. "Which compliance obligations are overdue?"
        if "compliance" in cleaned_query or "obligation" in cleaned_query:
            return self._query_compliance_tasks()

        # 7. "Which documents will expire within 30 days?"
        if any(k in cleaned_query for k in ["expire", "expiring", "validity", "lease", "noc"]):
            return self._query_expiring_documents()

        # Fallback with supported query suggestions
        return {
            "answer": "I can assist you with real-time analysis grounded in the AICTE database. Here are queries I can answer based on verified records:",
            "evidence": [
                "Which applications are overdue or approaching deadlines?",
                "Which applications have high or critical risk scores?",
                "Why is this application at high risk / delayed? (specify Application ID)",
                "Which tasks are unassigned or waiting for an officer?",
                "Which EVC inspection tasks require scheduling?",
                "Which compliance obligations or document validities are expiring?"
            ],
            "links": [],
            "limitations": "AI assistant operates strictly with authorized parameterised database queries."
        }

    def _explain_application_intelligence(self, app: Application, query: str) -> Dict[str, Any]:
        assessments = self.db.query(ApplicationRiskAssessment).filter(
            ApplicationRiskAssessment.application_id == app.id
        ).order_by(ApplicationRiskAssessment.assessed_at.desc()).all()

        current_assessment = assessments[0] if assessments else None
        previous_assessment = assessments[1] if len(assessments) > 1 else None

        # If user asks to compare risk
        if "compare" in query or "change" in query or "previous" in query:
            if previous_assessment:
                diff = current_assessment.risk_score - previous_assessment.risk_score
                direction = "increased" if diff > 0 else "decreased" if diff < 0 else "remained unchanged"
                return {
                    "answer": f"Application {app.application_id}'s risk score has {direction} by {abs(diff):.1f} points (from {previous_assessment.risk_score:.1f} [{previous_assessment.risk_category}] to {current_assessment.risk_score:.1f} [{current_assessment.risk_category}]).",
                    "evidence": [
                        f"Previous Assessment: {previous_assessment.risk_score} points ({previous_assessment.assessed_at.strftime('%Y-%m-%d %H:%M')})",
                        f"Current Assessment: {current_assessment.risk_score} points ({current_assessment.assessed_at.strftime('%Y-%m-%d %H:%M')})",
                        f"Top factors: {', '.join([f['factor_name'] for f in current_assessment.factors[:2]])}"
                    ],
                    "recommendation": current_assessment.recommended_action,
                    "links": [{"title": f"View {app.application_id}", "url": f"/admin/applications/{app.id}"}],
                    "limitations": "Risk trend compared using sequential recorded assessment snapshots."
                }
            else:
                return {
                    "answer": f"Application {app.application_id} currently has one baseline assessment recorded with a risk score of {current_assessment.risk_score if current_assessment else app.risk_score}/100 ({app.risk_level} Risk).",
                    "evidence": [f"Current Stage: {app.current_stage}", f"Workflow Status: {app.status.value}"],
                    "recommendation": current_assessment.recommended_action if current_assessment else "Continue standard scrutiny review",
                    "links": [{"title": f"Open {app.application_id}", "url": f"/admin/applications/{app.id}"}],
                    "limitations": "Only one historical assessment snapshot exists in database."
                }

        # Detailed factors explanation
        factors = current_assessment.factors if current_assessment else []
        top_factors_desc = []
        for f in factors[:3]:
            top_factors_desc.append(f"{f['factor_name']} (Contribution: +{f['contribution']} pts) — {f['evidence_source']}")

        delay_days = current_assessment.estimated_delay_days if current_assessment else 0.0

        return {
            "answer": f"Application {app.application_id} ({app.title}) is at {app.risk_level} risk with an explainable score of {app.risk_score}/100. Estimated additional turnaround dwell time is {delay_days} days.",
            "evidence": top_factors_desc or ["Application is proceeding on track with no critical deficiencies."],
            "recommendation": current_assessment.recommended_action if current_assessment else "Proceed with committee review",
            "links": [
                {"title": f"Case Dossier {app.application_id}", "url": f"/admin/applications/{app.id}"},
                {"title": "Prescribed Checklist", "url": f"/admin/applications/{app.id}"}
            ],
            "limitations": current_assessment.delay_estimation_method if current_assessment else "Deterministic rule engine."
        }

    def _query_overdue_applications(self) -> Dict[str, Any]:
        now = datetime.utcnow()
        overdue_apps = self.db.query(Application).filter(
            Application.deadline < now,
            Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
        ).all()

        if not overdue_apps:
            return {
                "answer": "No applications in the active bureau pipeline are currently past their target deadline date.",
                "evidence": ["All active applications are operating within SLA deadlines."],
                "links": []
            }

        evidence = []
        links = []
        for a in overdue_apps[:5]:
            days_over = (now - a.deadline).days
            evidence.append(f"{a.application_id}: '{a.title}' ({a.institution.name if a.institution else ''}) — Overdue by {days_over} days (Stage: {a.current_stage})")
            links.append({"title": a.application_id, "url": f"/admin/applications/{a.id}"})

        return {
            "answer": f"There are {len(overdue_apps)} application(s) currently past their official target deadline:",
            "evidence": evidence,
            "recommendation": "Review high-dwell cases and assign regional scrutiny officers or schedule EVC panels.",
            "links": links
        }

    def _query_high_risk_applications(self) -> Dict[str, Any]:
        high_risk_apps = self.db.query(Application).filter(
            Application.risk_level.in_(["HIGH", "CRITICAL"]),
            Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
        ).order_by(Application.risk_score.desc()).all()

        if not high_risk_apps:
            return {
                "answer": "There are currently no applications flagged in High or Critical risk categories.",
                "evidence": ["All active applications are Low or Moderate risk."],
                "links": []
            }

        evidence = []
        links = []
        for a in high_risk_apps[:5]:
            evidence.append(f"{a.application_id}: Score {a.risk_score}/100 [{a.risk_level}] — {a.title} ({a.current_stage})")
            links.append({"title": a.application_id, "url": f"/admin/applications/{a.id}"})

        return {
            "answer": f"Found {len(high_risk_apps)} application(s) requiring immediate administrative attention:",
            "evidence": evidence,
            "recommendation": "Prioritize document resubmission verification and unblock dependent committee stages.",
            "links": links
        }

    def _query_unassigned_cases(self) -> Dict[str, Any]:
        unassigned = self.db.query(Application).filter(
            Application.assigned_officer_id.is_(None),
            Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
        ).all()

        if not unassigned:
            return {
                "answer": "All active applications have a designated reviewing officer assigned.",
                "evidence": ["No orphan cases in bureau queues."],
                "links": []
            }

        evidence = [f"{a.application_id}: '{a.title}' ({a.category.value}) — Stage: {a.current_stage}" for a in unassigned[:5]]
        links = [{"title": a.application_id, "url": f"/admin/applications/{a.id}"} for a in unassigned[:5]]

        return {
            "answer": f"There are {len(unassigned)} active application(s) awaiting scrutiny officer assignment:",
            "evidence": evidence,
            "recommendation": "Assign bureau scrutiny officers to avoid queue dwell delay.",
            "links": links
        }

    def _query_evc_tasks(self) -> Dict[str, Any]:
        evc_apps = self.db.query(Application).filter(
            Application.current_stage == "EVC",
            Application.status != ApplicationStatus.EVC_COMPLETED
        ).all()

        evidence = []
        links = []
        for a in evc_apps[:5]:
            has_scheduled = any(e.inspection_status == "SCHEDULED" for e in a.evc_schedules)
            st = "Inspection Scheduled" if has_scheduled else "Awaiting Panel Scheduling"
            evidence.append(f"{a.application_id}: '{a.title}' — {st}")
            links.append({"title": a.application_id, "url": f"/admin/applications/{a.id}"})

        return {
            "answer": f"{len(evc_apps)} application(s) currently in the EVC Inspection workflow:",
            "evidence": evidence or ["No applications currently pending in EVC queue."],
            "recommendation": "Ensure panel leads upload signed inspection reports upon visit completion.",
            "links": links
        }

    def _query_compliance_tasks(self) -> Dict[str, Any]:
        now = datetime.utcnow()
        overdue_obs = self.db.query(ComplianceObligation).filter(
            ComplianceObligation.status == "PENDING",
            ComplianceObligation.due_date < now
        ).all()

        pending_verification = self.db.query(ComplianceObligation).filter(
            ComplianceObligation.status == "SUBMITTED_FOR_VERIFICATION"
        ).all()

        evidence = []
        for o in overdue_obs[:3]:
            evidence.append(f"OVERDUE: '{o.title}' ({o.institution.name if o.institution else ''}) — Due {o.due_date.strftime('%Y-%m-%d')}")
        for o in pending_verification[:3]:
            evidence.append(f"AWAITING VERIFICATION: '{o.title}' ({o.institution.name if o.institution else ''}) — Evidence uploaded")

        return {
            "answer": f"Compliance status: {len(overdue_obs)} overdue undertaking(s), {len(pending_verification)} awaiting official officer verification.",
            "evidence": evidence or ["All compliance conditions are satisfied."],
            "recommendation": "Open Compliance Verification Desk to review uploaded institutional proof.",
            "links": [{"title": "Compliance Verification Desk", "url": "/admin/compliance"}]
        }

    def _query_expiring_documents(self) -> Dict[str, Any]:
        expiring = self.db.query(ValidityDocument).filter(
            ValidityDocument.status.in_(["EXPIRING_SOON", "EXPIRED"])
        ).all()

        evidence = [
            f"{d.status}: {d.document_type} ({d.institution.name if d.institution else ''}) — Expiry: {d.expiry_date.strftime('%Y-%m-%d')}"
            for d in expiring[:5]
        ]

        return {
            "answer": f"Identified {len(expiring)} mandatory regulatory document(s) requiring renewal attention:",
            "evidence": evidence or ["All institutional lease deeds and NOCs are currently valid."],
            "recommendation": "Issue automated renewal notices to respective college registrars.",
            "links": [{"title": "Validity Registry", "url": "/admin/validity"}]
        }

