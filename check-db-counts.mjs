import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  const tables = [
    'pages', 'articles', 'pageBlocks', 'media', 'products', 
    'users', 'formSubmissions', 'siteContent', 'themeSettings',
    'navigation', 'seoSettings', 'brandAssets', 'formFields',
    'redirects', 'siteSettings', 'blockTemplates', 'orders',
    'events', 'productCategories', 'aiSettings', 'aiChatConversations'
  ];
  
  console.log('Database Record Counts:');
  console.log('========================');
  
  for (const table of tables) {
    try {
      const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
      const count = result[0][0]?.count || 0;
      console.log(`${table}: ${count}`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message}`);
    }
  }
  
  await connection.end();
}

main().catch(console.error);
