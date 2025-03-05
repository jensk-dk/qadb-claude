import pytest
from app.models.base import TestOperator


def test_login(client, test_admin):
    """Test login and token generation"""
    response = client.post(
        "/api/auth/token",
        data={"username": test_admin.login, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client, test_admin):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/auth/token",
        data={"username": test_admin.login, "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_get_current_user(client, admin_headers, test_admin):
    """Test getting current user information"""
    response = client.get("/api/auth/users/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["login"] == test_admin.login
    assert data["name"] == test_admin.name
    assert data["mail"] == test_admin.mail


def test_create_user(client, admin_headers, session, test_company):
    """Test user creation"""
    user_data = {
        "name": "Test User",
        "mail": "user@test.com",
        "login": "testuser",
        "access_rights": "user",
        "company_id": test_company.id,
        "password": "user123"
    }
    
    response = client.post(
        "/api/auth/register", 
        json=user_data,
        headers=admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["login"] == user_data["login"]
    assert data["name"] == user_data["name"]
    assert data["mail"] == user_data["mail"]
    
    # Verify user was created in the database
    user = session.get(TestOperator, data["id"])
    assert user is not None
    assert user.login == user_data["login"]
    
    # Try logging in with the new user
    response = client.post(
        "/api/auth/token",
        data={"username": user_data["login"], "password": user_data["password"]}
    )
    assert response.status_code == 200