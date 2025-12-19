# Stage 1: DynamoDB Local Setup

This guide explains how to set up and run the application with DynamoDB Local for development.

## Prerequisites

- Node.js 20.x or higher
- Docker (for running DynamoDB Local)
- AWS CLI (optional, for creating tables via CLI)

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start DynamoDB Local

**Option A: Using npm script (recommended)**
```bash
cd backend
npm run dynamodb:start
```

**Option B: Using shell script directly**
```bash
# From backend directory
./scripts/start-dynamodb-local.sh
```

This will start DynamoDB Local in a Docker container on port 8000.

### 3. Create the Table

**Option A: Using npm script (recommended)**
```bash
cd backend
# Set environment variables first
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues

# Create the table
npm run dynamodb:create-table
```

**Option B: One-command setup**
```bash
cd backend
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues
npm run dynamodb:setup
```

This will start DynamoDB Local, wait 3 seconds, and create the table automatically.

**Note:** The table creation script uses Node.js and doesn't require AWS CLI to be installed.

Alternatively, you can use the AWS CLI directly:

```bash
aws dynamodb create-table \
  --table-name issues \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### 4. Set Environment Variables

```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues
```

Or create a `.env` file in the `backend` directory:

```env
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=issues
```

### 5. Seed the Database (Optional)

```bash
cd backend
npm run seed
```

This will populate the database with 8 dummy issues.

### 6. Start the Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`.

## Testing the API

Once the server is running, you can test the endpoints:

```bash
# Get all issues
curl http://localhost:3000/api/issues

# Create an issue
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Issue",
    "description": "This is a test",
    "site": "Site-101",
    "severity": "minor"
  }'

# Get issue by ID (use an ID from the list)
curl http://localhost:3000/api/issues/<issue-id>
```

## Stopping DynamoDB Local

```bash
docker stop dynamodb-local
```

Or remove the container:

```bash
docker stop dynamodb-local
docker rm dynamodb-local
```

## Notes

- DynamoDB Local stores data in memory by default. Data will be lost when the container stops.
- The table uses `PAY_PER_REQUEST` billing mode (no need to provision capacity).
- Issue IDs are now UUIDs (strings) instead of auto-incrementing integers.
- The old SQLite database and schema files have been removed.

## Troubleshooting

### Table already exists error
If you see "Table already exists", the table was created previously. You can continue using it or delete and recreate:

```bash
aws dynamodb delete-table \
  --table-name issues \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Then run create-dynamodb-table.sh again
```

### Connection refused
Make sure DynamoDB Local is running:
```bash
docker ps | grep dynamodb-local
```

If not running, start it:
```bash
cd backend
npm run dynamodb:start
```

Or use the script directly:
```bash
cd backend
./scripts/start-dynamodb-local.sh
```

