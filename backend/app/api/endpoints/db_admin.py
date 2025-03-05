from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlmodel import Session
from typing import Optional
from datetime import datetime
import os
import tempfile

from app.db.database import get_session, export_db_to_json, import_db_from_json
from app.api.deps import get_admin_user
from app.models.schemas import StandardResponse

router = APIRouter()


@router.get("/backup", response_class=FileResponse)
async def backup_database(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Backup database to a JSON file"""
    # Create a timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    temp_dir = tempfile.gettempdir()
    backup_file = os.path.join(temp_dir, f"qa_db_backup_{timestamp}.json")
    
    # Export database to JSON
    success = export_db_to_json(backup_file)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to backup database"
        )
    
    # Schedule file to be removed after sending
    background_tasks.add_task(os.remove, backup_file)
    
    # Return the file as a download
    return FileResponse(
        path=backup_file,
        filename=f"qa_db_backup_{timestamp}.json",
        media_type="application/json"
    )


@router.post("/restore", response_model=StandardResponse)
async def restore_database(
    file_path: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Restore database from a JSON file"""
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {file_path}"
        )
    
    # Import data from JSON file
    success = import_db_from_json(file_path)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to restore database from backup"
        )
    
    return {
        "success": True,
        "message": "Database successfully restored from backup",
        "data": None
    }


@router.post("/backup-cli", response_model=StandardResponse)
async def backup_database_cli(
    output_file: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_admin_user)
):
    """Backup database to a specified JSON file (for CLI use)"""
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    
    # Export database to JSON
    success = export_db_to_json(output_file)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to backup database"
        )
    
    return {
        "success": True,
        "message": f"Database successfully backed up to {output_file}",
        "data": None
    }