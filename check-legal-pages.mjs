import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from 'drizzle-orm';
import * as schema from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  const pages = ['privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'];
  const content = await db.select({
    page: schema.siteContent.page,
    section: schema.siteContent.section,
    contentKey: schema.siteContent.contentKey
  }).from(schema.siteContent).where(inArray(schema.siteContent.page, pages));
  
  console.log('Legal page content in database:');
  console.log(JSON.stringify(content, null, 2));
  console.log('Total rows:', content.length);
  
  // Also check pages table
  const pagesInDb = await db.select().from(schema.pages).where(inArray(schema.pages.slug, pages));
  console.log('\nPages in database:');
  console.log(JSON.stringify(pagesInDb, null, 2));
  
  process.exit(0);
}
main().catch(console.error);
