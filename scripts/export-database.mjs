#!/usr/bin/env node
/**
 * Database Export Script for Just Empower
 * Exports all critical tables to JSON for backup
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function exportDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const exportDir = path.join(process.cwd(), 'database-backup');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const tables = [
    'pages',
    'siteContent',
    'articles',
    'media',
    'themeSettings',
    'brandAssets',
    'navigation',
    'seoSettings',
    'siteSettings',
    'products',
    'events',
    'categories',
    'pageBlocks',
    'aiChatConversations',
    'aiChatMessages',
    'adminUsers'
  ];

  console.log('Starting database export...\n');

  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT * FROM ${table}`);
      const filename = path.join(exportDir, `${table}.json`);
      fs.writeFileSync(filename, JSON.stringify(rows, null, 2));
      console.log(`✅ Exported ${table}: ${rows.length} rows`);
    } catch (error) {
      console.log(`⚠️  Skipped ${table}: ${error.message}`);
    }
  }

  // Export schema info
  const [schemaInfo] = await connection.execute(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  fs.writeFileSync(
    path.join(exportDir, '_schema_info.json'),
    JSON.stringify(schemaInfo, null, 2)
  );
  console.log(`\n✅ Exported schema info`);

  await connection.end();
  console.log(`\n📦 Database export complete! Files saved to: ${exportDir}`);
}

exportDatabase().catch(console.error);
