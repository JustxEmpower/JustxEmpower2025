require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixMissing() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Adding missing imageUrl fields...\n');
  
  const missing = [
    ['about', 'opening', 'imageUrl', ''],
    ['about', 'truth', 'imageUrl', ''],
    ['about', 'depth', 'imageUrl', ''],
    ['about', 'remembrance', 'imageUrl', ''],
    ['about', 'renewal', 'imageUrl', ''],
    ['about', 'future', 'imageUrl', ''],
    ['shop', 'overview', 'imageUrl', '']
  ];
  
  for (const [page, section, key, val] of missing) {
    try {
      await conn.query(
        'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE contentValue = contentValue',
        [page, section, key, val]
      );
      console.log(`Added: ${page}.${section}.${key}`);
    } catch (err) {
      console.log(`Error adding ${page}.${section}.${key}: ${err.message}`);
    }
  }
  
  await conn.end();
  console.log('\nDone!');
}

fixMissing().catch(console.error);
