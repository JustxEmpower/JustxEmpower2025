import { db } from '../server/db/index.js';
import { pageBlocks, pages } from '../shared/schema.js';
import { eq, like } from 'drizzle-orm';

async function findBlocks() {
  try {
    const result = await db.select({
      id: pageBlocks.id,
      type: pageBlocks.type,
      position: pageBlocks.position,
      content: pageBlocks.content
    })
    .from(pageBlocks)
    .innerJoin(pages, eq(pageBlocks.pageId, pages.id))
    .where(like(pages.slug, '%trilogy%'));
    
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

findBlocks();
