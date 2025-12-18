// Set test environment variables BEFORE any imports that might use them
// This is critical - the dynamodb config reads env vars at module load time
process.env.NODE_ENV = 'test';
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
process.env.DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'issues-test';

import { initializeDatabase, dynamoDBClient, TABLE_NAME } from '../src/config/dynamodb';
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const testEndpoint = process.env.DYNAMODB_ENDPOINT;
const testTableName = process.env.DYNAMODB_TABLE;

// Create a separate DynamoDB client for table operations (not document client)
const dynamoDBTableClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: testEndpoint,
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

// Initialize test database before all tests
beforeAll(async () => {
  // Initialize DynamoDB connection
  initializeDatabase();

  // Create table if it doesn't exist
  try {
    await dynamoDBTableClient.send(
      new DescribeTableCommand({
        TableName: testTableName,
      })
    );
    console.log(`Test table ${testTableName} already exists`);
  } catch (error: any) {
    // Table doesn't exist, create it
    if (error.name === 'ResourceNotFoundException') {
      try {
        await dynamoDBTableClient.send(
          new CreateTableCommand({
            TableName: testTableName,
            AttributeDefinitions: [
              {
                AttributeName: 'id',
                AttributeType: 'S',
              },
            ],
            KeySchema: [
              {
                AttributeName: 'id',
                KeyType: 'HASH',
              },
            ],
            BillingMode: 'PAY_PER_REQUEST',
          })
        );
        console.log(`Test table ${testTableName} created successfully`);
      } catch (createError: any) {
        console.error('Failed to create test table:', createError.message);
        throw createError;
      }
    } else {
      throw error;
    }
  }
});

// Clean database before each test (delete all items)
beforeEach(async () => {
  try {
    // Scan all items from the table
    const scanResult = await dynamoDBClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    // Delete all items in batches to avoid overwhelming DynamoDB Local
    if (scanResult.Items && scanResult.Items.length > 0) {
      const deletePromises = scanResult.Items.map((item: any) => {
        if (!item || !item.id) {
          return Promise.resolve();
        }
        return dynamoDBClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id: item.id },
          })
        ).catch((err) => {
          // Silently ignore individual delete errors
          return null;
        });
      });
      await Promise.all(deletePromises);
    }
  } catch (error: any) {
    // Silently ignore cleanup errors - table might not exist or be empty
    // This is expected in some test scenarios
  }
});

// Cleanup after all tests (optional - table can remain for next test run)
afterAll(async () => {
  // DynamoDB Local doesn't require explicit cleanup
  // The table can remain for faster subsequent test runs
  // If you want to delete the table, uncomment below:
  /*
  try {
    await dynamoDBClient.send(
      new DeleteTableCommand({
        TableName: TABLE_NAME,
      })
    );
    console.log(`Test table ${TABLE_NAME} deleted`);
  } catch (error: any) {
    // Ignore if table doesn't exist or can't be deleted
    console.log(`Could not delete test table: ${error.message}`);
  }
  */
});
