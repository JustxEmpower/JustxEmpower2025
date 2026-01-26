const mysql = require('mysql2/promise');
const https = require('https');

const TEST_MARKER = 'AUDIT_TEST_' + Date.now();

async function fetchAPI(page) {
  return new Promise((resolve, reject) => {
    const url = `https://justxempower.com/api/trpc/content.getByPage?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":{"page":page}}}))}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0]?.result?.data?.json || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const conn = await mysql.createConnection({
    host: 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'justxempower',
    password: 'JustEmpower2025Secure',
    database: 'justxempower'
  });

  console.log('=== FULL CONTENT EDITOR AUDIT ===');
  console.log('Test marker: ' + TEST_MARKER + '\n');

  // Get all unique page/section combinations (excluding test pages and legal)
  const [rows] = await conn.query(`
    SELECT DISTINCT page, section, id, contentKey, contentValue 
    FROM siteContent 
    WHERE page NOT LIKE '%test%' 
    AND page NOT LIKE '%Testing%'
    AND section != 'legalSections'
    AND contentKey = 'title'
    ORDER BY page, section
  `);

  console.log(`Testing ${rows.length} page/section combinations...\n`);

  const results = { pass: [], fail: [] };
  const backups = [];

  // Test each section
  for (const row of rows) {
    const { page, section, id, contentKey, contentValue } = row;
    const testValue = TEST_MARKER + '_' + page + '_' + section;
    
    // Backup original
    backups.push({ id, originalValue: contentValue });
    
    // Update with test marker
    await conn.query('UPDATE siteContent SET contentValue = ? WHERE id = ?', [testValue, id]);
    
    // Small delay to ensure DB commits
    await new Promise(r => setTimeout(r, 100));
    
    // Fetch from live API
    const apiData = await fetchAPI(page);
    const found = apiData.find(item => item.section === section && item.contentKey === contentKey);
    
    if (found && found.contentValue === testValue) {
      results.pass.push({ page, section, contentKey });
      process.stdout.write('✓');
    } else {
      results.fail.push({ 
        page, 
        section, 
        contentKey, 
        expected: testValue, 
        got: found?.contentValue || 'NOT FOUND' 
      });
      process.stdout.write('✗');
    }
  }

  console.log('\n\n=== RESTORING ORIGINAL VALUES ===');
  
  // Restore all backups
  for (const backup of backups) {
    await conn.query('UPDATE siteContent SET contentValue = ? WHERE id = ?', [backup.originalValue, backup.id]);
  }
  console.log(`Restored ${backups.length} values.\n`);

  // Print results
  console.log('=== RESULTS ===');
  console.log(`PASSED: ${results.pass.length}`);
  console.log(`FAILED: ${results.fail.length}\n`);

  if (results.fail.length > 0) {
    console.log('=== FAILED SECTIONS ===');
    results.fail.forEach(f => {
      console.log(`❌ ${f.page}.${f.section}.${f.contentKey}`);
      console.log(`   Expected: ${f.expected.substring(0, 50)}...`);
      console.log(`   Got: ${f.got.substring(0, 50)}...`);
    });
  }

  if (results.pass.length > 0) {
    console.log('\n=== PASSED SECTIONS ===');
    results.pass.forEach(p => console.log(`✓ ${p.page}.${p.section}.${p.contentKey}`));
  }

  await conn.end();
}

main().catch(console.error);
