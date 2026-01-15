import 'dotenv/config';
import mysql from 'mysql2/promise';

async function fixSchema() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    await conn.execute('ALTER TABLE products ADD COLUMN deletedAt timestamp NULL');
    console.log('Added deletedAt column');
  } catch(e) {
    console.log('deletedAt column already exists or error:', e.message);
  }
  
  try {
    await conn.execute('ALTER TABLE products ADD COLUMN archivedReason text NULL');
    console.log('Added archivedReason column');
  } catch(e) {
    console.log('archivedReason column already exists or error:', e.message);
  }
  
  await conn.end();
  console.log('Schema fix complete');
  process.exit(0);
}

fixSchema();
