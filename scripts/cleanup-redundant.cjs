require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanup() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== IDENTIFYING REDUNDANT CONTENT FIELDS ===\n');
  
  // Find fields still set to TEST (not restored = likely unused)
  const [testFields] = await conn.query(`
    SELECT id, page, section, contentKey 
    FROM siteContent 
    WHERE contentValue = 'TEST'
    ORDER BY page, section, contentKey
  `);
  
  console.log(`Found ${testFields.length} fields still set to TEST\n`);
  
  // Group by page
  const byPage = {};
  for (const f of testFields) {
    const key = f.page;
    if (!byPage[key]) byPage[key] = [];
    byPage[key].push(f);
  }
  
  // Show what would be removed
  for (const [page, fields] of Object.entries(byPage)) {
    console.log(`\n${page}:`);
    fields.forEach(f => console.log(`  - ${f.section}.${f.contentKey}`));
  }
  
  // Ask for confirmation before deleting
  console.log(`\n\nTotal redundant fields to remove: ${testFields.length}`);
  console.log('Removing redundant TEST fields...\n');
  
  // Delete redundant fields
  const [result] = await conn.query(`
    DELETE FROM siteContent 
    WHERE contentValue = 'TEST'
  `);
  
  console.log(`Deleted ${result.affectedRows} redundant fields`);
  
  // Show remaining count
  const [remaining] = await conn.query('SELECT COUNT(*) as cnt FROM siteContent');
  console.log(`\nRemaining content fields: ${remaining[0].cnt}`);
  
  // Show summary by page
  const [summary] = await conn.query(`
    SELECT page, COUNT(*) as cnt 
    FROM siteContent 
    GROUP BY page 
    ORDER BY page
  `);
  
  console.log('\nContent fields per page:');
  summary.forEach(s => console.log(`  ${s.page}: ${s.cnt} fields`));
  
  await conn.end();
}

cleanup().catch(console.error);
