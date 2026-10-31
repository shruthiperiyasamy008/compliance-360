from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import (
    User, UserRole, Institution, Application, Document, DocumentVersion,
    StageHistory, AuditEvent, Notification, EVCSchedule, ComplianceObligation,
    ValidityDocument, ApplicationCategory, ApplicationStatus, DocumentStatus,
    AlertRecord, AlertPolicy, AlertSeverity, AlertStatus, EscalationEvent,
    UnifiedObligation, ApplicationRiskAssessment, APHReferenceDocument,
    PolicyDraftSimulation
)
from .schemas import (
    ApplicationCreate, DocumentActionRequest, ApplicationStageTransitionRequest,
    EVCScheduleCreate, EVCCompletionRequest, ComplianceSubmissionRequest,
    ValidityDocumentCreate, SimulationRequest, AlertPolicyUpdate,
    AlertAcknowledgeRequest, AlertResolveRequest, AIChatQueryRequest,
    ApprovalRehearsalRequest, PolicyDraftSimulationRequest
)
from .auth import get_current_user, require_role
from .rules import CATEGORY_DOCUMENT_REQUIREMENTS, calculate_application_risk, record_application_risk_assessment
from .alert_engine import AlertMonitoringService
from .ai_assistant import AIAssistantService
from .config import settings

router = APIRouter(prefix="/api", tags=["core"])

def create_audit(db: Session, action: str, actor: User, app_id: Optional[int] = None, inst_id: Optional[int] = None, details: dict = None):
    audit = AuditEvent(
        application_id=app_id,
        institution_id=inst_id,
        actor_id=actor.id if actor else None,
        actor_name=actor.full_name if actor else "System",
        actor_role=actor.role.value if actor else "SYSTEM",
        action=action,
        details=details or {},
        timestamp=datetime.utcnow()
    )
    db.add(audit)

def push_notification(db: Session, title: str, message: str, n_type: str = "INFO", user_id: Optional[int] = None, inst_id: Optional[int] = None, link: str = None, category: str = "APPLICATION_WORKFLOW", priority: str = "MEDIUM", alert_id: Optional[int] = None, recommended_action: Optional[str] = None):
    notif = Notification(
        recipient_user_id=user_id,
        institution_id=inst_id,
        title=title,
        message=message,
        type=n_type,
        category=category,
        priority=priority,
        alert_id=alert_id,
        recommended_action=recommended_action,
        link=link,
        created_at=datetime.utcnow()
    )
    db.add(notif)

# ----------------- Dashboard & Metrics Endpoints -----------------

@router.get("/institution/dashboard")
def get_institution_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User is not linked to any institution")
    
    inst_id = current_user.institution_id
    apps = db.query(Application).filter(Application.institution_id == inst_id).all()
    
    total_apps = len(apps)
    under_review = sum(1 for a in apps if a.status in [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_SCRUTINY, ApplicationStatus.RESUBMITTED])
    correction_req = sum(1 for a in apps if a.status == ApplicationStatus.CORRECTION_REQUIRED)
    awaiting_further = sum(1 for a in apps if a.status in [ApplicationStatus.EVC_SCHEDULED, ApplicationStatus.SAC_SHC_REVIEW])
    approved = sum(1 for a in apps if a.status == ApplicationStatus.APPROVED)
    rejected = sum(1 for a in apps if a.status == ApplicationStatus.REJECTED)

    # Compliance & validity stats
    obligations = db.query(ComplianceObligation).filter(ComplianceObligation.institution_id == inst_id).all()
    overdue_actions = sum(1 for o in obligations if o.status == "PENDING" and o.due_date < datetime.utcnow())
    pending_compliance = sum(1 for o in obligations if o.status != "VERIFIED")

    docs = db.query(ValidityDocument).filter(ValidityDocument.institution_id == inst_id).all()
    expiring_docs = sum(1 for d in docs if d.status in ["EXPIRING_SOON", "EXPIRED"])

    # Recent notifications with category, priority, recommendation
    notifications = db.query(Notification).filter(
        (Notification.institution_id == inst_id) | (Notification.recipient_user_id == current_user.id)
    ).order_by(Notification.created_at.desc()).limit(12).all()

    unread_count = db.query(Notification).filter(
        ((Notification.institution_id == inst_id) | (Notification.recipient_user_id == current_user.id)),
        Notification.is_read.is_(False)
    ).count()

    return {
        "institution_name": current_user.institution.name if current_user.institution else "",
        "aicte_id": current_user.institution.aicte_id if current_user.institution else "",
        "metrics": {
            "total_applications": total_apps,
            "under_review": under_review,
            "correction_required": correction_req,
            "awaiting_further_processing": awaiting_further,
            "approved": approved,
            "rejected": rejected,
            "overdue_actions": overdue_actions,
            "pending_compliance": pending_compliance,
            "expiring_documents": expiring_docs,
            "unread_notifications": unread_count
        },
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "category": n.category,
                "priority": n.priority,
                "created_at": n.created_at.isoformat(),
                "is_read": n.is_read,
                "is_acknowledged": n.is_acknowledged,
                "recommended_action": n.recommended_action,
                "due_date": n.due_date.isoformat() if n.due_date else None,
                "alert_id": n.alert_id,
                "link": n.link
            } for n in notifications
        ]
    }

