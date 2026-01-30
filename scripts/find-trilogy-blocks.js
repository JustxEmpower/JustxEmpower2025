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
    const [pages] = await pool.query('SELECT id, slug, title FROM pages WHERE slug LIKE ?', ['%trilogy%']);
    if (pages.length === 0) {
      console.log('No trilogy pages found');
      return;
    }
    
    for (const page of pages) {
      console.log(`\n=== Page: ${page.title} (slug: ${page.slug}, id: ${page.id}) ===`);
      const [blocks] = await pool.query(
        'SELECT id, type, `order`, content FROM page_blocks WHERE page_id = ? ORDER BY `order`',
        [page.id]
      );
      
      for (const block of blocks) {
        let contentSummary = '';
        try {
          const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
          if (content.title) contentSummary = `title: "${content.title}"`;
          else if (content.sectionTitle) contentSummary = `sectionTitle: "${content.sectionTitle}"`;
          else if (content.items) contentSummary = `items: ${content.items.length}`;
        } catch (e) {}
        console.log(`  [${block.order}] id=${block.id} type=${block.type} ${contentSummary}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

findBlocks();
