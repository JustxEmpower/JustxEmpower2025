import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get ALL pages from the pages table
  const [pages] = await conn.execute('SELECT id, slug, title FROM pages WHERE id > 0 ORDER BY id');
  console.log('Found', pages.length, 'pages');
  
  for (const page of pages) {
    // Check if sections exist for this page
    const [existing] = await conn.execute('SELECT COUNT(*) as count FROM pageSections WHERE pageId = ?', [page.id]);
    
    if (existing[0].count === 0) {
      console.log('Creating sections for:', page.title, '(id:', page.id, ', slug:', page.slug, ')');
      
      // Create hero section
      await conn.execute(`
        INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible)
        VALUES (?, 'hero', 0, 'Hero Section', ?, '["title","subtitle","description"]', 1)
      `, [page.id, JSON.stringify({ 
        title: page.title || 'Page Title', 
        subtitle: 'Subtitle', 
        description: 'Description for ' + (page.title || page.slug)
      })]);
      
      // Create content section
      await conn.execute(`
        INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible)
        VALUES (?, 'content', 1, 'Main Content', ?, '["title","description"]', 1)
      `, [page.id, JSON.stringify({ 
        title: 'Content', 
        description: 'Main content for ' + (page.title || page.slug)
      })]);
      
      // Create footer section  
      await conn.execute(`
        INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible)
        VALUES (?, 'footer', 2, 'Footer', '{}', '[]', 1)
      `, [page.id]);
      
      console.log('  ✓ Created 3 sections');
    } else {
      console.log('✓', page.title || page.slug, 'already has', existing[0].count, 'sections');
    }
  }
  
  // Summary
  const [summary] = await conn.execute(`
    SELECT p.id, p.slug, p.title, COUNT(ps.id) as sectionCount 
    FROM pages p 
    LEFT JOIN pageSections ps ON p.id = ps.pageId 
    GROUP BY p.id 
    ORDER BY p.id
  `);
  
  console.log('\n=== SUMMARY ===');
  summary.forEach(r => {
    console.log(`  ${r.id}: ${r.slug || 'NO SLUG'} (${r.title || 'NO TITLE'}) - ${r.sectionCount} sections`);
  });
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
