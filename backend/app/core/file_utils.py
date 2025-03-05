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
        # First, try to read as standard JSON
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            # If it fails, try to extract and parse individual JSON objects
            # This handles non-standard JSON with multiple concatenated objects
            result = await _extract_and_parse_records(file_path)
            if result["success"]:
                data = result["data"]
            else:
                return result  # Return error from extraction attempt
            
        # Handle different JSON formats
        # 1. Standard format with test_cases and test_case_results
        if isinstance(data, dict) and 'test_cases' in data and 'test_case_results' in data:
            # Already in our expected format
            pass
            
        # 2. Format with just test_case_results array
        elif isinstance(data, dict) and 'test_case_results' in data:
            # Already has test_case_results, possibly missing test_run
            if 'test_run' not in data:
                data['test_run'] = {
                    'name': f"Import: {file_path.name}",
                    'date': None
                }
                
        # 3. HbbTV format - array of test reports
        elif isinstance(data, list) and len(data) > 0:
            # Check if the list items have test_case_id and state fields
            has_hbbtv_format = False
            for item in data[:min(5, len(data))]:
                if isinstance(item, dict) and 'test_case_id' in item and 'state' in item:
                    has_hbbtv_format = True
                    break
                    
            if has_hbbtv_format:
                # Convert HbbTV test format to our standard format
                results = []
                for item in data:
                    if isinstance(item, dict) and 'test_case_id' in item:
                        state = item.get('state', 'Unknown')
                        result = 'Pass' if state == 'Successful' else 'Fail' if state == 'Failed' else state
                        
                        results.append({
                            'test_case_id': item.get('test_case_id'),
                            'title': item.get('title', f"Test {item.get('test_case_id')}"),
                            'result': result,
                            'comment': f"Test run ID: {item.get('test_run_id', 'Unknown')}",
                            'logs': f"Created: {item.get('created', 'Unknown')}, Last changed: {item.get('last_changed', 'Unknown')}",
                            'artifacts': item.get('steps', {}).get('collectionUrl', '') if isinstance(item.get('steps'), dict) else ''
                        })
                
                # Create the complete data structure
                data = {
                    'test_run': {
                        'name': f"HbbTV Import: {file_path.name}",
                        'date': None
                    },
                    'test_case_results': results
                }
        
        # 4. Single HbbTV test report
        elif isinstance(data, dict) and 'test_case_id' in data and 'state' in data:
            state = data.get('state', 'Unknown')
            result = 'Pass' if state == 'Successful' else 'Fail' if state == 'Failed' else state
            
            # Create a test case result with the data
            results = [{
                'test_case_id': data.get('test_case_id'),
                'title': data.get('title', f"Test {data.get('test_case_id')}"),
                'result': result,
                'comment': f"Test run ID: {data.get('test_run_id', 'Unknown')}",
                'logs': f"Created: {data.get('created', 'Unknown')}, Last changed: {data.get('last_changed', 'Unknown')}",
                'artifacts': data.get('steps', {}).get('collectionUrl', '') if isinstance(data.get('steps'), dict) else ''
            }]
            
            # Create the complete data structure
            data = {
                'test_run': {
                    'name': f"HbbTV Single Test: {data.get('title', 'Unknown')}",
                    'date': data.get('created', '').split('T')[0] if data.get('created') else None
                },
                'test_case_results': results
            }
                
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
        
        
async def _extract_and_parse_records(file_path: Path) -> Dict[str, Any]:
    """Extract and parse individual JSON objects from a malformed file"""
    try:
        with open(file_path, "r") as f:
            content = f.read()
            
        # Try to identify individual JSON objects
        objects = []
        
        # Remove whitespace and handle newlines
        content = content.replace('\\n', ' ').strip()
        
        # Look for sequences that might be JSON objects
        start_idx = 0
        while start_idx < len(content):
            # Find opening brace
            open_brace = content.find('{', start_idx)
            if open_brace == -1:
                break
                
            # Find matching closing brace (accounting for nested braces)
            brace_count = 1
            close_brace = open_brace + 1
            while brace_count > 0 and close_brace < len(content):
                if content[close_brace] == '{':
                    brace_count += 1
                elif content[close_brace] == '}':
                    brace_count -= 1
                close_brace += 1
                
            if brace_count == 0:
                # Found a complete JSON object
                obj_str = content[open_brace:close_brace]
                try:
                    obj = json.loads(obj_str)
                    objects.append(obj)
                except json.JSONDecodeError:
                    # Skip malformed objects
                    pass
                    
            # Move to next position
            start_idx = close_brace
        
        if objects:
            # Convert to our expected format
            if all('test_case_id' in obj and 'state' in obj for obj in objects[:min(3, len(objects))]):
                # Detected HbbTV format
                results = []
                for item in objects:
                    state = item.get('state', 'Unknown')
                    result = 'Pass' if state == 'Successful' else 'Fail' if state == 'Failed' else state
                    
                    results.append({
                        'test_case_id': item.get('test_case_id'),
                        'result': result,
                        'comment': f"Test run ID: {item.get('test_run_id', 'Unknown')}",
                        'logs': f"Created: {item.get('created', 'Unknown')}, Last changed: {item.get('last_changed', 'Unknown')}",
                        'artifacts': item.get('steps', {}).get('collectionUrl', '') if isinstance(item.get('steps'), dict) else ''
                    })
                
                data = {
                    'test_run': {
                        'name': f"HbbTV Import: {file_path.name}",
                        'date': None
                    },
                    'test_case_results': results
                }
                return {"success": True, "data": data}
            else:
                # Use the objects as-is
                return {"success": True, "data": objects}
        else:
            return {"success": False, "error": "Could not extract valid JSON objects"}
            
    except Exception as e:
        return {"success": False, "error": f"Error extracting JSON objects: {str(e)}"}


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