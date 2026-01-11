import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from 'drizzle-orm';
import { siteContent, pages } from './drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const pagesList = ['privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'];
  const content = await db.select({
    page: siteContent.page,
    section: siteContent.section,
    contentKey: siteContent.contentKey
  }).from(siteContent).where(inArray(siteContent.page, pagesList));
  
  console.log('Legal page content in database:');
  console.log(JSON.stringify(content, null, 2));
  console.log('Total rows:', content.length);
  
  // Also check pages table
  const pagesInDb = await db.select().from(pages).where(inArray(pages.slug, pagesList));
  console.log('\nPages in database:');
  console.log(JSON.stringify(pagesInDb, null, 2));
  
  process.exit(0);
}
main().catch(console.error);
