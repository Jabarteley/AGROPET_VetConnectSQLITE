import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Path for the SQLite database file
const DB_PATH = path.join(process.cwd(), 'db.sqlite');

// Initialize the database
let db: Database.Database;

function initializeDB(): Database.Database {
  // Check if database file exists, if not, create it
  const dbExists = fs.existsSync(DB_PATH);

  const database = new Database(DB_PATH, { timeout: 5000 });

  // Enable foreign key constraints
  database.exec('PRAGMA foreign_keys = ON;');

  if (!dbExists) {
    console.log('Creating new SQLite database...');

    // Read and execute the schema
    const schemaPath = path.join(process.cwd(), 'sqlite_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      database.exec(schema);
      console.log('Database schema applied.');
    } else {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
  } else {
    // If database exists, check if we need to update the schema
    // Check if password column exists in profiles table
    const columns = database.prepare("PRAGMA table_info(profiles)").all();
    const hasPasswordColumn = columns.some((col: any) => col.name === 'password');

    if (!hasPasswordColumn) {
      console.log('Adding password column to profiles table...');
      database.exec('ALTER TABLE profiles ADD COLUMN password TEXT;');
      console.log('Password column added successfully.');
    }
  }

  return database;
}

// Get database instance (singleton pattern)
export function getDB(): Database.Database {
  if (!db) {
    db = initializeDB();
  }
  return db;
}

// Helper function to convert SQLite row to object with proper types
export function normalizeRow(row: any): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    // Convert SQLite integer booleans back to JavaScript booleans
    if (key.includes('_read') || key === 'is_read') {
      normalized[key] = Boolean(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

// Export the database instance
export default getDB();