@router.get("/admin/dashboard")
def get_admin_dashboard(current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR, UserRole.AUDITOR])), db: Session = Depends(get_db)):
    # Trigger active monitor run on dashboard access
    monitor = AlertMonitoringService(db)
    monitor.run_all_monitors()

    apps = db.query(Application).all()

    total_apps = len(apps)
    awaiting_scrutiny = sum(1 for a in apps if a.current_stage == "Scrutiny" and a.status in [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_SCRUTINY])
    requiring_rescrutiny = sum(1 for a in apps if a.status == ApplicationStatus.RESUBMITTED)
    awaiting_evc = sum(1 for a in apps if a.current_stage == "EVC" or a.status == ApplicationStatus.EVC_SCHEDULED)
    awaiting_committee = sum(1 for a in apps if a.status == ApplicationStatus.SAC_SHC_REVIEW)
    requiring_decision = sum(1 for a in apps if a.current_stage == "Decision" and a.status not in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
    correction_returned = sum(1 for a in apps if a.status == ApplicationStatus.CORRECTION_REQUIRED)

    # Overdue and risk calculation
    overdue_count = sum(1 for a in apps if a.deadline and a.deadline < datetime.utcnow() and a.status not in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
    high_risk_count = sum(1 for a in apps if a.risk_level in ["HIGH", "CRITICAL"])

    # Stage breakdown
    stage_breakdown = {}
    for a in apps:
        stage_breakdown[a.current_stage] = stage_breakdown.get(a.current_stage, 0) + 1

    # Regional pendency
    regional_pendency = {}
    for a in apps:
        r = a.institution.region if a.institution else "Unknown"
        regional_pendency[r] = regional_pendency.get(r, 0) + 1

    # Alerts Count from AlertRecord
    open_alerts = db.query(AlertRecord).filter(AlertRecord.status.in_([AlertStatus.OPEN, AlertStatus.ESCALATED])).count()
    critical_alerts = db.query(AlertRecord).filter(
        AlertRecord.status.in_([AlertStatus.OPEN, AlertStatus.ESCALATED]),
        AlertRecord.severity.in_([AlertSeverity.CRITICAL, AlertSeverity.HIGH])
    ).count()
    escalated_cases = db.query(AlertRecord).filter(AlertRecord.status == AlertStatus.ESCALATED).count()
    orphan_tasks = db.query(Application).filter(
        Application.assigned_officer_id.is_(None),
        Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
    ).count()

    # Pending compliance verifications
    pending_verifications = db.query(ComplianceObligation).filter(ComplianceObligation.status == "SUBMITTED_FOR_VERIFICATION").count()
    expiring_docs_count = db.query(ValidityDocument).filter(ValidityDocument.status.in_(["EXPIRING_SOON", "EXPIRED"])).count()

    # Recent Audit Log
    recent_audits = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(10).all()

    return {
        "metrics": {
            "total_applications": total_apps,
            "awaiting_scrutiny": awaiting_scrutiny,
            "requiring_rescrutiny": requiring_rescrutiny,
            "awaiting_evc": awaiting_evc,
            "awaiting_committee": awaiting_committee,
            "requiring_decision": requiring_decision,
            "correction_returned": correction_returned,
            "overdue_applications": overdue_count,
            "high_risk_delay": high_risk_count,
            "total_open_alerts": open_alerts,
            "critical_high_alerts": critical_alerts,
            "escalated_cases": escalated_cases,
            "orphan_tasks": orphan_tasks,
            "pending_compliance_verifications": pending_verifications,
            "expiring_documents": expiring_docs_count
        },
        "stage_breakdown": stage_breakdown,
        "regional_pendency": regional_pendency,
        "recent_audits": [
            {
                "id": a.id,
                "action": a.action,
                "actor_name": a.actor_name,
                "actor_role": a.actor_role,
                "details": a.details,
                "timestamp": a.timestamp.isoformat()
            } for a in recent_audits
        ]
    }

# ----------------- Application CRUD & Tracking -----------------

@router.post("/applications")
def create_application(payload: ApplicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="Only verified institutions can submit applications")
    
    year_prefix = datetime.utcnow().strftime("%Y")
    count_today = db.query(Application).count() + 1
    generated_app_id = f"AICTE-{year_prefix}-{count_today:04d}"

    workflow_route = "Scrutiny+EVC"
    if payload.category == ApplicationCategory.EOA:
        workflow_route = "Only Scrutiny"
    elif payload.category == ApplicationCategory.NEW_INSTITUTION:
        workflow_route = "Scrutiny+EVC+SAC"

    deadline = datetime.utcnow() + timedelta(days=21)

    new_app = Application(
        application_id=generated_app_id,
        institution_id=current_user.institution_id,
        category=payload.category,
        academic_year=payload.academic_year,
        title=payload.title,
        description=payload.description,
        programme=payload.programme,
        proposed_course_name=payload.proposed_course_name,
        proposed_intake=payload.proposed_intake,
        facility_details=payload.facility_details,
        current_stage="Scrutiny",
        status=ApplicationStatus.SUBMITTED,
        workflow_route=workflow_route,
        deadline=deadline,
        submitted_at=datetime.utcnow(),
        last_updated_at=datetime.utcnow()
    )
    db.add(new_app)
    db.flush()

    # Automatically generate required document checklist based on category
    reqs = CATEGORY_DOCUMENT_REQUIREMENTS.get(payload.category.value, [])
    for r in reqs:
        doc = Document(
            application_id=new_app.id,
            name=r["name"],
            requirement_code=r["requirement_code"],
            is_mandatory=r["is_mandatory"],
            description=r["description"],
            status=DocumentStatus.NOT_SUBMITTED
        )
        db.add(doc)

    # Initial stage history record
    stage_rec = StageHistory(
        application_id=new_app.id,
        stage_name="Scrutiny",
        status_entered="SUBMITTED",
        action_taken="Application Registered",
        remarks=f"Application registered for {payload.category.value}",
        actor_id=current_user.id,
        actor_role=current_user.role.value
    )
    db.add(stage_rec)

    # Automatically create unified review obligation
    obl = UnifiedObligation(
        obligation_code=f"OBL-{new_app.id}-SCRUTINY-REVIEW",
        obligation_type="REVIEW",
        party_responsible="OFFICIAL",
        application_id=new_app.id,
        institution_id=current_user.institution_id,
        title=f"Initial Scrutiny Review for {new_app.application_id}",
        description=f"Verify mandatory document checklist and statutory criteria for {new_app.title}.",
        responsible_role="AICTE_OFFICER",
        priority="HIGH",
        due_date=datetime.utcnow() + timedelta(days=7),
        status="PENDING",
        completion_conditions="All mandatory documents marked VERIFIED or flagged CORRECTION_REQUIRED."
    )
    db.add(obl)

    # Compute and persist initial application risk assessment
    db.flush()
    assessment = record_application_risk_assessment(db, new_app)

    # Audit & Notification
    create_audit(
        db,
        action="APPLICATION_REGISTERED",
        actor=current_user,
        app_id=new_app.id,
        inst_id=current_user.institution_id,
        details={"application_id": generated_app_id, "category": payload.category.value, "initial_risk": assessment.risk_score}
    )
    push_notification(
        db,
        title=f"Application Registered: {generated_app_id}",
        message=f"Application for '{payload.title}' was successfully registered and routed to Scrutiny queue.",
        n_type="SUCCESS",
        inst_id=current_user.institution_id,
        link=f"/institution/applications/{new_app.id}",
        category="APPLICATION_WORKFLOW"
    )

    db.commit()
    db.refresh(new_app)

    return {"message": "Application created successfully", "application_id": new_app.application_id, "id": new_app.id}

@router.get("/applications")
def list_applications(
    category: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if current_user.role == UserRole.INSTITUTION_USER:
        query = query.filter(Application.institution_id == current_user.institution_id)

    if category:
        query = query.filter(Application.category == category)
    if status:
        query = query.filter(Application.status == status)
    if stage:
        query = query.filter(Application.current_stage == stage)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Application.application_id.ilike(search_filter)) |
            (Application.title.ilike(search_filter))
        )

    apps = query.order_by(Application.submitted_at.desc()).all()

    result = []
    for a in apps:
        result.append({
            "id": a.id,
            "application_id": a.application_id,
            "category": a.category.value,
            "title": a.title,
            "academic_year": a.academic_year,
            "institution_name": a.institution.name if a.institution else "N/A",
            "region": a.institution.region if a.institution else "N/A",
            "current_stage": a.current_stage,
            "status": a.status.value,
            "workflow_route": a.workflow_route,
            "deadline": a.deadline.isoformat() if a.deadline else None,
            "submitted_at": a.submitted_at.isoformat(),
            "last_updated_at": a.last_updated_at.isoformat() if a.last_updated_at else None,
            "risk_level": a.risk_level,
            "risk_score": a.risk_score
        })
    return result

@router.get("/applications/{app_id}")
def get_application_details(app_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.INSTITUTION_USER and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access to other institutions' applications is forbidden")

    # Retrieve all historical risk assessments
    assessments = db.query(ApplicationRiskAssessment).filter(
        ApplicationRiskAssessment.application_id == app.id
    ).order_by(ApplicationRiskAssessment.assessed_at.desc()).all()

    # If no assessment exists yet, calculate and persist one
    if not assessments:
        assessment_obj = record_application_risk_assessment(db, app)
        assessments = [assessment_obj]
        db.commit()

    latest_assessment = assessments[0]

    return {
        "id": app.id,
        "application_id": app.application_id,
        "institution_id": app.institution_id,
        "institution_name": app.institution.name if app.institution else "",
        "aicte_id": app.institution.aicte_id if app.institution else "",
        "region": app.institution.region if app.institution else "",
        "state": app.institution.state if app.institution else "",
        "address": app.institution.address if app.institution else "",
        "contact_phone": app.institution.contact_phone if app.institution else "",
        "contact_email": app.institution.contact_email if app.institution else "",
        "category": app.category.value,
        "academic_year": app.academic_year,
        "title": app.title,
        "description": app.description,
        "programme": app.programme,
        "proposed_course_name": app.proposed_course_name,
        "proposed_intake": app.proposed_intake,
        "facility_details": app.facility_details,
        "current_stage": app.current_stage,
        "status": app.status.value,
        "workflow_route": app.workflow_route,
        "assigned_officer": app.assigned_officer.full_name if app.assigned_officer else "Unassigned (Scrutiny Queue)",
        "assigned_officer_id": app.assigned_officer_id,
        "deadline": app.deadline.isoformat() if app.deadline else None,
        "submitted_at": app.submitted_at.isoformat(),
        "last_updated_at": app.last_updated_at.isoformat() if app.last_updated_at else None,
        "risk_level": latest_assessment.risk_category,
        "risk_score": latest_assessment.risk_score,
        "risk_reasons": app.risk_reasons,
        "estimated_delay_days": latest_assessment.estimated_delay_days,
        "estimated_completion_date": latest_assessment.estimated_completion_date.isoformat() if latest_assessment.estimated_completion_date else None,
        "delay_estimation_method": latest_assessment.delay_estimation_method,
        "risk_factors": latest_assessment.factors,
        "data_quality_limitations": latest_assessment.data_quality_limitations,
        "recommended_action": latest_assessment.recommended_action,
        "risk_assessments_history": [
            {
                "id": a.id,
                "risk_score": a.risk_score,
                "risk_category": a.risk_category,
                "estimated_delay_days": a.estimated_delay_days,
                "assessed_at": a.assessed_at.isoformat(),
                "factors_count": len(a.factors or [])
            } for a in assessments
        ],
        "documents": [
            {
                "id": d.id,
                "name": d.name,
                "requirement_code": d.requirement_code,
                "is_mandatory": d.is_mandatory,
                "description": d.description,
                "file_name": d.file_name,
                "file_path": d.file_path,
                "file_size_kb": d.file_size_kb,
                "version": d.version,
                "status": d.status.value,
                "reviewer_decision": d.reviewer_decision,
                "deficiency_reason": d.deficiency_reason,
                "corrective_action_requested": d.corrective_action_requested,
                "submitted_at": d.submitted_at.isoformat() if d.submitted_at else None,
                "reviewed_at": d.reviewed_at.isoformat() if d.reviewed_at else None,
                "versions": [
                    {
                        "version_number": v.version_number,
                        "file_name": v.file_name,
                        "uploaded_at": v.uploaded_at.isoformat(),
                        "remarks": v.remarks,
                        "status_at_upload": v.status_at_upload
                    } for v in d.versions
                ]
            } for d in app.documents
        ],
        "stage_histories": [
            {
                "id": s.id,
                "stage_name": s.stage_name,
                "status_entered": s.status_entered,
                "action_taken": s.action_taken,
                "remarks": s.remarks,
                "actor_name": s.actor.full_name if s.actor else "System",
                "actor_role": s.actor_role,
                "created_at": s.created_at.isoformat()
            } for s in app.stage_histories
        ],
        "evc_schedules": [
            {
                "id": e.id,
                "evc_type": e.evc_type,
                "scheduled_date": e.scheduled_date.isoformat(),
                "panel_lead": e.panel_lead,
                "panel_members": e.panel_members,
                "inspection_status": e.inspection_status,
                "remarks": e.remarks,
                "recommendation": e.recommendation,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None
            } for e in app.evc_schedules
        ],
        "audit_events": [
            {
                "id": au.id,
                "action": au.action,
                "actor_name": au.actor_name,
                "actor_role": au.actor_role,
                "details": au.details,
                "timestamp": au.timestamp.isoformat()
            } for au in app.audit_events
        ]
    }

# ----------------- Document Upload & Resubmission Engine -----------------

@router.post("/applications/{app_id}/documents/{doc_id}/upload")
def upload_application_document(
    app_id: int,
    doc_id: int,
    file: UploadFile = File(...),
    remarks: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.INSTITUTION_USER and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    doc = db.query(Document).filter(Document.id == doc_id, Document.application_id == app.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document requirement not found")

    app_folder = os.path.join(settings.STORAGE_DIR, f"app_{app.id}")
    os.makedirs(app_folder, exist_ok=True)
    
    is_resubmission = (doc.status == DocumentStatus.CORRECTION_REQUIRED) or (doc.file_name is not None)
    new_version_num = doc.version + 1 if is_resubmission else 1
    
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"doc_{doc.id}_v{new_version_num}{file_extension}"
    target_path = os.path.join(app_folder, safe_filename)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = round(os.path.getsize(target_path) / 1024, 2)

    # Save version record
    doc_ver = DocumentVersion(
        document_id=doc.id,
        version_number=new_version_num,
        file_name=file.filename,
        file_path=target_path,
        uploaded_at=datetime.utcnow(),
        uploaded_by_id=current_user.id,
        remarks=remarks or ("Replacement document submitted" if is_resubmission else "Initial document upload"),
        status_at_upload="SUBMITTED"
    )
    db.add(doc_ver)

    doc.file_name = file.filename
    doc.file_path = target_path
    doc.file_size_kb = file_size_kb
    doc.version = new_version_num
    doc.status = DocumentStatus.SUBMITTED
    doc.submitted_at = datetime.utcnow()
    doc.reviewer_decision = None
    doc.deficiency_reason = None
    doc.corrective_action_requested = None

    # Check if application was CORRECTION_REQUIRED and if all flagged docs are now resubmitted
    remaining_flagged = [d for d in app.documents if d.id != doc.id and d.status == DocumentStatus.CORRECTION_REQUIRED]
    if app.status == ApplicationStatus.CORRECTION_REQUIRED and len(remaining_flagged) == 0:
        app.status = ApplicationStatus.RESUBMITTED
        app.last_updated_at = datetime.utcnow()
        stage_rec = StageHistory(
            application_id=app.id,
            stage_name=app.current_stage,
            status_entered="RESUBMITTED",
            action_taken="Deficiencies Corrected & Resubmitted",
            remarks="All requested document replacements uploaded by institution.",
            actor_id=current_user.id,
            actor_role=current_user.role.value
        )
        db.add(stage_rec)
        push_notification(
            db,
            title=f"Application Resubmitted: {app.application_id}",
            message=f"Institution uploaded replacement documents for {doc.name}. Application ready for re-scrutiny.",
            n_type="ACTION_REQUIRED",
            link=f"/admin/applications/{app.id}",
            category="APPLICATION_WORKFLOW"
        )

    # AUTOMATIC RECALCULATION OF RISK
    db.flush()
    record_application_risk_assessment(db, app)

    create_audit(
        db,
        action="DOCUMENT_UPLOADED" if not is_resubmission else "DOCUMENT_RESUBMITTED",
        actor=current_user,
        app_id=app.id,
        inst_id=app.institution_id,
        details={
            "document_name": doc.name,
            "version": new_version_num,
            "original_filename": file.filename,
            "is_resubmission": is_resubmission
        }
    )

    db.commit()
    return {"message": "Document uploaded successfully", "version": new_version_num, "status": doc.status.value}

# ----------------- Admin / Reviewer Endpoints -----------------

@router.post("/applications/{app_id}/documents/{doc_id}/review")
def review_document(
    app_id: int,
    doc_id: int,
    payload: DocumentActionRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    doc = db.query(Document).filter(Document.id == doc_id, Document.application_id == app.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.reviewed_at = datetime.utcnow()
    doc.reviewed_by_id = current_user.id

    if payload.decision == "ACCEPTED":
        doc.status = DocumentStatus.VERIFIED
        doc.reviewer_decision = "ACCEPTED"
        doc.deficiency_reason = None
        doc.corrective_action_requested = None

        create_audit(
            db,
            action="DOCUMENT_VERIFIED",
            actor=current_user,
            app_id=app.id,
            inst_id=app.institution_id,
            details={"document_name": doc.name, "decision": "ACCEPTED"}
        )
    elif payload.decision == "CORRECTION_REQUESTED":
        if not payload.deficiency_reason or not payload.corrective_action_requested:
            raise HTTPException(status_code=400, detail="Deficiency reason and corrective action are mandatory when returning a document")
        
        doc.status = DocumentStatus.CORRECTION_REQUIRED
        doc.reviewer_decision = "CORRECTION_REQUESTED"
        doc.deficiency_reason = payload.deficiency_reason
        doc.corrective_action_requested = payload.corrective_action_requested

        app.status = ApplicationStatus.CORRECTION_REQUIRED
        app.last_updated_at = datetime.utcnow()

        stage_rec = StageHistory(
            application_id=app.id,
            stage_name=app.current_stage,
            status_entered="CORRECTION_REQUIRED",
            action_taken=f"Deficiency Raised: {doc.name}",
            remarks=payload.deficiency_reason,
            actor_id=current_user.id,
            actor_role=current_user.role.value
        )
        db.add(stage_rec)

        create_audit(
            db,
            action="DOCUMENT_RETURNED_FOR_CORRECTION",
            actor=current_user,
            app_id=app.id,
            inst_id=app.institution_id,
            details={
                "document_name": doc.name,
                "reason": payload.deficiency_reason,
                "action_requested": payload.corrective_action_requested
            }
        )

        push_notification(
            db,
            title=f"Correction Required: {app.application_id}",
            message=f"Deficiency found in '{doc.name}'. Reason: {payload.deficiency_reason}. Please upload corrected document.",
            n_type="ACTION_REQUIRED",
            inst_id=app.institution_id,
            link=f"/institution/applications/{app.id}",
            category="APPLICATION_WORKFLOW",
            priority="HIGH",
            recommended_action=f"Upload replacement: {payload.corrective_action_requested}"
        )

    # AUTOMATIC RECALCULATION OF RISK
    db.flush()
    record_application_risk_assessment(db, app)

    db.commit()
    return {"message": "Document review recorded", "status": doc.status.value, "application_status": app.status.value}

@router.post("/applications/{app_id}/transition")
def transition_application_stage(
    app_id: int,
    payload: ApplicationStageTransitionRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.next_status == ApplicationStatus.APPROVED:
        unverified = [d for d in app.documents if d.is_mandatory and d.status != DocumentStatus.VERIFIED]
        if unverified:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve application. {len(unverified)} mandatory document(s) have not been verified yet."
            )

    old_stage = app.current_stage
    old_status = app.status

    app.current_stage = payload.next_stage
    app.status = payload.next_status
    app.last_updated_at = datetime.utcnow()

    if payload.next_stage == "EVC":
        app.deadline = datetime.utcnow() + timedelta(days=14)

    stage_rec = StageHistory(
        application_id=app.id,
        stage_name=payload.next_stage,
        status_entered=payload.next_status.value,
        action_taken=f"Transitioned from {old_stage} ({old_status.value}) to {payload.next_stage} ({payload.next_status.value})",
        remarks=payload.remarks or "Stage movement approved by reviewing officer.",
        actor_id=current_user.id,
        actor_role=current_user.role.value
    )
    db.add(stage_rec)

    create_audit(
        db,
        action="STAGE_TRANSITION",
        actor=current_user,
        app_id=app.id,
        inst_id=app.institution_id,
        details={
            "from_stage": old_stage,
            "to_stage": payload.next_stage,
            "from_status": old_status.value,
            "to_status": payload.next_status.value,
            "remarks": payload.remarks
        }
    )

    push_notification(
        db,
        title=f"Stage Updated: {app.application_id} -> {payload.next_stage}",
        message=f"Application has progressed to {payload.next_stage} stage. Status: {payload.next_status.value}.",
        n_type="INFO",
        inst_id=app.institution_id,
        link=f"/institution/applications/{app.id}",
        category="APPLICATION_WORKFLOW"
    )

    # AUTOMATIC RECALCULATION OF RISK
    db.flush()
    record_application_risk_assessment(db, app)

    db.commit()
    return {"message": "Stage transitioned successfully", "current_stage": app.current_stage, "status": app.status.value}

# ----------------- Case Assignment Endpoint -----------------

@router.post("/applications/{app_id}/assign")
def assign_application_case(
    app_id: int,
    officer_id: int = Form(...),
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    target_officer = db.query(User).filter(User.id == officer_id).first()
    if not target_officer:
        raise HTTPException(status_code=404, detail="Officer user not found")

    app.assigned_officer_id = target_officer.id
    app.last_updated_at = datetime.utcnow()

    # Close any orphan task alerts for this app
    orphan_alerts = db.query(AlertRecord).filter(
        AlertRecord.application_id == app.id,
        AlertRecord.policy_code == "POL_ORPHAN_TASK",
        AlertRecord.status.in_([AlertStatus.OPEN, AlertStatus.ESCALATED])
    ).all()
    for al in orphan_alerts:
        al.status = AlertStatus.RESOLVED
        al.resolved_at = datetime.utcnow()
        al.resolution_notes = f"Case assigned to officer {target_officer.full_name}."

    create_audit(
        db,
        action="CASE_ASSIGNED",
        actor=current_user,
        app_id=app.id,
        inst_id=app.institution_id,
        details={"assigned_officer": target_officer.full_name, "officer_id": target_officer.id}
    )

    # Recalculate risk
    db.flush()
    record_application_risk_assessment(db, app)

    db.commit()
    return {"message": f"Case assigned to {target_officer.full_name}"}

# ----------------- EVC Coordination Endpoints -----------------

@router.post("/applications/{app_id}/evc/schedule")
def schedule_evc(
    app_id: int,
    payload: EVCScheduleCreate,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    evc = EVCSchedule(
        application_id=app.id,
        evc_type=payload.evc_type,
        scheduled_date=payload.scheduled_date,
        panel_lead=payload.panel_lead,
        panel_members=payload.panel_members,
        inspection_status="SCHEDULED",
        remarks=payload.remarks
    )
    db.add(evc)

    app.current_stage = "EVC"
    app.status = ApplicationStatus.EVC_SCHEDULED
    app.last_updated_at = datetime.utcnow()

    # Close unscheduled EVC alerts for this application
    evc_alerts = db.query(AlertRecord).filter(
        AlertRecord.application_id == app.id,
        AlertRecord.policy_code == "POL_EVC_UNSCHEDULED"
    ).all()
    for al in evc_alerts:
        al.status = AlertStatus.RESOLVED
        al.resolved_at = datetime.utcnow()
        al.resolution_notes = f"EVC scheduled with Panel Lead {payload.panel_lead}"

    create_audit(
        db,
        action="EVC_SCHEDULED",
        actor=current_user,
        app_id=app.id,
        inst_id=app.institution_id,
        details={"date": payload.scheduled_date.isoformat(), "panel_lead": payload.panel_lead, "type": payload.evc_type}
    )

    push_notification(
        db,
        title=f"EVC Inspection Scheduled: {app.application_id}",
        message=f"An Expert Visit Committee ({payload.evc_type}) has been scheduled for {payload.scheduled_date.strftime('%Y-%m-%d %H:%M')}. Panel Lead: {payload.panel_lead}.",
        n_type="ACTION_REQUIRED",
        inst_id=app.institution_id,
        link=f"/institution/applications/{app.id}",
        category="EVC_SCHEDULING"
    )

    db.flush()
    record_application_risk_assessment(db, app)

    db.commit()
    return {"message": "EVC Inspection scheduled successfully"}

@router.post("/applications/{app_id}/evc/{evc_id}/complete")
def complete_evc(
    app_id: int,
    evc_id: int,
    payload: EVCCompletionRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    evc = db.query(EVCSchedule).filter(EVCSchedule.id == evc_id, EVCSchedule.application_id == app_id).first()
    if not app or not evc:
        raise HTTPException(status_code=404, detail="Application or EVC Record not found")

    evc.inspection_status = "COMPLETED"
    evc.recommendation = payload.recommendation
    evc.remarks = payload.remarks
    evc.completed_at = datetime.utcnow()

    app.status = ApplicationStatus.EVC_COMPLETED
    app.current_stage = "SAC/SHC Review" if "SAC" in app.workflow_route else "Decision"
    app.last_updated_at = datetime.utcnow()

    create_audit(
        db,
        action="EVC_REPORT_SUBMITTED",
        actor=current_user,
        app_id=app.id,
        inst_id=app.institution_id,
        details={"recommendation": payload.recommendation, "remarks": payload.remarks}
    )

    push_notification(
        db,
        title=f"EVC Report Submitted: {app.application_id}",
        message=f"EVC inspection concluded. Recommendation: {payload.recommendation}.",
        n_type="INFO",
        inst_id=app.institution_id,
        link=f"/institution/applications/{app.id}",
        category="EVC_SCHEDULING"
    )

    db.flush()
    record_application_risk_assessment(db, app)

    db.commit()
    return {"message": "EVC report recorded successfully"}

# ----------------- Post-Approval Compliance & Obligations -----------------

@router.get("/compliance/obligations")
def get_compliance_obligations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(ComplianceObligation)
    if current_user.role == UserRole.INSTITUTION_USER:
        query = query.filter(ComplianceObligation.institution_id == current_user.institution_id)
    
    items = query.order_by(ComplianceObligation.due_date.asc()).all()
    return [
        {
            "id": c.id,
            "institution_id": c.institution_id,
            "institution_name": c.institution.name if c.institution else "",
            "title": c.title,
            "source_condition": c.source_condition,
            "due_date": c.due_date.isoformat(),
            "evidence_required": c.evidence_required,
            "evidence_file_path": c.evidence_file_path,
            "evidence_submitted_at": c.evidence_submitted_at.isoformat() if c.evidence_submitted_at else None,
            "evidence_submission_notes": c.evidence_submission_notes,
            "status": c.status,
            "reviewer_notes": c.reviewer_notes,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None
        } for c in items
    ]

@router.post("/compliance/obligations/{ob_id}/submit")
def submit_compliance_evidence(
    ob_id: int,
    payload: ComplianceSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ob = db.query(ComplianceObligation).filter(ComplianceObligation.id == ob_id).first()
    if not ob:
        raise HTTPException(status_code=404, detail="Obligation not found")
    if current_user.role == UserRole.INSTITUTION_USER and ob.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    ob.evidence_submission_notes = payload.evidence_notes
    ob.evidence_submitted_at = datetime.utcnow()
    ob.status = "SUBMITTED_FOR_VERIFICATION"

    create_audit(
        db,
        action="COMPLIANCE_EVIDENCE_SUBMITTED",
        actor=current_user,
        inst_id=ob.institution_id,
        details={"obligation_title": ob.title}
    )

    push_notification(
        db,
        title=f"Compliance Evidence Submitted",
        message=f"Evidence submitted for '{ob.title}'. Pending officer verification.",
        n_type="INFO",
        inst_id=ob.institution_id,
        category="COMPLIANCE"
    )

    db.commit()
    return {"message": "Evidence submitted for official review"}

@router.post("/compliance/obligations/{ob_id}/verify")
def verify_compliance_evidence(
    ob_id: int,
    decision: str = Form(...),
    remarks: Optional[str] = Form(None),
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    ob = db.query(ComplianceObligation).filter(ComplianceObligation.id == ob_id).first()
    if not ob:
        raise HTTPException(status_code=404, detail="Obligation not found")

    if decision == "VERIFIED":
        ob.status = "VERIFIED"
        ob.verified_at = datetime.utcnow()
        ob.verified_by_id = current_user.id
        ob.reviewer_notes = remarks or "Evidence verified and accepted."
    else:
        ob.status = "PENDING"
        ob.reviewer_notes = remarks or "Evidence inadequate. Please resubmit."

    db.commit()
    return {"message": "Compliance status updated"}

# ----------------- Document Validity & Expiry Monitoring -----------------

@router.get("/validity/documents")
def get_validity_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(ValidityDocument)
    if current_user.role == UserRole.INSTITUTION_USER:
        query = query.filter(ValidityDocument.institution_id == current_user.institution_id)

    items = query.all()
    now = datetime.utcnow()
    for item in items:
        days_left = (item.expiry_date - now).days
        if days_left < 0:
            item.status = "EXPIRED"
        elif days_left <= 60:
            item.status = "EXPIRING_SOON"
        else:
            item.status = "VALID"
    db.commit()

    return [
        {
            "id": d.id,
            "institution_id": d.institution_id,
            "institution_name": d.institution.name if d.institution else "",
            "document_type": d.document_type,
            "issuing_authority": d.issuing_authority,
            "reference_number": d.reference_number,
            "issue_date": d.issue_date.isoformat() if d.issue_date else None,
            "expiry_date": d.expiry_date.isoformat(),
            "status": d.status,
            "renewal_status": d.renewal_status
        } for d in items
    ]

# ----------------- ALERT INTELLIGENCE CENTRE ENDPOINTS -----------------

@router.get("/alerts")
def get_alerts(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR, UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    query = db.query(AlertRecord)
    if category:
        query = query.filter(AlertRecord.category == category)
    if severity:
        query = query.filter(AlertRecord.severity == severity)
    if status:
        query = query.filter(AlertRecord.status == status)

    alerts = query.order_by(AlertRecord.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "policy_code": a.policy_code,
            "category": a.category,
            "title": a.title,
            "description": a.description,
            "severity": a.severity.value,
            "status": a.status.value,
            "target_role": a.target_role,
            "application_id": a.application_id,
            "application_code": a.application.application_id if a.application else None,
            "institution_name": a.institution.name if a.institution else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "trigger_reason": a.trigger_reason,
            "recommended_action": a.recommended_action,
            "escalation_level": a.escalation_level,
            "escalated_to_role": a.escalated_to_role,
            "escalated_at": a.escalated_at.isoformat() if a.escalated_at else None,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "resolution_notes": a.resolution_notes,
            "created_at": a.created_at.isoformat(),
            "escalation_events": [
                {
                    "id": e.id,
                    "previous_role": e.previous_role,
                    "new_role": e.new_role,
                    "reason": e.reason,
                    "triggering_rule": e.triggering_rule,
                    "timestamp": e.timestamp.isoformat()
                } for e in a.escalation_events
            ]
        } for a in alerts
    ]

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledgeRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR])),
    db: Session = Depends(get_db)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by_id = current_user.id

    create_audit(
        db,
        action="ALERT_ACKNOWLEDGED",
        actor=current_user,
        app_id=alert.application_id,
        inst_id=alert.institution_id,
        details={"alert_title": alert.title, "notes": payload.notes}
    )
    db.commit()
    return {"message": "Alert acknowledged successfully"}

@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    payload: AlertResolveRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = payload.resolution_notes

    create_audit(
        db,
        action="ALERT_RESOLVED",
        actor=current_user,
        app_id=alert.application_id,
        inst_id=alert.institution_id,
        details={"alert_title": alert.title, "resolution_notes": payload.resolution_notes}
    )
    db.commit()
    return {"message": "Alert marked resolved"}

@router.get("/alerts/policies")
def list_alert_policies(
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    policies = db.query(AlertPolicy).all()
    return [
        {
            "id": p.id,
            "policy_code": p.policy_code,
            "name": p.name,
            "category": p.category,
            "warning_days_before": p.warning_days_before,
            "overdue_threshold_hours": p.overdue_threshold_hours,
            "escalation_delay_hours": p.escalation_delay_hours,
            "responsible_role": p.responsible_role,
            "next_escalation_role": p.next_escalation_role,
            "reminder_frequency_hours": p.reminder_frequency_hours,
            "max_reminders": p.max_reminders,
            "requires_acknowledgement": p.requires_acknowledgement,
            "is_active": p.is_active,
            "is_statutory": p.is_statutory
        } for p in policies
    ]

@router.put("/alerts/policies/{policy_id}")
def update_alert_policy(
    policy_id: int,
    payload: AlertPolicyUpdate,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN])),
    db: Session = Depends(get_db)
):
    policy = db.query(AlertPolicy).filter(AlertPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if payload.warning_days_before is not None:
        policy.warning_days_before = payload.warning_days_before
    if payload.escalation_delay_hours is not None:
        policy.escalation_delay_hours = payload.escalation_delay_hours
    if payload.responsible_role is not None:
        policy.responsible_role = payload.responsible_role
    if payload.next_escalation_role is not None:
        policy.next_escalation_role = payload.next_escalation_role
    if payload.reminder_frequency_hours is not None:
        policy.reminder_frequency_hours = payload.reminder_frequency_hours
    if payload.requires_acknowledgement is not None:
        policy.requires_acknowledgement = payload.requires_acknowledgement
    if payload.is_active is not None:
        policy.is_active = payload.is_active

    create_audit(
        db,
        action="ALERT_POLICY_UPDATED",
        actor=current_user,
        details={"policy_code": policy.policy_code}
    )
    db.commit()
    return {"message": "Policy updated successfully"}

# ----------------- UNIFIED OBLIGATION CLOCK ENDPOINTS -----------------

@router.get("/obligations/timeline")
def get_unified_obligation_timeline(
    party: Optional[str] = None, # INSTITUTION or OFFICIAL
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(UnifiedObligation)
    if current_user.role == UserRole.INSTITUTION_USER:
        query = query.filter(UnifiedObligation.institution_id == current_user.institution_id)
    if party:
        query = query.filter(UnifiedObligation.party_responsible == party)

    obligations = query.order_by(UnifiedObligation.due_date.asc()).all()
    now = datetime.utcnow()

    return [
        {
            "id": o.id,
            "obligation_code": o.obligation_code,
            "obligation_type": o.obligation_type,
            "party_responsible": o.party_responsible,
            "application_id": o.application_id,
            "application_code": o.application.application_id if o.application else None,
            "institution_name": o.institution.name if o.institution else None,
            "title": o.title,
            "description": o.description,
            "responsible_role": o.responsible_role,
            "priority": o.priority,
            "due_date": o.due_date.isoformat(),
            "status": "OVERDUE" if o.status == "PENDING" and o.due_date < now else o.status,
            "completion_conditions": o.completion_conditions,
            "created_at": o.created_at.isoformat()
        } for o in obligations
    ]

# ----------------- NOTIFICATION CENTER ENDPOINTS -----------------

@router.get("/notifications")
def get_user_notifications(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if current_user.role == UserRole.INSTITUTION_USER:
        query = query.filter((Notification.institution_id == current_user.institution_id) | (Notification.recipient_user_id == current_user.id))
    else:
        query = query.filter((Notification.recipient_user_id == current_user.id) | (Notification.recipient_user_id.is_(None)))

    if category:
        query = query.filter(Notification.category == category)
    if priority:
        query = query.filter(Notification.priority == priority)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    notifications = query.order_by(Notification.created_at.desc()).limit(30).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "category": n.category,
            "priority": n.priority,
            "is_read": n.is_read,
            "is_acknowledged": n.is_acknowledged,
            "alert_id": n.alert_id,
            "recommended_action": n.recommended_action,
            "due_date": n.due_date.isoformat() if n.due_date else None,
            "link": n.link,
            "delivery_status": n.delivery_status,
            "created_at": n.created_at.isoformat()
        } for n in notifications
    ]

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked read"}

@router.post("/notifications/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.INSTITUTION_USER:
        db.query(Notification).filter(Notification.institution_id == current_user.institution_id).update({Notification.is_read: True})
    else:
        db.query(Notification).filter((Notification.recipient_user_id == current_user.id) | (Notification.recipient_user_id.is_(None))).update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked read"}

# ----------------- REAL AI CHAT & NATURAL LANGUAGE PIPELINE -----------------

@router.post("/ai/chat")
def ask_ai_pipeline(
    payload: AIChatQueryRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER, UserRole.EVC_COORDINATOR, UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    assistant = AIAssistantService(db, current_user)
    response = assistant.answer_query(payload.query, payload.context_app_id)

    create_audit(
        db,
        action="AI_QUERY_EXECUTED",
        actor=current_user,
        app_id=payload.context_app_id,
        details={"query": payload.query}
    )
    db.commit()
    return response

# ----------------- APPROVAL REHEARSAL (PRE-SUBMISSION READINESS CHECK) -----------------

@router.post("/ai/rehearsal")
def run_approval_rehearsal(
    payload: ApprovalRehearsalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approval Rehearsal: Pre-submission readiness check using applicable administrator-approved
    checklist requirements without altering live application state.
    """
    reqs = CATEGORY_DOCUMENT_REQUIREMENTS.get(payload.category.value, [])
    findings = []
    
    # Check attached documents vs required checklist
    attached = set(payload.attached_document_codes)
    for r in reqs:
        if r["requirement_code"] not in attached and r["is_mandatory"]:
            findings.append({
                "description": f"Mandatory document not provided: '{r['name']}'",
                "severity": "HIGH",
                "requirement_code": r["requirement_code"],
                "evidence": f"Category '{payload.category.value}' prescribes {r['description']}",
                "suggested_action": f"Obtain certified PDF for '{r['name']}' prior to formal submission"
            })

    # Validate specific fields
    if payload.category.value == "Introduction of a New Course or Programme":
        if not payload.proposed_course_name:
            findings.append({
                "description": "Proposed Course Name is blank",
                "severity": "HIGH",
                "requirement_code": "FIELD_COURSE_NAME",
                "evidence": "Academic council proposal must specify syllabus course designation",
                "suggested_action": "Enter full course title (e.g. B.Tech in Artificial Intelligence)"
            })
        if not payload.proposed_intake or payload.proposed_intake <= 0:
            findings.append({
                "description": "Sanctioned intake capacity missing",
                "severity": "HIGH",
                "requirement_code": "FIELD_INTAKE",
                "evidence": "Standard unit intake is 60 or 30 seats",
                "suggested_action": "Specify approved batch strength (e.g. 60 seats)"
            })

    if payload.category.value == "Infrastructure or Facility Request":
        if not payload.facility_details:
            findings.append({
                "description": "Laboratory / Facility specifications are incomplete",
                "severity": "HIGH",
                "requirement_code": "FIELD_FACILITY",
                "evidence": "Computer laboratory layout requires square footage and terminal count",
                "suggested_action": "Describe room area, workstation counts, and power backup"
            })

    # Check institutional document validity records
    if current_user.institution_id:
        expiring = db.query(ValidityDocument).filter(
            ValidityDocument.institution_id == current_user.institution_id,
            ValidityDocument.status.in_(["EXPIRING_SOON", "EXPIRED"])
        ).all()
        for exp in expiring:
            findings.append({
                "description": f"Institutional prescription {exp.document_type} is {exp.status}",
                "severity": "MEDIUM",
                "requirement_code": "DOC_EXPIRY",
                "evidence": f"Valid until {exp.expiry_date.strftime('%Y-%m-%d')} (Ref: {exp.reference_number})",
                "suggested_action": "Ensure renewal application is underway to avoid mid-cycle scrutiny return"
            })

    is_ready = len([f for f in findings if f["severity"] == "HIGH"]) == 0

    return {
        "is_ready_for_submission": is_ready,
        "readiness_score": max(100 - len(findings) * 20, 20),
        "total_findings": len(findings),
        "findings": findings,
        "disclaimer": "This is a preliminary readiness check against verified checklist requirements. Automated validation does not guarantee official bureau approval."
    }

# ----------------- APH INTELLIGENCE & REFERENCE REPOSITORY -----------------

@router.get("/ai/aph/references")
def get_aph_references(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(APHReferenceDocument).filter(APHReferenceDocument.is_active.is_(True))
    if category:
        query = query.filter(APHReferenceDocument.applicable_category == category)
    refs = query.all()
    return [
        {
            "id": r.id,
            "document_title": r.document_title,
            "version_academic_year": r.version_academic_year,
            "chapter_clause": r.chapter_clause,
            "page_reference": r.page_reference,
            "extracted_text": r.extracted_text,
            "proposed_interpretation": r.proposed_interpretation,
            "applicable_category": r.applicable_category,
            "verification_status": r.verification_status,
            "reviewer_name": r.reviewer_name
        } for r in refs
    ]

# ----------------- POLICY CHANGE IMPACT SIMULATOR -----------------

@router.post("/intelligence/policy-simulator")
def simulate_policy_draft(
    payload: PolicyDraftSimulationRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    """
    Policy Change Impact Simulator: Evaluates impact of proposed administrative changes on
    active applications and obligations without altering live database records.
    """
    active_apps = db.query(Application).filter(
        Application.status.notin_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
    ).all()

    affected_apps = []
    for a in active_apps:
        reasons = []
        if payload.new_scrutiny_days and a.current_stage == "Scrutiny":
            days_in_stage = (datetime.utcnow() - (a.last_updated_at or a.submitted_at)).days
            if days_in_stage > payload.new_scrutiny_days:
                reasons.append(f"Application exceeds new scrutiny SLA ({days_in_stage}d vs {payload.new_scrutiny_days}d target)")

        if payload.new_evc_days and a.current_stage == "EVC":
            reasons.append(f"Inspection scheduling window shortened to {payload.new_evc_days} days")

        if payload.require_new_mandate:
            reasons.append(f"Requires new mandatory compliance document: '{payload.require_new_mandate}'")

        if reasons:
            affected_apps.append({
                "application_id": a.application_id,
                "title": a.title,
                "institution_name": a.institution.name if a.institution else "",
                "current_stage": a.current_stage,
                "impact_reason": "; ".join(reasons)
            })

    active_obligations_count = db.query(UnifiedObligation).filter(UnifiedObligation.status == "PENDING").count()

    summary_impact = (
        f"Under draft policy '{payload.draft_name}', {len(affected_apps)} of {len(active_apps)} active applications "
        f"will require administrative review or transition adjustments. Zero live records were altered during this preview."
    )

    # Record simulation run
    sim_record = PolicyDraftSimulation(
        draft_name=payload.draft_name,
        proposed_change=payload.proposed_change,
        previous_configuration={"scrutiny_sla_days": 7.0, "evc_sla_days": 14.0},
        new_configuration={"new_scrutiny_days": payload.new_scrutiny_days, "new_evc_days": payload.new_evc_days},
        affected_application_count=len(affected_apps),
        affected_obligations_count=active_obligations_count,
        summary_impact=summary_impact,
        created_by_id=current_user.id
    )
    db.add(sim_record)
    db.commit()

    return {
        "draft_name": payload.draft_name,
        "affected_application_count": len(affected_apps),
        "affected_applications": affected_apps,
        "total_active_pipeline": len(active_apps),
        "summary_impact": summary_impact,
        "requires_authorized_activation": True,
        "simulation_disclaimer": "Live workflows remain unchanged. Activation requires signed bureau approval."
    }

# ----------------- Bottlenecks & Intelligence -----------------

@router.get("/intelligence/bottlenecks")
def get_bottleneck_analysis(current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])), db: Session = Depends(get_db)):
    apps = db.query(Application).all()
    
    stage_durations = {"Scrutiny": [], "EVC": [], "SAC/SHC Review": [], "Decision": []}
    for a in apps:
        elapsed_days = (datetime.utcnow() - a.submitted_at).days
        if a.current_stage in stage_durations:
            stage_durations[a.current_stage].append(elapsed_days)

    avg_stage_delay = {}
    for stage, times in stage_durations.items():
        avg_stage_delay[stage] = round(sum(times) / max(len(times), 1), 1)

    docs_returned = db.query(Document).filter(Document.status == DocumentStatus.CORRECTION_REQUIRED).all()
    reasons_freq = {}
    for d in docs_returned:
        cat = d.name
        reasons_freq[cat] = reasons_freq.get(cat, 0) + 1

    return {
        "average_stage_dwell_days": avg_stage_delay,
        "primary_bottleneck_stage": max(avg_stage_delay, key=avg_stage_delay.get) if avg_stage_delay else "Scrutiny",
        "common_deficiency_documents": reasons_freq,
        "high_risk_applications_count": sum(1 for a in apps if a.risk_level in ["HIGH", "CRITICAL"]),
        "total_active_pipeline": sum(1 for a in apps if a.status not in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
    }

@router.post("/intelligence/simulate")
def run_what_if_simulation(
    payload: SimulationRequest,
    current_user: User = Depends(require_role([UserRole.AICTE_ADMIN, UserRole.AICTE_OFFICER])),
    db: Session = Depends(get_db)
):
    base_apps = db.query(Application).count() or 12
    simulated_apps = int(base_apps * (1 + payload.additional_applications_pct / 100.0))
    
    baseline_avg_days = 16.5
    scrutiny_impact = (payload.scrutiny_capacity_change_pct / 100.0) * -3.5
    evc_impact = payload.evc_delay_days * 0.8
    projected_avg_days = round(max(baseline_avg_days + scrutiny_impact + evc_impact, 5.0), 1)

    projected_pendency_surge = round(((projected_avg_days - baseline_avg_days) / baseline_avg_days) * 100, 1)

    return {
        "input_parameters": {
            "additional_applications_pct": payload.additional_applications_pct,
            "scrutiny_capacity_change_pct": payload.scrutiny_capacity_change_pct,
            "evc_delay_days": payload.evc_delay_days
        },
        "baseline": {
            "current_volume": base_apps,
            "average_processing_days": baseline_avg_days,
            "risk_profile": "Standard"
        },
        "projected_outcome": {
            "projected_application_volume": simulated_apps,
            "projected_average_days": projected_avg_days,
            "pendency_shift_pct": projected_pendency_surge,
            "recommended_mitigation": "Increase peer scrutiny review capacity by 25% or authorize hybrid virtual EVC mode to eliminate inspection queue backlog." if projected_avg_days > 18 else "Workflow remains within permissible AICTE SLA operational thresholds."
        }
    }
