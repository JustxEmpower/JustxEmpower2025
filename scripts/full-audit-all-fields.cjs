const mysql = require('mysql2/promise');
const https = require('https');

const TEST_MARKER = 'TEST_' + Date.now();

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

  console.log('=== COMPREHENSIVE FIELD AUDIT ===');
  console.log('Test marker: ' + TEST_MARKER + '\n');

  // Get ALL content fields for main pages only
  const mainPages = ['home', 'founder', 'philosophy', 'offerings', 'about', 'contact', 'walk-with-us', 'blog', 'shop', 'resources', 'community-events'];
  
  const [rows] = await conn.query(`
    SELECT id, page, section, contentKey, contentValue 
    FROM siteContent 
    WHERE page IN (?)
    AND section != 'legalSections'
    AND contentKey NOT LIKE '%Url%'
    AND contentKey NOT LIKE '%Link%'
    AND contentKey NOT LIKE '%Image%'
    ORDER BY page, section, contentKey
  `, [mainPages]);

  console.log(`Testing ${rows.length} content fields across ${mainPages.length} main pages...\n`);

  const results = { pass: [], fail: [] };
  const backups = [];

  let tested = 0;
  for (const row of rows) {
    const { page, section, id, contentKey, contentValue } = row;
    const testValue = TEST_MARKER;
    
    // Backup original
    backups.push({ id, originalValue: contentValue });
    
    // Update with test marker
    await conn.query('UPDATE siteContent SET contentValue = ? WHERE id = ?', [testValue, id]);
    
    tested++;
    if (tested % 20 === 0) {
      console.log(`Tested ${tested}/${rows.length}...`);
    }
  }

  // Now fetch all pages and verify
  console.log('\nVerifying via API...');
  
  for (const page of mainPages) {
    const apiData = await fetchAPI(page);
    const pageRows = rows.filter(r => r.page === page);
    
    for (const row of pageRows) {
      const found = apiData.find(item => item.section === row.section && item.contentKey === row.contentKey);
      
      if (found && found.contentValue === TEST_MARKER) {
        results.pass.push({ page: row.page, section: row.section, contentKey: row.contentKey });
      } else {
        results.fail.push({ 
          page: row.page, 
          section: row.section, 
          contentKey: row.contentKey, 
          expected: TEST_MARKER, 
          got: found?.contentValue?.substring(0, 30) || 'NOT FOUND' 
        });
      }
    }
  }

  console.log('\n=== RESTORING ORIGINAL VALUES ===');
  
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
    console.log('=== FAILED FIELDS ===');
    results.fail.forEach(f => {
      console.log(`❌ ${f.page}.${f.section}.${f.contentKey} - Got: "${f.got}"`);
    });
  } else {
    console.log('✅ ALL FIELDS PASSED - Content Editor is working correctly!');
  }

  await conn.end();
}

main().catch(console.error);
