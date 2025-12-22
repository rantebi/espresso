# Espresso - Trial Issue Log

A full-stack web application for managing clinical trial issues with real-time statistics, CSV import, and advanced filtering capabilities.

## Features

- **Issue Management**: Create, read, update, and delete clinical trial issues
- **Search & Filter**: Search by title, filter by status/severity, sort by multiple fields
- **CSV Import**: Bulk upload issues via CSV with validation and preview
- **Statistics Dashboard**: Real-time stacked bar chart showing issues by severity and status
- **Responsive Design**: Modern UI with SCSS styling and color-coded status indicators

## Technical Stack

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- React Router for navigation
- Recharts for data visualization
- Generic Infinite Data-Table
- Axios with interceptors for API calls
- SCSS with centralized color variables

**Backend:**
- Node.js with Express 5
- TypeScript
- AWS DynamoDB for data storage
- Zod for request validation
- Multer for file uploads
- Serverless Framework for AWS Lambda deployment

**Infrastructure:**
- AWS Lambda (API Gateway)
- DynamoDB (local development + AWS)
- S3 for frontend hosting
- Docker for DynamoDB Local

**Testing:**
- Jest with ts-jest
- Unit tests for models
- Integration tests for API endpoints (CRUD, CSV upload, querying, validation)

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
