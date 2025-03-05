from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.base import TestRunTemplate, TestCase, TestRunTemplateTestCase
from app.models.schemas import (
    TestRunTemplateCreate,
    TestRunTemplateRead,
    TestRunTemplateUpdate,
    TestRunTemplateWithCases,
    StandardResponse
)
from app.api.deps import get_current_active_user, get_admin_user

router = APIRouter()


@router.post("/", response_model=TestRunTemplateRead)
def create_test_run_template(
    template: TestRunTemplateCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new test run template"""
    db_template = TestRunTemplate.from_orm(template)
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template


@router.get("/", response_model=List[TestRunTemplateRead])
def get_test_run_templates(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all test run templates"""
    templates = session.exec(select(TestRunTemplate).offset(skip).limit(limit)).all()
    return templates


@router.get("/{template_id}", response_model=TestRunTemplateWithCases)
def get_test_run_template(
    template_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific test run template by ID, including its test cases"""
    template = session.get(TestRunTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Test run template not found")
    
    # Get test cases for this template
    test_cases = []
    template_cases = session.exec(
        select(TestRunTemplateTestCase).where(TestRunTemplateTestCase.template_id == template_id)
    ).all()
    
    for link in template_cases:
        test_case = session.get(TestCase, link.test_case_id)
        if test_case:
            test_cases.append(test_case)
    
    # Add test cases to template response
    result = TestRunTemplateWithCases.from_orm(template)
    result.test_cases = test_cases
    
    return result


@router.patch("/{template_id}", response_model=TestRunTemplateRead)
def update_test_run_template(
    template_id: int,
    template: TestRunTemplateUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a test run template"""
    db_template = session.get(TestRunTemplate, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Test run template not found")
    
    # Update attributes
    template_data = template.dict(exclude_unset=True)
    for key, value in template_data.items():
        setattr(db_template, key, value)
    
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template


@router.delete("/{template_id}", response_model=StandardResponse)
def delete_test_run_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a test run template"""
    template = session.get(TestRunTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Test run template not found")
    
    # First delete template-test case links
    session.exec(
        select(TestRunTemplateTestCase).where(TestRunTemplateTestCase.template_id == template_id)
    ).delete()
    
    # Then delete the template
    session.delete(template)
    session.commit()
    
    return {"success": True, "message": f"Test run template {template_id} deleted successfully", "data": None}


@router.post("/{template_id}/test_cases/{test_case_id}", response_model=StandardResponse)
def add_test_case_to_template(
    template_id: int,
    test_case_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Add a test case to a test run template"""
    # Verify template exists
    template = session.get(TestRunTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Test run template not found")
    
    # Verify test case exists
    test_case = session.get(TestCase, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Check if link already exists
    existing_link = session.exec(
        select(TestRunTemplateTestCase)
        .where(TestRunTemplateTestCase.template_id == template_id)
        .where(TestRunTemplateTestCase.test_case_id == test_case_id)
    ).first()
    
    if existing_link:
        return {"success": True, "message": "Test case already in template", "data": None}
    
    # Create the link
    link = TestRunTemplateTestCase(template_id=template_id, test_case_id=test_case_id)
    session.add(link)
    session.commit()
    
    return {"success": True, "message": "Test case added to template", "data": None}


@router.delete("/{template_id}/test_cases/{test_case_id}", response_model=StandardResponse)
def remove_test_case_from_template(
    template_id: int,
    test_case_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Remove a test case from a test run template"""
    # Verify template exists
    template = session.get(TestRunTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Test run template not found")
    
    # Verify test case exists
    test_case = session.get(TestCase, test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Find and delete the link
    link = session.exec(
        select(TestRunTemplateTestCase)
        .where(TestRunTemplateTestCase.template_id == template_id)
        .where(TestRunTemplateTestCase.test_case_id == test_case_id)
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Test case not in template")
    
    session.delete(link)
    session.commit()
    
    return {"success": True, "message": "Test case removed from template", "data": None}