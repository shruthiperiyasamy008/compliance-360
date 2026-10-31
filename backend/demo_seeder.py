import os
import shutil
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, UserRole, Institution, Application, Document, DocumentStatus,
    DocumentVersion, ApplicationCategory, ApplicationStatus, StageHistory,
    EVCSchedule, ComplianceObligation, ValidityDocument, AuditEvent,
    Notification, UnifiedObligation, AlertRecord, AlertStatus, AlertSeverity,
    ApplicationRiskAssessment
)
from .auth import get_password_hash
from .rules import CATEGORY_DOCUMENT_REQUIREMENTS, record_application_risk_assessment
from .alert_engine import ensure_default_policies, AlertMonitoringService
from .config import settings

DEMO_MARKER = "DEMO_SIH_2025"

def generate_complete_demo_dataset(db: Session, reference_time: datetime = None) -> dict:
    """
    Idempotent, non-destructive generator for a comprehensive 12-institution,
    26-application demonstration dataset with realistic variations across speeds,
    risk profiles, EVC queues, compliance deadlines, and alert histories.
    """
    if reference_time is None:
        reference_time = datetime.utcnow()

    ensure_default_policies(db)

    # 1. Ensure Standard Officials Exist
    admin_user = db.query(User).filter(User.email == "admin@aicte.gov.in").first()
    if not admin_user:
        admin_user = User(
            email="admin@aicte.gov.in",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Dr. R. K. Sridhar (AICTE Admin)",
            role=UserRole.AICTE_ADMIN,
            designation="Director (Approval Bureau)",
            department="Central Approval Bureau",
            is_active=True
        )
        db.add(admin_user)

    officer_user = db.query(User).filter(User.email == "officer@aicte.gov.in").first()
    if not officer_user:
        officer_user = User(
            email="officer@aicte.gov.in",
            hashed_password=get_password_hash("Officer@123"),
            full_name="Prof. Sunita Verma (Scrutiny Officer)",
            role=UserRole.AICTE_OFFICER,
            designation="Senior Scrutiny Consultant",
            department="Regional Bureau - Western",
            is_active=True
        )
        db.add(officer_user)

    evc_user = db.query(User).filter(User.email == "evc@aicte.gov.in").first()
    if not evc_user:
        evc_user = User(
            email="evc@aicte.gov.in",
            hashed_password=get_password_hash("Evc@123"),
            full_name="Dr. Anil Deshmukh (EVC Coordinator)",
            role=UserRole.EVC_COORDINATOR,
            designation="Regional Inspection Convenor",
            department="Inspection Cell",
            is_active=True
        )
        db.add(evc_user)

    auditor_user = db.query(User).filter(User.email == "auditor@aicte.gov.in").first()
    if not auditor_user:
        auditor_user = User(
            email="auditor@aicte.gov.in",
            hashed_password=get_password_hash("Auditor@123"),
            full_name="Rajesh Mehrotra (Quality Auditor)",
            role=UserRole.AUDITOR,
            designation="Independent Vigilance Officer",
            department="Vigilance Cell",
            is_active=True
        )
        db.add(auditor_user)

    db.flush()

    # 2. Define 12 Realistic Fictional Institutions across Indian Regions
    institution_configs = [
        {
            "aicte_id": "1-432891001",
            "name": "Vivekananda Institute of Technology and Science",
            "category": "Engineering & Technology",
            "region": "Western",
            "state": "Maharashtra",
            "city": "Pune",
            "address": "Sector 14, Knowledge Corridor, Pune - 411038",
            "contact_email": "institution@vits.edu.in",
            "user_email": "institution@vits.edu.in",
            "principal": "Dr. Ashok Patil",
            "established": 2008
        },
        {
            "aicte_id": "1-789012344",
            "name": "Apex College of Advanced Computing and AI",
            "category": "Technical Campus",
            "region": "Southern",
            "state": "Karnataka",
            "city": "Bengaluru",
            "address": "Plot 5B, Electronic City Phase 1, Bengaluru - 560100",
            "contact_email": "institution@apex.ac.in",
            "user_email": "institution@apex.ac.in",
            "principal": "Dr. Meenakshi Sundaram",
            "established": 2015
        },
        {
            "aicte_id": "1-998822110",
            "name": "Northern Institute of Management & Research",
            "category": "Management",
            "region": "Northern",
            "state": "Uttar Pradesh",
            "city": "Noida",
            "address": "Sector 62, Institutional Area, Noida - 201309",
            "contact_email": "director@nimr.edu.in",
            "user_email": "institution@nimr.edu.in",
            "principal": "Prof. K. P. Sharma",
            "established": 2011
        },
        {
            "aicte_id": "1-554433221",
            "name": "Sahyadri Institute of Engineering & Robotics",
            "category": "Engineering & Technology",
            "region": "Western",
            "state": "Maharashtra",
            "city": "Nashik",
            "address": "Gangapur Hills, Nashik - 422013",
            "contact_email": "principal@sahyadri-engg.edu.in",
            "user_email": "institution@sahyadri.edu.in",
            "principal": "Dr. Vinay Deshmukh",
            "established": 2014
        },
        {
            "aicte_id": "1-667788990",
            "name": "Coromandel Academy of Maritime & Technical Studies",
            "category": "Technical Campus",
            "region": "Southern",
            "state": "Tamil Nadu",
            "city": "Chennai",
            "address": "Old Mahabalipuram Road, IT Corridor, Chennai - 600119",
            "contact_email": "dean@coromandel-tech.ac.in",
            "user_email": "institution@coromandel.edu.in",
            "principal": "Dr. S. Radhakrishnan",
            "established": 2006
        },
        {
            "aicte_id": "1-332211445",
            "name": "Malwa Institute of Science & Pharmaceutical Sciences",
            "category": "Pharmacy",
            "region": "Central",
            "state": "Madhya Pradesh",
            "city": "Indore",
            "address": "Bhawarkua Main Road, Indore - 452001",
            "contact_email": "principal@malwapharm.ac.in",
            "user_email": "institution@malwa.edu.in",
            "principal": "Dr. Neha Agrawal",
            "established": 2017
        },
        {
            "aicte_id": "1-889900112",
            "name": "Heritage Valley School of Architecture & Urban Design",
            "category": "Architecture & Planning",
            "region": "Northern",
            "state": "Haryana",
            "city": "Gurugram",
            "address": "Sohna Road, Sector 48, Gurugram - 122018",
            "contact_email": "director@heritage-arch.edu.in",
            "user_email": "institution@heritage.edu.in",
            "principal": "Prof. Sanjay Malhotra",
            "established": 2013
        },
        {
            "aicte_id": "1-112233449",
            "name": "Brahmaputra Regional College of Engineering",
            "category": "Engineering & Technology",
            "region": "Eastern",
            "state": "Assam",
            "city": "Guwahati",
            "address": "Jalukbari Bypass Road, Guwahati - 781014",
            "contact_email": "principal@brce-assam.ac.in",
            "user_email": "institution@brce.edu.in",
            "principal": "Dr. B. K. Sarma",
            "established": 2010
        },
        {
            "aicte_id": "1-776655443",
            "name": "Kalinga Institute of Poly-Engineering & Skill Sciences",
            "category": "Applied Arts & Crafts",
            "region": "Eastern",
            "state": "Odisha",
            "city": "Bhubaneswar",
            "address": "Infocity Avenue, Patia, Bhubaneswar - 751024",
            "contact_email": "director@kalinga-poly.edu.in",
            "user_email": "institution@kalinga.edu.in",
            "principal": "Dr. Manoranjan Nayak",
            "established": 2016
        },
        {
            "aicte_id": "1-445566778",
            "name": "Konkan Technical Campus of Cyber Security",
            "category": "Technical Campus",
            "region": "Western",
            "state": "Goa",
            "city": "Panaji",
            "address": "Plateau Campus, Bambolim, Goa - 403202",
            "contact_email": "registrar@konkan-cyber.ac.in",
            "user_email": "institution@konkan.edu.in",
            "principal": "Dr. Anthony Fernandes",
            "established": 2019
        },
        {
            "aicte_id": "1-990011223",
            "name": "Vindhya Institute of Technology & Renewable Energy",
            "category": "Engineering & Technology",
            "region": "Central",
            "state": "Chhattisgarh",
            "city": "Raipur",
            "address": "Atal Nagar, Sector 24, Nawa Raipur - 492002",
            "contact_email": "principal@vindhyatech.ac.in",
            "user_email": "institution@vindhya.edu.in",
            "principal": "Dr. Rameshwar Shukla",
            "established": 2012
        },
        {
            "aicte_id": "1-556677889",
            "name": "Nilgiri School of Applied Analytics & Cloud Systems",
            "category": "Technical Campus",
            "region": "South-Western",
            "state": "Kerala",
            "city": "Kochi",
            "address": "Infopark Phase 2 Expressway, Kakkanad, Kochi - 682042",
            "contact_email": "principal@nilgiri-analytics.ac.in",
            "user_email": "institution@nilgiri.edu.in",
            "principal": "Dr. Thomas Kurian",
            "established": 2020
        }
    ]

    institutions_map = {}
    for cfg in institution_configs:
        inst = db.query(Institution).filter(Institution.aicte_id == cfg["aicte_id"]).first()
        if not inst:
            inst = Institution(
                aicte_id=cfg["aicte_id"],
                name=cfg["name"],
                category=cfg["category"],
                region=cfg["region"],
                state=cfg["state"],
                address=cfg["address"],
                contact_email=cfg["contact_email"],
                contact_phone="+91 20 4567 8900",
                head_of_institution=cfg["principal"],
                established_year=cfg["established"],
                created_at=reference_time - timedelta(days=120)
            )
            db.add(inst)
            db.flush()

        institutions_map[cfg["aicte_id"]] = inst

        # Associated user
        user = db.query(User).filter(User.email == cfg["user_email"]).first()
        if not user:
            user = User(
                email=cfg["user_email"],
                hashed_password=get_password_hash("College@123"),
                full_name=f"{cfg['principal']} (Principal)",
                role=UserRole.INSTITUTION_USER,
                institution_id=inst.id,
                is_active=True,
                created_at=reference_time - timedelta(days=120)
            )
            db.add(user)

    db.flush()

    # 3. Create 26 Distinct Applications Covering Speeds, Stages, and Real Scenarios
    # Groups:
    # A. 5 Fast / Low-Risk Applications
    # B. 7 Medium-Risk Applications
    # C. 6 High-Risk / Delayed Applications
    # D. 8 Edge-Case & Regulatory Workflow Applications
    app_definitions = [
        # --- GROUP A: FAST / LOW-RISK (5 Applications) ---
        {
            "code": "AICTE-2025-0001",
            "inst_key": "1-432891001",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval for Engineering Programs (2025-26)",
            "stage": "Decision",
            "status": ApplicationStatus.APPROVED,
            "route": "Only Scrutiny",
            "sub_days_ago": 22,
            "deadline_days": 10,
            "officer": officer_user.id,
            "all_verified": True
        },
        {
            "code": "AICTE-2025-0002",
            "inst_key": "1-789012344",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of B.Tech in Artificial Intelligence & Data Science",
            "stage": "Decision",
            "status": ApplicationStatus.APPROVED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 26,
            "deadline_days": 8,
            "officer": officer_user.id,
            "all_verified": True,
            "evc_completed": True
        },
        {
            "code": "AICTE-2025-0003",
            "inst_key": "1-554433221",
            "cat": ApplicationCategory.INCREASE_INTAKE,
            "title": "Increase in Intake: B.Tech Computer Engineering (60 to 120)",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 3,
            "deadline_days": 18,
            "officer": officer_user.id,
            "all_verified": False,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0004",
            "inst_key": "1-667788990",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval for Marine & Nautical Studies (2025-26)",
            "stage": "Decision",
            "status": ApplicationStatus.APPROVED,
            "route": "Only Scrutiny",
            "sub_days_ago": 19,
            "deadline_days": 12,
            "officer": officer_user.id,
            "all_verified": True
        },
        {
            "code": "AICTE-2025-0005",
            "inst_key": "1-112233449",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of M.Tech in Structural Engineering",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 2,
            "deadline_days": 19,
            "officer": officer_user.id,
            "all_verified": False,
            "all_submitted": True
        },

        # --- GROUP B: MEDIUM-RISK APPLICATIONS (7 Applications) ---
        {
            "code": "AICTE-2025-0006",
            "inst_key": "1-432891001",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of B.Tech in Artificial Intelligence & Machine Learning",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 5,
            "deadline_days": 12,
            "officer": officer_user.id,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0007",
            "inst_key": "1-998822110",
            "cat": ApplicationCategory.INCREASE_INTAKE,
            "title": "Intake Expansion: MBA Executive Programme (120 to 180 seats)",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Only Scrutiny",
            "sub_days_ago": 7,
            "deadline_days": 8,
            "officer": officer_user.id,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0008",
            "inst_key": "1-789012344",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval (EoA) for Academic Year 2025-2026",
            "stage": "EVC",
            "status": ApplicationStatus.EVC_SCHEDULED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 16,
            "deadline_days": 4,
            "officer": officer_user.id,
            "all_verified": True,
            "evc_scheduled": True
        },
        {
            "code": "AICTE-2025-0009",
            "inst_key": "1-332211445",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of M.Pharm in Pharmacology",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 8,
            "deadline_days": 6,
            "officer": officer_user.id,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0010",
            "inst_key": "1-889900112",
            "cat": ApplicationCategory.INFRASTRUCTURE_FACILITY,
            "title": "Establishment of Advanced GIS & Spatial Modeling Studio",
            "stage": "Scrutiny",
            "status": ApplicationStatus.RESUBMITTED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 12,
            "deadline_days": 7,
            "officer": officer_user.id,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0011",
            "inst_key": "1-445566778",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of B.Tech in Cyber Security & Digital Forensics",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 9,
            "deadline_days": 5,
            "officer": officer_user.id,
            "all_submitted": True
        },
        {
            "code": "AICTE-2025-0012",
            "inst_key": "1-556677889",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval for Analytics & Cloud Degree Programs",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Only Scrutiny",
            "sub_days_ago": 6,
            "deadline_days": 9,
            "officer": officer_user.id,
            "all_submitted": True
        },

        # --- GROUP C: HIGH-RISK / DELAYED APPLICATIONS (6 Applications) ---
        {
            "code": "AICTE-2025-0013",
            "inst_key": "1-998822110",
            "cat": ApplicationCategory.NEW_INSTITUTION,
            "title": "Establishment of New Technical Campus in Western UP",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC+SAC",
            "sub_days_ago": 28,
            "deadline_days": -6, # Overdue by 6 days!
            "officer": officer_user.id,
            "missing_docs": 2
        },
        {
            "code": "AICTE-2025-0014",
            "inst_key": "1-332211445",
            "cat": ApplicationCategory.INFRASTRUCTURE_FACILITY,
            "title": "Central Animal House & Medicinal Chemistry Research Facility",
            "stage": "EVC",
            "status": ApplicationStatus.EVC_SCHEDULED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 24,
            "deadline_days": -3, # Overdue by 3 days!
            "officer": officer_user.id,
            "evc_overdue": True
        },
        {
            "code": "AICTE-2025-0015",
            "inst_key": "1-432891001",
            "cat": ApplicationCategory.INFRASTRUCTURE_FACILITY,
            "title": "Establishment of High-Performance Central Computing & IoT Facility",
            "stage": "Scrutiny",
            "status": ApplicationStatus.CORRECTION_REQUIRED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 15,
            "deadline_days": 3,
            "officer": officer_user.id,
            "deficiency": True
        },
        {
            "code": "AICTE-2025-0016",
            "inst_key": "1-776655443",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of Diploma in Industrial Automation & Mechatronics",
            "stage": "Scrutiny",
            "status": ApplicationStatus.CORRECTION_REQUIRED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 18,
            "deadline_days": -2, # Overdue!
            "officer": officer_user.id,
            "deficiency": True
        },
        {
            "code": "AICTE-2025-0017",
            "inst_key": "1-990011223",
            "cat": ApplicationCategory.INCREASE_INTAKE,
            "title": "Increase in Intake: B.Tech Solar & Renewable Energy (30 to 60)",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 21,
            "deadline_days": -4, # Overdue!
            "officer": None, # Orphan task
            "missing_docs": 1
        },
        {
            "code": "AICTE-2025-0018",
            "inst_key": "1-554433221",
            "cat": ApplicationCategory.INFRASTRUCTURE_FACILITY,
            "title": "Automated Heavy Vehicle Testing Workshop Expansion",
            "stage": "EVC",
            "status": ApplicationStatus.SUBMITTED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 17,
            "deadline_days": -1, # Overdue
            "officer": officer_user.id,
            "evc_unscheduled": True
        },

        # --- GROUP D: EDGE CASES, EXPIRIES & RESUBMISSIONS (8 Applications) ---
        {
            "code": "AICTE-2025-0019",
            "inst_key": "1-889900112",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval for School of Architecture (2025-26)",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Only Scrutiny",
            "sub_days_ago": 11,
            "deadline_days": 1, # Due tomorrow!
            "officer": officer_user.id,
            "doc_expiring_soon": True
        },
        {
            "code": "AICTE-2025-0020",
            "inst_key": "1-667788990",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of B.Tech in Marine Electrical Systems",
            "stage": "Scrutiny",
            "status": ApplicationStatus.RESUBMITTED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 14,
            "deadline_days": 6,
            "officer": officer_user.id,
            "replacement_uploaded": True
        },
        {
            "code": "AICTE-2025-0021",
            "inst_key": "1-445566778",
            "cat": ApplicationCategory.INFRASTRUCTURE_FACILITY,
            "title": "Setup of Secure Redundant Cloud Datacenter & Cyber Range",
            "stage": "Scrutiny",
            "status": ApplicationStatus.SUBMITTED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 10,
            "deadline_days": 8,
            "officer": None # Orphan task: unassigned in queue
        },
        {
            "code": "AICTE-2025-0022",
            "inst_key": "1-112233449",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval (EoA 2025-26) with Compliance Undertaking",
            "stage": "Decision",
            "status": ApplicationStatus.APPROVED,
            "route": "Only Scrutiny",
            "sub_days_ago": 30,
            "deadline_days": 15,
            "officer": officer_user.id,
            "has_compliance_obligation": True
        },
        {
            "code": "AICTE-2025-0023",
            "inst_key": "1-556677889",
            "cat": ApplicationCategory.NEW_COURSE,
            "title": "Introduction of M.Tech in Generative AI & High Performance Computing",
            "stage": "Scrutiny",
            "status": ApplicationStatus.CORRECTION_REQUIRED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 16,
            "deadline_days": 4,
            "officer": officer_user.id,
            "deficiency": True
        },
        {
            "code": "AICTE-2025-0024",
            "inst_key": "1-990011223",
            "cat": ApplicationCategory.NEW_INSTITUTION,
            "title": "New Green Energy Technical Campus Sanction",
            "stage": "SAC/SHC Review",
            "status": ApplicationStatus.SAC_SHC_REVIEW,
            "route": "Scrutiny+EVC+SAC",
            "sub_days_ago": 35,
            "deadline_days": 5,
            "officer": officer_user.id,
            "evc_completed": True
        },
        {
            "code": "AICTE-2025-0025",
            "inst_key": "1-776655443",
            "cat": ApplicationCategory.EOA,
            "title": "Extension of Approval with Land Lease Renewal Requirement",
            "stage": "Scrutiny",
            "status": ApplicationStatus.UNDER_SCRUTINY,
            "route": "Only Scrutiny",
            "sub_days_ago": 13,
            "deadline_days": 3,
            "officer": officer_user.id,
            "doc_expired": True
        },
        {
            "code": "AICTE-2025-0026",
            "inst_key": "1-332211445",
            "cat": ApplicationCategory.INCREASE_INTAKE,
            "title": "Intake Expansion: B.Pharm First Shift (60 to 100 seats)",
            "stage": "Decision",
            "status": ApplicationStatus.APPROVED,
            "route": "Scrutiny+EVC",
            "sub_days_ago": 25,
            "deadline_days": 11,
            "officer": officer_user.id,
            "all_verified": True
        }
    ]

    apps_map = {}
    for a_def in app_definitions:
        inst = institutions_map.get(a_def["inst_key"])
        if not inst:
            continue

        app = db.query(Application).filter(Application.application_id == a_def["code"]).first()
        sub_time = reference_time - timedelta(days=a_def["sub_days_ago"])
        deadline_time = reference_time + timedelta(days=a_def["deadline_days"])

        if not app:
            app = Application(
                application_id=a_def["code"],
                institution_id=inst.id,
                category=a_def["cat"],
                academic_year="2025-2026",
                title=a_def["title"],
                description=f"Fictional Demonstration Submission [{DEMO_MARKER}]: Proposal for {a_def['title']}",
                current_stage=a_def["stage"],
                status=a_def["status"],
                workflow_route=a_def["route"],
                assigned_officer_id=a_def["officer"],
                deadline=deadline_time,
                submitted_at=sub_time,
                last_updated_at=sub_time + timedelta(days=2)
            )
            db.add(app)
            db.flush()

        apps_map[a_def["code"]] = app

        # Documents checklist
        reqs = CATEGORY_DOCUMENT_REQUIREMENTS.get(a_def["cat"].value, [])
        for i, r in enumerate(reqs):
            doc = db.query(Document).filter(
                Document.application_id == app.id,
                Document.requirement_code == r["requirement_code"]
            ).first()

            if not doc:
                is_missing = a_def.get("missing_docs", 0) > i
                is_deficiency = a_def.get("deficiency", False) and i == 0
                is_replacement = a_def.get("replacement_uploaded", False) and i == 0
                is_verified = a_def.get("all_verified", False)

                doc_status = DocumentStatus.VERIFIED if is_verified else (
                    DocumentStatus.NOT_SUBMITTED if is_missing else (
                        DocumentStatus.CORRECTION_REQUIRED if is_deficiency else (
                            DocumentStatus.SUBMITTED
                        )
                    )
                )

                doc = Document(
                    application_id=app.id,
                    name=r["name"],
                    requirement_code=r["requirement_code"],
                    is_mandatory=r["is_mandatory"],
                    description=r["description"],
                    file_name=f"{r['requirement_code'].lower()}_demo.pdf" if not is_missing else None,
                    file_path=f"./uploads/app_{app.id}/{r['requirement_code'].lower()}_demo.pdf" if not is_missing else None,
                    file_size_kb=512.0 if not is_missing else None,
                    version=2 if is_replacement else 1,
                    status=doc_status,
                    reviewer_decision="ACCEPTED" if is_verified else ("CORRECTION_REQUESTED" if is_deficiency else None),
                    deficiency_reason="The submitted layout plan does not clearly show emergency fire exit passageways or server room earthing pit layout as per AICTE Norms Table 4.2." if is_deficiency else None,
                    corrective_action_requested="Upload an architect-endorsed revision marking dual exit doors and 1.5m clearance aisle." if is_deficiency else None,
                    submitted_at=sub_time,
                    reviewed_at=sub_time + timedelta(days=3) if is_verified or is_deficiency else None
                )
                db.add(doc)
                db.flush()

                # Add version record
                if not is_missing:
                    ver = DocumentVersion(
                        document_id=doc.id,
                        version_number=1,
                        file_name=f"{r['requirement_code'].lower()}_v1.pdf",
                        file_path=f"./uploads/app_{app.id}/{r['requirement_code'].lower()}_v1.pdf",
                        uploaded_at=sub_time,
                        status_at_upload="SUBMITTED",
                        remarks="Initial statutory document upload"
                    )
                    db.add(ver)

                    if is_replacement:
                        ver2 = DocumentVersion(
                            document_id=doc.id,
                            version_number=2,
                            file_name=f"{r['requirement_code'].lower()}_v2_revised.pdf",
                            file_path=f"./uploads/app_{app.id}/{r['requirement_code'].lower()}_v2_revised.pdf",
                            uploaded_at=reference_time - timedelta(days=1),
                            status_at_upload="SUBMITTED",
                            remarks="Replacement upload incorporating dual fire exit corridors"
                        )
                        db.add(ver2)

        # Stage history
        if not app.stage_histories:
            sh1 = StageHistory(
                application_id=app.id,
                stage_name="Scrutiny",
                status_entered="SUBMITTED",
                action_taken="Application Registered",
                remarks=f"Registered for {a_def['cat'].value}",
                created_at=sub_time
            )
            db.add(sh1)

            if a_def["stage"] != "Scrutiny":
                sh2 = StageHistory(
                    application_id=app.id,
                    stage_name=a_def["stage"],
                    status_entered=a_def["status"].value,
                    action_taken=f"Progressed to {a_def['stage']}",
                    remarks="Stage transition verified",
                    created_at=sub_time + timedelta(days=5)
                )
                db.add(sh2)

        # EVC Schedule record if applicable
        if (a_def.get("evc_scheduled") or a_def.get("evc_completed")) and not app.evc_schedules:
            evc_rec = EVCSchedule(
                application_id=app.id,
                evc_type="Physical",
                scheduled_date=reference_time + timedelta(days=3) if not a_def.get("evc_completed") else (reference_time - timedelta(days=4)),
                panel_lead="Dr. P. Venkatraman (IIT Bombay)",
                panel_members=["Dr. P. Venkatraman", "Prof. Sneha Deshpande (COEP)", "Dr. M. K. Rao (VJTI)"],
                inspection_status="COMPLETED" if a_def.get("evc_completed") else "SCHEDULED",
                remarks="Inspection of specialized computer laboratories and student-cadre records",
                recommendation="RECOMMENDED" if a_def.get("evc_completed") else None,
                completed_at=reference_time - timedelta(days=4) if a_def.get("evc_completed") else None
            )
            db.add(evc_rec)

    db.flush()

    # 4. Create 14 Realistic Fictional Compliance Obligations
    compliance_definitions = [
        {
            "inst_key": "1-432891001",
            "title": "Biometric Attendance Integration with AICTE Central Portal",
            "condition": "Condition 6 of Approval Letter 2024-25",
            "due_days": 10,
            "status": "PENDING",
            "req": "API integration test certificate and live biometric punch logs"
        },
        {
            "inst_key": "1-432891001",
            "title": "Establishment of Online Grievance Redressal Cell & Committee",
            "condition": "Mandatory Compliance Clause 3.1",
            "due_days": -2, # Overdue
            "status": "PENDING",
            "req": "Gazette notification order and institutional web portal grievance link"
        },
        {
            "inst_key": "1-789012344",
            "title": "Barrier-free Wheelchair Ramp & Dedicated Accessible Lift Installation",
            "condition": "EVC Inspection Observation 2024 Clause 8",
            "due_days": 25,
            "status": "SUBMITTED_FOR_VERIFICATION",
            "req": "PWD certified ramp gradient certificate and lift commissioning letter"
        },
        {
            "inst_key": "1-998822110",
            "title": "Anti-Ragging Squad Formation and Affidavit Collection",
            "condition": "AICTE Anti-Ragging Regulation 2009",
            "due_days": 5,
            "status": "PENDING",
            "req": "Affidavit confirmation report for 100% of enrolled students"
        },
        {
            "inst_key": "1-554433221",
            "title": "Industry-Academia MoUs for Mandatory 6-Month Internships",
            "condition": "Approval Letter 2024 Condition 9",
            "due_days": 15,
            "status": "PENDING",
            "req": "Copies of 5 signed agreements with tier-1 engineering industries"
        },
        {
            "inst_key": "1-667788990",
            "title": "Emergency Marine Fire Hydrant Simulation Recertification",
            "condition": "Maritime Safety Circular 2024",
            "due_days": -5, # Overdue
            "status": "PENDING",
            "req": "Chief Fire Officer annual mock-drill log and certificate"
        },
        {
            "inst_key": "1-332211445",
            "title": "Hazardous Chemical Disposal Protocols & Effluent Treatment Proof",
            "condition": "Pollution Control Board Sanction Condition 4",
            "due_days": 12,
            "status": "VERIFIED",
            "req": "State PCB consented effluent discharge analysis report"
        },
        {
            "inst_key": "1-889900112",
            "title": "Digital Library Consortium Subscription (IEEE & ScienceDirect)",
            "condition": "Norms for Technical Libraries Clause 5",
            "due_days": 3,
            "status": "SUBMITTED_FOR_VERIFICATION",
            "req": "Publisher invoice and remote institutional IP access range"
        },
        {
            "inst_key": "1-112233449",
            "title": "Faculty 7th Pay Commission Scale Disbursement Endorsement",
            "condition": "AICTE Faculty Cadre & Pay Scale Gazette Order",
            "due_days": 20,
            "status": "PENDING",
            "req": "Audited bank disbursement certificate signed by Chartered Accountant"
        },
        {
            "inst_key": "1-776655443",
            "title": "Internal Quality Assurance Cell (IQAC) Annual Quality Audit",
            "condition": "Accreditation Mandate Clause 2.4",
            "due_days": -4, # Overdue
            "status": "PENDING",
            "req": "Signed minutes of IQAC external committee audit"
        },
        {
            "inst_key": "1-445566778",
            "title": "ISO 27001 Information Security Recertification for Cyber Lab",
            "condition": "Approval Condition 2024-25 Clause 11",
            "due_days": 45,
            "status": "PENDING",
            "req": "Valid ISO 27001:2022 surveillance audit certificate"
        },
        {
            "inst_key": "1-990011223",
            "title": "Rooftop Solar 50kW Grid-Tie Commissioning Proof",
            "condition": "Green Campus Initiative Circular 2024",
            "due_days": 18,
            "status": "SUBMITTED_FOR_VERIFICATION",
            "req": "State Electricity Board net-metering synchronization letter"
        },
        {
            "inst_key": "1-556677889",
            "title": "GPU Server Cluster Earthing and Fire Suppression Endorsement",
            "condition": "Computing Center Norms Table 4.2",
            "due_days": 8,
            "status": "PENDING",
            "req": "Electrical inspectorate inspection certificate"
        },
        {
            "inst_key": "1-432891001",
            "title": "SC/ST Cell and Committee Notification for AY 2025-26",
            "condition": "Statutory Equal Opportunity Regulation Clause 4",
            "due_days": 2, # Due very soon
            "status": "PENDING",
            "req": "Office order publishing committee members and liaison officer contact"
        }
    ]

    for c_def in compliance_definitions:
        inst = institutions_map.get(c_def["inst_key"])
        if not inst:
            continue

        existing_ob = db.query(ComplianceObligation).filter(
            ComplianceObligation.institution_id == inst.id,
            ComplianceObligation.title == c_def["title"]
        ).first()

        due_date = reference_time + timedelta(days=c_def["due_days"])
        if not existing_ob:
            ob = ComplianceObligation(
                institution_id=inst.id,
                title=c_def["title"],
                source_condition=c_def["condition"],
                due_date=due_date,
                evidence_required=c_def["req"],
                status=c_def["status"],
                evidence_submission_notes="Uploaded certified evidence for scrutiny verification" if c_def["status"] == "SUBMITTED_FOR_VERIFICATION" else None,
                evidence_submitted_at=reference_time - timedelta(days=1) if c_def["status"] == "SUBMITTED_FOR_VERIFICATION" else None,
                verified_at=reference_time - timedelta(days=5) if c_def["status"] == "VERIFIED" else None,
                verified_by_id=officer_user.id if c_def["status"] == "VERIFIED" else None
            )
            db.add(ob)

    db.flush()

    # 5. Create 12 Fictional Prescribed Validity Documents (Lease Deeds, Fire NOCs, Building Fitness)
    validity_definitions = [
        {
            "inst_key": "1-432891001",
            "type": "Land Registered Lease Deed (30-Year Mandatory)",
            "authority": "Sub-Registrar Haveli, Pune",
            "ref": "MH-PUN-LEASE-2005-9981",
            "expiry_days": 45, # Expiring soon (<60d)
            "status": "EXPIRING_SOON"
        },
        {
            "inst_key": "1-432891001",
            "type": "Fire Safety Certificate / No-Objection Certificate",
            "authority": "Chief Fire Officer, Pune Municipal Corporation",
            "ref": "PMC/FIRE/NOC/2024/481",
            "expiry_days": 25, # Expiring soon
            "status": "EXPIRING_SOON"
        },
        {
            "inst_key": "1-789012344",
            "type": "Building Safety & Structural Stability Certificate",
            "authority": "Executive Engineer, PWD Karnataka",
            "ref": "PWD-KAR-BLDG-2022-771",
            "expiry_days": 365,
            "status": "VALID"
        },
        {
            "inst_key": "1-998822110",
            "type": "Occupancy / Completion Certificate",
            "authority": "Noida Industrial Development Authority",
            "ref": "NOIDA/PLG/COMPL/2012/104",
            "expiry_days": 730,
            "status": "VALID"
        },
        {
            "inst_key": "1-554433221",
            "type": "Fire Safety No-Objection Certificate",
            "authority": "Fire Prevention Cell, Nashik Municipal Corp",
            "ref": "NMC/FIRE/2023/889",
            "expiry_days": 15, # Expiring soon (<30d)
            "status": "EXPIRING_SOON"
        },
        {
            "inst_key": "1-667788990",
            "type": "Coastal Regulation Zone (CRZ) Clearance Certificate",
            "authority": "Tamil Nadu State Coastal Zone Management Authority",
            "ref": "TNCZMA/CLEARANCE/2018/42",
            "expiry_days": 210,
            "status": "VALID"
        },
        {
            "inst_key": "1-332211445",
            "type": "Pharmacy Council of India (PCI) Approval Letter",
            "authority": "Registrar-cum-Secretary, Pharmacy Council of India",
            "ref": "PCI-MP-2023-1492",
            "expiry_days": -10, # Expired!
            "status": "EXPIRED"
        },
        {
            "inst_key": "1-889900112",
            "type": "Council of Architecture (CoA) Institutional Sanction",
            "authority": "Council of Architecture India",
            "ref": "COA/HR/2024/774",
            "expiry_days": 35, # Expiring soon
            "status": "EXPIRING_SOON"
        },
        {
            "inst_key": "1-112233449",
            "type": "Seismic Stability & Flood Safety Certificate",
            "authority": "Assam State Disaster Management Authority",
            "ref": "ASDMA/SEISMIC/2021/309",
            "expiry_days": 400,
            "status": "VALID"
        },
        {
            "inst_key": "1-776655443",
            "type": "Land Title Deed / Registered Sale Deed",
            "authority": "Sub-Registrar Patia, Bhubaneswar",
            "ref": "OD-BBSR-TITLE-2015-881",
            "expiry_days": -5, # Expired renewal mandate!
            "status": "EXPIRED"
        },
        {
            "inst_key": "1-445566778",
            "type": "Environmental Clearance Certificate",
            "authority": "Goa State Environment Impact Assessment Authority",
            "ref": "GSEIAA/ENV/2020/12",
            "expiry_days": 180,
            "status": "VALID"
        },
        {
            "inst_key": "1-556677889",
            "type": "High Tension Power Sanction & Earthing NOC",
            "authority": "Kerala State Electricity Board (KSEB)",
            "ref": "KSEB/HT/2022/944",
            "expiry_days": 55, # Expiring soon
            "status": "EXPIRING_SOON"
        }
    ]

    for v_def in validity_definitions:
        inst = institutions_map.get(v_def["inst_key"])
        if not inst:
            continue

        existing_val = db.query(ValidityDocument).filter(
            ValidityDocument.institution_id == inst.id,
            ValidityDocument.document_type == v_def["type"]
        ).first()

        exp_date = reference_time + timedelta(days=v_def["expiry_days"])
        if not existing_val:
            val = ValidityDocument(
                institution_id=inst.id,
                document_type=v_def["type"],
                issuing_authority=v_def["authority"],
                reference_number=v_def["ref"],
                issue_date=reference_time - timedelta(days=365 * 3),
                expiry_date=exp_date,
                status=v_def["status"],
                file_path=f"./uploads/validity/{v_def['ref'].lower()}.pdf",
                renewal_status="UNDER_REVIEW" if v_def["status"] == "EXPIRING_SOON" else "NOT_REQUIRED"
            )
            db.add(val)

    db.flush()

    # 6. Create Unified Accountability Obligations
    for a_code, app_obj in apps_map.items():
        existing_uobl = db.query(UnifiedObligation).filter(UnifiedObligation.application_id == app_obj.id).first()
        if not existing_uobl:
            is_official = app_obj.current_stage in ["Scrutiny", "EVC", "Decision"] and app_obj.status != ApplicationStatus.CORRECTION_REQUIRED
            uobl = UnifiedObligation(
                obligation_code=f"UOB-{app_obj.application_id}",
                obligation_type="CORRECTION" if app_obj.status == ApplicationStatus.CORRECTION_REQUIRED else (
                    "EVC_SCHEDULE" if app_obj.current_stage == "EVC" else "REVIEW"
                ),
                party_responsible="OFFICIAL" if is_official else "INSTITUTION",
                application_id=app_obj.id,
                institution_id=app_obj.institution_id,
                title=f"{app_obj.current_stage} Action for {app_obj.application_id}",
                description=f"Action required under AICTE Approval Framework for {app_obj.title}",
                responsible_role="AICTE_OFFICER" if is_official else "INSTITUTION_USER",
                assigned_user_id=app_obj.assigned_officer_id if is_official else None,
                priority="HIGH" if app_obj.deadline and app_obj.deadline < reference_time else "MEDIUM",
                due_date=app_obj.deadline or (reference_time + timedelta(days=7)),
                status="OVERDUE" if app_obj.deadline and app_obj.deadline < reference_time else "PENDING",
                completion_conditions=f"Complete {app_obj.current_stage} verification decisions"
            )
            db.add(uobl)

    db.flush()

    # 7. Compute & Persist Real Risk Assessments for All 26 Applications
    for a_code, app_obj in apps_map.items():
        record_application_risk_assessment(db, app_obj)

    db.commit()

    # 8. Run Alert Monitoring Engine across newly seeded records (creates alerts, notifications, escalation events)
    monitor = AlertMonitoringService(db)
    summary = monitor.run_all_monitors()

    print(f"--- Fictional SIH Demo Dataset Successfully Populated ---")
    print(f"Institutions: {len(institutions_map)} | Applications: {len(apps_map)} | Alerts: {summary}")

    return {
        "status": "SUCCESS",
        "institutions_seeded": len(institutions_map),
        "applications_seeded": len(apps_map),
        "monitoring_summary": summary,
        "reference_time": reference_time.isoformat()
    }

def reset_demo_dataset(db: Session) -> dict:
    """
    Safely resets records tagged with fictional demo markers without destroying baseline schema.
    """
    apps = db.query(Application).filter(Application.description.like(f"%{DEMO_MARKER}%")).all()
    count_apps = len(apps)
    for a in apps:
        db.delete(a)
    db.commit()
    return {"status": "RESET_COMPLETE", "deleted_applications_count": count_apps}

