# Stage 2: AWS Lambda Deployment Guide

This guide explains how to deploy the backend to AWS Lambda using Serverless Framework.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Serverless Framework** installed globally or locally
4. **Node.js 20.x** installed

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `serverless-http` - Wraps Express app for Lambda
- `serverless` (dev dependency) - Serverless Framework CLI

### 2. Configure AWS Credentials

Serverless Framework uses the same credential chain as AWS CLI. You can configure credentials in several ways:

**Option A: AWS CLI (Recommended)**
```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

**Option B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

**Option C: AWS Profile**
If using multiple AWS accounts:
```bash
aws configure --profile myprofile
```

Then deploy with:
```bash
serverless deploy --aws-profile myprofile
```

**Verify Credentials**
```bash
# Test AWS CLI access
aws sts get-caller-identity

# If this works, Serverless Framework should also work
```

### 3. Build the Backend

```bash
cd backend
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Deployment

**Note**: All Serverless Framework commands should be run from the `backend/` directory.

### Option 1: Using npm Scripts (Recommended)

```bash
cd backend

# Deploy to dev stage (default)
npm run deploy

# Deploy to specific stage
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# View deployment info
npm run deploy:info

# View logs
npm run deploy:logs

# Remove deployment
npm run deploy:remove:dev
```

### Option 2: Using the Deployment Script

```bash
# From backend directory
# Deploy to dev stage (default)
./scripts/deploy.sh

# Deploy to production stage
./scripts/deploy.sh production

# Deploy to specific region
./scripts/deploy.sh dev us-west-2
```

### Option 3: Using Serverless Framework Directly

```bash
cd backend

# Deploy to dev stage (default)
npx serverless deploy

# Deploy to specific stage
npx serverless deploy --stage production

# Deploy to specific region
npx serverless deploy --region us-west-2

# Deploy with both stage and region
npx serverless deploy --stage production --region us-west-2
```

## Configuration

The `serverless.yml` file in the `backend/` directory contains all the configuration:

- **Service name**: `espresso-api`
- **Runtime**: Node.js 20.x
- **Default region**: `us-east-1`
- **Default stage**: `dev`
- **Lambda timeout**: 30 seconds
- **Lambda memory**: 512 MB

### Environment Variables

- `DYNAMODB_TABLE`: Automatically set to `espresso-api-{stage}`
- `NODE_ENV`: Set to `production`

### DynamoDB Table

The DynamoDB table is automatically created with:
- **Table name**: `espresso-api-{stage}`
- **Partition key**: `id` (String)
- **Billing mode**: Pay per request (no capacity provisioning needed)

## After Deployment

### Get API Endpoint

```bash
cd backend
npx serverless info --stage dev
```

Or check the CloudFormation outputs in AWS Console.

### Test the API

```bash
# Get the endpoint URL
ENDPOINT=$(serverless info --stage dev | grep "ServiceEndpoint" | awk '{print $2}')

# Test health check
curl $ENDPOINT/health

# Test API
curl $ENDPOINT/api/issues
```

### Seed the Database

After deployment, you can seed the database:

```bash
# Set environment variables
export DYNAMODB_TABLE=espresso-api-dev
export AWS_REGION=us-east-1

# Run seed script (will use AWS DynamoDB)
cd backend
npm run seed
```

## Managing Deployments

### View Deployment Info

```bash
cd backend
npx serverless info --stage dev
```

### View Logs

```bash
cd backend
npx serverless logs -f api --stage dev --tail
```

### Remove Deployment

```bash
cd backend
npx serverless remove --stage dev
```

**Warning**: This will delete all AWS resources including the DynamoDB table and all data!

## Stages

You can deploy to multiple stages (environments):

- `dev` - Development environment
- `staging` - Staging environment
- `production` - Production environment

Each stage gets its own:
- Lambda function
- API Gateway
- DynamoDB table
- CloudFormation stack

## Troubleshooting

### AWS Credentials Not Found

If you get "AWS provider credentials not found" but `aws sts get-caller-identity` works:

1. **Check Serverless Framework is using correct credentials**:
   ```bash
   # Verify AWS CLI works
   aws sts get-caller-identity
   
   # Try deploying with explicit profile
   cd backend
   npx serverless deploy --aws-profile default
   ```

2. **Set credentials as environment variables** (if using temporary credentials):
   ```bash
   export AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
   export AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
   export AWS_SESSION_TOKEN=$(aws configure get aws_session_token)  # If using SSO
   cd backend
   npx serverless deploy
   ```

3. **If using AWS SSO**, you may need to login first:
   ```bash
   aws sso login --profile your-profile
   cd backend
   npx serverless deploy --aws-profile your-profile
   ```

4. **Check credentials file location**:
   ```bash
   # Serverless looks for credentials in:
   # ~/.aws/credentials (Linux/Mac)
   # %USERPROFILE%\.aws\credentials (Windows)
   cat ~/.aws/credentials
   ```

### Deployment Fails

1. Check AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions (need Lambda, API Gateway, DynamoDB, CloudFormation permissions)
3. Check CloudFormation stack in AWS Console for errors

### Lambda Timeout

If requests timeout, increase the timeout in `backend/serverless.yml`:

```yaml
functions:
  api:
    timeout: 60  # Increase from 30 to 60 seconds
```

### CORS Issues

CORS is configured in `backend/serverless.yml`. If you need to restrict origins:

```yaml
cors:
  origin: 'https://yourdomain.com'
  headers:
    - Content-Type
    - Authorization
```

### DynamoDB Access Denied

Ensure the Lambda execution role has DynamoDB permissions. Check `backend/serverless.yml` IAM role statements.

## Cost Estimation

For low traffic (< 1000 requests/day):
- **Lambda**: Free tier (1M requests/month), then ~$0.20 per 1M requests
- **API Gateway**: Free tier (1M requests/month), then ~$3.50 per 1M requests
- **DynamoDB**: Free tier (25GB storage, 25 RCU/WCU), then ~$0.25/GB storage
- **Total**: ~$0-5/month

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Seed the database with dummy data
3. Configure custom domain (optional)
4. Set up monitoring and alerts
5. Proceed to Stage 3: Deploy frontend to S3

