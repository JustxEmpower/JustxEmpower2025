import 'dotenv/config';
import { getDb } from '../server/db';
import { siteContent } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const legalPages = [
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-of-service', title: 'Terms of Service' },
  { slug: 'accessibility', title: 'Accessibility Statement' },
  { slug: 'cookie-policy', title: 'Cookie Policy' },
];

async function initializeLegalSections() {
  console.log('Initializing legal sections in database...');

  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed. Make sure DATABASE_URL is set.');
    }

    for (const page of legalPages) {
      console.log(`Processing ${page.title}...`);

      // Check if legalSections already exists
      const existing = await db
        .select()
        .from(siteContent)
        .where(
          and(
            eq(siteContent.page, page.slug),
            eq(siteContent.section, 'legalSections')
          )
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ✓ legalSections already exists for ${page.slug}`);
      } else {
        // Insert legalSections
        await db.insert(siteContent).values({
          page: page.slug,
          section: 'legalSections',
          contentKey: 'sections',
          contentValue: JSON.stringify([]),
        });
        console.log(`  ✓ Created legalSections for ${page.slug}`);
      }
    }

    console.log('\n✅ Legal sections initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing legal sections:', error);
    process.exit(1);
  }
}

initializeLegalSections();
