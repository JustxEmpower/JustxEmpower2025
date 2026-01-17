/**
 * Create blockStore table in RDS database
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://admin:JustEmpower2025DB@justempower-db.c5eq6s8qimqv.us-east-1.rds.amazonaws.com:3306/justempower';

async function createTable() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Creating blockStore table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blockStore (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL DEFAULT 'custom',
        icon VARCHAR(50) DEFAULT 'box',
        blockType VARCHAR(100) NOT NULL,
        content LONGTEXT NOT NULL,
        thumbnail VARCHAR(1000),
        tags TEXT,
        isPublic INT NOT NULL DEFAULT 1,
        usageCount INT NOT NULL DEFAULT 0,
        createdBy VARCHAR(100),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ blockStore table created successfully!');
    
    // Verify table exists
    const [rows] = await connection.execute('DESCRIBE blockStore');
    console.log('Table columns:', rows.map(r => r.Field).join(', '));
    
  } catch (error) {
    console.error('Error creating table:', error.message);
  } finally {
    await connection.end();
  }
}

createTable();
