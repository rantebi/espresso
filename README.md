# Espresso - Trial Issue Log

## Prerequisites

- Node.js 20.x or higher
- npm (comes with Node.js)
- Docker (for DynamoDB Local)
- AWS CLI (for deployment)
- AWS Account (for deployment)

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Local Development

### Backend Setup

1. Start DynamoDB Local:
```bash
cd backend
npm run dynamodb:start
```

2. Create the table:
```bash
cd backend
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues
npm run dynamodb:create-table
```

Or use the one-command setup:
```bash
cd backend
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues
npm run dynamodb:setup
```

3. (Optional) Seed the database:
```bash
cd backend
npm run seed
```

4. Start the server:
```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend Setup

1. Start the development server:
```bash
cd frontend
npm run dev
```

Application runs on `http://localhost:5173`

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

Watch mode:
```bash
cd backend
npm run test:watch
```

### Frontend Tests

(Add test commands if available)

## Building

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

Preview production build:
```bash
cd frontend
npm run preview
```

## Deployment

### Backend Deployment to AWS Lambda

1. Configure AWS credentials:
```bash
aws configure
```

2. Build:
```bash
cd backend
npm run build
```

3. Deploy:
```bash
cd backend
npm run deploy:dev      # Deploy to dev stage
npm run deploy:staging  # Deploy to staging
npm run deploy:prod    # Deploy to production
```

4. View deployment info:
```bash
cd backend
npm run deploy:info
```

5. View logs:
```bash
cd backend
npm run deploy:logs
```

6. Remove deployment:
```bash
cd backend
npm run deploy:remove:dev
```

### Frontend Deployment to S3

1. Get API Gateway endpoint from backend:
```bash
cd backend
npx serverless info --stage dev
```

2. Deploy frontend:
```bash
cd frontend
npm run deploy:dev      # Deploy to dev
npm run deploy:staging  # Deploy to staging
npm run deploy:prod    # Deploy to production
```

## Environment Variables

### Backend

Create `.env` file in `backend/` directory (optional for local development):

```env
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=issues
PORT=3000
NODE_ENV=development
```

For AWS deployment, these are set automatically by Serverless Framework.

### Frontend

Create `.env` file in `frontend/` directory (optional):

```env
VITE_API_URL=http://localhost:3000/api
```

For production, set `VITE_API_URL` to your API Gateway endpoint before building.

## Stopping Services

Stop DynamoDB Local:
```bash
docker stop dynamodb-local
```

Remove DynamoDB Local container:
```bash
docker stop dynamodb-local
docker rm dynamodb-local
```
