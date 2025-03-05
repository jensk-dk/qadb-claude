from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.core.file_utils import process_upload_file
from app.models.base import TestCase, TestRun, TestCaseResult, TestOperator, TestSuite
from app.models.schemas import StandardResponse, FileUploadResponse
from app.api.deps import get_current_active_user
import os
import json
import pandas as pd

router = APIRouter()


@router.post("/test-results", response_model=FileUploadResponse)
async def upload_test_results(
    file: UploadFile = File(...),
    operator_id: int = None,
    test_run_name: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload test results from a file (JSON or Excel)"""
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file extension
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["json", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only JSON and Excel files are supported."
        )
    
    # Process the file
    result = await process_upload_file(file)
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing file: {result.get('error', 'Unknown error')}"
        )
    
    data = result["data"]
    
    # Use current user as operator if operator_id is not provided
    if not operator_id:
        operator_id = current_user.id
    else:
        # Verify operator exists
        operator = session.get(TestOperator, operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")
    
    try:
        # Create a new test run
        test_run = TestRun(
            status="Completed",
            name=test_run_name or f"Imported from {file.filename}",
            operator_id=operator_id
        )
        session.add(test_run)
        session.commit()
        session.refresh(test_run)
        
        # Process results based on file format
        test_case_results_count = 0
        
        # Assume a specific structure in the file
        if file_ext == "json":
            results = data.get("test_results", [])
            if not results and isinstance(data, list):
                results = data
            
            # Look for standard structure with test_case_results
            if "test_case_results" in data:
                results = data.get("test_case_results", [])
                
            # Process test cases
            if "test_cases" in data:
                test_cases = data.get("test_cases", [])
                for test_case_data in test_cases:
                    try:
                        case_id = test_case_data.get("case_id")
                        if not case_id:
                            continue
                            
                        # Check if test case already exists
                        test_case = session.exec(
                            select(TestCase).where(TestCase.case_id == case_id)
                        ).first()
                        
                        # Create test suite if needed
                        test_suite_id = None
                        test_suite_name = test_case_data.get("test_suite_id")
                        
                        if test_suite_name and test_suite_name != "default":
                            test_suite = session.exec(
                                select(TestSuite).where(TestSuite.name == test_suite_name)
                            ).first()
                            
                            if not test_suite:
                                # Create test suite
                                test_suite = TestSuite(
                                    name=test_suite_name,
                                    format="JSON",
                                    version=1,
                                    version_string="1.0"
                                )
                                session.add(test_suite)
                                session.commit()
                                session.refresh(test_suite)
                                
                            test_suite_id = test_suite.id
                        
                        # Create or update test case
                        if not test_case:
                            test_case = TestCase(
                                case_id=case_id,
                                title=test_case_data.get("title", f"Test Case {case_id}"),
                                version=test_case_data.get("version", 1),
                                version_string=test_case_data.get("version_string", "1.0"),
                                description=test_case_data.get("description"),
                                area=test_case_data.get("area"),
                                automatability=test_case_data.get("automatability"),
                                test_suite_id=test_suite_id
                            )
                            session.add(test_case)
                            session.commit()
                            session.refresh(test_case)
                    except Exception as e:
                        print(f"Error processing test case: {e}")
            
            # Process test results
            for item in results:
                # Try to find test case by ID or create a placeholder
                test_case_id = item.get("test_case_id")
                if test_case_id:
                    test_case = session.exec(
                        select(TestCase).where(TestCase.case_id == test_case_id)
                    ).first()
                    
                    if not test_case:
                        # Create a placeholder test case
                        test_suite_id = None
                        test_suite_name = item.get("test_suite")
                        
                        if test_suite_name:
                            test_suite = session.exec(
                                select(TestSuite).where(TestSuite.name == test_suite_name)
                            ).first()
                            
                            if test_suite:
                                test_suite_id = test_suite.id
                        
                        # Create the placeholder test case
                        test_case = TestCase(
                            case_id=test_case_id,
                            title=item.get("title", f"Test Case {test_case_id}"),
                            version=1,
                            version_string="1.0",
                            test_suite_id=test_suite_id
                        )
                        session.add(test_case)
                        session.commit()
                        session.refresh(test_case)
                    
                    # Add test case result
                    result = TestCaseResult(
                        test_case_id=test_case.id,
                        test_run_id=test_run.id,
                        result=item.get("result", "Unknown"),
                        logs=item.get("logs"),
                        comment=item.get("comment"),
                        artifacts=item.get("artifacts")
                    )
                    session.add(result)
                    test_case_results_count += 1
        
        elif file_ext in ["xlsx", "xls"]:
            # Process Excel data
            for item in data:
                # Excel column headers should match these keys
                test_case_id = item.get("test_case_id") or item.get("id")
                if test_case_id:
                    test_case = session.exec(
                        select(TestCase).where(TestCase.case_id == str(test_case_id))
                    ).first()
                    
                    if not test_case:
                        # Create a placeholder test case
                        test_suite_id = None
                        test_suite_name = item.get("test_suite")
                        
                        if test_suite_name:
                            test_suite = session.exec(
                                select(TestSuite).where(TestSuite.name == test_suite_name)
                            ).first()
                            
                            if test_suite:
                                test_suite_id = test_suite.id
                        
                        # Create the placeholder test case
                        test_case = TestCase(
                            case_id=str(test_case_id),
                            title=item.get("title", f"Test Case {test_case_id}"),
                            version=1,
                            version_string="1.0",
                            test_suite_id=test_suite_id
                        )
                        session.add(test_case)
                        session.commit()
                        session.refresh(test_case)
                    
                    # Add test case result
                    result = TestCaseResult(
                        test_case_id=test_case.id,
                        test_run_id=test_run.id,
                        result=item.get("result", "Unknown"),
                        logs=item.get("logs", None),
                        comment=item.get("comment", None),
                        artifacts=item.get("artifacts", None)
                    )
                    session.add(result)
                    test_case_results_count += 1
        
        session.commit()
        
        return {
            "filename": file.filename,
            "success": True,
            "message": f"Test results imported successfully. Created test run with {test_case_results_count} results."
        }
    
    except Exception as e:
        # Rollback changes if any error occurs
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error importing test results: {str(e)}"
        )


@router.post("/import-local-file", response_model=FileUploadResponse)
async def import_local_file(
    file_path: str = None,
    operator_id: int = None,
    test_run_name: Optional[str] = None,
    data: dict = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    # Check if parameters were sent in the body
    if data and not file_path:
        file_path = data.get("file_path")
        if not operator_id:
            operator_id = data.get("operator_id")
        if not test_run_name:
            test_run_name = data.get("test_run_name")
    """Import test results from a local file path"""
    if not file_path:
        raise HTTPException(status_code=400, detail="No file path provided")
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Check file extension
    file_ext = file_path.split(".")[-1].lower()
    if file_ext not in ["json", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only JSON and Excel files are supported."
        )
    
    try:
        # Read and parse the file
        data = None
        if file_ext == "json":
            with open(file_path, 'r') as f:
                data = json.load(f)
        elif file_ext in ["xlsx", "xls"]:
            df = pd.read_excel(file_path)
            data = df.to_dict(orient="records")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Use current user as operator if operator_id is not provided
        if not operator_id:
            operator_id = current_user.id
        else:
            # Verify operator exists
            operator = session.get(TestOperator, operator_id)
            if not operator:
                raise HTTPException(status_code=404, detail="Operator not found")
        
        # Get filename for display
        filename = os.path.basename(file_path)
        
        # Create a new test run
        test_run = TestRun(
            status="Completed",
            name=test_run_name or f"Imported from {filename}",
            operator_id=operator_id
        )
        session.add(test_run)
        session.commit()
        session.refresh(test_run)
        
        # Process results
        test_case_results_count = 0
        
        # Process based on file format and structure
        if file_ext == "json":
            results = data.get("test_results", [])
            if not results and isinstance(data, list):
                results = data
            
            # Look for standard structure with test_case_results
            if "test_case_results" in data:
                results = data.get("test_case_results", [])
                
            # Process test cases
            if "test_cases" in data:
                test_cases = data.get("test_cases", [])
                for test_case_data in test_cases:
                    try:
                        case_id = test_case_data.get("case_id")
                        if not case_id:
                            continue
                            
                        # Check if test case already exists
                        test_case = session.exec(
                            select(TestCase).where(TestCase.case_id == case_id)
                        ).first()
                        
                        # Create test suite if needed
                        test_suite_id = None
                        test_suite_name = test_case_data.get("test_suite_id")
                        
                        if test_suite_name and test_suite_name != "default":
                            test_suite = session.exec(
                                select(TestSuite).where(TestSuite.name == test_suite_name)
                            ).first()
                            
                            if not test_suite:
                                # Create test suite
                                test_suite = TestSuite(
                                    name=test_suite_name,
                                    format="JSON",
                                    version=1,
                                    version_string="1.0"
                                )
                                session.add(test_suite)
                                session.commit()
                                session.refresh(test_suite)
                                
                            test_suite_id = test_suite.id
                        
                        # Create or update test case
                        if not test_case:
                            test_case = TestCase(
                                case_id=case_id,
                                title=test_case_data.get("title", f"Test Case {case_id}"),
                                version=test_case_data.get("version", 1),
                                version_string=test_case_data.get("version_string", "1.0"),
                                description=test_case_data.get("description"),
                                area=test_case_data.get("area"),
                                automatability=test_case_data.get("automatability"),
                                test_suite_id=test_suite_id
                            )
                            session.add(test_case)
                            session.commit()
                            session.refresh(test_case)
                    except Exception as e:
                        print(f"Error processing test case: {e}")
            
            # Process test results
            for item in results:
                # Try to find test case by ID or create a placeholder
                test_case_id = item.get("test_case_id")
                if test_case_id:
                    test_case = session.exec(
                        select(TestCase).where(TestCase.case_id == test_case_id)
                    ).first()
                    
                    if not test_case:
                        # Create a placeholder test case
                        test_suite_id = None
                        test_suite_name = item.get("test_suite")
                        
                        if test_suite_name:
                            test_suite = session.exec(
                                select(TestSuite).where(TestSuite.name == test_suite_name)
                            ).first()
                            
                            if test_suite:
                                test_suite_id = test_suite.id
                        
                        # Create the placeholder test case
                        test_case = TestCase(
                            case_id=test_case_id,
                            title=item.get("title", f"Test Case {test_case_id}"),
                            version=1,
                            version_string="1.0",
                            test_suite_id=test_suite_id
                        )
                        session.add(test_case)
                        session.commit()
                        session.refresh(test_case)
                    
                    # Add test case result
                    result = TestCaseResult(
                        test_case_id=test_case.id,
                        test_run_id=test_run.id,
                        result=item.get("result", "Unknown"),
                        logs=item.get("logs"),
                        comment=item.get("comment"),
                        artifacts=item.get("artifacts")
                    )
                    session.add(result)
                    test_case_results_count += 1
        
        session.commit()
        
        return {
            "filename": filename,
            "success": True,
            "message": f"Test results imported successfully from {filename}. Created test run with {test_case_results_count} results."
        }
    
    except Exception as e:
        # Rollback changes if any error occurs
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error importing test results: {str(e)}"
        )