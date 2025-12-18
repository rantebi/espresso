import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Get DynamoDB endpoint from environment (for local development with DynamoDB Local)
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
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
export const dynamoDBClient = DynamoDBDocumentClient.from(client);

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

