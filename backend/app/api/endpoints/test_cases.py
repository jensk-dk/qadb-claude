from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.base import TestCase, TestSuite
from app.models.schemas import (
    TestCaseCreate,
    TestCaseRead,
    TestCaseUpdate,
    TestCaseWithSuite,
    StandardResponse
)
from app.api.deps import get_current_active_user, get_admin_user

router = APIRouter()


@router.post("/", response_model=TestCaseRead)
def create_test_case(
    test_case: TestCaseCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new test case"""
    # Verify test suite exists
    test_suite = session.get(TestSuite, test_case.test_suite_id)
    if not test_suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    db_test_case = TestCase.from_orm(test_case)
    session.add(db_test_case)
    session.commit()
    session.refresh(db_test_case)
    return db_test_case


@router.get("/", response_model=List[TestCaseRead])
def get_test_cases(
    skip: int = 0,
    limit: int = 100,
    test_suite_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """Get all test cases, optionally filtered by test suite"""
    query = select(TestCase)
    
    if test_suite_id is not None:
        query = query.where(TestCase.test_suite_id == test_suite_id)
    
    test_cases = session.exec(query.offset(skip).limit(limit)).all()
    return test_cases


@router.get("/{case_id}", response_model=TestCaseWithSuite)
def get_test_case(
    case_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific test case by ID"""
    test_case = session.get(TestCase, case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case


@router.patch("/{case_id}", response_model=TestCaseRead)
def update_test_case(
    case_id: int,
    test_case: TestCaseUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a test case"""
    db_test_case = session.get(TestCase, case_id)
    if not db_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Verify test suite exists if it's being updated
    if test_case.test_suite_id is not None:
        test_suite = session.get(TestSuite, test_case.test_suite_id)
        if not test_suite:
            raise HTTPException(status_code=404, detail="Test suite not found")
    
    # Update attributes
    test_case_data = test_case.dict(exclude_unset=True)
    for key, value in test_case_data.items():
        setattr(db_test_case, key, value)
    
    session.add(db_test_case)
    session.commit()
    session.refresh(db_test_case)
    return db_test_case


@router.delete("/{case_id}", response_model=StandardResponse)
def delete_test_case(
    case_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a test case"""
    test_case = session.get(TestCase, case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    session.delete(test_case)
    session.commit()
    
    return {"success": True, "message": f"Test case {case_id} deleted successfully", "data": None}