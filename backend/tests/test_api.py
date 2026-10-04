import os
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BENCHMARK_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark_dataset")


def get_auth_token():
    resp = client.post("/api/auth/demo-login")
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_health_check_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "HealthForm AI"
    assert "demo_mode" in data


def test_auth_flows():
    # 1. Demo Login
    token = get_auth_token()
    assert token is not None

    # 2. Signup with new email
    import uuid
    rand_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": rand_email,
        "password": "Password123!",
        "full_name": "Test User"
    })
    assert reg_resp.status_code in (200, 201)
    reg_data = reg_resp.json()
    assert "access_token" in reg_data

    # 3. Regular Login with newly created user
    login_resp = client.post("/api/auth/login", json={
        "email": rand_email,
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_research_metrics_endpoint():
    resp = client.get("/api/research/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "proposed_system_metrics" in data
    assert len(data["approaches"]) == 4


def test_rag_query_endpoint():
    resp = client.post("/api/rag/query", json={"query": "hemoglobin oxygen transport", "top_k": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["chunks_found"] >= 1
    assert any("hemoglobin" in e["content"].lower() or "blood" in e["content"].lower() for e in data["evidence"])


def test_pre_validate_endpoint():
    token = get_auth_token()
    pdf_path = os.path.join(BENCHMARK_DIR, "report_01_clean_normal_cbc.pdf")
    if not os.path.exists(pdf_path):
        from backend.tests.generate_test_benchmark_dataset import generate_all
        generate_all()

    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/reports/validate",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("report_01_clean_normal_cbc.pdf", f, "application/pdf")}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_valid_report"] is True
    assert "quality" in data


def test_upload_valid_pdf_and_report_lifecycle():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    pdf_path = os.path.join(BENCHMARK_DIR, "report_01_clean_normal_cbc.pdf")

    # 1. Upload report
    with open(pdf_path, "rb") as f:
        upload_resp = client.post(
            "/api/reports/upload",
            headers=headers,
            files={"file": ("report_01_clean_normal_cbc.pdf", f, "application/pdf")}
        )
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    report_data = upload_resp.json()
    report_id = report_data["id"]
    assert report_data["processing_status"] == "completed"
    assert len(report_data["parameters"]) > 0

    # 2. Retrieve report
    get_resp = client.get(f"/api/reports/{report_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == report_id

    # 3. Retrieve parameters
    param_resp = client.get(f"/api/reports/{report_id}/parameters", headers=headers)
    assert param_resp.status_code == 200
    assert len(param_resp.json()) > 0

    # 4. List reports
    list_resp = client.get("/api/reports", headers=headers)
    assert list_resp.status_code == 200
    assert any(r["id"] == report_id for r in list_resp.json())

    # 5. Comparison endpoint
    comp_resp = client.get(f"/api/reports/{report_id}/comparison", headers=headers)
    assert comp_resp.status_code == 200

    # 6. Delete report
    del_resp = client.delete(f"/api/reports/{report_id}", headers=headers)
    assert del_resp.status_code == 200


def test_upload_invalid_document_rejected():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    cert_path = os.path.join(BENCHMARK_DIR, "report_08_invalid_certificate.pdf")

    with open(cert_path, "rb") as f:
        resp = client.post(
            "/api/reports/upload",
            headers=headers,
            files={"file": ("report_08_invalid_certificate.pdf", f, "application/pdf")}
        )
    assert resp.status_code == 422
    data = resp.json()["detail"]
    assert data["is_valid_report"] is False
    assert "rejection_code" in data
