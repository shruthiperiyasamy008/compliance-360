import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, JSON, Float
)
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    AICTE_ADMIN = "AICTE_ADMIN"
    AICTE_OFFICER = "AICTE_OFFICER"
    INSTITUTION_USER = "INSTITUTION_USER"
    EVC_COORDINATOR = "EVC_COORDINATOR"
    AUDITOR = "AUDITOR"

class ApplicationCategory(str, enum.Enum):
    NEW_INSTITUTION = "New Institution"
    EOA = "Extension of Approval"
    NEW_COURSE = "Introduction of a New Course or Programme"
    INCREASE_INTAKE = "Increase in Intake"
    INFRASTRUCTURE_FACILITY = "Infrastructure or Facility Request"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_SCRUTINY = "UNDER_SCRUTINY"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    RESUBMITTED = "RESUBMITTED"
    EVC_SCHEDULED = "EVC_SCHEDULED"
    EVC_COMPLETED = "EVC_COMPLETED"
    SAC_SHC_REVIEW = "SAC_SHC_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class DocumentStatus(str, enum.Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.INSTITUTION_USER)
    designation = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Technical Campus")
    region = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    head_of_institution = Column(String(255), nullable=True)
    established_year = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution")
    applications = relationship("Application", back_populates="institution")
    compliance_obligations = relationship("ComplianceObligation", back_populates="institution")
    validity_documents = relationship("ValidityDocument", back_populates="institution")
    obligations = relationship("UnifiedObligation", back_populates="institution")
    alerts = relationship("AlertRecord", back_populates="institution")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), unique=True, index=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    category = Column(Enum(ApplicationCategory), nullable=False)
    academic_year = Column(String(20), default="2025-2026")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    programme = Column(String(100), nullable=True)
    proposed_course_name = Column(String(255), nullable=True)
    proposed_intake = Column(Integer, nullable=True)
    facility_details = Column(Text, nullable=True)
    
    current_stage = Column(String(100), default="Scrutiny")
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SUBMITTED)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deadline = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workflow_route = Column(String(100), default="Scrutiny+EVC")
    
    # Explainable Risk / Delay score computed by rule engine
    risk_level = Column(String(50), default="LOW")
    risk_score = Column(Float, default=10.0)
    risk_reasons = Column(JSON, default=list)

    institution = relationship("Institution", back_populates="applications")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    stage_histories = relationship("StageHistory", back_populates="application", cascade="all, delete-orphan")
    evc_schedules = relationship("EVCSchedule", back_populates="application", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="application", cascade="all, delete-orphan")
    risk_assessments = relationship("ApplicationRiskAssessment", back_populates="application", cascade="all, delete-orphan")
    obligations = relationship("UnifiedObligation", back_populates="application", cascade="all, delete-orphan")
    alerts = relationship("AlertRecord", back_populates="application", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    name = Column(String(255), nullable=False)
    requirement_code = Column(String(100), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size_kb = Column(Float, nullable=True)
    version = Column(Integer, default=1)
    
    status = Column(Enum(DocumentStatus), default=DocumentStatus.NOT_SUBMITTED)
    reviewer_decision = Column(String(100), nullable=True)
    deficiency_reason = Column(Text, nullable=True)
    corrective_action_requested = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    application = relationship("Application", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    status_at_upload = Column(String(100), default="SUBMITTED")

    document = relationship("Document", back_populates="versions")

class StageHistory(Base):
    __tablename__ = "stage_histories"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    status_entered = Column(String(100), nullable=False)
    action_taken = Column(String(255), nullable=False)
    remarks = Column(Text, nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="stage_histories")
    actor = relationship("User")

class EVCSchedule(Base):
    __tablename__ = "evc_schedules"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    evc_type = Column(String(50), default="Physical")
    scheduled_date = Column(DateTime, nullable=False)
    panel_lead = Column(String(255), nullable=False)
    panel_members = Column(JSON, default=list)
    inspection_status = Column(String(50), default="SCHEDULED")
    remarks = Column(Text, nullable=True)
    report_file_path = Column(String(500), nullable=True)
    recommendation = Column(String(100), nullable=True)
    completed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="evc_schedules")

class ComplianceObligation(Base):
    __tablename__ = "compliance_obligations"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    title = Column(String(255), nullable=False)
    source_condition = Column(String(255), nullable=False)
    due_date = Column(DateTime, nullable=False)
    evidence_required = Column(Text, nullable=False)
    evidence_file_path = Column(String(500), nullable=True)
    evidence_submitted_at = Column(DateTime, nullable=True)
    evidence_submission_notes = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING")
    reviewer_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    institution = relationship("Institution", back_populates="compliance_obligations")

class ValidityDocument(Base):
    __tablename__ = "validity_documents"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    document_type = Column(String(255), nullable=False)
    issuing_authority = Column(String(255), nullable=False)
    reference_number = Column(String(100), nullable=False)
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="VALID")
    file_path = Column(String(500), nullable=True)
    renewal_file_path = Column(String(500), nullable=True)
    renewal_submitted_at = Column(DateTime, nullable=True)
    renewal_status = Column(String(50), default="NOT_REQUIRED")

    institution = relationship("Institution", back_populates="validity_documents")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")
    category = Column(String(50), default="APPLICATION_WORKFLOW")
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    link = Column(String(255), nullable=True)
    alert_id = Column(Integer, ForeignKey("alert_records.id"), nullable=True)
    recommended_action = Column(String(255), nullable=True)
    due_date = Column(DateTime, nullable=True)
    delivery_status = Column(String(50), default="DELIVERED") # DELIVERED, SENT_EMAIL, FAILED, RETRY_EXHAUSTED
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("AlertRecord", back_populates="notifications")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="audit_events")

