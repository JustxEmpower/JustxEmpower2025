/**
 * Script to check what content exists in the database
 */

import mysql from 'mysql2/promise';

// DATABASE_URL must be set via environment variable - no hardcoded URLs
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
};

async function checkContent() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(config);
  
  try {
    // Get all unique pages
    const [pages] = await connection.execute(
      'SELECT DISTINCT page FROM siteContent ORDER BY page'
    );
    console.log('\n=== PAGES IN DATABASE ===');
    pages.forEach(p => console.log(`  - ${p.page}`));

    // Get all content for blog page
    console.log('\n=== BLOG PAGE CONTENT ===');
    const [blogContent] = await connection.execute(
      "SELECT page, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = 'blog' ORDER BY section, contentKey"
    );
    blogContent.forEach(c => console.log(`  ${c.section}.${c.contentKey}: ${c.preview}...`));

    // Get all content for blog-she-writes page (in case it's different)
    console.log('\n=== BLOG-SHE-WRITES PAGE CONTENT ===');
    const [blogSheWritesContent] = await connection.execute(
      "SELECT page, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = 'blog-she-writes' ORDER BY section, contentKey"
    );
    if (blogSheWritesContent.length === 0) {
      console.log('  (No content found)');
    } else {
      blogSheWritesContent.forEach(c => console.log(`  ${c.section}.${c.contentKey}: ${c.preview}...`));
    }

    // Get all content for offerings page
    console.log('\n=== OFFERINGS PAGE CONTENT ===');
    const [offeringsContent] = await connection.execute(
      "SELECT page, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = 'offerings' ORDER BY section, contentKey"
    );
    offeringsContent.forEach(c => console.log(`  ${c.section}.${c.contentKey}: ${c.preview}...`));

    // Get all content for philosophy page
    console.log('\n=== PHILOSOPHY PAGE CONTENT ===');
    const [philosophyContent] = await connection.execute(
      "SELECT page, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = 'philosophy' ORDER BY section, contentKey"
    );
    philosophyContent.forEach(c => console.log(`  ${c.section}.${c.contentKey}: ${c.preview}...`));

    // Get all content for home page
    console.log('\n=== HOME PAGE CONTENT ===');
    const [homeContent] = await connection.execute(
      "SELECT page, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = 'home' ORDER BY section, contentKey"
    );
    homeContent.forEach(c => console.log(`  ${c.section}.${c.contentKey}: ${c.preview}...`));

  } finally {
    await connection.end();
  }
}

checkContent().catch(console.error);
