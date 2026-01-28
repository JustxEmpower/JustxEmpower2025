const mysql = require('mysql2/promise');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection(dbUrl);

  // Pages to exclude from cleanup
  const excludedPages = ['founder', 'privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'];
  
  // First, show what will be deleted
  const [beforeRows] = await conn.execute(
    `SELECT page, section, contentKey, LEFT(contentValue, 40) as preview 
     FROM siteContent 
     WHERE page NOT IN (?, ?, ?, ?, ?) 
     AND contentValue NOT LIKE '%123%'
     ORDER BY page, section`,
    excludedPages
  );
  
  console.log(`Found ${beforeRows.length} entries WITHOUT '123' to delete:\n`);
  
  // Group by page for cleaner output
  const byPage = {};
  for (const row of beforeRows) {
    if (!byPage[row.page]) byPage[row.page] = [];
    byPage[row.page].push(row);
  }
  
  for (const [page, rows] of Object.entries(byPage)) {
    console.log(`\n${page} (${rows.length} entries):`);
    for (const row of rows) {
      console.log(`  - ${row.section}.${row.contentKey}: "${row.preview}..."`);
    }
  }
  
  // Delete entries without '123'
  const [result] = await conn.execute(
    `DELETE FROM siteContent 
     WHERE page NOT IN (?, ?, ?, ?, ?) 
     AND contentValue NOT LIKE '%123%'`,
    excludedPages
  );
  
  console.log(`\n\nDeleted ${result.affectedRows} entries.`);
  
  // Show remaining counts
  const [afterRows] = await conn.execute(
    `SELECT page, COUNT(*) as remaining 
     FROM siteContent 
     WHERE page NOT IN (?, ?, ?, ?, ?)
     GROUP BY page 
     ORDER BY page`,
    excludedPages
  );
  
  console.log('\nRemaining entries per page:');
  for (const row of afterRows) {
    console.log(`  ${row.page}: ${row.remaining}`);
  }

  await conn.end();
  console.log('\nDone!');
}

run().catch(console.error);