# ==================== NEW EXTENDED MODELS FOR ALERT INTELLIGENCE & AI LAYER ====================

class AlertPolicy(Base):
    __tablename__ = "alert_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_code = Column(String(100), unique=True, nullable=False) # e.g. POL_APP_OVERDUE
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False) # APPLICATION_WORKFLOW, EVC_SCHEDULING, COMPLIANCE, DOCUMENT_VALIDITY, OPERATIONAL
    warning_days_before = Column(Integer, default=3)
    overdue_threshold_hours = Column(Integer, default=0)
    escalation_delay_hours = Column(Integer, default=24) # Hours after overdue before escalating
    responsible_role = Column(String(50), nullable=False) # AICTE_OFFICER, EVC_COORDINATOR, etc.
    next_escalation_role = Column(String(50), nullable=True) # AICTE_ADMIN
    reminder_frequency_hours = Column(Integer, default=24)
    max_reminders = Column(Integer, default=3)
    requires_acknowledgement = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_statutory = Column(Boolean, default=False) # Distinguishes statutory vs administrative vs operational targets
    created_at = Column(DateTime, default=datetime.utcnow)

class AlertRecord(Base):
    __tablename__ = "alert_records"

    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(255), unique=True, index=True, nullable=False) # Prevents duplicates
    policy_code = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.HIGH)
    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN)
    
    # Associated Entities
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    target_role = Column(String(50), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    due_date = Column(DateTime, nullable=True)
    trigger_reason = Column(Text, nullable=False)
    recommended_action = Column(String(255), nullable=True)
    
    # Escalation state
    escalation_level = Column(Integer, default=0) # 0 = Initial, 1 = Escalated, 2 = Bureau Admin
    escalated_to_role = Column(String(50), nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    
    # Acknowledgment & Resolution
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_checked_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="alerts")
    institution = relationship("Institution", back_populates="alerts")
    notifications = relationship("Notification", back_populates="alert")
    escalation_events = relationship("EscalationEvent", back_populates="alert")

class EscalationEvent(Base):
    __tablename__ = "escalation_events"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alert_records.id"), nullable=False)
    previous_role = Column(String(50), nullable=False)
    new_role = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    triggering_rule = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action_taken = Column(String(255), default="Escalation notification dispatched to senior bureau authority")

    alert = relationship("AlertRecord", back_populates="escalation_events")

class UnifiedObligation(Base):
    __tablename__ = "unified_obligations"

    id = Column(Integer, primary_key=True, index=True)
    obligation_code = Column(String(100), unique=True, index=True, nullable=False) # e.g. OBL-APP-0012-SCRUTINY
    obligation_type = Column(String(50), nullable=False) # REVIEW, CORRECTION, EVC_SCHEDULE, COMPLIANCE_SUBMISSION, VERIFICATION, RENEWAL
    party_responsible = Column(String(50), nullable=False) # INSTITUTION or OFFICIAL
    
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    responsible_role = Column(String(50), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    priority = Column(String(20), default="MEDIUM")
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, OVERDUE, ESCALATED
    completion_conditions = Column(Text, nullable=True)
    resolution_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="obligations")
    institution = relationship("Institution", back_populates="obligations")

class ApplicationRiskAssessment(Base):
    __tablename__ = "application_risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    risk_score = Column(Float, nullable=False) # 0 - 100
    risk_category = Column(String(20), nullable=False) # LOW (0-24), MODERATE (25-49), HIGH (50-74), CRITICAL (75-100)
    
    # Delay Estimation (distinct from risk score)
    estimated_delay_days = Column(Float, default=0.0) # Estimated additional dwell time
    estimated_completion_date = Column(DateTime, nullable=True)
    delay_estimation_method = Column(String(100), default="Rule-based estimate — not a statistically validated prediction")
    
    factors = Column(JSON, default=list) # List of factor objects: {factor_name, weight, observed_value, contribution, evidence_source, clickable_type, clickable_id}
    data_quality_limitations = Column(JSON, default=list)
    recommended_action = Column(String(255), nullable=True)
    rule_version = Column(String(50), default="v2.1-ExplainableEngine")
    assessed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="risk_assessments")

class APHReferenceDocument(Base):
    """
    Approval Process Handbook (APH) Grounded Reference Documents
    """
    __tablename__ = "aph_reference_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_title = Column(String(255), nullable=False) # e.g. "AICTE Approval Process Handbook (APH) 2024-27"
    version_academic_year = Column(String(50), nullable=False) # 2024-2027
    chapter_clause = Column(String(100), nullable=False) # Chapter II, Clause 2.14
    page_reference = Column(String(50), nullable=True)
    extracted_text = Column(Text, nullable=False)
    proposed_interpretation = Column(Text, nullable=False)
    applicable_category = Column(String(100), nullable=False)
    verification_status = Column(String(50), default="VERIFIED_AUTHORITY") # VERIFIED_AUTHORITY, UNVERIFIED_DRAFT
    reviewer_name = Column(String(255), default="Dr. R. K. Sridhar (Approval Bureau)")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PolicyDraftSimulation(Base):
    """
    Draft policy change simulations for What-If impact analysis without modifying live data.
    """
    __tablename__ = "policy_draft_simulations"

    id = Column(Integer, primary_key=True, index=True)
    draft_name = Column(String(255), nullable=False)
    proposed_change = Column(Text, nullable=False)
    previous_configuration = Column(JSON, default=dict)
    new_configuration = Column(JSON, default=dict)
    affected_application_count = Column(Integer, default=0)
    affected_obligations_count = Column(Integer, default=0)
    summary_impact = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
