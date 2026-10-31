import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import (
    Application, Document, DocumentStatus, ApplicationStatus,
    AlertRecord, AlertStatus, User, UserRole, UnifiedObligation,
    ApplicationRiskAssessment
)
from backend.alert_engine import AlertMonitoringService
from backend.rules import calculate_application_risk, record_application_risk_assessment

client = TestClient(app)

def test_login_and_roles():
    # Admin login
    res = client.post("/api/auth/login", data={"username": "admin@aicte.gov.in", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "AICTE_ADMIN"
    assert "access_token" in data

    # Institution login
    res2 = client.post("/api/auth/login", data={"username": "institution@vits.edu.in", "password": "College@123"})
    assert res2.status_code == 200
    assert res2.json()["role"] == "INSTITUTION_USER"

def test_risk_score_calculation_and_explainability():
    with SessionLocal() as db:
        app_obj = db.query(Application).filter(Application.application_id == "AICTE-2025-0015").first()
        assert app_obj is not None
        risk = calculate_application_risk(app_obj, db)
        assert 0 <= risk["risk_score"] <= 100
        assert risk["risk_category"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert len(risk["factors"]) > 0
        
        # Verify factor structure
        first_factor = risk["factors"][0]
        assert "factor_name" in first_factor
        assert "contribution" in first_factor
        assert "evidence_source" in first_factor
        assert "clickable_type" in first_factor

def test_alert_monitoring_idempotency_no_duplicates():
    with SessionLocal() as db:
        monitor = AlertMonitoringService(db)
        # Run cycle 1
        summary1 = monitor.run_all_monitors()
        count1 = db.query(AlertRecord).count()

        # Run cycle 2 immediately
        summary2 = monitor.run_all_monitors()
        count2 = db.query(AlertRecord).count()

        # Assert no duplicate alerts were inserted for existing conditions
        assert count1 == count2, f"Idempotency failed: count1={count1}, count2={count2}"

def test_ai_chatbox_grounded_queries():
    # Authenticate as AICTE Officer
    res = client.post("/api/auth/login", data={"username": "officer@aicte.gov.in", "password": "Officer@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Query 1: Overdue applications
    q1 = client.post("/api/ai/chat", json={"query": "Which applications are overdue?"}, headers=headers)
    assert q1.status_code == 200
    res_data1 = q1.json()
    assert "answer" in res_data1
    assert "evidence" in res_data1

    # Query 2: Specific application risk explanation
    with SessionLocal() as db:
        target_app = db.query(Application).first()
        app_code = target_app.application_id

    q2 = client.post("/api/ai/chat", json={"query": f"Why is {app_code} at risk?"}, headers=headers)
    assert q2.status_code == 200
    res_data2 = q2.json()
    assert app_code in res_data2["answer"]

def test_approval_rehearsal():
    # Authenticate as institution
    res = client.post("/api/auth/login", data={"username": "institution@vits.edu.in", "password": "College@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    rehearsal_payload = {
        "category": "Introduction of a New Course or Programme",
        "academic_year": "2025-2026",
        "title": "Introduction of B.Tech Robotics & Automation",
        "proposed_course_name": "", # Intentionally blank to test check
        "proposed_intake": 0,
        "attached_document_codes": [] # No documents attached
    }

    resp = client.post("/api/ai/rehearsal", json=rehearsal_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_ready_for_submission"] is False
    assert data["total_findings"] > 0
    assert "disclaimer" in data

def test_policy_simulator_no_live_alteration():
    # Authenticate as admin
    res = client.post("/api/auth/login", data={"username": "admin@aicte.gov.in", "password": "Admin@123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with SessionLocal() as db:
        apps_before = [(a.id, a.current_stage, a.status.value) for a in db.query(Application).all()]

    sim_payload = {
        "draft_name": "Emergency 4-Day Scrutiny SLA Fast-Track",
        "proposed_change": "Reduce scrutiny target dwell time from 7 to 4 days",
        "new_scrutiny_days": 4.0,
        "new_evc_days": 7.0
    }

    sim_resp = client.post("/intelligence/policy-simulator", json=sim_payload, headers=headers)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["requires_authorized_activation"] is True

    # Verify that zero live application records were altered
    with SessionLocal() as db:
        apps_after = [(a.id, a.current_stage, a.status.value) for a in db.query(Application).all()]
        assert apps_before == apps_after

