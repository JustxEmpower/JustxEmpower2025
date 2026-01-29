// Script to add missing media fields to hero sections
// Run with: npx tsx scripts/add-missing-media-fields.ts

import mysql from 'mysql2/promise';

const missingFields = [
  { page: 'founder', section: 'hero', contentKey: 'videoUrl', contentValue: '' },
  { page: 'founder', section: 'hero', contentKey: 'imageUrl', contentValue: '' },
  { page: 'about', section: 'hero', contentKey: 'videoUrl', contentValue: '' },
  { page: 'about', section: 'hero', contentKey: 'imageUrl', contentValue: '' },
  { page: 'events', section: 'hero', contentKey: 'videoUrl', contentValue: '' },
  { page: 'events', section: 'hero', contentKey: 'imageUrl', contentValue: '' },
  { page: 'blog', section: 'hero', contentKey: 'videoUrl', contentValue: '' },
  { page: 'blog', section: 'hero', contentKey: 'imageUrl', contentValue: '' },
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
    user: process.env.DATABASE_USER || 'justxempower',
    password: process.env.DATABASE_PASSWORD || 'SynergyEra2024$!',
    database: process.env.DATABASE_NAME || 'justxempower',
  });

  console.log('Adding missing media fields...');

  for (const field of missingFields) {
    try {
      // Check if field already exists
      const [existing] = await connection.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [field.page, field.section, field.contentKey]
      );

      if ((existing as any[]).length === 0) {
        await connection.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
          [field.page, field.section, field.contentKey, field.contentValue]
        );
        console.log(`✅ Added: ${field.page} -> ${field.section} -> ${field.contentKey}`);
      } else {
        console.log(`⏭️  Exists: ${field.page} -> ${field.section} -> ${field.contentKey}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${field.page}/${field.contentKey}:`, error);
    }
  }

  await connection.end();
  console.log('Done!');
}

main().catch(console.error);
