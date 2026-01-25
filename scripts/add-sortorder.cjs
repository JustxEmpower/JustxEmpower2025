require('dotenv').config();
const mysql = require('mysql2/promise');

async function addSortOrder() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check if column exists
  const [columns] = await conn.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'sortOrder'
  `);
  
  if (columns.length === 0) {
    console.log('Adding sortOrder column...');
    await conn.execute(`ALTER TABLE products ADD COLUMN sortOrder INT DEFAULT 0 NOT NULL`);
    console.log('Column added successfully!');
  } else {
    console.log('sortOrder column already exists');
  }
  
  await conn.end();
}

addSortOrder().catch(console.error);
