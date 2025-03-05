from fastapi import Depends, HTTPException, status
from sqlmodel import Session
from app.db.database import get_session
from app.core.auth import get_current_user
from app.models.base import TestOperator

# Dependency for authenticated endpoints
def get_current_active_user(
    current_user: TestOperator = Depends(get_current_user)
) -> TestOperator:
    return current_user

# Dependency for admin-only endpoints
def get_admin_user(
    current_user: TestOperator = Depends(get_current_user)
) -> TestOperator:
    # Check if user has admin rights
    if current_user.access_rights != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return current_user