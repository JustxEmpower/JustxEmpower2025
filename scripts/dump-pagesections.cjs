require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function dump() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [sections] = await conn.query(`
    SELECT ps.pageId, p.slug as pageSlug, ps.sectionId, ps.content 
    FROM pageSections ps 
    LEFT JOIN pages p ON ps.pageId = p.id
    ORDER BY ps.pageId, ps.sectionOrder
  `);
  
  console.log(`Found ${sections.length} pageSections\n`);
  
  const output = [];
  for (const s of sections) {
    try {
      const content = JSON.parse(s.content);
      output.push({
        page: s.pageSlug || `page_${s.pageId}`,
        section: s.sectionId,
        content: content
      });
      console.log(`${s.pageSlug}.${s.sectionId}: ${Object.keys(content).length} fields`);
    } catch (e) {
      console.log(`ERROR: ${s.pageSlug}.${s.sectionId}`);
    }
  }
  
  fs.writeFileSync('/tmp/pagesections-dump.json', JSON.stringify(output, null, 2));
  console.log('\nDumped to /tmp/pagesections-dump.json');
  
  await conn.end();
}

dump().catch(console.error);
