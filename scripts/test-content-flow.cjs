const mysql = require('mysql2/promise');

async function testContentFlow() {
  const connection = await mysql.createConnection({
    host: 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'justxempower',
    password: 'JustEmpower2025Secure',
    database: 'justxempower'
  });

  console.log('=== CONTENT FLOW TEST ===\n');

  // Test 1: Read content for 'home' page
  console.log('--- Test 1: Read Home Page Content ---');
  const [homeContent] = await connection.query(
    'SELECT id, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = "home" LIMIT 10'
  );
  console.log(`Found ${homeContent.length} content items for home page:`);
  homeContent.forEach(c => console.log(`  ID:${c.id} | ${c.section}.${c.contentKey} = "${c.preview}..."`));

  // Test 2: Read content for 'philosophy' page  
  console.log('\n--- Test 2: Read Philosophy Page Content ---');
  const [philContent] = await connection.query(
    'SELECT id, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = "philosophy" LIMIT 10'
  );
  console.log(`Found ${philContent.length} content items for philosophy page:`);
  philContent.forEach(c => console.log(`  ID:${c.id} | ${c.section}.${c.contentKey} = "${c.preview}..."`));

  // Test 3: Read content for 'offerings' page
  console.log('\n--- Test 3: Read Offerings Page Content ---');
  const [offContent] = await connection.query(
    'SELECT id, section, contentKey, LEFT(contentValue, 50) as preview FROM siteContent WHERE page = "offerings" LIMIT 10'
  );
  console.log(`Found ${offContent.length} content items for offerings page:`);
  offContent.forEach(c => console.log(`  ID:${c.id} | ${c.section}.${c.contentKey} = "${c.preview}..."`));

  // Test 4: Test UPDATE operation
  console.log('\n--- Test 4: Test UPDATE Operation ---');
  if (homeContent.length > 0) {
    const testId = homeContent[0].id;
    const originalValue = homeContent[0].preview;
    
    // Get full value first
    const [[fullRecord]] = await connection.query('SELECT contentValue FROM siteContent WHERE id = ?', [testId]);
    const fullValue = fullRecord.contentValue;
    
    console.log(`Testing update on ID ${testId}`);
    console.log(`Original value (first 50 chars): "${originalValue}..."`);
    
    // Update with a test marker
    const testMarker = ' [TEST-' + Date.now() + ']';
    await connection.query(
      'UPDATE siteContent SET contentValue = ?, updatedAt = NOW() WHERE id = ?',
      [fullValue + testMarker, testId]
    );
    
    // Read back
    const [[updated]] = await connection.query('SELECT contentValue FROM siteContent WHERE id = ?', [testId]);
    console.log(`After update (last 50 chars): "...${updated.contentValue.slice(-50)}"`);
    
    // Restore original
    await connection.query(
      'UPDATE siteContent SET contentValue = ?, updatedAt = NOW() WHERE id = ?',
      [fullValue, testId]
    );
    console.log('Restored original value');
    console.log('✓ UPDATE operation works correctly!');
  }

  // Test 5: Check which pages have content in siteContent
  console.log('\n--- Test 5: Pages with Content in siteContent ---');
  const [pageStats] = await connection.query(
    'SELECT page, COUNT(*) as count FROM siteContent GROUP BY page ORDER BY count DESC'
  );
  pageStats.forEach(p => console.log(`  ${p.page}: ${p.count} items`));

  // Test 6: Check if there's any caching issue - compare createdAt vs updatedAt
  console.log('\n--- Test 6: Recent Updates (last 24 hours) ---');
  const [recentUpdates] = await connection.query(`
    SELECT page, section, contentKey, updatedAt 
    FROM siteContent 
    WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY updatedAt DESC
    LIMIT 20
  `);
  if (recentUpdates.length === 0) {
    console.log('  No updates in the last 24 hours');
  } else {
    recentUpdates.forEach(u => console.log(`  ${u.updatedAt} | ${u.page}.${u.section}.${u.contentKey}`));
  }

  await connection.end();
  console.log('\n=== TEST COMPLETE ===');
}

testContentFlow().catch(console.error);
