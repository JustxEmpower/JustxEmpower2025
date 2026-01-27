require('dotenv').config();
const mysql = require('mysql2/promise');

async function restoreContent() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== CHECKING BACKUPS TABLE ===\n');
  
  // Check backups table structure
  const [columns] = await conn.query('DESCRIBE backups');
  console.log('Backups table columns:');
  columns.forEach(c => console.log(`  - ${c.Field}: ${c.Type}`));
  
  // Check what's in backups
  const [backups] = await conn.query('SELECT * FROM backups ORDER BY id DESC LIMIT 5');
  console.log('\nRecent backups:');
  backups.forEach(b => {
    console.log(`  ID: ${b.id}, Created: ${b.createdAt || b.created_at}`);
    if (b.data) {
      const preview = typeof b.data === 'string' ? b.data.substring(0, 200) : JSON.stringify(b.data).substring(0, 200);
      console.log(`  Data preview: ${preview}...`);
    }
  });
  
  // Also check pageSections table for any content
  console.log('\n=== CHECKING pageSections TABLE ===\n');
  const [pageSections] = await conn.query('SELECT id, pageId, sectionId, content FROM pageSections LIMIT 10');
  console.log(`Found ${pageSections.length} page sections`);
  pageSections.forEach(ps => {
    const content = ps.content ? (typeof ps.content === 'string' ? ps.content.substring(0, 100) : JSON.stringify(ps.content).substring(0, 100)) : 'null';
    console.log(`  Page ${ps.pageId}, Section: ${ps.sectionId}, Content: ${content}...`);
  });
  
  await conn.end();
}

restoreContent().catch(console.error);
