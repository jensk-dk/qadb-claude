from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.db.database import get_session
from app.models.base import TestSuite
from app.models.schemas import (
    TestSuiteCreate,
    TestSuiteRead,
    TestSuiteUpdate,
    StandardResponse
)
from app.api.deps import get_current_active_user, get_admin_user

router = APIRouter()


@router.post("/", response_model=TestSuiteRead)
def create_test_suite(
    test_suite: TestSuiteCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new test suite"""
    db_test_suite = TestSuite.from_orm(test_suite)
    session.add(db_test_suite)
    session.commit()
    session.refresh(db_test_suite)
    return db_test_suite


@router.get("/", response_model=List[TestSuiteRead])
def get_test_suites(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all test suites"""
    test_suites = session.exec(select(TestSuite).offset(skip).limit(limit)).all()
    return test_suites


@router.get("/{suite_id}", response_model=TestSuiteRead)
def get_test_suite(
    suite_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific test suite by ID"""
    test_suite = session.get(TestSuite, suite_id)
    if not test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return test_suite


@router.patch("/{suite_id}", response_model=TestSuiteRead)
def update_test_suite(
    suite_id: int,
    test_suite: TestSuiteUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a test suite"""
    db_test_suite = session.get(TestSuite, suite_id)
    if not db_test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    # Update attributes
    test_suite_data = test_suite.dict(exclude_unset=True)
    for key, value in test_suite_data.items():
        setattr(db_test_suite, key, value)
    
    session.add(db_test_suite)
    session.commit()
    session.refresh(db_test_suite)
    return db_test_suite


@router.delete("/{suite_id}", response_model=StandardResponse)
def delete_test_suite(
    suite_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a test suite"""
    test_suite = session.get(TestSuite, suite_id)
    if not test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    session.delete(test_suite)
    session.commit()
    
    return {"success": True, "message": f"Test suite {suite_id} deleted successfully", "data": None}