from sqlmodel import Session, select
from typing import Optional, Dict, Any
from app.models.base import TestCase, TestSuite

def create_or_find_test_case(session: Session, test_case_data: Dict[str, Any]) -> TestCase:
    """
    Create or find a test case based on the provided data.
    """
    test_case_id = test_case_data.get("test_case_id")
    if not test_case_id:
        return None
        
    # First try to find by case_id
    test_case = session.exec(
        select(TestCase).where(TestCase.case_id == test_case_id)
    ).first()
    
    # If not found, also try searching by title
    if not test_case and test_case_data.get("title"):
        test_case = session.exec(
            select(TestCase).where(TestCase.title == test_case_data.get("title"))
        ).first()
    
    if not test_case:
        # Create a placeholder test case
        test_suite_id = None
        test_suite_name = test_case_data.get("test_suite")
        
        # If test_suite not found in data, try to create a default one
        if not test_suite_name:
            test_suite_name = "Imported Tests"
        
        # Find or create the test suite
        test_suite = session.exec(
            select(TestSuite).where(TestSuite.name == test_suite_name)
        ).first()
        
        if not test_suite:
            # Create default test suite
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
        
        # Create the placeholder test case with better defaults
        title = test_case_data.get("title") 
        if not title:
            title = f"Test Case {test_case_id}"
        
        test_case = TestCase(
            case_id=test_case_id,
            title=title,
            version=test_case_data.get("version", 1),
            version_string=test_case_data.get("version_string", "1.0"),
            description=test_case_data.get("description") or f"Imported test case {test_case_id}",
            test_suite_id=test_suite_id
        )
        session.add(test_case)
        session.commit()
        session.refresh(test_case)
        print(f"Created new test case: {test_case_id} - {title}")
    
    return test_case