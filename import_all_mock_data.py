import requests
import glob
import os
import json
import sys
import time

BASE_URL = "http://localhost:8001/api"
AUTH_URL = f"{BASE_URL}/auth/token"

def login():
    """Login to get access token"""
    data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(AUTH_URL, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.text}")
        sys.exit(1)

def get_headers(token):
    """Get headers with authorization token"""
    return {
        "Authorization": f"Bearer {token}"
    }

def import_test_results(file_path, token):
    """Import test results from a file"""
    url = f"{BASE_URL}/uploads/import-local-file"
    
    # Create request data
    data = {
        "file_path": file_path,
        "test_run_name": f"Imported from {os.path.basename(file_path)}",
        "operator_id": 1  # Default admin user
    }
    
    headers = get_headers(token)
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        print(f"Successfully imported {os.path.basename(file_path)}")
        return True
    else:
        print(f"Error importing {os.path.basename(file_path)}: {response.text}")
        return False

def main():
    # Login and get token
    token = login()
    if not token:
        print("Failed to login")
        return
    
    # Get all JSON files in the mock_data directory
    mock_data_dir = "/home/jensk/QaDb2/mock_data"
    json_files = glob.glob(f"{mock_data_dir}/*.json")
    
    if not json_files:
        print(f"No JSON files found in {mock_data_dir}")
        return
    
    print(f"Found {len(json_files)} JSON files to import")
    
    # Import each file
    success_count = 0
    for file_path in json_files:
        print(f"Importing {os.path.basename(file_path)}...")
        if import_test_results(file_path, token):
            success_count += 1
        
        # Add a small delay to prevent overwhelming the server
        time.sleep(1)
    
    print(f"Import completed. Successfully imported {success_count} out of {len(json_files)} files.")

if __name__ == "__main__":
    main()