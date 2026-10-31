from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    Application, Document, DocumentStatus, ApplicationStatus,
    ApplicationRiskAssessment, EVCSchedule, ComplianceObligation,
    ValidityDocument
)

# Checklist template by application category
CATEGORY_DOCUMENT_REQUIREMENTS = {
    "Introduction of a New Course or Programme": [
        {
            "name": "Governing Body Resolution & Academic Council Approval",
            "requirement_code": "GB_RESOLUTION",
            "is_mandatory": True,
            "description": "Certified resolution copy specifying sanction for new program introduction"
        },
        {
            "name": "Detailed Project Report (DPR) & Syllabus Structure",
            "requirement_code": "DPR_SYLLABUS",
            "is_mandatory": True,
            "description": "Comprehensive feasibility report, course curriculum, and industry need analysis"
        },
        {
            "name": "Faculty Cadre Ratio & Qualification Undertaking",
            "requirement_code": "FACULTY_CADRE",
            "is_mandatory": True,
            "description": "Form 16/Cadre details verifying adherence to 1:15 or 1:20 teacher-student ratio"
        },
        {
            "name": "Laboratory Equipment & Space Allocation Certificate",
            "requirement_code": "LAB_EQUIPMENT",
            "is_mandatory": True,
            "description": "Architect endorsed blueprint for dedicated instructional computer lab/workshops"
        }
    ],
    "Infrastructure or Facility Request": [
        {
            "name": "Architectural Layout & Floor Area Certificate",
            "requirement_code": "ARCH_LAYOUT",
            "is_mandatory": True,
            "description": "Approved building master plan showing proposed computer lab / facility dimensions"
        },
        {
            "name": "Equipment Purchase Invoices & Quotations",
            "requirement_code": "EQUIPMENT_BILLS",
            "is_mandatory": True,
            "description": "Proof of procurement for computer systems, networking hardware, UPS & licencing"
        },
        {
            "name": "Electrical Load & Fire Safety Endorsement",
            "requirement_code": "FIRE_SAFETY",
            "is_mandatory": True,
            "description": "NOC and power sanction certificate for proposed computer center load"
        }
    ],
    "Extension of Approval": [
        {
            "name": "Audited Financial Statements (Last 2 FYs)",
            "requirement_code": "FINANCIAL_AUDIT",
            "is_mandatory": True,
            "description": "Audited balance sheet and income/expenditure account by Chartered Accountant"
        },
        {
            "name": "Faculty Regularity & Biometric/Salary Disbursement Proof",
            "requirement_code": "FACULTY_PAYROLL",
            "is_mandatory": True,
            "description": "Bank disbursement statement reflecting 7th CPC scale compliance"
        },
        {
            "name": "Mandatory Disclosures & Anti-Ragging Affidavit",
            "requirement_code": "MANDATORY_DISCLOSURE",
            "is_mandatory": True,
            "description": "Uploaded public disclosure confirmation and compliance affidavits"
        }
    ],
    "New Institution": [
        {
            "name": "Registered Land Lease / Title Deed",
            "requirement_code": "LAND_TITLE",
            "is_mandatory": True,
            "description": "Minimum 30-year registered lease deed or ownership title in trust name"
        },
        {
            "name": "Approved Master Plan & Building Completion Certificate",
            "requirement_code": "BUILDING_COMPLETION",
            "is_mandatory": True,
            "description": "Town Planning authority sanctioned layout and structural safety certificate"
        },
        {
            "name": "Corpus Fund Fixed Deposit Proof",
            "requirement_code": "CORPUS_FUND",
            "is_mandatory": True,
            "description": "Joint fixed deposit receipt in name of AICTE and applicant trust"
        }
    ]
}

# Benchmark stage targets (in days)
STAGE_TARGET_DAYS = {
    "Scrutiny": 7.0,
    "EVC": 14.0,
    "SAC/SHC Review": 7.0,
    "Decision": 5.0
}

# Configurable Weights & Thresholds
FACTOR_WEIGHTS = {
    "MISSING_MANDATORY_DOCUMENTS": 25.0,
    "OUTSTANDING_DEFICIENCIES": 30.0,
    "STAGE_DWELL_OVER_TARGET": 20.0,
    "APPROACHING_OR_PASSED_DEADLINE": 25.0,
    "PENDING_EVC_INSPECTION": 15.0,
    "UNASSIGNED_TASK_OR_OWNER": 15.0
}

