import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createPageZonesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  console.log('Connected to database...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS pageZones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pageSlug VARCHAR(100) NOT NULL,
      zoneName VARCHAR(100) NOT NULL,
      blocks LONGTEXT,
      isActive INT DEFAULT 1 NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      UNIQUE KEY unique_page_zone (pageSlug, zoneName)
    );
  `;

  try {
    await connection.execute(createTableSQL);
    console.log('pageZones table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await connection.end();
  }
}

createPageZonesTable();
