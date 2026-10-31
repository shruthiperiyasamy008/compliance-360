from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, UserRole, Institution, Application, Document, DocumentStatus,
    ApplicationCategory, ApplicationStatus, StageHistory, EVCSchedule,
    ComplianceObligation, ValidityDocument, AuditEvent, Notification,
    UnifiedObligation, APHReferenceDocument
)
from .auth import get_password_hash
from .rules import CATEGORY_DOCUMENT_REQUIREMENTS, record_application_risk_assessment
from .alert_engine import ensure_default_policies, AlertMonitoringService

def seed_database(db: Session):
    ensure_default_policies(db)

    # Check if admin already exists
    if db.query(User).filter(User.email == "admin@aicte.gov.in").first():
        # Ensure APH references exist even if users are already seeded
        _seed_aph_references(db)
        # Ensure risk assessments are recorded for existing applications
        for a in db.query(Application).all():
            if not a.risk_assessments:
                record_application_risk_assessment(db, a)
        db.commit()
        return

    print("--- Seeding Database with AICTE Baseline Data ---")

    # 1. AICTE Admin & Officer Accounts
    admin_user = User(
        email="admin@aicte.gov.in",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Dr. R. K. Sridhar (AICTE Admin)",
        role=UserRole.AICTE_ADMIN,
        designation="Director (Approval Bureau)",
        department="Central Approval Bureau",
        is_active=True
    )
    officer_user = User(
        email="officer@aicte.gov.in",
        hashed_password=get_password_hash("Officer@123"),
        full_name="Prof. Sunita Verma (Scrutiny Officer)",
        role=UserRole.AICTE_OFFICER,
        designation="Senior Scrutiny Consultant",
        department="Regional Bureau - Western",
        is_active=True
    )
    evc_user = User(
        email="evc@aicte.gov.in",
        hashed_password=get_password_hash("Evc@123"),
        full_name="Dr. Anil Deshmukh (EVC Coordinator)",
        role=UserRole.EVC_COORDINATOR,
        designation="Regional Inspection Convenor",
        department="Inspection Cell",
        is_active=True
    )
    auditor_user = User(
        email="auditor@aicte.gov.in",
        hashed_password=get_password_hash("Auditor@123"),
        full_name="Rajesh Mehrotra (Quality Auditor)",
        role=UserRole.AUDITOR,
        designation="Independent Vigilance Officer",
        department="Vigilance Cell",
        is_active=True
    )
    db.add_all([admin_user, officer_user, evc_user, auditor_user])
    db.flush()

    # 2. Realistic Institutions
    inst1 = Institution(
        aicte_id="1-432891001",
        name="Vivekananda Institute of Technology and Science",
        category="Engineering & Technology",
        region="Western",
        state="Maharashtra",
        address="Sector 14, Knowledge Corridor, Pune - 411038",
        contact_email="principal@vits-pune.edu.in",
        contact_phone="+91 20 2567 8900",
        head_of_institution="Dr. Ashok Patil",
        established_year=2008
    )
    inst2 = Institution(
        aicte_id="1-789012344",
        name="Apex College of Advanced Computing and AI",
        category="Technical Campus",
        region="Southern",
        state="Karnataka",
        address="Plot 5B, Electronic City Phase 1, Bengaluru - 560100",
        contact_email="director@apexcomputing.ac.in",
        contact_phone="+91 80 4123 4567",
        head_of_institution="Dr. Meenakshi Sundaram",
        established_year=2015
    )
    inst3 = Institution(
        aicte_id="1-998822110",
        name="Northern Institute of Management & Research",
        category="Management",
        region="Northern",
        state="Uttar Pradesh",
        address="Sector 62, Institutional Area, Noida - 201309",
        contact_email="registrar@nimr-noida.edu.in",
        contact_phone="+91 120 456 7890",
        head_of_institution="Prof. K. P. Sharma",
        established_year=2011
    )
    db.add_all([inst1, inst2, inst3])
    db.flush()

    # 3. Institution Users
    inst_user1 = User(
        email="institution@vits.edu.in",
        hashed_password=get_password_hash("College@123"),
        full_name="Dr. Ashok Patil (Principal)",
        role=UserRole.INSTITUTION_USER,
        institution_id=inst1.id,
        is_active=True
    )
    inst_user2 = User(
        email="institution@apex.ac.in",
        hashed_password=get_password_hash("College@123"),
        full_name="Dr. Meenakshi Sundaram (Director)",
        role=UserRole.INSTITUTION_USER,
        institution_id=inst2.id,
        is_active=True
    )
    db.add_all([inst_user1, inst_user2])
    db.flush()

    # 4. Realistic Applications
    # Scenario A: Institution applying to introduce a new course
    app1 = Application(
        application_id="AICTE-2025-0012",
        institution_id=inst1.id,
        category=ApplicationCategory.NEW_COURSE,
        academic_year="2025-2026",
        title="Introduction of B.Tech in Artificial Intelligence & Machine Learning",
        description="Application for approval to introduce new 4-year undergraduate degree program with 60 sanctioned seats.",
        programme="Engineering & Technology",
        proposed_course_name="B.Tech in Artificial Intelligence & Machine Learning",
        proposed_intake=60,
        current_stage="Scrutiny",
        status=ApplicationStatus.UNDER_SCRUTINY,
        assigned_officer_id=officer_user.id,
        workflow_route="Scrutiny+EVC",
        deadline=datetime.utcnow() + timedelta(days=12),
        submitted_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(app1)
    db.flush()

    # Documents for App 1
    reqs_new_course = CATEGORY_DOCUMENT_REQUIREMENTS["Introduction of a New Course or Programme"]
    for r in reqs_new_course:
        doc = Document(
            application_id=app1.id,
            name=r["name"],
            requirement_code=r["requirement_code"],
            is_mandatory=r["is_mandatory"],
            description=r["description"],
            file_name=f"{r['requirement_code'].lower()}_submitted.pdf",
            file_path=f"./uploads/app_{app1.id}/{r['requirement_code'].lower()}_submitted.pdf",
            file_size_kb=420.5,
            version=1,
            status=DocumentStatus.SUBMITTED,
            submitted_at=datetime.utcnow() - timedelta(days=4)
        )
        db.add(doc)

    # Scenario B: Facility-related application involving computer laboratory with returned deficiency
    app2 = Application(
        application_id="AICTE-2025-0015",
        institution_id=inst1.id,
        category=ApplicationCategory.INFRASTRUCTURE_FACILITY,
        academic_year="2025-2026",
        title="Establishment of High-Performance Central Computing & IoT Facility",
        description="Expansion request for specialized computing center with 120 client terminals and dedicated GPU server rack.",
        facility_details="Central Computing Center (Block C, 3rd Floor, 3500 sq.ft) with 120 HP Workstations, 20 kVA UPS redundancy.",
        current_stage="Scrutiny",
        status=ApplicationStatus.CORRECTION_REQUIRED,
        assigned_officer_id=officer_user.id,
        workflow_route="Scrutiny+EVC",
        deadline=datetime.utcnow() + timedelta(days=7),
        submitted_at=datetime.utcnow() - timedelta(days=9)
    )
    db.add(app2)
    db.flush()

    doc_layout = Document(
        application_id=app2.id,
        name="Architectural Layout & Floor Area Certificate",
        requirement_code="ARCH_LAYOUT",
        is_mandatory=True,
        description="Approved master plan showing proposed computer lab / facility dimensions",
        file_name="lab_floor_plan_v1.pdf",
        file_path=f"./uploads/app_{app2.id}/lab_floor_plan_v1.pdf",
        file_size_kb=840.0,
        version=1,
        status=DocumentStatus.CORRECTION_REQUIRED,
        reviewer_decision="CORRECTION_REQUESTED",
        deficiency_reason="The submitted layout plan does not clearly show emergency fire exit passageways or server room earthing pit layout as per AICTE Norms 2024-25 Table 4.2.",
        corrective_action_requested="Upload an architect-endorsed revision marking dual exit doors, 1.5m clearance aisle, and designated electrical breaker panel.",
        submitted_at=datetime.utcnow() - timedelta(days=9),
        reviewed_at=datetime.utcnow() - timedelta(days=2)
    )
    doc_bills = Document(
        application_id=app2.id,
        name="Equipment Purchase Invoices & Quotations",
        requirement_code="EQUIPMENT_BILLS",
        is_mandatory=True,
        description="Proof of procurement for computer systems, networking hardware, UPS & licencing",
        file_name="workstation_po_bills.pdf",
        file_path=f"./uploads/app_{app2.id}/workstation_po_bills.pdf",
        file_size_kb=1250.0,
        version=1,
        status=DocumentStatus.VERIFIED,
        reviewer_decision="ACCEPTED",
        submitted_at=datetime.utcnow() - timedelta(days=9),
        reviewed_at=datetime.utcnow() - timedelta(days=2)
    )
    doc_fire = Document(
        application_id=app2.id,
        name="Electrical Load & Fire Safety Endorsement",
        requirement_code="FIRE_SAFETY",
        is_mandatory=True,
        description="NOC and power sanction certificate for proposed computer center load",
        file_name="fire_safety_noc.pdf",
        file_path=f"./uploads/app_{app2.id}/fire_safety_noc.pdf",
        file_size_kb=512.0,
        version=1,
        status=DocumentStatus.VERIFIED,
        reviewer_decision="ACCEPTED",
        submitted_at=datetime.utcnow() - timedelta(days=9),
        reviewed_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add_all([doc_layout, doc_bills, doc_fire])

    # Scenario C: Extension of Approval (EoA) in EVC stage
    app3 = Application(
        application_id="AICTE-2025-0008",
        institution_id=inst2.id,
        category=ApplicationCategory.EOA,
        academic_year="2025-2026",
        title="Extension of Approval (EoA) for Academic Year 2025-2026",
        description="Regular annual Extension of Approval for existing B.Tech and MCA academic programs.",
        programme="Engineering & Computer Applications",
        current_stage="EVC",
        status=ApplicationStatus.EVC_SCHEDULED,
        assigned_officer_id=officer_user.id,
        workflow_route="Scrutiny+EVC",
        deadline=datetime.utcnow() + timedelta(days=5),
        submitted_at=datetime.utcnow() - timedelta(days=18)
    )
    db.add(app3)
    db.flush()

    reqs_eoa = CATEGORY_DOCUMENT_REQUIREMENTS["Extension of Approval"]
    for r in reqs_eoa:
        doc = Document(
            application_id=app3.id,
            name=r["name"],
            requirement_code=r["requirement_code"],
            is_mandatory=r["is_mandatory"],
            file_name=f"{r['requirement_code'].lower()}.pdf",
            file_path=f"./uploads/app_{app3.id}/{r['requirement_code'].lower()}.pdf",
            file_size_kb=600.0,
            version=1,
            status=DocumentStatus.VERIFIED,
            reviewer_decision="ACCEPTED",
            submitted_at=datetime.utcnow() - timedelta(days=18),
            reviewed_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add(doc)

    evc3 = EVCSchedule(
        application_id=app3.id,
        evc_type="Physical",
        scheduled_date=datetime.utcnow() + timedelta(days=3),
        panel_lead="Dr. P. Venkatraman (IIT Bombay)",
        panel_members=["Dr. P. Venkatraman", "Prof. Sneha Deshpande (COEP)", "Dr. M. K. Rao (VJTI)"],
        inspection_status="SCHEDULED",
        remarks="Comprehensive inspection of computer facilities, research labs, and faculty cadre compliance."
    )
    db.add(evc3)

    # 5. Post-Approval Compliance Obligations
    comp1 = ComplianceObligation(
        institution_id=inst1.id,
        title="Biometric Attendance Integration with AICTE Portal",
        source_condition="Condition 6 of Approval Letter 2024-25",
        due_date=datetime.utcnow() + timedelta(days=10),
        evidence_required="API integration confirmation certificate and live test logs",
        status="PENDING"
    )
    comp2 = ComplianceObligation(
        institution_id=inst1.id,
        title="Establishment of Grievance Redressal Mechanism & SC/ST Cell",
        source_condition="Mandatory Compliance Clause 3.1",
        due_date=datetime.utcnow() - timedelta(days=2),
        evidence_required="Committee notification order and web portal link",
        status="PENDING"
    )
    comp3 = ComplianceObligation(
        institution_id=inst2.id,
        title="Barrier-free Environment & Wheelchair Accessible Lift Report",
        source_condition="EVC Inspection Observation 2024",
        due_date=datetime.utcnow() + timedelta(days=25),
        evidence_required="PWD certified ramp gradient certificate and lift commissioning letter",
        status="SUBMITTED_FOR_VERIFICATION",
        evidence_submitted_at=datetime.utcnow() - timedelta(days=1),
        evidence_submission_notes="Lift commissioning certificate signed by Otis engineers and PWD structural engineer uploaded."
    )
    db.add_all([comp1, comp2, comp3])

    # 6. Prescribed Validity Documents
    val1 = ValidityDocument(
        institution_id=inst1.id,
        document_type="Land Registered Lease Deed (30-Year Mandatory)",
        issuing_authority="Sub-Registrar Haveli, Pune",
        reference_number="MH-PUN-LEASE-2005-9981",
        issue_date=datetime.utcnow() - timedelta(days=365 * 19),
        expiry_date=datetime.utcnow() + timedelta(days=45),
        status="EXPIRING_SOON"
    )
    val2 = ValidityDocument(
        institution_id=inst1.id,
        document_type="Fire Safety Certificate / No-Objection Certificate",
        issuing_authority="Chief Fire Officer, Pune Municipal Corporation",
        reference_number="PMC/FIRE/NOC/2024/481",
        issue_date=datetime.utcnow() - timedelta(days=340),
        expiry_date=datetime.utcnow() + timedelta(days=25),
        status="EXPIRING_SOON"
    )
    val3 = ValidityDocument(
        institution_id=inst2.id,
        document_type="Building Safety & Structural Stability Certificate",
        issuing_authority="Executive Engineer, PWD Karnataka",
        reference_number="PWD-KAR-BLDG-2022-771",
        issue_date=datetime.utcnow() - timedelta(days=365 * 2),
        expiry_date=datetime.utcnow() + timedelta(days=365),
        status="VALID"
    )
    db.add_all([val1, val2, val3])

    # 7. Unified Obligations Initial Records
    obl1 = UnifiedObligation(
        obligation_code=f"OBL-{app2.id}-CORRECTION",
        obligation_type="CORRECTION",
        party_responsible="INSTITUTION",
        application_id=app2.id,
        institution_id=inst1.id,
        title=f"Architectural Layout Replacement for {app2.application_id}",
        description="Upload architect-certified floor plan addressing emergency fire exit passageways.",
        responsible_role="INSTITUTION_USER",
        priority="HIGH",
        due_date=datetime.utcnow() + timedelta(days=5),
        status="PENDING",
        completion_conditions="Upload v2 replacement document for ARCH_LAYOUT"
    )
    obl2 = UnifiedObligation(
        obligation_code=f"OBL-{app3.id}-EVC-INSPECTION",
        obligation_type="EVC_SCHEDULE",
        party_responsible="OFFICIAL",
        application_id=app3.id,
        institution_id=inst2.id,
        title=f"EVC Inspection Coordination for {app3.application_id}",
        description="Conduct inspection visit and upload expert panel recommendations.",
        responsible_role="EVC_COORDINATOR",
        priority="HIGH",
        due_date=datetime.utcnow() + timedelta(days=4),
        status="IN_PROGRESS",
        completion_conditions="Upload signed EVC report and select recommendation"
    )
    db.add_all([obl1, obl2])

    db.commit()

    # 8. Seed APH Grounded Knowledge Base
    _seed_aph_references(db)

    # 9. Calculate and persist immutable Risk Assessments
    for a in [app1, app2, app3]:
        record_application_risk_assessment(db, a)
    db.commit()

    # 10. Run initial alert monitoring cycle
    monitor = AlertMonitoringService(db)
    monitor.run_all_monitors()

    print("--- Database seeding complete ---")

def _seed_aph_references(db: Session):
    if db.query(APHReferenceDocument).first():
        return

    refs = [
        APHReferenceDocument(
            document_title="AICTE Approval Process Handbook (APH) 2024-27",
            version_academic_year="2024-2027",
            chapter_clause="Chapter II, Clause 2.14",
            page_reference="Page 48",
            extracted_text="Introduction of any new course or programme in Engineering and Technology requires an approved Governing Body resolution, a comprehensive Detailed Project Report (DPR), and adherence to 1:15 or 1:20 faculty cadre ratios with dedicated computational facilities.",
            proposed_interpretation="Introduction of New Course requires GB_RESOLUTION, DPR_SYLLABUS, and FACULTY_CADRE. Non-submission triggers automatic scrutiny return.",
            applicable_category="Introduction of a New Course or Programme",
            verification_status="VERIFIED_AUTHORITY",
            reviewer_name="Dr. R. K. Sridhar (Approval Bureau)"
        ),
        APHReferenceDocument(
            document_title="AICTE Norms for Instructional Facilities Table 4.2",
            version_academic_year="2024-2027",
            chapter_clause="Chapter IV, Norm 4.2",
            page_reference="Page 82",
            extracted_text="Computer centers and instructional laboratories must feature dual fire exit passages of at least 1.5m clearance, earthing pit separation from standard electrical distribution, and certified UPS backup redundancy.",
            proposed_interpretation="Architectural layout blueprints lacking designated fire escape passageways or server room breaker details must be returned under deficiency code ARCH_LAYOUT.",
            applicable_category="Infrastructure or Facility Request",
            verification_status="VERIFIED_AUTHORITY",
            reviewer_name="Prof. Sunita Verma (Scrutiny Officer)"
        ),
        APHReferenceDocument(
            document_title="AICTE Approval Process Handbook Clause 1.8 (Land Norms)",
            version_academic_year="2024-2027",
            chapter_clause="Chapter I, Clause 1.8",
            page_reference="Page 24",
            extracted_text="The institution must maintain a registered lease deed of not less than 30 years or freehold title. Where lease expiry is less than 60 days, renewal proceedings must be established prior to sanction.",
            proposed_interpretation="Prescribed Land Lease Deed must be monitored for validity. Documents expiring within 60 days trigger proactive renewal warnings.",
            applicable_category="New Institution",
            verification_status="VERIFIED_AUTHORITY",
            reviewer_name="Dr. R. K. Sridhar (Approval Bureau)"
        )
    ]
    db.add_all(refs)
    db.commit()
