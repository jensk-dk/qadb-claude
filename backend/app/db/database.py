import os
from sqlmodel import SQLModel, Session, create_engine
from typing import Generator, Optional

# Get database URL from environment variable or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qa_database.db")

# Support for both SQLite and PostgreSQL
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Create engine
engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=True)


def create_db_and_tables():
    """Create database tables from SQLModel models"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get a new database session"""
    with Session(engine) as session:
        yield session


def export_db_to_json(output_file: str) -> bool:
    """Export all database tables to a JSON file"""
    from sqlmodel import select
    import json
    from app.models.base import (
        TestSuite, TestRunTemplate, TestCase, Company, TestOperator, 
        TestCaseResult, TestRun, Specification, Requirement,
        Capability, DUT, TestRunTemplateTestCase, DUTCapability,
        RequirementSpecification
    )
    
    try:
        with Session(engine) as session:
            # Collect data from all tables
            data = {
                "test_suites": [row.dict() for row in session.exec(select(TestSuite)).all()],
                "test_run_templates": [row.dict() for row in session.exec(select(TestRunTemplate)).all()],
                "test_cases": [row.dict() for row in session.exec(select(TestCase)).all()],
                "companies": [row.dict() for row in session.exec(select(Company)).all()],
                "test_operators": [row.dict() for row in session.exec(select(TestOperator)).all()],
                "test_case_results": [row.dict() for row in session.exec(select(TestCaseResult)).all()],
                "test_runs": [row.dict() for row in session.exec(select(TestRun)).all()],
                "specifications": [row.dict() for row in session.exec(select(Specification)).all()],
                "requirements": [row.dict() for row in session.exec(select(Requirement)).all()],
                "capabilities": [row.dict() for row in session.exec(select(Capability)).all()],
                "duts": [row.dict() for row in session.exec(select(DUT)).all()],
                "test_run_template_test_cases": [row.dict() for row in session.exec(select(TestRunTemplateTestCase)).all()],
                "dut_capabilities": [row.dict() for row in session.exec(select(DUTCapability)).all()],
                "requirement_specifications": [row.dict() for row in session.exec(select(RequirementSpecification)).all()],
            }
            
            # Write to JSON file
            with open(output_file, "w") as f:
                json.dump(data, f, indent=2, default=str)
            
            return True
    except Exception as e:
        print(f"Error exporting database to JSON: {e}")
        return False


def import_db_from_json(input_file: str) -> bool:
    """Import database tables from a JSON file"""
    from sqlmodel import select
    import json
    from app.models.base import (
        TestSuite, TestRunTemplate, TestCase, Company, TestOperator, 
        TestCaseResult, TestRun, Specification, Requirement,
        Capability, DUT, TestRunTemplateTestCase, DUTCapability,
        RequirementSpecification
    )
    
    try:
        # Read JSON file
        with open(input_file, "r") as f:
            data = json.load(f)
        
        with Session(engine) as session:
            # Clear existing data (optional)
            for model in [
                RequirementSpecification, DUTCapability, TestRunTemplateTestCase,
                TestCaseResult, TestRun, TestCase, TestRunTemplate, TestSuite,
                TestOperator, Company, Requirement, Specification, DUT, Capability
            ]:
                session.exec(f"DELETE FROM {model.__tablename__}")
            
            # Import data for each table
            for test_suite in data.get("test_suites", []):
                session.add(TestSuite(**test_suite))
            
            for template in data.get("test_run_templates", []):
                session.add(TestRunTemplate(**template))
            
            for test_case in data.get("test_cases", []):
                session.add(TestCase(**test_case))
            
            for company in data.get("companies", []):
                session.add(Company(**company))
            
            for operator in data.get("test_operators", []):
                session.add(TestOperator(**operator))
            
            for result in data.get("test_case_results", []):
                session.add(TestCaseResult(**result))
            
            for test_run in data.get("test_runs", []):
                session.add(TestRun(**test_run))
            
            for spec in data.get("specifications", []):
                session.add(Specification(**spec))
            
            for req in data.get("requirements", []):
                session.add(Requirement(**req))
            
            for capability in data.get("capabilities", []):
                session.add(Capability(**capability))
            
            for dut in data.get("duts", []):
                session.add(DUT(**dut))
            
            for template_case in data.get("test_run_template_test_cases", []):
                session.add(TestRunTemplateTestCase(**template_case))
            
            for dut_capability in data.get("dut_capabilities", []):
                session.add(DUTCapability(**dut_capability))
            
            for req_spec in data.get("requirement_specifications", []):
                session.add(RequirementSpecification(**req_spec))
            
            session.commit()
            
            return True
    except Exception as e:
        print(f"Error importing database from JSON: {e}")
        return False