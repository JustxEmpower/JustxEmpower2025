require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function verifyAudit() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== CROSS-REFERENCE AUDIT ===\n');
  
  // Get all content from database
  const [dbContent] = await conn.query('SELECT id, page, section, contentKey, contentValue FROM siteContent ORDER BY page, section, contentKey');
  
  // Group by page
  const pageData = {};
  for (const row of dbContent) {
    if (!pageData[row.page]) pageData[row.page] = { total: 0, test: 0, nonTest: [], fields: [] };
    pageData[row.page].total++;
    pageData[row.page].fields.push({ section: row.section, key: row.contentKey, value: row.contentValue });
    
    // Check if it's a text field (not URL/image)
    const key = row.contentKey.toLowerCase();
    if (!key.includes('url') && !key.includes('image') && !key.includes('video')) {
      if (row.contentValue === 'TEST') {
        pageData[row.page].test++;
      } else {
        pageData[row.page].nonTest.push(`${row.section}.${row.contentKey} = "${row.contentValue.substring(0, 50)}"`);
      }
    }
  }
  
  // Output results
  const report = [];
  report.push('# CONTENT EDITOR FULL AUDIT REPORT');
  report.push(`Generated: ${new Date().toISOString()}\n`);
  report.push('## DATABASE STATE\n');
  
  let totalFields = 0;
  let totalTest = 0;
  let discrepancies = [];
  
  for (const page of Object.keys(pageData).sort()) {
    const data = pageData[page];
    totalFields += data.total;
    totalTest += data.test;
    
    report.push(`### Page: ${page}`);
    report.push(`- Total fields: ${data.total}`);
    report.push(`- Text fields with TEST: ${data.test}`);
    
    if (data.nonTest.length > 0) {
      report.push(`- Fields NOT set to TEST (${data.nonTest.length}):`);
      for (const nt of data.nonTest) {
        report.push(`  - ${nt}`);
        discrepancies.push({ page, field: nt });
      }
    }
    report.push('');
    
    // List all sections for this page
    const sections = {};
    for (const f of data.fields) {
      if (!sections[f.section]) sections[f.section] = [];
      sections[f.section].push(f.key);
    }
    report.push('**Sections:**');
    for (const sec of Object.keys(sections).sort()) {
      report.push(`- ${sec}: ${sections[sec].join(', ')}`);
    }
    report.push('');
  }
  
  report.push('## SUMMARY\n');
  report.push(`- Total pages: ${Object.keys(pageData).length}`);
  report.push(`- Total content fields: ${totalFields}`);
  report.push(`- Text fields set to TEST: ${totalTest}`);
  report.push(`- Discrepancies (text fields not TEST): ${discrepancies.length}`);
  
  if (discrepancies.length > 0) {
    report.push('\n### DISCREPANCIES TO FIX:');
    for (const d of discrepancies) {
      report.push(`- [${d.page}] ${d.field}`);
    }
  } else {
    report.push('\n**✅ ALL TEXT FIELDS ARE SET TO TEST - DATABASE IS CONSISTENT**');
  }
  
  // Output to console and file
  const reportText = report.join('\n');
  console.log(reportText);
  
  // Save report
  fs.writeFileSync('/tmp/audit-report.txt', reportText);
  console.log('\nReport saved to /tmp/audit-report.txt');
  
  await conn.end();
}

verifyAudit().catch(console.error);
