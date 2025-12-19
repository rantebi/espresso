#!/bin/bash

# Script to create DynamoDB table for local development
# Requires DynamoDB Local to be running and AWS CLI installed

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
TABLE_NAME="${DYNAMODB_TABLE:-issues}"

echo "Creating DynamoDB table: $TABLE_NAME"
echo "Endpoint: $ENDPOINT"
echo ""

aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "$ENDPOINT" \
  --region us-east-1 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Table created successfully!"
else
  # Check if table already exists
  aws dynamodb describe-table \
    --table-name "$TABLE_NAME" \
    --endpoint-url "$ENDPOINT" \
    --region us-east-1 > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✓ Table already exists!"
  else
    echo "Error: Failed to create table"
    echo "Make sure DynamoDB Local is running: ./scripts/start-dynamodb-local.sh"
    echo "Or use: npm run dynamodb:start"
    exit 1
  fi
fi

