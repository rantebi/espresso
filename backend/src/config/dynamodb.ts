import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Get DynamoDB endpoint from environment (for local development with DynamoDB Local)
// Default to DynamoDB Local if NODE_ENV is development or test and endpoint is not set
const endpoint = process.env.DYNAMODB_ENDPOINT || 
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' 
    ? 'http://localhost:8000' 
    : undefined);
const region = process.env.AWS_REGION || 'us-east-1';

// Create DynamoDB client
const client = new DynamoDBClient({
  region,
  endpoint, // If set, will use DynamoDB Local
  credentials: endpoint
    ? {
        // Dummy credentials for DynamoDB Local
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      }
    : undefined,
});

// Create DynamoDB Document Client (simplified API)
// Using from() with explicit configuration to ensure proper typing
export const dynamoDBClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name from environment or default
export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'issues';

export function initializeDatabase(): void {
  console.log(
    endpoint
      ? `DynamoDB initialized (Local) at ${endpoint}`
      : `DynamoDB initialized (AWS) in region ${region}`
  );
  console.log(`Using table: ${TABLE_NAME}`);
}

