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

1. Setup DynamoDB Local:
```bash
cd backend
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE=issues
npm run dynamodb:setup
```

2. (Optional) Seed the database:
```bash
cd backend
npm run seed
```

3. Start the server:
```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend Setup

Start the development server:
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

## Deployment (Dev)

### Backend Deployment to AWS Lambda

1. Configure AWS credentials:
```bash
aws configure
```

2. Deploy:
```bash
cd backend
npm run deploy:dev
```

3. Get API endpoint:
```bash
cd backend
npm run deploy:info
```

### Frontend Deployment to S3

1. Deploy:
```bash
cd frontend
npm run deploy:dev
```

## Stopping Services

Stop DynamoDB Local:
```bash
docker stop dynamodb-local
```
