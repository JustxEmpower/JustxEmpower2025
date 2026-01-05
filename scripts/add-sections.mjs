import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get pages that need sections
  const [pages] = await conn.execute('SELECT id, slug, title FROM pages WHERE id >= 60013 ORDER BY id');
  console.log('Pages found:', pages.length);
  
  for (const page of pages) {
    // Check if page has sections
    const [existing] = await conn.execute('SELECT COUNT(*) as cnt FROM pageSections WHERE pageId = ?', [page.id]);
    
    if (existing[0].cnt === 0) {
      console.log(`Creating sections for: ${page.title} (${page.id})`);
      
      await conn.execute(
        'INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [page.id, 'hero', 0, 'Hero Section', JSON.stringify({title: page.title, subtitle: 'Subtitle', description: 'Description for ' + page.title}), '["title","subtitle","description"]', 1]
      );
      await conn.execute(
        'INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [page.id, 'content', 1, 'Main Content', JSON.stringify({title: 'Content', description: 'Main content for ' + page.title}), '["title","description"]', 1]
      );
      await conn.execute(
        'INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [page.id, 'footer', 2, 'Footer', '{}', '[]', 1]
      );
      
      console.log(`  Created 3 sections`);
    } else {
      console.log(`${page.title} already has ${existing[0].cnt} sections`);
    }
  }
  
  await conn.end();
  console.log('Done!');
}

main().catch(console.error);
