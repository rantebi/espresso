#!/bin/bash

# Frontend deployment script to S3
# Usage: ./scripts/deploy.sh [bucket-name] [stage] [region]
# Example: ./scripts/deploy.sh my-frontend-bucket dev us-east-1

set -e

BUCKET_NAME=${1:-espresso-frontend-${USER}-$(date +%s)}
STAGE=${2:-dev}
REGION=${3:-us-east-1}

echo "🚀 Deploying frontend to S3..."
echo "Bucket: $BUCKET_NAME"
echo "Stage: $STAGE"
echo "Region: $REGION"
echo ""

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &>/dev/null; then
  echo "❌ Error: AWS credentials not configured"
  echo "Please run: aws configure"
  exit 1
fi

# Get API Gateway endpoint from backend deployment
echo "📡 Getting API Gateway endpoint..."
cd ../backend
API_ENDPOINT=""

# Try to get endpoint from serverless info
if command -v npx &> /dev/null; then
  SERVERLESS_INFO=$(npx serverless info --stage "$STAGE" --region "$REGION" 2>/dev/null || echo "")
  if [ -n "$SERVERLESS_INFO" ]; then
    # Try to extract endpoint from the output
    # Format: "ANY - https://abc123.execute-api.us-east-1.amazonaws.com/dev/{proxy+}"
    RAW_ENDPOINT=$(echo "$SERVERLESS_INFO" | grep -i "endpoints:" -A 5 | grep -oE 'https://[a-z0-9]+\.execute-api\.[^[:space:]]+' | head -1)
    
    # If found, clean it up (remove path and stage suffix if duplicated)
    if [ -n "$RAW_ENDPOINT" ]; then
      # Extract base URL (everything up to .amazonaws.com)
      BASE_URL=$(echo "$RAW_ENDPOINT" | sed 's|\(https://[^/]*\.amazonaws\.com\).*|\1|')
      # Rebuild with just the stage (no duplication)
      API_ENDPOINT="${BASE_URL}/${STAGE}"
    fi
    
    # Fallback: try ServiceEndpoint pattern (from CloudFormation outputs)
    if [ -z "$API_ENDPOINT" ]; then
      API_ENDPOINT=$(echo "$SERVERLESS_INFO" | grep -i "ServiceEndpoint" | grep -oE 'https://[^[:space:]]+' | head -1)
    fi
  fi
fi

if [ -z "$API_ENDPOINT" ]; then
  echo "⚠️  Warning: Could not get API Gateway endpoint automatically"
  echo ""
  echo "You can:"
  echo "  1. Set VITE_API_URL environment variable before running this script"
  echo "  2. Enter the API Gateway URL now (base URL, e.g., https://abc123.execute-api.us-east-1.amazonaws.com/dev)"
  echo ""
  read -p "Enter API Gateway URL (or press Enter to use default/localhost): " API_ENDPOINT
else
  echo "✓ Found API endpoint: $API_ENDPOINT"
fi

cd ../frontend

# Build with API URL
echo "📦 Building frontend..."
if [ -n "$API_ENDPOINT" ]; then
  echo "Using API endpoint: $API_ENDPOINT/api"
  export VITE_API_URL="${API_ENDPOINT}/api"
  npm run build
else
  echo "⚠️  Building without API URL (will use default: http://localhost:3000/api)"
  echo "   Set VITE_API_URL environment variable to override"
  npm run build
fi

# Check if bucket exists, create if it doesn't
if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
  echo "📦 Creating S3 bucket: $BUCKET_NAME"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
  else
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
  fi
  
  # Enable static website hosting
  echo "🌐 Enabling static website hosting..."
  aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html
fi

# Upload files
echo "☁️  Uploading files to S3..."
SYNC_OUTPUT=$(aws s3 sync dist/ "s3://$BUCKET_NAME" \
  --delete \
  --region "$REGION" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json" 2>&1)

# Upload HTML files with no cache
HTML_SYNC_OUTPUT=$(aws s3 sync dist/ "s3://$BUCKET_NAME" \
  --delete \
  --region "$REGION" \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html" \
  --include "*.json" 2>&1)

# Check if there were any changes
if echo "$SYNC_OUTPUT" "$HTML_SYNC_OUTPUT" | grep -q "upload\|delete\|copy"; then
  echo "✓ Files uploaded successfully"
else
  echo "ℹ️  No changes to deploy (files are up to date)"
fi

# Set bucket policy for public read access
echo "🔓 Setting bucket policy for public access..."

# First, check and disable Block Public Access if needed
echo "   Checking Block Public Access settings..."
BLOCK_PUBLIC_ACCESS=$(aws s3api get-public-access-block --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "")

if [ -n "$BLOCK_PUBLIC_ACCESS" ]; then
  echo "   ⚠️  Block Public Access is enabled. Attempting to disable it..."
  aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
    --region "$REGION" 2>/dev/null || {
    echo "   ❌ Could not disable Block Public Access automatically"
    echo "   Please disable it manually in AWS Console or run:"
    echo "   aws s3api put-public-access-block --bucket $BUCKET_NAME \\"
    echo "     --public-access-block-configuration \\"
    echo "     'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false' \\"
    echo "     --region $REGION"
  }
fi

# Set bucket policy
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

POLICY_SET=false
if aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy file:///tmp/bucket-policy.json \
  --region "$REGION" 2>/dev/null; then
  echo "   ✓ Bucket policy set successfully"
  POLICY_SET=true
else
  echo "   ⚠️  Could not set bucket policy automatically"
  echo "   This might be due to Block Public Access settings."
  echo "   Please set the policy manually in AWS Console or disable Block Public Access first."
fi

rm /tmp/bucket-policy.json

# Try to get the actual website endpoint from AWS (more reliable)
ACTUAL_ENDPOINT=$(aws s3api get-bucket-website --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null | grep -oE 'http://[^"]+' | head -1 || echo "")

if [ -n "$ACTUAL_ENDPOINT" ]; then
  WEBSITE_URL="$ACTUAL_ENDPOINT"
else
  # Fallback to constructed URL
  if [ "$REGION" = "us-east-1" ]; then
    WEBSITE_URL="http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
  else
    WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
  fi
fi

echo ""
if echo "$SYNC_OUTPUT" "$HTML_SYNC_OUTPUT" | grep -q "upload\|delete\|copy"; then
  echo "✅ Files uploaded successfully!"
else
  echo "ℹ️  No changes to deploy (files are up to date)"
fi

# Show status about public access
echo ""
if [ "$POLICY_SET" = true ]; then
  echo "✅ Bucket is configured for public access"
else
  echo "⚠️  Bucket policy not set - website may not be publicly accessible"
  echo ""
  echo "To enable public access:"
  echo "1. Go to AWS Console → S3 → $BUCKET_NAME → Permissions"
  echo "2. Edit 'Block Public Access' settings"
  echo "3. Uncheck all 4 options and save"
  echo "4. Then set the bucket policy (or run this script again)"
fi

echo ""
echo "🌐 Website URL: $WEBSITE_URL"
echo ""
echo "📋 Additional info:"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  Stage: $STAGE"
echo ""
if [ "$POLICY_SET" != true ]; then
  echo "💡 Note: The website URL may not work until Block Public Access is disabled"
  echo "   and the bucket policy is set."
fi

