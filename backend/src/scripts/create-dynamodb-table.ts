import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
const tableName = process.env.DYNAMODB_TABLE || 'issues';
const region = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({
  region,
  endpoint,
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

async function createTable(): Promise<void> {
  try {
    console.log(`Creating DynamoDB table: ${tableName}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log('');

    // First, check if table already exists
    try {
      await client.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );
      console.log('✓ Table already exists!');
      return;
    } catch (error: any) {
      // Table doesn't exist, continue to create it
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create the table
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
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

    console.log('✓ Table created successfully!');
  } catch (error: any) {
    console.error('Error creating table:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createTable()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create table:', error);
      process.exit(1);
    });
}

export { createTable };

