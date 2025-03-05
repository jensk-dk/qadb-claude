# QA Database System

A comprehensive QA database system with a FastAPI backend and Vue.js frontend for managing test suites, test cases, and test results.

## Features

- Track test suites, test cases, and other relevant QA data
- Create and customize test run templates
- Upload test results via JSON or Excel files
- Drag-and-drop file upload support
- Visualize test reports with charts and statistics
- Compare test runs to track regressions
- RESTful API for integration with other tools

## Project Structure

```
/
├── backend/          # Python FastAPI backend
│   ├── app/          # Application code
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core functionalities 
│   │   ├── db/       # Database models & migrations
│   │   └── models/   # Data models
│   ├── tests/        # Backend tests
│   ├── requirements.txt  # Python dependencies
│   └── run.py        # Script to run the backend
└── frontend/         # Vue.js frontend
    ├── src/          # Source code
    ├── public/       # Public assets
    └── tests/        # Frontend tests
```

## Setup Instructions

### Backend Setup

1. Set up a Python virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Run the backend server:

```bash
python run.py
```

The backend API will be available at http://localhost:8000.
You can access the API documentation at http://localhost:8000/docs.

### Frontend Setup

1. Install Node.js dependencies:

```bash
cd frontend
npm install
```

2. Run the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173.

## Database Management

### Initial Setup

The system automatically creates an SQLite database file at `backend/qa_database.db` on first run. It also creates an initial admin user:

- Username: `admin`
- Password: `admin123`

**Important:** Be sure to change the admin password after initial login.

### Database Migrations

When database schema changes, use Alembic for migrations:

```bash
cd backend
python -c "from app.db.migrations import create_migration; create_migration('description')"
python -c "from app.db.migrations import upgrade_database; upgrade_database()"
```

### Backup and Restore

Backup the database to a JSON file:

```bash
python backup_db.py --output backup_file.json
```

Or use the API endpoint (`/api/admin/backup`) to download a backup.

### Switching to PostgreSQL

For production, you can switch to PostgreSQL by setting the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://user:password@localhost/qadb"
```

## API Usage with Curl

### Authentication

```bash
# Get authentication token
curl -X POST http://localhost:8000/api/auth/token \
  -d "username=admin&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

Save the token from the response and use it in subsequent requests:

```bash
export TOKEN="your_token_here"
```

### Basic Operations

#### Get all test suites:

```bash
curl -X GET http://localhost:8000/api/test-suites/ \
  -H "Authorization: Bearer $TOKEN"
```

#### Create a test suite:

```bash
curl -X POST http://localhost:8000/api/test-suites/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "UI Tests", "format": "HTML", "version": 1, "version_string": "1.0"}'
```

#### Upload test results:

```bash
curl -X POST http://localhost:8000/api/uploads/test-results \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_results.json" \
  -F "test_run_name=My Test Run"
```

## Development

### Backend Testing

```bash
cd backend
pytest
```

### Frontend Testing

```bash
cd frontend
npm run test
```

### Linting

```bash
# Backend
cd backend
pylint app

# Frontend
cd frontend
npm run lint
```

## Production Deployment

For production deployment, consider:

1. Using a proper production WSGI server like Gunicorn for the backend
2. Building the frontend for production: `npm run build`
3. Setting up proper environment variables for database connections and secrets
4. Configuring appropriate CORS settings in the backend
5. Using a reverse proxy like Nginx in front of both services

## License

This project is licensed under the MIT License - see the LICENSE file for details.