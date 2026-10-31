export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'AICTE_ADMIN' | 'AICTE_OFFICER' | 'INSTITUTION_USER' | 'EVC_COORDINATOR' | 'AUDITOR';
  institution_id?: number;
  institution_name?: string;
  aicte_id?: string;
}

export interface DocumentVersion {
  version_number: number;
  file_name: string;
  uploaded_at: string;
  remarks?: string;
  status_at_upload: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  requirement_code: string;
  is_mandatory: boolean;
  description?: string;
  file_name?: string;
  file_path?: string;
  file_size_kb?: number;
  version: number;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'VERIFIED' | 'REJECTED';
  reviewer_decision?: string;
  deficiency_reason?: string;
  corrective_action_requested?: string;
  submitted_at?: string;
  reviewed_at?: string;
  versions?: DocumentVersion[];
}

export interface StageHistoryItem {
  id: number;
  stage_name: string;
  status_entered: string;
  action_taken: string;
  remarks?: string;
  actor_name: string;
  actor_role: string;
  created_at: string;
}

export interface EVCScheduleItem {
  id: number;
  evc_type: string;
  scheduled_date: string;
  panel_lead: string;
  panel_members: string[];
  inspection_status: string;
  remarks?: string;
  recommendation?: string;
  completed_at?: string;
}

export interface RiskFactor {
  factor_name: string;
  weight: number;
  observed_value: string;
  contribution: number;
  evidence_source: string;
  clickable_type: string;
  clickable_id?: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface ApplicationDetail {
  id: number;
  application_id: string;
  institution_id: number;
  institution_name: string;
  aicte_id: string;
  region: string;
  state: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  academic_year: string;
  title: string;
  description?: string;
  programme?: string;
  proposed_course_name?: string;
  proposed_intake?: number;
  facility_details?: string;
  current_stage: string;
  status: string;
  workflow_route: string;
  assigned_officer: string;
  assigned_officer_id?: number;
  deadline?: string;
  submitted_at: string;
  last_updated_at?: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  risk_reasons: string[];
  estimated_delay_days?: number;
  estimated_completion_date?: string;
  delay_estimation_method?: string;
  risk_factors?: RiskFactor[];
  data_quality_limitations?: string[];
  recommended_action?: string;
  risk_assessments_history?: Array<{
    id: number;
    risk_score: number;
    risk_category: string;
    estimated_delay_days: number;
    assessed_at: string;
    factors_count: number;
  }>;
  documents: DocumentItem[];
  stage_histories: StageHistoryItem[];
  evc_schedules: EVCScheduleItem[];
  audit_events: Array<{
    id: number;
    action: string;
    actor_name: string;
    actor_role: string;
    details: any;
    timestamp: string;
  }>;
}

export interface AlertItem {
  id: number;
  policy_code: string;
  category: string;
  title: string;
  description: string;
  severity: 'INFO' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  target_role: string;
  application_id?: number;
  application_code?: string;
  institution_name?: string;
  due_date?: string;
  trigger_reason: string;
  recommended_action?: string;
  escalation_level: number;
  escalated_to_role?: string;
  escalated_at?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  escalation_events?: Array<{
    id: number;
    previous_role: string;
    new_role: string;
    reason: string;
    triggering_rule: string;
    timestamp: string;
  }>;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  is_read: boolean;
  is_acknowledged: boolean;
  alert_id?: number;
  recommended_action?: string;
  due_date?: string;
  link?: string;
  delivery_status: string;
  created_at: string;
}

export interface UnifiedObligationItem {
  id: number;
  obligation_code: string;
  obligation_type: string;
  party_responsible: 'INSTITUTION' | 'OFFICIAL';
  application_id?: number;
  application_code?: string;
  institution_name?: string;
  title: string;
  description: string;
  responsible_role: string;
  priority: string;
  due_date: string;
  status: string;
  completion_conditions?: string;
  created_at: string;
}

export interface ComplianceObligation {
  id: number;
  institution_id: number;
  institution_name: string;
  title: string;
  source_condition: string;
  due_date: string;
  evidence_required: string;
  evidence_file_path?: string;
  evidence_submitted_at?: string;
  evidence_submission_notes?: string;
  status: 'PENDING' | 'SUBMITTED_FOR_VERIFICATION' | 'VERIFIED' | 'OVERDUE';
  reviewer_notes?: string;
  verified_at?: string;
}

export interface ValidityDoc {
  id: number;
  institution_id: number;
  institution_name: string;
  document_type: string;
  issuing_authority: string;
  reference_number: string;
  issue_date?: string;
  expiry_date: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  renewal_status: string;
}
