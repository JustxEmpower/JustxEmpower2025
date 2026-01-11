/**
 * Migration script to add freeformContent sections for legal pages
 * This enables the free-form content editor for Privacy Policy, Terms of Service,
 * Accessibility Statement, and Cookie Policy pages.
 * 
 * Run with: pnpm tsx scripts/add-legal-freeform-content.ts
 */

import dotenv from "dotenv";
dotenv.config({ override: true });

import { getDb } from "../server/db";
import { siteContent } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const legalPages = [
  'privacy-policy',
  'terms-of-service',
  'accessibility',
  'cookie-policy'
];

async function main() {
  console.log('Adding freeformContent sections for legal pages...');
  
  const db = await getDb();
  if (!db) {
    console.error('Database not available. Make sure DATABASE_URL is set.');
    process.exit(1);
  }
  
  for (const page of legalPages) {
    // Check if freeformContent section already exists
    const existing = await db.select()
      .from(siteContent)
      .where(
        and(
          eq(siteContent.page, page),
          eq(siteContent.section, 'freeformContent'),
          eq(siteContent.contentKey, 'blocks')
        )
      );
    
    if (existing.length > 0) {
      console.log(`  - ${page}: freeformContent already exists, skipping`);
      continue;
    }
    
    // Insert new freeformContent section with empty blocks array
    await db.insert(siteContent).values({
      page,
      section: 'freeformContent',
      contentKey: 'blocks',
      contentValue: '[]'
    });
    
    console.log(`  - ${page}: Added freeformContent section`);
  }
  
  console.log('Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
