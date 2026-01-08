import { getDb } from './db';
import * as schema from '../drizzle/schema';

async function checkMedia() {
  const db = await getDb();
  if (!db) {
    console.log('No database connection');
    return;
  }
  
  const mediaItems = await db.select().from(schema.media);
  console.log('Media count:', mediaItems.length);
  console.log('Media items:', JSON.stringify(mediaItems.slice(0, 5), null, 2));
  process.exit(0);
}

checkMedia();
