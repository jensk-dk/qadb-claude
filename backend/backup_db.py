#!/usr/bin/env python3
import os
import sys
import argparse
from datetime import datetime
from app.db.database import export_db_to_json

if __name__ == "__main__":
    # Add current directory to Python path to find modules
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    parser = argparse.ArgumentParser(description="Backup QA Database to JSON file")
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output JSON file path (default: ./qa_db_backup_TIMESTAMP.json)"
    )
    
    args = parser.parse_args()
    
    # Generate default filename if not provided
    if not args.output:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.output = f"./qa_db_backup_{timestamp}.json"
    
    # Ensure directory exists
    output_dir = os.path.dirname(os.path.abspath(args.output))
    os.makedirs(output_dir, exist_ok=True)
    
    # Perform the backup
    print(f"Backing up database to {args.output}...")
    success = export_db_to_json(args.output)
    
    if success:
        print(f"Backup completed successfully: {args.output}")
    else:
        print("Backup failed!", file=sys.stderr)
        sys.exit(1)