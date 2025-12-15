import { initializeDatabase, getDatabase, closeDatabase } from '../src/config/database';
import { join } from 'path';
import { unlinkSync, existsSync, chmodSync } from 'fs';

const TEST_DB_PATH = join(__dirname, 'test.db');

// Set test database path before any imports that might use it
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database before all tests
beforeAll(() => {
  // Force close any existing database connection (from server import or previous tests)
  try {
    closeDatabase();
  } catch (error) {
    // Ignore
  }
  
  // Remove test database if it exists
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore if can't delete (might be in use)
    }
  }
  
  // Initialize with test database path
  const db = initializeDatabase(TEST_DB_PATH);
  
  // Ensure database file has write permissions
  try {
    if (existsSync(TEST_DB_PATH)) {
      chmodSync(TEST_DB_PATH, 0o666);
    }
  } catch (error) {
    // Ignore permission errors
  }
  
  // Verify database is open and working (test write)
  try {
    const testStmt = db.prepare('CREATE TABLE IF NOT EXISTS test_write (id INTEGER)');
    testStmt.run();
    db.prepare('DROP TABLE IF EXISTS test_write').run();
  } catch (error) {
    console.error('Database write verification failed:', error);
    throw error;
  }
});

// Clean database before each test
beforeEach(() => {
  let db = getDatabase();
  
  // Clean the table, retry if we get a readonly error
  try {
    db.prepare('DELETE FROM issues').run();
  } catch (error: any) {
    // If we get a readonly error, close and reinitialize
    if (error?.code === 'SQLITE_READONLY' || error?.message?.includes('readonly') || error?.message?.includes('read-only')) {
      try {
        closeDatabase();
      } catch (closeError) {
        // Ignore close errors
      }
      
      // Remove and recreate the database file
      if (existsSync(TEST_DB_PATH)) {
        try {
          unlinkSync(TEST_DB_PATH);
        } catch (unlinkError) {
          // Ignore
        }
      }
      
      // Reinitialize
      db = initializeDatabase(TEST_DB_PATH);
      
      // Try again
      db.prepare('DELETE FROM issues').run();
    } else {
      throw error;
    }
  }
});

// Close database after all tests
afterAll(() => {
  try {
    closeDatabase();
  } catch (error) {
    // Ignore close errors
  }
  
  // Clean up test database file
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore if can't delete
    }
  }
});

