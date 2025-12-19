#!/bin/bash

# Script to start DynamoDB Local for local development

echo "Starting DynamoDB Local..."
echo "DynamoDB Local will be available at http://localhost:8000"
echo ""
echo "To use it, set the following environment variable:"
echo "export DYNAMODB_ENDPOINT=http://localhost:8000"
echo "export DYNAMODB_TABLE=issues"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if container is already running
if docker ps | grep -q dynamodb-local; then
  echo "DynamoDB Local is already running!"
  echo "To stop it, run: docker stop dynamodb-local"
  exit 0
fi

# Start DynamoDB Local container
docker run -d \
  --name dynamodb-local \
  -p 8000:8000 \
  amazon/dynamodb-local \
  -jar DynamoDBLocal.jar -sharedDb

if [ $? -eq 0 ]; then
  echo "✓ DynamoDB Local started successfully!"
  echo ""
  echo "To create the table, you can use the AWS CLI:"
  echo "aws dynamodb create-table \\"
  echo "  --table-name issues \\"
  echo "  --attribute-definitions AttributeName=id,AttributeType=S \\"
  echo "  --key-schema AttributeName=id,KeyType=HASH \\"
  echo "  --billing-mode PAY_PER_REQUEST \\"
  echo "  --endpoint-url http://localhost:8000"
else
  echo "Error: Failed to start DynamoDB Local"
  exit 1
fi

