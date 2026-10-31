import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    Application, Document, DocumentStatus, ApplicationStatus,
    ComplianceObligation, ValidityDocument, EVCSchedule,
    AlertRecord, AlertPolicy, AlertSeverity, AlertStatus,
    Notification, EscalationEvent, UnifiedObligation, User, UserRole,
    AuditEvent
)

logger = logging.getLogger(__name__)

# Default Baseline Policies
DEFAULT_POLICIES = [
    {
        "policy_code": "POL_APP_OVERDUE",
        "name": "Application Processing Deadline Overdue",
        "category": "APPLICATION_WORKFLOW",
        "warning_days_before": 3,
        "overdue_threshold_hours": 0,
        "escalation_delay_hours": 24,
        "responsible_role": "AICTE_OFFICER",
        "next_escalation_role": "AICTE_ADMIN",
        "reminder_frequency_hours": 24,
        "max_reminders": 3,
        "requires_acknowledgement": True,
        "is_statutory": True
    },
    {
        "policy_code": "POL_DOC_DEFICIENCY",
        "name": "Outstanding Correction Required from Institution",
        "category": "APPLICATION_WORKFLOW",
        "warning_days_before": 2,
        "overdue_threshold_hours": 72,
        "escalation_delay_hours": 48,
        "responsible_role": "INSTITUTION_USER",
        "next_escalation_role": "AICTE_OFFICER",
        "reminder_frequency_hours": 24,
        "max_reminders": 3,
        "requires_acknowledgement": False,
        "is_statutory": False
    },
    {
        "policy_code": "POL_EVC_UNSCHEDULED",
        "name": "EVC Inspection Scheduling Pending",
        "category": "EVC_SCHEDULING",
        "warning_days_before": 4,
        "overdue_threshold_hours": 96,
        "escalation_delay_hours": 48,
        "responsible_role": "EVC_COORDINATOR",
        "next_escalation_role": "AICTE_ADMIN",
        "reminder_frequency_hours": 24,
        "max_reminders": 3,
        "requires_acknowledgement": True,
        "is_statutory": False
    },
    {
        "policy_code": "POL_COMPLIANCE_OVERDUE",
        "name": "Post-Approval Compliance Undertaking Overdue",
        "category": "COMPLIANCE",
        "warning_days_before": 7,
        "overdue_threshold_hours": 0,
        "escalation_delay_hours": 72,
        "responsible_role": "INSTITUTION_USER",
        "next_escalation_role": "AICTE_OFFICER",
        "reminder_frequency_hours": 24,
        "max_reminders": 3,
        "requires_acknowledgement": True,
        "is_statutory": True
    },
    {
        "policy_code": "POL_DOC_EXPIRING",
        "name": "Mandatory Regulatory Document Approaching Expiry (Lease/NOC)",
        "category": "DOCUMENT_VALIDITY",
        "warning_days_before": 60,
        "overdue_threshold_hours": 0,
        "escalation_delay_hours": 168, # 7 days
        "responsible_role": "INSTITUTION_USER",
        "next_escalation_role": "AICTE_ADMIN",
        "reminder_frequency_hours": 72,
        "max_reminders": 5,
        "requires_acknowledgement": False,
        "is_statutory": True
    },
    {
        "policy_code": "POL_ORPHAN_TASK",
        "name": "Unassigned Case or Prerequisite Blocked Task",
        "category": "OPERATIONAL",
        "warning_days_before": 0,
        "overdue_threshold_hours": 48,
        "escalation_delay_hours": 24,
        "responsible_role": "AICTE_ADMIN",
        "next_escalation_role": "AICTE_ADMIN",
        "reminder_frequency_hours": 24,
        "max_reminders": 3,
        "requires_acknowledgement": True,
        "is_statutory": False
    }
]

def ensure_default_policies(db: Session):
    for p in DEFAULT_POLICIES:
        existing = db.query(AlertPolicy).filter(AlertPolicy.policy_code == p["policy_code"]).first()
        if not existing:
            rec = AlertPolicy(**p)
            db.add(rec)
    db.commit()

