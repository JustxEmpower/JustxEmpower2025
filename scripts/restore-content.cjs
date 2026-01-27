require('dotenv').config();
const mysql = require('mysql2/promise');

async function restoreContent() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check pageSections table - this has the original structured content
  console.log('=== pageSections TABLE (ORIGINAL CONTENT SOURCE) ===\n');
  
  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM pageSections');
  console.log(`Total page sections: ${count[0].cnt}\n`);
  
  const [sections] = await conn.query(`
    SELECT ps.id, ps.pageId, p.slug as pageSlug, ps.sectionId, ps.content 
    FROM pageSections ps 
    LEFT JOIN pages p ON ps.pageId = p.id
    ORDER BY ps.pageId, ps.sectionId
  `);
  
  // Group by page
  const byPage = {};
  for (const s of sections) {
    const page = s.pageSlug || `page_${s.pageId}`;
    if (!byPage[page]) byPage[page] = [];
    byPage[page].push(s);
  }
  
  console.log('Content found per page:');
  for (const [page, sects] of Object.entries(byPage)) {
    console.log(`\n${page}:`);
    for (const s of sects) {
      try {
        const content = JSON.parse(s.content);
        const keys = Object.keys(content).filter(k => k !== 'sectionId');
        console.log(`  ${s.sectionId}: ${keys.join(', ')}`);
      } catch (e) {
        console.log(`  ${s.sectionId}: [parse error]`);
      }
    }
  }
  
  await conn.end();
}

restoreContent().catch(console.error);
