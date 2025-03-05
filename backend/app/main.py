from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
import os
import sys

from app.api.api import api_router
from app.db.database import create_db_and_tables, get_session
from app.core.auth import get_password_hash
from app.models.base import TestOperator, Company

# Create FastAPI app
app = FastAPI(
    title="QA Database API",
    description="API for managing QA testing and results",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")


# Startup event
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    create_initial_admin()


def create_initial_admin():
    """Create an initial admin user if no users exist"""
    from sqlmodel import select
    
    # Use the first database session from the generator
    session = next(get_session())
    
    # Check if any users exist
    users = session.exec(select(TestOperator)).first()
    if users:
        return
    
    # Create default company
    company = Company(
        field="Default",
        access_rights="all"
    )
    session.add(company)
    session.commit()
    session.refresh(company)
    
    # Create admin user
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")  # Use env var or default
    admin = TestOperator(
        name="Administrator",
        mail="admin@example.com",
        login="admin",
        access_rights="admin",
        company_id=company.id,
        hashed_password=get_password_hash(admin_password)
    )
    session.add(admin)
    session.commit()
    
    print(f"Created initial admin user with username 'admin' and password '{admin_password}'")
    print(f"Admin user ID: {admin.id}")


# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to QA Database API",
        "docs": "/docs",
        "version": "1.0.0"
    }