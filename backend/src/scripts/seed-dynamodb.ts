import { dynamoDBClient, TABLE_NAME, initializeDatabase } from '../config/dynamodb';
import { Issue } from '../types';
import { v4 as uuidv4 } from 'uuid';

const dummyIssues: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Missing consent form',
    description: 'Consent form not in file for patient 003',
    site: 'Site-101',
    severity: 'major',
    status: 'open',
  },
  {
    title: 'Temperature log incomplete',
    description: 'Temperature log missing entries for days 5-7',
    site: 'Site-102',
    severity: 'minor',
    status: 'in_progress',
  },
  {
    title: 'Protocol deviation',
    description: 'Patient 015 received incorrect dosage on visit 3',
    site: 'Site-101',
    severity: 'critical',
    status: 'open',
  },
  {
    title: 'Equipment calibration overdue',
    description: 'Centrifuge calibration certificate expired 2 weeks ago',
    site: 'Site-103',
    severity: 'major',
    status: 'resolved',
  },
  {
    title: 'Documentation error',
    description: 'Visit date incorrectly recorded in CRF',
    site: 'Site-102',
    severity: 'minor',
    status: 'open',
  },
  {
    title: 'Sample storage issue',
    description: 'Blood samples not stored at required temperature',
    site: 'Site-101',
    severity: 'critical',
    status: 'in_progress',
  },
  {
    title: 'Missing lab results',
    description: 'Lab results for patient 022 not received',
    site: 'Site-103',
    severity: 'major',
    status: 'open',
  },
  {
    title: 'IRB approval pending',
    description: 'Amendment approval still pending from IRB',
    site: 'Site-102',
    severity: 'major',
    status: 'in_progress',
  },
];

async function seedDatabase(): Promise<void> {
  try {
    initializeDatabase();
    console.log(`Seeding ${dummyIssues.length} issues into table: ${TABLE_NAME}`);

    const now = new Date().toISOString();

    for (const issue of dummyIssues) {
      const id = uuidv4();
      const fullIssue: Issue = {
        id,
        ...issue,
        createdAt: now,
        updatedAt: now,
      };

      await dynamoDBClient.put({
        TableName: TABLE_NAME,
        Item: fullIssue,
      });

      console.log(`✓ Created issue: ${fullIssue.title} (${id})`);
    }

    console.log(`\nSuccessfully seeded ${dummyIssues.length} issues!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };

