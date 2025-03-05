from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.base import TestRun, TestCase, TestCaseResult, TestOperator
from app.models.schemas import (
    TestRunCreate, 
    TestRunRead, 
    TestRunUpdate, 
    TestRunWithResults,
    TestCaseResultCreate,
    TestCaseResultRead,
    TestCaseResultUpdate,
    StandardResponse
)
from app.api.deps import get_current_active_user, get_admin_user
from datetime import datetime

router = APIRouter()


# Test Runs Endpoints
@router.post("/", response_model=TestRunRead)
def create_test_run(
    test_run: TestRunCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new test run with optional test case results"""
    # Verify operator exists
    operator = session.get(TestOperator, test_run.operator_id)
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    # Create test run
    db_test_run = TestRun.from_orm(test_run)
    session.add(db_test_run)
    session.commit()
    session.refresh(db_test_run)
    
    # Create any test case results provided
    if test_run.test_case_results:
        for result in test_run.test_case_results:
            # Verify test case exists
            test_case = session.get(TestCase, result.test_case_id)
            if not test_case:
                continue  # Skip this result if test case not found
            
            # Create test case result
            db_result = TestCaseResult(
                result=result.result,
                logs=result.logs,
                comment=result.comment,
                artifacts=result.artifacts,
                test_case_id=result.test_case_id,
                test_run_id=db_test_run.id
            )
            session.add(db_result)
        
        session.commit()
        session.refresh(db_test_run)
    
    return db_test_run


@router.get("/", response_model=List[TestRunRead])
def get_test_runs(
    skip: int = 0,
    limit: int = 100,
    operator_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """Get all test runs, optionally filtered by operator"""
    query = select(TestRun)
    
    if operator_id is not None:
        query = query.where(TestRun.operator_id == operator_id)
    
    # Sort by most recent first
    query = query.order_by(TestRun.id.desc())
    
    test_runs = session.exec(query.offset(skip).limit(limit)).all()
    return test_runs


@router.get("/{run_id}", response_model=TestRunWithResults)
def get_test_run(
    run_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific test run by ID, including test case results"""
    test_run = session.get(TestRun, run_id)
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    return test_run


@router.patch("/{run_id}", response_model=TestRunRead)
def update_test_run(
    run_id: int,
    test_run: TestRunUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a test run"""
    db_test_run = session.get(TestRun, run_id)
    if not db_test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    # Verify operator exists if it's being updated
    if test_run.operator_id is not None:
        operator = session.get(TestOperator, test_run.operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")
    
    # Update attributes
    test_run_data = test_run.dict(exclude_unset=True)
    for key, value in test_run_data.items():
        setattr(db_test_run, key, value)
    
    session.add(db_test_run)
    session.commit()
    session.refresh(db_test_run)
    return db_test_run


@router.delete("/{run_id}", response_model=StandardResponse)
def delete_test_run(
    run_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a test run and its results"""
    test_run = session.get(TestRun, run_id)
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    # Delete test case results first
    session.exec(select(TestCaseResult).where(TestCaseResult.test_run_id == run_id)).delete()
    
    # Delete test run
    session.delete(test_run)
    session.commit()
    
    return {"success": True, "message": f"Test run {run_id} deleted successfully", "data": None}


@router.get("/compare/{run_id1}/{run_id2}", response_model=dict)
def compare_test_runs(
    run_id1: int,
    run_id2: int,
    session: Session = Depends(get_session)
):
    """Compare results from two test runs"""
    # Get both test runs
    test_run1 = session.get(TestRun, run_id1)
    test_run2 = session.get(TestRun, run_id2)
    
    if not test_run1 or not test_run2:
        raise HTTPException(status_code=404, detail="One or both test runs not found")
    
    # Collect results for both runs
    results1 = session.exec(select(TestCaseResult).where(TestCaseResult.test_run_id == run_id1)).all()
    results2 = session.exec(select(TestCaseResult).where(TestCaseResult.test_run_id == run_id2)).all()
    
    # Map test case IDs to results for easier comparison
    results1_map = {result.test_case_id: result for result in results1}
    results2_map = {result.test_case_id: result for result in results2}
    
    # Get all test case IDs from both runs
    all_test_case_ids = set(results1_map.keys()) | set(results2_map.keys())
    
    # Compare results
    comparison = {
        "run1": {"id": run_id1, "pass_count": 0, "fail_count": 0, "other_count": 0, "total": 0},
        "run2": {"id": run_id2, "pass_count": 0, "fail_count": 0, "other_count": 0, "total": 0},
        "differences": [],
        "test_cases": []
    }
    
    for test_case_id in all_test_case_ids:
        test_case = session.get(TestCase, test_case_id)
        if not test_case:
            continue
        
        result1 = results1_map.get(test_case_id)
        result2 = results2_map.get(test_case_id)
        
        # Calculate statistics for run1
        if result1:
            comparison["run1"]["total"] += 1
            if result1.result.lower() == "pass":
                comparison["run1"]["pass_count"] += 1
            elif result1.result.lower() == "fail":
                comparison["run1"]["fail_count"] += 1
            else:
                comparison["run1"]["other_count"] += 1
        
        # Calculate statistics for run2
        if result2:
            comparison["run2"]["total"] += 1
            if result2.result.lower() == "pass":
                comparison["run2"]["pass_count"] += 1
            elif result2.result.lower() == "fail":
                comparison["run2"]["fail_count"] += 1
            else:
                comparison["run2"]["other_count"] += 1
        
        # Check for differences
        if result1 and result2 and result1.result != result2.result:
            comparison["differences"].append({
                "test_case_id": test_case_id,
                "test_case_title": test_case.title,
                "run1_result": result1.result,
                "run2_result": result2.result
            })
        
        # Add to test cases list
        comparison["test_cases"].append({
            "test_case_id": test_case_id,
            "test_case_title": test_case.title,
            "run1_result": result1.result if result1 else None,
            "run2_result": result2.result if result2 else None
        })
    
    return comparison


# Test Case Results Endpoints
@router.post("/results", response_model=TestCaseResultRead)
def create_test_case_result(
    result: TestCaseResultCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new test case result"""
    # Verify test case exists
    test_case = session.get(TestCase, result.test_case_id)
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Verify test run exists if provided
    if result.test_run_id:
        test_run = session.get(TestRun, result.test_run_id)
        if not test_run:
            raise HTTPException(status_code=404, detail="Test run not found")
    
    # Create test case result
    db_result = TestCaseResult.from_orm(result)
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    
    return db_result


@router.get("/results/{result_id}", response_model=TestCaseResultRead)
def get_test_case_result(
    result_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific test case result by ID"""
    result = session.get(TestCaseResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Test case result not found")
    
    return result


@router.patch("/results/{result_id}", response_model=TestCaseResultRead)
def update_test_case_result(
    result_id: int,
    result: TestCaseResultUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a test case result"""
    db_result = session.get(TestCaseResult, result_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Test case result not found")
    
    # Verify test case exists if it's being updated
    if result.test_case_id is not None:
        test_case = session.get(TestCase, result.test_case_id)
        if not test_case:
            raise HTTPException(status_code=404, detail="Test case not found")
    
    # Verify test run exists if it's being updated
    if result.test_run_id is not None:
        test_run = session.get(TestRun, result.test_run_id)
        if not test_run:
            raise HTTPException(status_code=404, detail="Test run not found")
    
    # Update attributes
    result_data = result.dict(exclude_unset=True)
    for key, value in result_data.items():
        setattr(db_result, key, value)
    
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    
    return db_result


@router.delete("/results/{result_id}", response_model=StandardResponse)
def delete_test_case_result(
    result_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Delete a test case result"""
    result = session.get(TestCaseResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Test case result not found")
    
    session.delete(result)
    session.commit()
    
    return {"success": True, "message": f"Test case result {result_id} deleted successfully", "data": None}