class AlertMonitoringService:
    """
    Automated alert engine that monitors actual database conditions with strict idempotency.
    Running repeated scheduler cycles never creates duplicate alerts for the same condition.
    """

    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_alert(
        self,
        idempotency_key: str,
        policy_code: str,
        category: str,
        title: str,
        description: str,
        severity: AlertSeverity,
        target_role: str,
        trigger_reason: str,
        recommended_action: str,
        app_id: Optional[int] = None,
        inst_id: Optional[int] = None,
        assigned_user_id: Optional[int] = None,
        due_date: Optional[datetime] = None
    ) -> AlertRecord:
        alert = self.db.query(AlertRecord).filter(AlertRecord.idempotency_key == idempotency_key).first()
        if alert:
            # Update last checked timestamp without creating duplicate
            alert.last_checked_at = datetime.utcnow()
            return alert

        alert = AlertRecord(
            idempotency_key=idempotency_key,
            policy_code=policy_code,
            category=category,
            title=title,
            description=description,
            severity=severity,
            status=AlertStatus.OPEN,
            application_id=app_id,
            institution_id=inst_id,
            target_role=target_role,
            assigned_user_id=assigned_user_id,
            due_date=due_date,
            trigger_reason=trigger_reason,
            recommended_action=recommended_action,
            created_at=datetime.utcnow(),
            last_checked_at=datetime.utcnow()
        )
        self.db.add(alert)
        self.db.flush()

        # Generate persistent notification linked to this alert
        notif = Notification(
            recipient_user_id=assigned_user_id,
            institution_id=inst_id if target_role == "INSTITUTION_USER" else None,
            title=title,
            message=description,
            type="ACTION_REQUIRED" if severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL] else "INFO",
            category=category,
            priority=severity.value,
            alert_id=alert.id,
            recommended_action=recommended_action,
            due_date=due_date,
            link=f"/admin/applications/{app_id}" if target_role != "INSTITUTION_USER" and app_id else f"/institution/applications/{app_id}" if app_id else None,
            created_at=datetime.utcnow()
        )
        self.db.add(notif)
        return alert

    def run_all_monitors(self) -> Dict[str, Any]:
        ensure_default_policies(self.db)
        summary = {
            "overdue_applications": 0,
            "approaching_deadlines": 0,
            "unresolved_deficiencies": 0,
            "evc_scheduling_tasks": 0,
            "compliance_obligations": 0,
            "document_expiries": 0,
            "orphan_tasks": 0,
            "escalations_executed": 0
        }

        now = datetime.utcnow()

        # 1. APPLICATION WORKFLOW: Overdue and Approaching Deadlines
        active_apps = self.db.query(Application).filter(
            Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
        ).all()

        for app in active_apps:
            if app.deadline:
                time_to_deadline = app.deadline - now
                if time_to_deadline.total_seconds() < 0:
                    # OVERDUE
                    key = f"ALERT_OVERDUE_APP_{app.id}_{app.deadline.strftime('%Y%m%d')}"
                    self._get_or_create_alert(
                        idempotency_key=key,
                        policy_code="POL_APP_OVERDUE",
                        category="APPLICATION_WORKFLOW",
                        title=f"Application Overdue: {app.application_id}",
                        description=f"Processing timeline has elapsed target SLA deadline of {app.deadline.strftime('%Y-%m-%d')} for {app.title}.",
                        severity=AlertSeverity.CRITICAL,
                        target_role="AICTE_OFFICER",
                        trigger_reason=f"Deadline passed by {abs(int(time_to_deadline.total_seconds() / 86400))} day(s)",
                        recommended_action="Expedite review decision or transition to next committee stage",
                        app_id=app.id,
                        inst_id=app.institution_id,
                        assigned_user_id=app.assigned_officer_id,
                        due_date=app.deadline
                    )
                    summary["overdue_applications"] += 1
                elif time_to_deadline.total_seconds() <= 3 * 86400:
                    # APPROACHING DEADLINE (<= 3 days)
                    key = f"ALERT_WARN_APP_{app.id}_{app.deadline.strftime('%Y%m%d')}"
                    self._get_or_create_alert(
                        idempotency_key=key,
                        policy_code="POL_APP_OVERDUE",
                        category="APPLICATION_WORKFLOW",
                        title=f"Deadline Approaching: {app.application_id}",
                        description=f"Only {int(time_to_deadline.total_seconds() / 86400)} day(s) remaining until target turnaround deadline.",
                        severity=AlertSeverity.HIGH,
                        target_role="AICTE_OFFICER",
                        trigger_reason="Approaching deadline threshold (< 3 days)",
                        recommended_action="Complete pending scrutiny verifications",
                        app_id=app.id,
                        inst_id=app.institution_id,
                        assigned_user_id=app.assigned_officer_id,
                        due_date=app.deadline
                    )
                    summary["approaching_deadlines"] += 1

            # Check corrections awaiting institutional action
            if app.status == ApplicationStatus.CORRECTION_REQUIRED:
                key = f"ALERT_CORRECTION_REQ_{app.id}_{app.last_updated_at.strftime('%Y%m%d') if app.last_updated_at else 'init'}"
                self._get_or_create_alert(
                    idempotency_key=key,
                    policy_code="POL_DOC_DEFICIENCY",
                    category="APPLICATION_WORKFLOW",
                    title=f"Deficiencies Awaiting Correction: {app.application_id}",
                    description=f"Scrutiny officer flagged requirements requiring institutional replacement upload.",
                    severity=AlertSeverity.HIGH,
                    target_role="INSTITUTION_USER",
                    trigger_reason="Application transitioned to CORRECTION_REQUIRED",
                    recommended_action="Upload replacement documents addressing officer observations",
                    app_id=app.id,
                    inst_id=app.institution_id,
                    due_date=now + timedelta(days=5)
                )
                summary["unresolved_deficiencies"] += 1

        # 2. EVC SCHEDULING: Applications eligible for EVC but not scheduled
        evc_eligible = self.db.query(Application).filter(
            Application.current_stage == "EVC",
            Application.status != ApplicationStatus.EVC_COMPLETED
        ).all()

        for app in evc_eligible:
            has_scheduled_evc = any(e.inspection_status == "SCHEDULED" for e in app.evc_schedules)
            if not has_scheduled_evc:
                key = f"ALERT_EVC_UNSCHEDULED_{app.id}"
                self._get_or_create_alert(
                    idempotency_key=key,
                    policy_code="POL_EVC_UNSCHEDULED",
                    category="EVC_SCHEDULING",
                    title=f"EVC Inspection Requires Scheduling: {app.application_id}",
                    description=f"Application in EVC stage awaiting expert committee nomination and inspection date allocation.",
                    severity=AlertSeverity.HIGH,
                    target_role="EVC_COORDINATOR",
                    trigger_reason="Current stage is EVC but no active inspection is scheduled",
                    recommended_action="Nominate panel members and fix physical/virtual inspection date",
                    app_id=app.id,
                    inst_id=app.institution_id
                )
                summary["evc_scheduling_tasks"] += 1

        # 3. INSTITUTIONAL COMPLIANCE: Overdue & Upcoming Obligations
        obligations = self.db.query(ComplianceObligation).all()
        for ob in obligations:
            if ob.status == "PENDING":
                time_left = ob.due_date - now
                if time_left.total_seconds() < 0:
                    key = f"ALERT_OBL_OVERDUE_{ob.id}_{ob.due_date.strftime('%Y%m%d')}"
                    self._get_or_create_alert(
                        idempotency_key=key,
                        policy_code="POL_COMPLIANCE_OVERDUE",
                        category="COMPLIANCE",
                        title=f"Compliance Obligation Overdue: {ob.title}",
                        description=f"Institution has not submitted mandatory compliance proof due on {ob.due_date.strftime('%Y-%m-%d')}.",
                        severity=AlertSeverity.HIGH,
                        target_role="INSTITUTION_USER",
                        trigger_reason=f"Due date elapsed by {abs(int(time_left.total_seconds() / 86400))} day(s)",
                        recommended_action="Submit compliance undertaking and documentary evidence",
                        inst_id=ob.institution_id,
                        due_date=ob.due_date
                    )
                    summary["compliance_obligations"] += 1

        # 4. DOCUMENT VALIDITY: Approaching Expiry & Expired
        validity_docs = self.db.query(ValidityDocument).all()
        for doc in validity_docs:
            days_left = (doc.expiry_date - now).days
            if days_left < 0:
                doc.status = "EXPIRED"
                key = f"ALERT_DOC_EXPIRED_{doc.id}_{doc.expiry_date.strftime('%Y%m%d')}"
                self._get_or_create_alert(
                    idempotency_key=key,
                    policy_code="POL_DOC_EXPIRING",
                    category="DOCUMENT_VALIDITY",
                    title=f"Prescribed Document Expired: {doc.document_type}",
                    description=f"Validity expired on {doc.expiry_date.strftime('%Y-%m-%d')} (Ref: {doc.reference_number}).",
                    severity=AlertSeverity.CRITICAL,
                    target_role="INSTITUTION_USER",
                    trigger_reason="Current date passed document expiration date",
                    recommended_action="Obtain certified renewal endorsement and upload replacement",
                    inst_id=doc.institution_id,
                    due_date=doc.expiry_date
                )
                summary["document_expiries"] += 1
            elif days_left <= 60:
                doc.status = "EXPIRING_SOON"
                key = f"ALERT_DOC_EXPIRING_{doc.id}_{doc.expiry_date.strftime('%Y%m%d')}"
                self._get_or_create_alert(
                    idempotency_key=key,
                    policy_code="POL_DOC_EXPIRING",
                    category="DOCUMENT_VALIDITY",
                    title=f"Document Approaching Expiry: {doc.document_type}",
                    description=f"Validity expires in {days_left} day(s) on {doc.expiry_date.strftime('%Y-%m-%d')}.",
                    severity=AlertSeverity.HIGH if days_left <= 30 else AlertSeverity.MODERATE,
                    target_role="INSTITUTION_USER",
                    trigger_reason=f"Document expires within {days_left} days",
                    recommended_action="Initiate renewal process with municipal/registration authority",
                    inst_id=doc.institution_id,
                    due_date=doc.expiry_date
                )
                summary["document_expiries"] += 1

        # 5. OPERATIONAL / ORPHAN TASKS: Tasks without Assigned Owner
        unassigned_apps = self.db.query(Application).filter(
            Application.assigned_officer_id.is_(None),
            Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
        ).all()

        for app in unassigned_apps:
            key = f"ALERT_ORPHAN_CASE_{app.id}"
            self._get_or_create_alert(
                idempotency_key=key,
                policy_code="POL_ORPHAN_TASK",
                category="OPERATIONAL",
                title=f"Unassigned Case in Scrutiny Queue: {app.application_id}",
                description=f"Case currently has no designated reviewing officer assigned, creating idle wait risk.",
                severity=AlertSeverity.MODERATE,
                target_role="AICTE_ADMIN",
                trigger_reason="assigned_officer_id is NULL for active application",
                recommended_action="Assign case to regional scrutiny officer in Western/Northern/Southern bureau",
                app_id=app.id,
                inst_id=app.institution_id
            )
            summary["orphan_tasks"] += 1

        # 6. CONFIGURABLE ESCALATION ENGINE: Check open alerts exceeding escalation_delay
        open_alerts = self.db.query(AlertRecord).filter(
            AlertRecord.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED]),
            AlertRecord.escalation_level == 0
        ).all()

        for alert in open_alerts:
            policy = self.db.query(AlertPolicy).filter(AlertPolicy.policy_code == alert.policy_code).first()
            if policy and policy.next_escalation_role:
                hours_open = (now - alert.created_at).total_seconds() / 3600.0
                if hours_open >= policy.escalation_delay_hours:
                    # Execute Escalation
                    prev_role = alert.target_role
                    next_role = policy.next_escalation_role
                    alert.escalation_level = 1
                    alert.escalated_to_role = next_role
                    alert.escalated_at = now
                    alert.status = AlertStatus.ESCALATED
                    alert.severity = AlertSeverity.CRITICAL

                    # Record Escalation Event
                    esc_event = EscalationEvent(
                        alert_id=alert.id,
                        previous_role=prev_role,
                        new_role=next_role,
                        reason=f"Alert remained unresolved for {int(hours_open)} hours exceeding {policy.escalation_delay_hours}h policy threshold.",
                        triggering_rule=f"Policy {policy.policy_code} Escalation Rule",
                        timestamp=now
                    )
                    self.db.add(esc_event)

                    # Send notification to senior escalated role
                    esc_notif = Notification(
                        recipient_user_id=None,
                        title=f"ESCALATION: {alert.title}",
                        message=f"Case escalated to {next_role}. {alert.description}",
                        type="ACTION_REQUIRED",
                        category=alert.category,
                        priority="CRITICAL",
                        alert_id=alert.id,
                        recommended_action=f"Intervene as {next_role}: {alert.recommended_action}",
                        created_at=now
                    )
                    self.db.add(esc_notif)
                    summary["escalations_executed"] += 1

        self.db.commit()
        return summary

