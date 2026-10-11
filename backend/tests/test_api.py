import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_superadmin_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@grandstay.com",
        "password": "Admin@12345"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "SUPER_ADMIN"

def test_tenant_admin_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@serenevalley.com",
        "password": "Admin@12345"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "TENANT_ADMIN"
    assert data["user"]["tenant_name"] == "Serene Valley Luxury Resort & Spa"

def test_authenticated_tape_chart():
    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@serenevalley.com",
        "password": "Admin@12345"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Tape Chart
    chart_resp = client.get("/api/v1/rooms/tape-chart?days=14", headers=headers)
    assert chart_resp.status_code == 200
    data = chart_resp.json()
    assert "rooms" in data
    assert len(data["rooms"]) > 0

def test_authenticated_pos_menu():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "pos@serenevalley.com",
        "password": "Admin@12345"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    menu_resp = client.get("/api/v1/pos/menu", headers=headers)
    assert menu_resp.status_code == 200
    items = menu_resp.json()
    assert len(items) > 0
