# Stage 3: Frontend S3 Deployment Guide

This guide explains how to deploy the frontend React application to AWS S3 for static website hosting.

## Prerequisites

1. **Backend deployed** (Stage 2 completed)
2. **AWS Account** with appropriate permissions
3. **AWS CLI** installed and configured
4. **Node.js** installed

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Get API Gateway Endpoint

Before deploying, you need the API Gateway endpoint from your backend deployment:

```bash
cd ../backend
npx serverless info --stage dev
```

Look for the `ServiceEndpoint` output. It will look like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

## Deployment

### Option 1: Using npm Scripts (Recommended)

```bash
cd frontend

# Deploy to dev (will auto-detect API endpoint)
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Deploy with custom bucket name
npm run deploy
```

### Option 2: Using the Deployment Script

```bash
cd frontend

# Deploy with auto-generated bucket name
./scripts/deploy.sh

# Deploy with specific bucket name and stage
./scripts/deploy.sh my-frontend-bucket dev us-east-1

# Deploy to production
./scripts/deploy.sh espresso-frontend-prod production us-east-1
```

### Option 3: Manual Deployment

```bash
cd frontend

# Set API Gateway URL
export VITE_API_URL=https://your-api.execute-api.us-east-1.amazonaws.com/dev

# Build
npm run build

# Create S3 bucket (if it doesn't exist)
aws s3 mb s3://your-bucket-name --region us-east-1

# Enable static website hosting
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync dist/ s3://your-bucket-name \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

# Upload HTML files with no cache
aws s3 sync dist/ s3://your-bucket-name \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

# Set public read access
aws s3api put-bucket-policy --bucket your-bucket-name \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }]
  }'
```

## Configuration

### Environment Variables

The frontend uses `VITE_API_URL` to connect to the backend API:

- **Development**: `http://localhost:3000/api` (default)
- **Production**: Set to your API Gateway endpoint (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/dev/api`)

### Build Configuration

The `vite.config.ts` file is configured to:
- Build to `dist/` directory
- Inject `VITE_API_URL` at build time
- Optimize for production

## After Deployment

### Get Website URL

After deployment, the script will output the website URL. You can also get it manually:

```bash
# Get bucket website endpoint
aws s3api get-bucket-website --bucket your-bucket-name

# Or construct it manually:
# http://your-bucket-name.s3-website-region.amazonaws.com
# For us-east-1: http://your-bucket-name.s3-website-us-east-1.amazonaws.com
```

### Test the Deployment

1. Open the website URL in your browser
2. Verify the frontend loads correctly
3. Test API calls to ensure they connect to the backend

## Updating the Deployment

To update the frontend after making changes:

```bash
cd frontend
npm run build
npm run deploy:dev  # or your stage
```

The deployment script uses `--delete` flag, so it will remove old files and upload new ones.

## Custom Domain (Optional)

To use a custom domain:

1. **Get a domain** (Route 53, or external registrar)
2. **Create CloudFront distribution** (recommended for better performance)
3. **Configure DNS** to point to CloudFront or S3 bucket
4. **Set up SSL certificate** via AWS Certificate Manager

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:
1. Backend API Gateway has CORS configured (already done in `serverless.yml`)
2. API Gateway URL is correct in `VITE_API_URL`

### 404 Errors on Routes

S3 static hosting doesn't support client-side routing by default. For React Router to work:
- Use CloudFront with error page redirects, OR
- Configure S3 to redirect all 404s to `index.html`

### API Connection Issues

1. Verify `VITE_API_URL` is set correctly during build
2. Check API Gateway endpoint is accessible
3. Verify CORS is configured on the backend

### Bucket Already Exists

If the bucket name already exists:
- Use a different bucket name
- Or delete the existing bucket (careful - this deletes all files!)

## Cost Estimation

For low traffic:
- **S3 Storage**: ~$0.023/GB/month (minimal for static sites)
- **S3 Requests**: ~$0.0004 per 1,000 GET requests
- **Data Transfer**: First 1GB free, then ~$0.09/GB
- **Total**: ~$0-1/month for low traffic

## Next Steps

After successful deployment:
1. Test all functionality
2. Set up CloudFront for better performance (optional)
3. Configure custom domain (optional)
4. Set up monitoring and analytics
5. Configure CI/CD for automated deployments

