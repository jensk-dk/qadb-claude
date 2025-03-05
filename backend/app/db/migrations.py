import os
import subprocess
from pathlib import Path


def initialize_migrations():
    """Initialize Alembic for database migrations"""
    # Create alembic directory structure
    alembic_dir = Path("alembic")
    if not alembic_dir.exists():
        subprocess.run(["alembic", "init", "alembic"], check=True)
    
    # Update alembic.ini with correct database URL
    alembic_ini = Path("alembic.ini")
    with open(alembic_ini, "r") as f:
        lines = f.readlines()
    
    # Replace SQLAlchemy URL with our database URL
    updated_lines = []
    for line in lines:
        if line.startswith("sqlalchemy.url = "):
            line = f"sqlalchemy.url = {os.getenv('DATABASE_URL', 'sqlite:///./qa_database.db')}\n"
        updated_lines.append(line)
    
    with open(alembic_ini, "w") as f:
        f.writelines(updated_lines)
    
    # Update env.py to use our models
    env_py = Path("alembic") / "env.py"
    with open(env_py, "r") as f:
        lines = f.readlines()
    
    # Add import for SQLModel models
    updated_lines = []
    for line in lines:
        updated_lines.append(line)
        if "from alembic import context" in line:
            updated_lines.append("\nfrom sqlmodel import SQLModel\n")
            updated_lines.append("from app.models.base import *\n")
    
    # Update target_metadata
    target_found = False
    for i, line in enumerate(updated_lines):
        if line.strip().startswith("target_metadata = "):
            updated_lines[i] = "target_metadata = SQLModel.metadata\n"
            target_found = True
    
    with open(env_py, "w") as f:
        f.writelines(updated_lines)
    
    print("Alembic migration system initialized successfully.")


def create_migration(message="database-update"):
    """Create a new database migration"""
    try:
        subprocess.run(["alembic", "revision", "--autogenerate", "-m", message], check=True)
        print(f"Created new migration with message: {message}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        return False


def upgrade_database(revision="head"):
    """Upgrade the database to a specific revision"""
    try:
        subprocess.run(["alembic", "upgrade", revision], check=True)
        print(f"Database upgraded to revision: {revision}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error upgrading database: {e}")
        return False


def downgrade_database(revision="-1"):
    """Downgrade the database to a previous revision"""
    try:
        subprocess.run(["alembic", "downgrade", revision], check=True)
        print(f"Database downgraded to revision: {revision}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error downgrading database: {e}")
        return False