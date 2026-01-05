import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// All pages that should exist with their slugs
const REQUIRED_PAGES = [
  { slug: 'home', title: 'Home' },
  { slug: 'philosophy', title: 'Philosophy' },
  { slug: 'founder', title: 'Founder' },
  { slug: 'vision-ethos', title: 'Vision & Ethos' },
  { slug: 'offerings', title: 'Offerings' },
  { slug: 'workshops-programs', title: 'Workshops & Programs' },
  { slug: 'vi-x-journal-trilogy', title: 'VI • X Journal Trilogy' },
  { slug: 'blog', title: 'Blog (She Writes)' },
  { slug: 'shop', title: 'Shop' },
  { slug: 'community-events', title: 'Community Events' },
  { slug: 'resources', title: 'Resources' },
  { slug: 'walk-with-us', title: 'Walk With Us' },
  { slug: 'contact', title: 'Contact' },
  { slug: 'about', title: 'About' },
  { slug: 'about-justxempower', title: 'About JustxEmpower' },
  { slug: 'accessibility', title: 'Accessibility' },
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-of-service', title: 'Terms of Service' },
  { slug: 'cookie-policy', title: 'Cookie Policy' },
  { slug: 'rooted-unity', title: 'Rooted Unity' },
];

async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get existing pages
  const [existingPages] = await conn.execute('SELECT id, slug, title FROM pages');
  console.log(`Found ${existingPages.length} existing pages`);
  
  const existingSlugs = new Set(existingPages.map(p => p.slug));
  const slugToId = {};
  existingPages.forEach(p => { slugToId[p.slug] = p.id; });
  
  // Create missing pages
  for (const page of REQUIRED_PAGES) {
    if (!existingSlugs.has(page.slug)) {
      console.log(`Creating page: ${page.title} (${page.slug})`);
      const [result] = await conn.execute(
        'INSERT INTO pages (slug, title) VALUES (?, ?)',
        [page.slug, page.title]
      );
      slugToId[page.slug] = result.insertId;
      console.log(`  Created with id: ${result.insertId}`);
    } else {
      console.log(`Page exists: ${page.title} (id: ${slugToId[page.slug]})`);
    }
  }
  
  // Now create sections for ALL pages
  const [allPages] = await conn.execute('SELECT id, slug, title FROM pages');
  console.log(`\nCreating sections for ${allPages.length} pages...`);
  
  for (const page of allPages) {
    // Check if page has sections
    const [existing] = await conn.execute('SELECT COUNT(*) as cnt FROM pageSections WHERE pageId = ?', [page.id]);
    
    if (existing[0].cnt === 0) {
      console.log(`Creating sections for: ${page.title} (id: ${page.id})`);
      
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
  
  // Print final page ID mapping for frontend
  console.log('\n=== PAGE ID MAPPING FOR FRONTEND ===');
  const [finalPages] = await conn.execute('SELECT id, slug, title FROM pages ORDER BY slug');
  console.log('const PAGE_IDS: Record<string, number> = {');
  for (const p of finalPages) {
    console.log(`  '${p.slug}': ${p.id},`);
  }
  console.log('};');
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
