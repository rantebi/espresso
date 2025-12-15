# Trial Issue Log - Backend API

A Node.js/TypeScript backend API for tracking issues discovered during clinical trial site visits. Built with Express.js and SQLite.

## Features

- Full CRUD operations for issues
- Input validation
- Error handling
- Unit and integration tests
- TypeScript for type safety

## Prerequisites

- Node.js (LTS version 20.x or higher recommended)
- npm (comes with Node.js)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the server in development mode with hot-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Environment Variables

Create a `.env` file in the backend directory (optional):

```env
PORT=3000
DB_PATH=./db/issues.db
NODE_ENV=development
```

- `PORT`: Server port (default: 3000)
- `DB_PATH`: SQLite database file path (default: `./db/issues.db`)
- `NODE_ENV`: Environment mode (development/test/production)

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Create Issue
**POST** `/api/issues`

Request body:
```json
{
  "title": "Missing consent form",
  "description": "Consent form not in file for patient 003",
  "site": "Site-101",
  "severity": "major",
  "status": "open"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Missing consent form",
    "description": "Consent form not in file for patient 003",
    "site": "Site-101",
    "severity": "major",
    "status": "open",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Issue by ID
**GET** `/api/issues/:id`

Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Missing consent form",
    "description": "Consent form not in file for patient 003",
    "site": "Site-101",
    "severity": "major",
    "status": "open",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Update Issue
**PUT** `/api/issues/:id`

Request body (all fields optional):
```json
{
  "title": "Updated title",
  "status": "resolved",
  "severity": "critical"
}
```

Response (200): Same format as GET

### Delete Issue
**DELETE** `/api/issues/:id`

Response (204): No content

### Health Check
**GET** `/health`

Response (200):
```json
{
  "status": "ok"
}
```

## Data Models

### Issue
- `id` (number): Auto-incrementing primary key
- `title` (string, required): Issue title (max 255 characters)
- `description` (string, required): Issue description
- `site` (string, required): Site identifier (e.g., "Site-101")
- `severity` (enum, required): One of `"minor"`, `"major"`, `"critical"`
- `status` (enum, optional): One of `"open"`, `"in_progress"`, `"resolved"` (defaults to `"open"`)
- `createdAt` (string): ISO 8601 timestamp
- `updatedAt` (string): ISO 8601 timestamp

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Status Codes
- `400`: Bad Request (validation errors)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # SQLite connection & initialization
│   ├── models/
│   │   └── Issue.ts             # Issue model with CRUD methods
│   ├── controllers/
│   │   └── issueController.ts  # Issue controller handlers
│   ├── routes/
│   │   └── api.ts               # API route definitions
│   ├── middleware/
│   │   ├── validation.ts        # Request validation
│   │   └── errorHandler.ts     # Error handling middleware
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces/types
│   └── server.ts                # Express app entry point
├── tests/
│   ├── unit/
│   │   └── models/
│   │       └── Issue.test.ts    # Unit tests for Issue model
│   ├── integration/
│   │   └── issues.test.ts       # Integration tests for CRUD endpoints
│   └── setup.ts                 # Test database setup/teardown
├── db/
│   ├── schema.sql               # Database schema
│   └── issues.db                # SQLite database file (created on first run)
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest test configuration
├── package.json
└── README.md
```

## Database

The application uses SQLite for data storage. The database file is created automatically on first run at the path specified by `DB_PATH` (default: `./db/issues.db`).

### Schema

The `issues` table includes:
- Auto-incrementing ID
- Title, description, site (text fields)
- Severity and status (enums with CHECK constraints)
- Automatic timestamps (createdAt, updatedAt)

## Development

### Code Quality

- TypeScript strict mode enabled
- ESLint/Prettier (if configured)
- Comprehensive test coverage

### Testing Strategy

- **Unit Tests**: Test individual model methods in isolation
- **Integration Tests**: Test full request/response cycle using Supertest

Tests use a separate test database (`test.db`) that is created and cleaned between test runs.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:
1. Ensure the `db/` directory exists
2. Check file permissions for the database file
3. Verify `DB_PATH` environment variable is set correctly

### Port Already in Use

If port 3000 is already in use:
```bash
PORT=3001 npm run dev
```

### Test Failures

If tests fail:
1. Ensure all dependencies are installed: `npm install`
2. Check that the test database can be created in the `tests/` directory
3. Run tests with verbose output: `npm test -- --verbose`

## Next Steps

This is Phase 1 of the implementation. Future phases will include:
- Phase 2: List endpoint with filtering and search
- Phase 3: Pagination and sorting
- Phase 4: Dashboard endpoint with counts
- Phase 5: CSV import functionality

## License

ISC

