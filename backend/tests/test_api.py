import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "HealthForm AI"
    assert "demo_mode" in data

def test_demo_login_endpoint():
    resp = client.post("/api/auth/demo-login")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@healthform.ai"

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