def calculate_application_risk(app: Application, db: Optional[Session] = None) -> Dict[str, Any]:
    factors = []
    data_limitations = []
    total_score = 0.0

    # 1. Missing Mandatory Documents
    mandatory_docs = [d for d in app.documents if d.is_mandatory]
    missing_docs = [d for d in mandatory_docs if d.status == DocumentStatus.NOT_SUBMITTED]
    if len(mandatory_docs) == 0:
        data_limitations.append("Checklist requirements not initialized for this application category.")
    elif len(missing_docs) > 0:
        contribution = min(len(missing_docs) * 12.0, FACTOR_WEIGHTS["MISSING_MANDATORY_DOCUMENTS"])
        total_score += contribution
        factors.append({
            "factor_name": "Missing Required Documents",
            "weight": FACTOR_WEIGHTS["MISSING_MANDATORY_DOCUMENTS"],
            "observed_value": f"{len(missing_docs)} of {len(mandatory_docs)} mandatory documents unsubmitted",
            "contribution": round(contribution, 1),
            "evidence_source": f"Documents pending upload: {', '.join([d.name for d in missing_docs[:2]])}{'...' if len(missing_docs) > 2 else ''}",
            "clickable_type": "DOCUMENT_CHECKLIST",
            "clickable_id": missing_docs[0].id if missing_docs else None,
            "severity": "HIGH" if contribution > 15 else "MEDIUM"
        })

    # 2. Outstanding Document Deficiencies (Returned for correction)
    deficiency_docs = [d for d in app.documents if d.status == DocumentStatus.CORRECTION_REQUIRED]
    if len(deficiency_docs) > 0:
        contribution = min(len(deficiency_docs) * 20.0, FACTOR_WEIGHTS["OUTSTANDING_DEFICIENCIES"])
        total_score += contribution
        sample_reasons = "; ".join([f"{d.name}: {d.deficiency_reason}" for d in deficiency_docs[:2] if d.deficiency_reason])
        factors.append({
            "factor_name": "Outstanding Document Deficiencies",
            "weight": FACTOR_WEIGHTS["OUTSTANDING_DEFICIENCIES"],
            "observed_value": f"{len(deficiency_docs)} document(s) returned with scrutiny deficiencies",
            "contribution": round(contribution, 1),
            "evidence_source": sample_reasons or f"{len(deficiency_docs)} replacement files awaited from institution",
            "clickable_type": "DOCUMENT_DEFICIENCY",
            "clickable_id": deficiency_docs[0].id if deficiency_docs else None,
            "severity": "CRITICAL"
        })

    # 3. Time spent in current workflow stage vs Target SLA
    stage_target = STAGE_TARGET_DAYS.get(app.current_stage, 7.0)
    days_elapsed = (datetime.utcnow() - (app.last_updated_at or app.submitted_at)).days
    if days_elapsed > stage_target:
        excess_days = days_elapsed - stage_target
        contribution = min(excess_days * 3.5, FACTOR_WEIGHTS["STAGE_DWELL_OVER_TARGET"])
        total_score += contribution
        factors.append({
            "factor_name": "Stage Dwell Exceeding SLA Benchmark",
            "weight": FACTOR_WEIGHTS["STAGE_DWELL_OVER_TARGET"],
            "observed_value": f"{days_elapsed} days in {app.current_stage} (Target SLA: {stage_target:.0f} days)",
            "contribution": round(contribution, 1),
            "evidence_source": f"Idle queue duration exceeded benchmark by {excess_days} day(s)",
            "clickable_type": "STAGE_HISTORY",
            "clickable_id": app.id,
            "severity": "HIGH" if contribution > 10 else "MODERATE"
        })

    # 4. Approaching or Passed Deadline
    if app.deadline:
        time_diff = app.deadline - datetime.utcnow()
        days_left = time_diff.total_seconds() / 86400.0
        if days_left < 0:
            contribution = FACTOR_WEIGHTS["APPROACHING_OR_PASSED_DEADLINE"]
            total_score += contribution
            factors.append({
                "factor_name": "Official Statutory Deadline Overdue",
                "weight": FACTOR_WEIGHTS["APPROACHING_OR_PASSED_DEADLINE"],
                "observed_value": f"Lapsed by {abs(int(days_left))} day(s)",
                "contribution": round(contribution, 1),
                "evidence_source": f"Target deadline date {app.deadline.strftime('%Y-%m-%d')} has elapsed",
                "clickable_type": "DEADLINE",
                "clickable_id": app.id,
                "severity": "CRITICAL"
            })
        elif days_left <= 3:
            contribution = 15.0
            total_score += contribution
            factors.append({
                "factor_name": "Approaching Processing Deadline",
                "weight": FACTOR_WEIGHTS["APPROACHING_OR_PASSED_DEADLINE"],
                "observed_value": f"{days_left:.1f} days remaining",
                "contribution": round(contribution, 1),
                "evidence_source": f"Deadline scheduled on {app.deadline.strftime('%Y-%m-%d')}",
                "clickable_type": "DEADLINE",
                "clickable_id": app.id,
                "severity": "HIGH"
            })

    # 5. Pending EVC Inspection
    if app.current_stage == "EVC" or app.status == ApplicationStatus.EVC_SCHEDULED:
        contribution = 12.0
        total_score += contribution
        factors.append({
            "factor_name": "EVC Inspection Coordination Pending",
            "weight": FACTOR_WEIGHTS["PENDING_EVC_INSPECTION"],
            "observed_value": "Physical/Virtual Expert Visit Committee stage active",
            "contribution": round(contribution, 1),
            "evidence_source": "Inspection visit report awaiting conclusion and panel upload",
            "clickable_type": "EVC_SCHEDULE",
            "clickable_id": app.id,
            "severity": "MODERATE"
        })

    # 6. Task without Assigned Owner
    if not app.assigned_officer_id and app.status not in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
        contribution = 10.0
        total_score += contribution
        factors.append({
            "factor_name": "Unassigned Case in Bureau Queue",
            "weight": FACTOR_WEIGHTS["UNASSIGNED_TASK_OR_OWNER"],
            "observed_value": "No specific reviewing officer assigned",
            "contribution": round(contribution, 1),
            "evidence_source": "Case remains in unassigned pool awaiting regional bureau lead assignment",
            "clickable_type": "OFFICER_ASSIGNMENT",
            "clickable_id": app.id,
            "severity": "MODERATE"
        })

    final_score = min(max(total_score, 5.0), 98.0)

    if final_score >= 75.0:
        category = "CRITICAL"
    elif final_score >= 50.0:
        category = "HIGH"
    elif final_score >= 25.0:
        category = "MODERATE"
    else:
        category = "LOW"

    baseline_days = 14.0
    delay_factors_days = 0.0
    if len(deficiency_docs) > 0:
        delay_factors_days += len(deficiency_docs) * 5.0
    if len(missing_docs) > 0:
        delay_factors_days += len(missing_docs) * 3.0
    if days_elapsed > stage_target:
        delay_factors_days += (days_elapsed - stage_target) * 0.7

    estimated_additional_delay = round(delay_factors_days, 1)
    estimated_completion_date = datetime.utcnow() + timedelta(days=max(baseline_days + delay_factors_days - days_elapsed, 2.0))

    if len(deficiency_docs) > 0:
        rec_action = f"Remind institution to submit replacement documents for: {deficiency_docs[0].name}"
    elif len(missing_docs) > 0:
        rec_action = f"Require initial upload of mandatory checklist file: {missing_docs[0].name}"
    elif not app.assigned_officer_id:
        rec_action = "Assign regional scrutiny officer to prevent case idle-time"
    elif app.current_stage == "EVC" and app.status == ApplicationStatus.EVC_SCHEDULED:
        rec_action = "Coordinate with EVC Panel Lead to finalize on-site inspection date"
    elif app.status == ApplicationStatus.RESUBMITTED:
        rec_action = "Conduct re-scrutiny on newly uploaded document versions"
    else:
        rec_action = "Complete scrutiny review and record requirement verification decisions"

    if not factors:
        factors.append({
            "factor_name": "Standard Operational Flow",
            "weight": 0.0,
            "observed_value": "All mandatory requirements verified or submitted on time",
            "contribution": 0.0,
            "evidence_source": "No adverse delays or overdue criteria detected in current stage",
            "clickable_type": "GENERAL",
            "clickable_id": app.id,
            "severity": "LOW"
        })

    return {
        "risk_score": round(final_score, 1),
        "risk_category": category,
        "estimated_delay_days": estimated_additional_delay,
        "estimated_completion_date": estimated_completion_date,
        "delay_estimation_method": "Rule-based estimate — not a statistically validated prediction",
        "factors": factors,
        "data_quality_limitations": data_limitations,
        "recommended_action": rec_action,
        "rule_version": "v2.1-ExplainableEngine",
        "assessed_at": datetime.utcnow()
    }

def record_application_risk_assessment(db: Session, app: Application) -> ApplicationRiskAssessment:
    assessment_data = calculate_application_risk(app, db)
    
    assessment = ApplicationRiskAssessment(
        application_id=app.id,
        risk_score=assessment_data["risk_score"],
        risk_category=assessment_data["risk_category"],
        estimated_delay_days=assessment_data["estimated_delay_days"],
        estimated_completion_date=assessment_data["estimated_completion_date"],
        delay_estimation_method=assessment_data["delay_estimation_method"],
        factors=assessment_data["factors"],
        data_quality_limitations=assessment_data["data_quality_limitations"],
        recommended_action=assessment_data["recommended_action"],
        rule_version=assessment_data["rule_version"],
        assessed_at=datetime.utcnow()
    )
    db.add(assessment)
    
    app.risk_score = assessment_data["risk_score"]
    app.risk_level = assessment_data["risk_category"]
    app.risk_reasons = [f["factor_name"] + ": " + f["observed_value"] for f in assessment_data["factors"][:3]]
    app.last_updated_at = datetime.utcnow()
    
    return assessment

# Legacy alias for backward compatibility
compute_delay_risk = calculate_application_risk
