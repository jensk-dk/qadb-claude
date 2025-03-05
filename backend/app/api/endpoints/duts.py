from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from app.db.database import get_session
from app.models.base import DUT, Capability, DUTCapability
from app.models.schemas import (
    DUTCreate,
    DUTRead,
    DUTUpdate,
    DUTWithCapabilities,
    CapabilityCreate,
    CapabilityRead,
    CapabilityUpdate,
    StandardResponse
)
from app.api.deps import get_current_active_user, get_admin_user

router = APIRouter()


# DUT Endpoints
@router.post("/", response_model=DUTRead)
def create_dut(
    dut: DUTCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new DUT (Device Under Test)"""
    db_dut = DUT.from_orm(dut)
    session.add(db_dut)
    session.commit()
    session.refresh(db_dut)
    return db_dut


@router.get("/", response_model=List[DUTRead])
def get_duts(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all DUTs"""
    duts = session.exec(select(DUT).offset(skip).limit(limit)).all()
    return duts


@router.get("/{dut_id}", response_model=DUTWithCapabilities)
def get_dut(
    dut_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific DUT by ID, including its capabilities"""
    dut = session.get(DUT, dut_id)
    if not dut:
        raise HTTPException(status_code=404, detail="DUT not found")
    
    # Get capabilities for this DUT
    capabilities = []
    dut_capabilities = session.exec(
        select(DUTCapability).where(DUTCapability.dut_id == dut_id)
    ).all()
    
    for link in dut_capabilities:
        capability = session.get(Capability, link.capability_id)
        if capability:
            capabilities.append(capability)
    
    # Create response object
    result = DUTWithCapabilities.from_orm(dut)
    result.capabilities = capabilities
    
    return result


@router.patch("/{dut_id}", response_model=DUTRead)
def update_dut(
    dut_id: int,
    dut: DUTUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a DUT"""
    db_dut = session.get(DUT, dut_id)
    if not db_dut:
        raise HTTPException(status_code=404, detail="DUT not found")
    
    # Update attributes
    dut_data = dut.dict(exclude_unset=True)
    for key, value in dut_data.items():
        setattr(db_dut, key, value)
    
    session.add(db_dut)
    session.commit()
    session.refresh(db_dut)
    return db_dut


@router.delete("/{dut_id}", response_model=StandardResponse)
def delete_dut(
    dut_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a DUT"""
    dut = session.get(DUT, dut_id)
    if not dut:
        raise HTTPException(status_code=404, detail="DUT not found")
    
    # First delete DUT-capability links
    session.exec(
        select(DUTCapability).where(DUTCapability.dut_id == dut_id)
    ).delete()
    
    # Then delete the DUT
    session.delete(dut)
    session.commit()
    
    return {"success": True, "message": f"DUT {dut_id} deleted successfully", "data": None}


@router.post("/{dut_id}/capabilities/{capability_id}", response_model=StandardResponse)
def add_capability_to_dut(
    dut_id: int,
    capability_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Add a capability to a DUT"""
    # Verify DUT exists
    dut = session.get(DUT, dut_id)
    if not dut:
        raise HTTPException(status_code=404, detail="DUT not found")
    
    # Verify capability exists
    capability = session.get(Capability, capability_id)
    if not capability:
        raise HTTPException(status_code=404, detail="Capability not found")
    
    # Check if link already exists
    existing_link = session.exec(
        select(DUTCapability)
        .where(DUTCapability.dut_id == dut_id)
        .where(DUTCapability.capability_id == capability_id)
    ).first()
    
    if existing_link:
        return {"success": True, "message": "Capability already added to DUT", "data": None}
    
    # Create the link
    link = DUTCapability(dut_id=dut_id, capability_id=capability_id)
    session.add(link)
    session.commit()
    
    return {"success": True, "message": "Capability added to DUT", "data": None}


@router.delete("/{dut_id}/capabilities/{capability_id}", response_model=StandardResponse)
def remove_capability_from_dut(
    dut_id: int,
    capability_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Remove a capability from a DUT"""
    # Verify DUT exists
    dut = session.get(DUT, dut_id)
    if not dut:
        raise HTTPException(status_code=404, detail="DUT not found")
    
    # Verify capability exists
    capability = session.get(Capability, capability_id)
    if not capability:
        raise HTTPException(status_code=404, detail="Capability not found")
    
    # Find and delete the link
    link = session.exec(
        select(DUTCapability)
        .where(DUTCapability.dut_id == dut_id)
        .where(DUTCapability.capability_id == capability_id)
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Capability not linked to this DUT")
    
    session.delete(link)
    session.commit()
    
    return {"success": True, "message": "Capability removed from DUT", "data": None}


# Capability Endpoints
@router.post("/capabilities", response_model=CapabilityRead)
def create_capability(
    capability: CapabilityCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new capability"""
    db_capability = Capability.from_orm(capability)
    session.add(db_capability)
    session.commit()
    session.refresh(db_capability)
    return db_capability


@router.get("/capabilities", response_model=List[CapabilityRead])
def get_capabilities(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get all capabilities, optionally filtered by category"""
    query = select(Capability)
    
    if category:
        query = query.where(Capability.category == category)
    
    capabilities = session.exec(query.offset(skip).limit(limit)).all()
    return capabilities


@router.get("/capabilities/{capability_id}", response_model=CapabilityRead)
def get_capability(
    capability_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific capability by ID"""
    capability = session.get(Capability, capability_id)
    if not capability:
        raise HTTPException(status_code=404, detail="Capability not found")
    return capability


@router.patch("/capabilities/{capability_id}", response_model=CapabilityRead)
def update_capability(
    capability_id: int,
    capability: CapabilityUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """Update a capability"""
    db_capability = session.get(Capability, capability_id)
    if not db_capability:
        raise HTTPException(status_code=404, detail="Capability not found")
    
    # Update attributes
    capability_data = capability.dict(exclude_unset=True)
    for key, value in capability_data.items():
        setattr(db_capability, key, value)
    
    session.add(db_capability)
    session.commit()
    session.refresh(db_capability)
    return db_capability


@router.delete("/capabilities/{capability_id}", response_model=StandardResponse)
def delete_capability(
    capability_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Delete a capability"""
    capability = session.get(Capability, capability_id)
    if not capability:
        raise HTTPException(status_code=404, detail="Capability not found")
    
    # First delete DUT-capability links
    session.exec(
        select(DUTCapability).where(DUTCapability.capability_id == capability_id)
    ).delete()
    
    # Then delete the capability
    session.delete(capability)
    session.commit()
    
    return {"success": True, "message": f"Capability {capability_id} deleted successfully", "data": None}