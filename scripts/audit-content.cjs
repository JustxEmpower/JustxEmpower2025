const mysql = require('mysql2/promise');

async function auditContent() {
  const connection = await mysql.createConnection({
    host: 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'justxempower',
    password: 'JustEmpower2025Secure',
    database: 'justxempower'
  });

  console.log('=== CONTENT EDITOR AUDIT ===\n');

  // 1. Check siteContent table structure
  console.log('--- siteContent Table Structure ---');
  const [columns] = await connection.query('DESCRIBE siteContent');
  columns.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));

  // 2. Get all unique pages in siteContent
  console.log('\n--- Pages in siteContent ---');
  const [pages] = await connection.query('SELECT DISTINCT page FROM siteContent ORDER BY page');
  pages.forEach(p => console.log(`  - ${p.page}`));

  // 3. Get sample content for each page
  console.log('\n--- Sample Content Per Page ---');
  for (const p of pages) {
    const [content] = await connection.query(
      'SELECT id, section, contentKey, LEFT(contentValue, 80) as preview FROM siteContent WHERE page = ? LIMIT 5',
      [p.page]
    );
    console.log(`\n[${p.page}]`);
    content.forEach(c => {
      console.log(`  ID:${c.id} | ${c.section}.${c.contentKey} = "${c.preview}..."`);
    });
  }

  // 4. Check pageSections table
  console.log('\n\n--- pageSections Table ---');
  const [psColumns] = await connection.query('DESCRIBE pageSections');
  psColumns.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));

  const [psSections] = await connection.query('SELECT id, pageId, sectionType, title FROM pageSections ORDER BY pageId, sectionOrder');
  console.log('\n--- All Page Sections ---');
  psSections.forEach(s => console.log(`  ID:${s.id} | PageID:${s.pageId} | ${s.sectionType} | ${s.title || '(no title)'}`));

  // 5. Check pages table
  console.log('\n\n--- pages Table ---');
  const [allPages] = await connection.query('SELECT id, slug, title, published FROM pages ORDER BY id');
  allPages.forEach(p => console.log(`  ID:${p.id} | ${p.slug} | ${p.title} | pub:${p.published}`));

  // 6. Count records
  console.log('\n\n--- Record Counts ---');
  const [[scCount]] = await connection.query('SELECT COUNT(*) as count FROM siteContent');
  const [[psCount]] = await connection.query('SELECT COUNT(*) as count FROM pageSections');
  const [[pagesCount]] = await connection.query('SELECT COUNT(*) as count FROM pages');
  console.log(`  siteContent: ${scCount.count} records`);
  console.log(`  pageSections: ${psCount.count} records`);
  console.log(`  pages: ${pagesCount.count} records`);

  await connection.end();
  console.log('\n=== AUDIT COMPLETE ===');
}

auditContent().catch(console.error);
