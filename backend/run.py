import uvicorn
import argparse
import os
import sys

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the QA Database backend server")
    parser.add_argument(
        "--host", 
        type=str, 
        default="0.0.0.0", 
        help="Host to listen on (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="Port to listen on (default: 8000)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    
    args = parser.parse_args()
    
    # Add current directory to Python path to find modules
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Run the server
    uvicorn.run(
        "app.main:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload
    )