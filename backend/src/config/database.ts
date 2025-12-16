import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = process.env.DB_PATH || './db/issues.db';
const SCHEMA_PATH = join(__dirname, '../../db/schema.sql');

let db: Database.Database | null = null;
let currentDbPath: string | null = null;

export function initializeDatabase(databasePath?: string): Database.Database {
  const path = databasePath || DB_PATH;
  
  // If database is already initialized with the same path, return it
  if (db && currentDbPath === path) {
    return db;
  }
  
  // If database exists but path is different, close it first
  if (db && currentDbPath !== path) {
    db.close();
    db = null;
  }
  
  currentDbPath = path;
  
  try {
    // Ensure the directory exists
    const dbDir = dirname(path);
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
    
    // Open database with explicit read-write mode
    db = new Database(path, { verbose: undefined });
    
    // Read and execute schema
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    
    console.log(`Database initialized at ${path}`);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  const path = process.env.DB_PATH || DB_PATH;
  
  // If no database or path has changed, reinitialize
  if (!db || currentDbPath !== path) {
    db = initializeDatabase(path);
  }
  
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    currentDbPath = null;
    console.log('Database connection closed');
  }
}

