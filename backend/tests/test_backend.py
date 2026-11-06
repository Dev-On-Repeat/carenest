import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.models.user import User

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_demo_seed_and_info():
    response = client.get("/api/demo/info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_demo_mode_available"] is True
    assert len(data["sample_accounts"]) == 2

    seed_resp = client.post("/api/demo/seed")
    assert seed_resp.status_code == 200
    assert seed_resp.json()["success"] is True

def test_auth_login_demo_elderly():
    login_data = {
        "email": "ramakrishna.demo@carenest.ai",
        "password": "DemoPassword123!"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token_info = response.json()
    assert "access_token" in token_info
    assert token_info["user"]["role"] == "elderly"
    assert token_info["user"]["full_name"] == "Ramakrishna Varma (Demo)"

def test_medicines_crud():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "email": "ramakrishna.demo@carenest.ai",
        "password": "DemoPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List medicines
    list_resp = client.get("/api/medicines", headers=headers)
    assert list_resp.status_code == 200
    meds = list_resp.json()
    assert len(meds) >= 3

    # Add new medicine
    new_med = {
        "name": "Vitamin C",
        "strength": "500 mg",
        "dosage": "1 chewable tablet",
        "frequency": "Once daily",
        "scheduled_times": "14:00",
        "meal_timing": "after_food",
        "start_date": "2026-01-01",
        "instructions": "Chew after lunch",
        "is_active": True
    }
    create_resp = client.post("/api/medicines", json=new_med, headers=headers)
    assert create_resp.status_code == 201
    created_id = create_resp.json()["id"]

    # Delete medicine
    del_resp = client.delete(f"/api/medicines/{created_id}", headers=headers)
    assert del_resp.status_code == 204

def test_schedules_today():
    login_resp = client.post("/api/auth/login", json={
        "email": "ramakrishna.demo@carenest.ai",
        "password": "DemoPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/schedules/today", headers=headers)
    assert resp.status_code == 200
    slots = resp.json()
    assert len(slots) > 0
    assert "medicine_name" in slots[0]
    assert "status" in slots[0]

def test_assistant_ask():
    login_resp = client.post("/api/auth/login", json={
        "email": "ramakrishna.demo@carenest.ai",
        "password": "DemoPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask in English
    ask_resp = client.post("/api/assistant/ask", json={
        "question": "What medicines do I have today?",
        "language": "en"
    }, headers=headers)
    assert ask_resp.status_code == 200
    data = ask_resp.json()
    assert "Metformin" in data["answer"] or len(data["related_medicines"]) > 0

    # Ask in Telugu
    ask_te = client.post("/api/assistant/ask", json={
        "question": "ఈరోజు నా మందులు ఏమిటి?",
        "language": "te"
    }, headers=headers)
    assert ask_te.status_code == 200
    assert ask_te.json()["language"] == "te"

def test_sos_trigger_and_resolve():
    login_resp = client.post("/api/auth/login", json={
        "email": "ramakrishna.demo@carenest.ai",
        "password": "DemoPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sos_resp = client.post("/api/sos/trigger", json={
        "notes": "Emergency test alert from pytest"
    }, headers=headers)
    assert sos_resp.status_code == 201
    sos_data = sos_resp.json()
    assert sos_data["status"] == "triggered"

    # Resolve
    resolve_resp = client.post(f"/api/sos/{sos_data['id']}/resolve", headers=headers)
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["success"] is True

def test_hardware_abstraction():
    status_resp = client.get("/api/hardware/status")
    assert status_resp.status_code == 200
    assert "gpio_pins_mapping" in status_resp.json()

    # Trigger taken button
    btn_resp = client.post("/api/hardware/button", json={"button": "TAKEN"})
    assert btn_resp.status_code == 200
    assert btn_resp.json()["button_pressed"] == "TAKEN"
