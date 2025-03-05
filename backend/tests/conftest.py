import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

# Add backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import get_session
from app.core.auth import get_password_hash
from app.models.base import Company, TestOperator


@pytest.fixture(name="test_db_engine")
def test_db_engine_fixture():
    """Create a test database engine"""
    # Use in-memory SQLite database for testing
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    
    # Create the database schema
    SQLModel.metadata.create_all(engine)
    
    return engine


@pytest.fixture(name="session")
def session_fixture(test_db_engine):
    """Create a test database session"""
    with Session(test_db_engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    """Create a test client with a test database session"""
    # Override the get_session dependency to use the test session
    def get_test_session():
        yield session
    
    app.dependency_overrides[get_session] = get_test_session
    
    # Create test client
    with TestClient(app) as client:
        yield client
    
    # Remove the override after the test
    app.dependency_overrides.clear()


@pytest.fixture(name="test_company")
def test_company_fixture(session):
    """Create a test company"""
    company = Company(
        field="Test Company",
        access_rights="all"
    )
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@pytest.fixture(name="test_admin")
def test_admin_fixture(session, test_company):
    """Create a test admin user"""
    admin = TestOperator(
        name="Test Admin",
        mail="admin@test.com",
        login="testadmin",
        access_rights="admin",
        company_id=test_company.id,
        hashed_password=get_password_hash("password123")
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


@pytest.fixture(name="admin_token")
def admin_token_fixture(client, test_admin):
    """Get an admin token for authentication"""
    response = client.post(
        "/api/auth/token",
        data={"username": test_admin.login, "password": "password123"}
    )
    return response.json()["access_token"]


@pytest.fixture(name="admin_headers")
def admin_headers_fixture(admin_token):
    """Get admin authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}