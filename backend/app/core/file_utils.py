import json
import pandas as pd
from fastapi import UploadFile
from typing import Dict, Any, List, Optional
from pathlib import Path
import os
import tempfile


async def save_upload_file_tmp(upload_file: UploadFile) -> Path:
    """Save an upload file temporarily and return the path"""
    try:
        suffix = Path(upload_file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await upload_file.read()
            tmp.write(content)
            tmp_path = Path(tmp.name)
        return tmp_path
    except Exception:
        return None


async def process_json_file(file_path: Path) -> Dict[str, Any]:
    """Process a JSON file and return the data"""
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def process_excel_file(file_path: Path) -> Dict[str, Any]:
    """Process an Excel file and return the data as a dict"""
    try:
        # Read Excel file into a pandas DataFrame
        df = pd.read_excel(file_path)
        
        # Convert DataFrame to dict
        data = df.to_dict(orient="records")
        
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def process_upload_file(upload_file: UploadFile) -> Dict[str, Any]:
    """Process an uploaded file based on its format"""
    try:
        # Save file temporarily
        tmp_path = await save_upload_file_tmp(upload_file)
        if not tmp_path:
            return {"success": False, "error": "Failed to save uploaded file"}
        
        # Process based on file extension
        file_ext = Path(upload_file.filename).suffix.lower()
        
        if file_ext == ".json":
            result = await process_json_file(tmp_path)
        elif file_ext in [".xlsx", ".xls"]:
            result = await process_excel_file(tmp_path)
        else:
            result = {"success": False, "error": f"Unsupported file type: {file_ext}"}
        
        # Clean up temporary file
        os.unlink(tmp_path)
        
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}