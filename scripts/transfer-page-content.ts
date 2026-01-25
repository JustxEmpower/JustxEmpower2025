/**
 * Transfer page content from /workshops-programs to /overview
 * Run with: npx tsx scripts/transfer-page-content.ts
 */
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import * as schema from "../drizzle/schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  // Find the workshops-programs page
  const [workshopsPage] = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, "workshops-programs"))
    .limit(1);

  console.log("Workshops page:", workshopsPage || "NOT FOUND");

  // Check if overview page exists
  const [overviewPage] = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, "overview"))
    .limit(1);

  console.log("Overview page:", overviewPage || "NOT FOUND");

  if (workshopsPage) {
    // Count blocks on workshops-programs page
    const blocks = await db
      .select()
      .from(schema.pageBlocks)
      .where(eq(schema.pageBlocks.pageId, workshopsPage.id));

    console.log(`Blocks on workshops-programs page: ${blocks.length}`);

    if (overviewPage) {
      // Transfer blocks from workshops-programs to overview
      const result = await db
        .update(schema.pageBlocks)
        .set({ pageId: overviewPage.id })
        .where(eq(schema.pageBlocks.pageId, workshopsPage.id));

      console.log("Transferred blocks to overview page");

      // Also transfer page sections if any
      await db
        .update(schema.pageSections)
        .set({ pageId: overviewPage.id })
        .where(eq(schema.pageSections.pageId, workshopsPage.id));

      console.log("Transferred page sections to overview page");
    } else {
      // No overview page exists, just rename the slug
      await db
        .update(schema.pages)
        .set({ slug: "overview" })
        .where(eq(schema.pages.id, workshopsPage.id));

      console.log("Renamed workshops-programs page slug to 'overview'");
    }
  }

  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
