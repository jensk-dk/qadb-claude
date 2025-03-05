from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.core.auth import (
    authenticate_user, create_access_token, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.db.database import get_session
from app.models.base import TestOperator, Company
from app.models.schemas import Token, TestOperatorCreate, TestOperatorRead, TestOperatorUpdate, StandardResponse
from app.api.deps import get_current_active_user, get_admin_user

router = APIRouter()


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    """Login and get access token"""
    print(f"Login attempt for user: {form_data.username}")
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        print(f"Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Authentication successful for user: {form_data.username}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=TestOperatorRead)
async def register_user(
    user: TestOperatorCreate,
    session: Session = Depends(get_session),
    current_user: TestOperator = Depends(get_admin_user)
):
    """Register a new user (admin only)"""
    # Check if username already exists
    existing_user = session.exec(select(TestOperator).where(TestOperator.login == user.login)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Verify company exists if provided
    if user.company_id:
        company = session.get(Company, user.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create the user
    db_user = TestOperator(
        name=user.name,
        mail=user.mail,
        login=user.login,
        access_rights=user.access_rights,
        company_id=user.company_id,
        hashed_password=hashed_password
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user


@router.get("/users", response_model=list[TestOperatorRead])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: TestOperator = Depends(get_admin_user)
):
    """Get all users (admin only)"""
    users = session.exec(select(TestOperator).offset(skip).limit(limit)).all()
    return users


@router.get("/users/me", response_model=TestOperatorRead)
async def read_users_me(
    current_user: TestOperator = Depends(get_current_active_user)
):
    """Get current user info"""
    return current_user


@router.patch("/users/{user_id}", response_model=TestOperatorRead)
async def update_user(
    user_id: int,
    user_update: TestOperatorUpdate,
    session: Session = Depends(get_session),
    current_user: TestOperator = Depends(get_admin_user)
):
    """Update a user (admin only)"""
    db_user = session.get(TestOperator, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify company exists if it's being updated
    if user_update.company_id is not None:
        company = session.get(Company, user_update.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
    
    # Update password if provided
    if user_update.password:
        user_update.hashed_password = get_password_hash(user_update.password)
        user_update.password = None
    
    # Update other attributes
    user_data = user_update.dict(exclude_unset=True, exclude={"password"})
    for key, value in user_data.items():
        setattr(db_user, key, value)
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user


@router.delete("/users/{user_id}", response_model=StandardResponse)
async def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: TestOperator = Depends(get_admin_user)
):
    """Delete a user (admin only)"""
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db_user = session.get(TestOperator, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(db_user)
    session.commit()
    
    return {"success": True, "message": f"User {user_id} deleted successfully", "data": None}