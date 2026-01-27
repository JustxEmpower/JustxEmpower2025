require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkBackup() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== CHECKING FOR CONTENT BACKUPS ===\n');
  
  // Check for backup tables
  const [tables] = await conn.query('SHOW TABLES');
  console.log('All tables in database:');
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  
  // Check if there's a content version history
  const [versions] = await conn.query('SHOW TABLES LIKE "%version%"');
  console.log('\nVersion tables:', versions.length > 0 ? versions : 'None');
  
  // Check siteContent for any non-TEST values that might be preserved
  const [nonTest] = await conn.query(`
    SELECT page, section, contentKey, LEFT(contentValue, 100) as value 
    FROM siteContent 
    WHERE contentValue != 'TEST' 
    AND contentKey NOT LIKE '%Url%' 
    AND contentKey NOT LIKE '%image%'
    LIMIT 20
  `);
  
  console.log('\nNon-TEST content still in database:');
  if (nonTest.length > 0) {
    nonTest.forEach(r => console.log(`  ${r.page}.${r.section}.${r.contentKey} = "${r.value}"`));
  } else {
    console.log('  None found - all text content is TEST');
  }
  
  // Check updatedAt timestamps to see recent changes
  const [recent] = await conn.query(`
    SELECT page, section, contentKey, contentValue, updatedAt
    FROM siteContent 
    WHERE contentValue != 'TEST'
    ORDER BY updatedAt DESC
    LIMIT 10
  `);
  
  console.log('\nMost recent non-TEST updates:');
  recent.forEach(r => console.log(`  [${r.updatedAt}] ${r.page}.${r.section}.${r.contentKey}`));
  
  await conn.end();
}

checkBackup().catch(console.error);
