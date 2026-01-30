import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function findBlocks() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const pool = await mysql.createPool(dbUrl);
  try {
    // First find the correct table name for page blocks
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const blockTable = tableNames.find(t => t.toLowerCase().includes('block') || t.toLowerCase().includes('pageblock'));
    console.log('Available tables:', tableNames.filter(t => t.toLowerCase().includes('page') || t.toLowerCase().includes('block')).join(', '));
    
    const [pages] = await pool.query('SELECT id, slug, title FROM pages WHERE slug LIKE ?', ['%trilogy%']);
    if (pages.length === 0) {
      console.log('No trilogy pages found');
      return;
    }
    
    for (const page of pages) {
      console.log(`\n=== Page: ${page.title} (slug: ${page.slug}, id: ${page.id}) ===`);
      
      // Check pageBlocks table
      try {
        const [blocks] = await pool.query(
          `SELECT id, type, \`order\`, content FROM pageBlocks WHERE pageId = ? ORDER BY \`order\``,
          [page.id]
        );
        
        console.log('  Page Blocks:');
        for (const block of blocks) {
          let contentSummary = '';
          try {
            const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
            if (content.title) contentSummary = `title: "${content.title}"`;
            else if (content.sectionTitle) contentSummary = `sectionTitle: "${content.sectionTitle}"`;
            else if (content.items) contentSummary = `items: ${content.items.length}`;
          } catch (e) {}
          console.log(`    [${block.order}] id=${block.id} type=${block.type} ${contentSummary}`);
        }
      } catch (e) {
        console.log('  Error querying pageBlocks:', e.message);
      }
      
      // Check siteContent table for this page
      try {
        const [content] = await pool.query(
          `SELECT id, section, contentKey, contentValue FROM siteContent WHERE page = ? ORDER BY section, contentKey`,
          [page.slug]
        );
        
        if (content.length > 0) {
          console.log('\n  Site Content entries:');
          for (const row of content) {
            const preview = row.contentValue?.substring(0, 100) || '';
            console.log(`    id=${row.id} section=${row.section} key=${row.contentKey} value="${preview}..."`);
          }
        }
      } catch (e) {
        console.log('  Error querying siteContent:', e.message);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

// Delete orphaned siteContent entries for mom-vix-journal-trilogy page
async function deleteOrphanedContent() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const pool = await mysql.createPool(dbUrl);
  try {
    // Delete the offerings_grid_5 and heading_4 entries that are causing the phantom section
    const idsToDelete = [1158, 1159, 1160, 1161, 1141, 1162, 1163, 1164];
    
    console.log('Deleting orphaned siteContent entries:', idsToDelete);
    
    const [result] = await pool.query(
      'DELETE FROM siteContent WHERE id IN (?) AND page = ?',
      [idsToDelete, 'mom-vix-journal-trilogy']
    );
    
    console.log('Deleted', result.affectedRows, 'rows');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

// Run with --delete flag to delete orphaned content
if (process.argv.includes('--delete')) {
  deleteOrphanedContent();
} else {
  findBlocks();
}
