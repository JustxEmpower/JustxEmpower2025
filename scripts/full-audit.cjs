require('dotenv').config();
const mysql = require('mysql2/promise');

async function fullAudit() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected!\n');
  
  console.log('=== FULL CONTENT EDITOR AUDIT ===\n');
  
  // Step 1: Get all content from siteContent table
  console.log('STEP 1: Getting all content from siteContent table...\n');
  const [allContent] = await conn.query('SELECT id, page, section, contentKey, contentValue FROM siteContent ORDER BY page, section, contentKey');
  
  // Group by page
  const pages = {};
  for (const row of allContent) {
    if (!pages[row.page]) pages[row.page] = [];
    pages[row.page].push(row);
  }
  
  console.log(`Found ${allContent.length} content items across ${Object.keys(pages).length} pages:\n`);
  for (const page of Object.keys(pages).sort()) {
    console.log(`  ${page}: ${pages[page].length} fields`);
  }
  
  // Step 2: Update ALL text content fields to "TEST" (skip URLs)
  console.log('\n\nSTEP 2: Updating ALL text fields to "TEST"...\n');
  
  let updateCount = 0;
  let skipCount = 0;
  const updates = [];
  
  for (const row of allContent) {
    // Skip ONLY actual media URL fields (imageUrl, videoUrl)
    const key = row.contentKey.toLowerCase();
    if (key.includes('imageurl') || key.includes('videourl') || key === 'image' || key === 'video') {
      skipCount++;
      continue;
    }
    
    // Update ALL other fields to TEST (including buttonText, buttonLink, placeholder, ctaText, ctaLink)
    await conn.query('UPDATE siteContent SET contentValue = ? WHERE id = ?', ['TEST', row.id]);
    updates.push({ id: row.id, page: row.page, section: row.section, key: row.contentKey });
    updateCount++;
  }
  
  console.log(`Updated ${updateCount} text fields to "TEST"`);
  console.log(`Skipped ${skipCount} URL/media fields\n`);
  
  // Step 3: Verify updates in database
  console.log('\nSTEP 3: Verifying updates in database...\n');
  
  const [verified] = await conn.query('SELECT id, page, section, contentKey, contentValue FROM siteContent WHERE contentValue = ? ORDER BY page, section', ['TEST']);
  
  console.log(`Verified ${verified.length} fields now contain "TEST"\n`);
  
  // Group verified by page for summary
  const verifiedPages = {};
  for (const row of verified) {
    if (!verifiedPages[row.page]) verifiedPages[row.page] = [];
    verifiedPages[row.page].push(row);
  }
  
  console.log('Fields updated per page:');
  for (const page of Object.keys(verifiedPages).sort()) {
    console.log(`  ${page}: ${verifiedPages[page].length} fields`);
    for (const field of verifiedPages[page]) {
      console.log(`    - ${field.section}.${field.contentKey} = "${field.contentValue}"`);
    }
  }
  
  // Step 4: Output summary for live site verification
  console.log('\n\n=== SUMMARY FOR LIVE SITE VERIFICATION ===\n');
  console.log('The following pages/sections should now show "TEST" on the live site:\n');
  
  for (const page of Object.keys(verifiedPages).sort()) {
    console.log(`\nPage: ${page} (https://justxempower.com/${page === 'home' ? '' : page})`);
    const sections = {};
    for (const field of verifiedPages[page]) {
      if (!sections[field.section]) sections[field.section] = [];
      sections[field.section].push(field.contentKey);
    }
    for (const section of Object.keys(sections).sort()) {
      console.log(`  Section: ${section}`);
      for (const key of sections[section]) {
        console.log(`    - ${key}`);
      }
    }
  }
  
  await conn.end();
  
  console.log('\n\n=== AUDIT COMPLETE ===');
  console.log('Database has been updated. Check live site to verify all "TEST" values appear.');
}

fullAudit().catch(console.error);
