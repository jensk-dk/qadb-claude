from fastapi import APIRouter
from app.api.endpoints import (
    test_suites,
    test_cases, 
    test_run_templates,
    test_runs,
    duts,
    auth,
    uploads,
    db_admin
)

api_router = APIRouter()

# Add all the API endpoints to the main router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(test_suites.router, prefix="/test-suites", tags=["Test Suites"])
api_router.include_router(test_cases.router, prefix="/test-cases", tags=["Test Cases"])
api_router.include_router(test_run_templates.router, prefix="/test-run-templates", tags=["Test Run Templates"])
api_router.include_router(test_runs.router, prefix="/test-runs", tags=["Test Runs"])
api_router.include_router(duts.router, prefix="/duts", tags=["DUTs & Capabilities"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["File Uploads"])
api_router.include_router(db_admin.router, prefix="/admin", tags=["Database Administration"])