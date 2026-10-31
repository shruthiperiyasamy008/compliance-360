from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from .models import UserRole, ApplicationCategory, ApplicationStatus, DocumentStatus

# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

class InstitutionRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    aicte_id: str
    institution_name: str
    category: str = "Technical Campus"
    region: str
    state: str
    address: str
    contact_phone: str
    head_of_institution: Optional[str] = None
    established_year: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    full_name: str
    role: str
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    category: ApplicationCategory
    academic_year: str = "2025-2026"
    title: str
    description: Optional[str] = None
    programme: Optional[str] = None
    proposed_course_name: Optional[str] = None
    proposed_intake: Optional[int] = None
    facility_details: Optional[str] = None

class DocumentActionRequest(BaseModel):
    decision: str
    deficiency_reason: Optional[str] = None
    corrective_action_requested: Optional[str] = None

class ApplicationStageTransitionRequest(BaseModel):
    next_stage: str
    next_status: ApplicationStatus
    remarks: Optional[str] = None

class EVCScheduleCreate(BaseModel):
    evc_type: str = "Physical"
    scheduled_date: datetime
    panel_lead: str
    panel_members: List[str] = []
    remarks: Optional[str] = None

class EVCCompletionRequest(BaseModel):
    recommendation: str
    remarks: Optional[str] = None

class ComplianceSubmissionRequest(BaseModel):
    evidence_notes: str

class ValidityDocumentCreate(BaseModel):
    document_type: str
    issuing_authority: str
    reference_number: str
    issue_date: Optional[datetime] = None
    expiry_date: datetime

class SimulationRequest(BaseModel):
    additional_applications_pct: float = 20.0
    scrutiny_capacity_change_pct: float = 0.0
    evc_delay_days: int = 5

# --- New Alert & AI Layer Schemas ---

class AlertPolicyUpdate(BaseModel):
    warning_days_before: Optional[int] = None
    overdue_threshold_hours: Optional[int] = None
    escalation_delay_hours: Optional[int] = None
    responsible_role: Optional[str] = None
    next_escalation_role: Optional[str] = None
    reminder_frequency_hours: Optional[int] = None
    requires_acknowledgement: Optional[bool] = None
    is_active: Optional[bool] = None

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None

class AlertResolveRequest(BaseModel):
    resolution_notes: str

class AIChatQueryRequest(BaseModel):
    query: str
    context_app_id: Optional[int] = None

class ApprovalRehearsalRequest(BaseModel):
    category: ApplicationCategory
    academic_year: str = "2025-2026"
    title: str
    programme: Optional[str] = None
    proposed_course_name: Optional[str] = None
    proposed_intake: Optional[int] = None
    facility_details: Optional[str] = None
    attached_document_codes: List[str] = []

class PolicyDraftSimulationRequest(BaseModel):
    draft_name: str
    proposed_change: str
    new_scrutiny_days: Optional[float] = None
    new_evc_days: Optional[float] = None
    require_new_mandate: Optional[str] = None
