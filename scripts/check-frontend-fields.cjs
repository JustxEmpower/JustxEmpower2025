/**
 * This script maps what each frontend page expects vs what's in the database
 * to identify any mismatches in the content flow
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Frontend page field mappings (what each page component tries to render)
const FRONTEND_FIELDS = {
  'home': {
    'hero': ['title', 'subtitle', 'description', 'subDescription', 'ctaText', 'ctaLink', 'buttonText', 'buttonLink', 'videoUrl', 'imageUrl'],
    'philosophy': ['label', 'title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'imageUrl'],
    'community': ['label', 'title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'imageUrl'],
    'offerings': ['title', 'subtitle'],
    'offeringsCarousel': ['title', 'subtitle', 'item1_title', 'item1_description', 'item1_link', 'item2_title', 'item2_description', 'item2_link', 'item3_title', 'item3_description', 'item3_link', 'item4_title', 'item4_description', 'item4_link', 'item5_title', 'item5_description', 'item5_link', 'item6_link'],
    'pointsOfAccess': ['label', 'title', 'subtitle', 'description', 'ctaText', 'ctaLink']
  },
  'philosophy': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'principles': ['title', 'imageUrl', 'principle1_title', 'principle1_description', 'principle2_title', 'principle2_description', 'principle3_title', 'principle3_description'],
    'pillars': ['title', 'subtitle', 'description', 'imageUrl'],
    'newsletter': ['title', 'description', 'buttonText', 'placeholder']
  },
  'founder': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'opening': ['title', 'content', 'paragraph1', 'paragraph2', 'paragraph3', 'imageUrl'],
    'truth': ['title', 'description', 'content', 'paragraph1', 'paragraph2', 'imageUrl'],
    'depth': ['title', 'content', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'paragraph5', 'imageUrl'],
    'remembrance': ['title', 'description', 'content', 'quote', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'imageUrl'],
    'renewal': ['title', 'description', 'content', 'paragraph1', 'paragraph2', 'imageUrl'],
    'future': ['title', 'description', 'content', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'imageUrl'],
    'newsletter': ['title', 'description']
  },
  'about': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'opening': ['paragraph1', 'paragraph2', 'paragraph3', 'imageUrl'],
    'truth': ['title', 'description', 'imageUrl'],
    'depth': ['title', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'paragraph5', 'imageUrl'],
    'remembrance': ['title', 'quote', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'imageUrl'],
    'renewal': ['title', 'paragraph1', 'paragraph2', 'imageUrl'],
    'future': ['title', 'paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'imageUrl'],
    'newsletter': ['title', 'description']
  },
  'offerings': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'emerge': ['title', 'subtitle', 'description', 'buttonText', 'buttonLink', 'imageUrl'],
    'rootedUnity': ['title', 'subtitle', 'description', 'buttonText', 'buttonLink', 'imageUrl'],
    'seeds': ['title', 'subtitle', 'description', 'buttonText', 'buttonLink', 'imageUrl'],
    'sheWrites': ['title', 'subtitle', 'description', 'buttonText', 'buttonLink', 'imageUrl']
  },
  'contact': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'info': ['heading', 'description', 'address', 'phone', 'email', 'location']
  },
  'shop': {
    'hero': ['title', 'subtitle', 'description', 'videoUrl', 'imageUrl'],
    'overview': ['title', 'paragraph1', 'paragraph2', 'imageUrl']
  }
};

async function checkFrontendFields() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== FRONTEND vs DATABASE FIELD AUDIT ===\n');
  
  const report = [];
  report.push('# FRONTEND vs DATABASE FIELD AUDIT');
  report.push(`Generated: ${new Date().toISOString()}\n`);
  
  let totalMatches = 0;
  let totalMissing = 0;
  let totalMismatches = 0;
  
  for (const [page, sections] of Object.entries(FRONTEND_FIELDS)) {
    console.log(`\nChecking page: ${page}`);
    report.push(`\n## Page: ${page}`);
    
    // Get all content for this page from DB
    const [dbContent] = await conn.query(
      'SELECT section, contentKey, contentValue FROM siteContent WHERE page = ?',
      [page]
    );
    
    // Create lookup map
    const dbMap = {};
    for (const row of dbContent) {
      const key = `${row.section}.${row.contentKey}`;
      dbMap[key] = row.contentValue;
    }
    
    for (const [section, fields] of Object.entries(sections)) {
      report.push(`\n### Section: ${section}`);
      
      for (const field of fields) {
        const key = `${section}.${field}`;
        const dbValue = dbMap[key];
        
        if (dbValue === undefined) {
          console.log(`  ❌ MISSING: ${key}`);
          report.push(`- ❌ **MISSING**: \`${field}\` - Frontend expects this but DB has no value`);
          totalMissing++;
        } else if (dbValue === 'TEST') {
          console.log(`  ✅ ${key} = TEST`);
          report.push(`- ✅ \`${field}\` = "TEST"`);
          totalMatches++;
        } else if (field.toLowerCase().includes('url') || field.toLowerCase().includes('image')) {
          // URL fields are expected to not be TEST
          console.log(`  ✅ ${key} = [URL]`);
          report.push(`- ✅ \`${field}\` = [media URL]`);
          totalMatches++;
        } else {
          console.log(`  ⚠️ MISMATCH: ${key} = "${dbValue.substring(0, 30)}..."`);
          report.push(`- ⚠️ **MISMATCH**: \`${field}\` = "${dbValue.substring(0, 50)}..." (expected TEST)`);
          totalMismatches++;
        }
      }
    }
  }
  
  report.push('\n## SUMMARY');
  report.push(`- Fields matching (TEST or URL): ${totalMatches}`);
  report.push(`- Fields MISSING from DB: ${totalMissing}`);
  report.push(`- Fields with wrong value: ${totalMismatches}`);
  
  if (totalMissing === 0 && totalMismatches === 0) {
    report.push('\n**✅ ALL FRONTEND FIELDS MATCH DATABASE - CONTENT FLOW IS WORKING**');
  } else {
    report.push('\n**❌ DISCREPANCIES FOUND - CONTENT FLOW HAS ISSUES**');
  }
  
  const reportText = report.join('\n');
  console.log('\n' + '='.repeat(50));
  console.log(reportText);
  
  fs.writeFileSync('/tmp/frontend-audit.txt', reportText);
  
  await conn.end();
}

checkFrontendFields().catch(console.error);
