require('dotenv').config();
const mysql = require('mysql2/promise');

async function restoreContent() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== RESTORING siteContent FROM pageSections ===\n');
  
  // Get all pageSections with their page slugs
  const [sections] = await conn.query(`
    SELECT ps.id, ps.pageId, p.slug as pageSlug, ps.sectionId, ps.sectionType, ps.content 
    FROM pageSections ps 
    LEFT JOIN pages p ON ps.pageId = p.id
    ORDER BY ps.pageId, ps.sectionOrder
  `);
  
  console.log(`Found ${sections.length} page sections to process\n`);
  
  let restored = 0;
  let errors = 0;
  
  for (const section of sections) {
    const pageSlug = section.pageSlug || 'unknown';
    const sectionId = section.sectionId || section.sectionType || 'unknown';
    
    try {
      const content = JSON.parse(section.content);
      
      // Extract all text fields from the JSON content
      for (const [key, value] of Object.entries(content)) {
        // Skip non-content keys
        if (key === 'sectionId' || key === 'sectionType' || key === 'sectionOrder') continue;
        
        // Handle nested arrays (like items, principles, etc.)
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const item = value[i];
            if (typeof item === 'object' && item !== null) {
              for (const [itemKey, itemValue] of Object.entries(item)) {
                if (typeof itemValue === 'string' && itemValue.trim()) {
                  const contentKey = `${key}${i + 1}_${itemKey}`;
                  await upsertContent(conn, pageSlug, sectionId, contentKey, itemValue);
                  restored++;
                }
              }
            } else if (typeof item === 'string' && item.trim()) {
              const contentKey = `${key}${i + 1}`;
              await upsertContent(conn, pageSlug, sectionId, contentKey, item);
              restored++;
            }
          }
        }
        // Handle nested objects (like socialLinks)
        else if (typeof value === 'object' && value !== null) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (typeof subValue === 'string' && subValue.trim()) {
              const contentKey = `${key}_${subKey}`;
              await upsertContent(conn, pageSlug, sectionId, contentKey, subValue);
              restored++;
            }
          }
        }
        // Handle simple string values
        else if (typeof value === 'string' && value.trim()) {
          await upsertContent(conn, pageSlug, sectionId, key, value);
          restored++;
        }
      }
      
      console.log(`✓ ${pageSlug}.${sectionId}`);
    } catch (e) {
      console.log(`✗ ${pageSlug}.${sectionId}: ${e.message}`);
      errors++;
    }
  }
  
  console.log(`\n=== RESTORE COMPLETE ===`);
  console.log(`Restored: ${restored} content fields`);
  console.log(`Errors: ${errors}`);
  
  // Show sample of restored content
  const [sample] = await conn.query(`
    SELECT page, section, contentKey, LEFT(contentValue, 60) as value 
    FROM siteContent 
    WHERE contentValue != 'TEST'
    ORDER BY page, section, contentKey
    LIMIT 20
  `);
  
  console.log('\nSample restored content:');
  sample.forEach(s => console.log(`  ${s.page}.${s.section}.${s.contentKey} = "${s.value}..."`));
  
  await conn.end();
}

async function upsertContent(conn, page, section, contentKey, contentValue) {
  await conn.query(`
    INSERT INTO siteContent (page, section, contentKey, contentValue)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue)
  `, [page, section, contentKey, contentValue]);
}

restoreContent().catch(console.error);
