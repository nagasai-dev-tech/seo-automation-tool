import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Avention SEO" in data["service"]


def test_auth_and_protected_flow():
    # Login with seeded admin
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "admin@aventionseo.com", "password": "admin123"}
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /api/auth/me
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@aventionseo.com"

    # List Brands
    brands_resp = client.get("/api/brands", headers=headers)
    assert brands_resp.status_code == 200
    brands = brands_resp.json()
    assert len(brands) >= 4

    # List Websites
    web_resp = client.get("/api/websites", headers=headers)
    assert web_resp.status_code == 200
    assert len(web_resp.json()) >= 8

    # List Keywords
    kw_resp = client.get("/api/keywords?limit=10", headers=headers)
    assert kw_resp.status_code == 200
    assert len(kw_resp.json()) == 10

    # Analytics Overview
    analytics_resp = client.get("/api/analytics/overview", headers=headers)
    assert analytics_resp.status_code == 200
    an_data = analytics_resp.json()
    assert an_data["total_keywords"] >= 100
    assert an_data["top_10"] > 0
    assert an_data["average_position"] > 0

    # Analytics Distribution
    dist_resp = client.get("/api/analytics/distribution", headers=headers)
    assert dist_resp.status_code == 200
    dist = dist_resp.json()
    assert len(dist) == 6

    # Global Search
    search_resp = client.get("/api/search?q=sap", headers=headers)
    assert search_resp.status_code == 200
    assert len(search_resp.json()) > 0
