#!/bin/bash

# Deployment script for Serverless Framework
# Usage: ./scripts/deploy.sh [stage] [region]
# Note: This script should be run from the backend directory

set -e

STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Deploying to AWS..."
echo "Stage: $STAGE"
echo "Region: $REGION"
echo ""

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &>/dev/null; then
  echo "❌ Error: AWS credentials not configured"
  echo "Please run: aws configure"
  exit 1
fi

# Build and deploy
echo "📦 Building backend..."
npm run build

echo "☁️  Deploying to AWS Lambda..."
npx serverless deploy --stage "$STAGE" --region "$REGION"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "To get the API endpoint, run:"
echo "  npx serverless info --stage $STAGE --region $REGION"

