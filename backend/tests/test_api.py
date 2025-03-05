import pytest
from app.models.base import TestSuite, TestCase


# Test Suite API Tests
def test_create_test_suite(client, admin_headers):
    """Test creating a test suite"""
    test_suite_data = {
        "name": "UI Tests",
        "format": "HTML",
        "version": 1,
        "version_string": "1.0",
        "is_final": False
    }
    
    response = client.post(
        "/api/test-suites/", 
        json=test_suite_data,
        headers=admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == test_suite_data["name"]
    assert data["format"] == test_suite_data["format"]
    assert "id" in data


def test_get_test_suites(client, admin_headers, session):
    """Test getting all test suites"""
    # Create test suites
    suite1 = TestSuite(name="Suite 1", format="HTML", version=1, version_string="1.0")
    suite2 = TestSuite(name="Suite 2", format="XML", version=1, version_string="1.0")
    session.add(suite1)
    session.add(suite2)
    session.commit()
    
    response = client.get("/api/test-suites/", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Suite 1"
    assert data[1]["name"] == "Suite 2"


def test_get_test_suite(client, admin_headers, session):
    """Test getting a specific test suite"""
    # Create a test suite
    suite = TestSuite(name="My Suite", format="HTML", version=1, version_string="1.0")
    session.add(suite)
    session.commit()
    session.refresh(suite)
    
    response = client.get(f"/api/test-suites/{suite.id}", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Suite"
    assert data["id"] == suite.id


# Test Case API Tests
def test_create_test_case(client, admin_headers, session):
    """Test creating a test case"""
    # Create a test suite first
    suite = TestSuite(name="Suite", format="HTML", version=1, version_string="1.0")
    session.add(suite)
    session.commit()
    session.refresh(suite)
    
    test_case_data = {
        "case_id": "TC001",
        "title": "Login Test",
        "version": 1,
        "version_string": "1.0",
        "description": "Test the login functionality",
        "test_suite_id": suite.id
    }
    
    response = client.post(
        "/api/test-cases/", 
        json=test_case_data,
        headers=admin_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == test_case_data["case_id"]
    assert data["title"] == test_case_data["title"]
    assert data["test_suite_id"] == suite.id


def test_get_test_cases(client, admin_headers, session):
    """Test getting all test cases"""
    # Create a test suite
    suite = TestSuite(name="Suite", format="HTML", version=1, version_string="1.0")
    session.add(suite)
    session.commit()
    session.refresh(suite)
    
    # Create test cases
    case1 = TestCase(
        case_id="TC001", 
        title="Test 1", 
        version=1, 
        version_string="1.0", 
        test_suite_id=suite.id
    )
    case2 = TestCase(
        case_id="TC002", 
        title="Test 2", 
        version=1, 
        version_string="1.0", 
        test_suite_id=suite.id
    )
    session.add(case1)
    session.add(case2)
    session.commit()
    
    response = client.get("/api/test-cases/", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["case_id"] == "TC001"
    assert data[1]["case_id"] == "TC002"
    
    # Test filtering by test_suite_id
    response = client.get(f"/api/test-cases/?test_suite_id={suite.id}", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Test filtering with non-existent suite ID
    response = client.get("/api/test-cases/?test_suite_id=999", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0