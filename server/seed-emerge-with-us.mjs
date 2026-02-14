import { drizzle } from "drizzle-orm/mysql2";
import { siteContent } from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding 'emerge-with-us' page content...");

  const contentData = [
    // Hero section
    { page: "emerge-with-us", section: "hero", contentKey: "title", contentValue: "Emerge With Us" },
    { page: "emerge-with-us", section: "hero", contentKey: "subtitle", contentValue: "Step Into Your Power" },
    { page: "emerge-with-us", section: "hero", contentKey: "videoUrl", contentValue: "" },
    { page: "emerge-with-us", section: "hero", contentKey: "imageUrl", contentValue: "" },

    // Main section
    { page: "emerge-with-us", section: "main", contentKey: "title", contentValue: "A New Paradigm of Partnership" },
    { page: "emerge-with-us", section: "main", contentKey: "description", contentValue: "Just Empower invites aligned partners and individuals to join us in co-creating a world rooted in consciousness, compassion, and sacred reciprocity." },

    // Partners section
    { page: "emerge-with-us", section: "partners", contentKey: "title", contentValue: "For Partners & Organizations" },
    { page: "emerge-with-us", section: "partners", contentKey: "description", contentValue: "Collaborate with us to bring transformational programs and conscious leadership initiatives to your organization or community." },
    { page: "emerge-with-us", section: "partners", contentKey: "ctaText", contentValue: "Partner With Us" },
    { page: "emerge-with-us", section: "partners", contentKey: "ctaLink", contentValue: "/contact" },

    // Individuals section
    { page: "emerge-with-us", section: "individuals", contentKey: "title", contentValue: "For Individuals" },
    { page: "emerge-with-us", section: "individuals", contentKey: "description", contentValue: "Begin your personal journey of embodied transformation. Explore our offerings designed to catalyze your emergence." },
    { page: "emerge-with-us", section: "individuals", contentKey: "ctaText", contentValue: "Explore Offerings" },
    { page: "emerge-with-us", section: "individuals", contentKey: "ctaLink", contentValue: "/offerings" },

    // Quote section
    { page: "emerge-with-us", section: "quote", contentKey: "text", contentValue: "We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity." },
    { page: "emerge-with-us", section: "quote", contentKey: "imageUrl", contentValue: "" },

    // Content section
    { page: "emerge-with-us", section: "content", contentKey: "heading", contentValue: "The Invitation" },
    { page: "emerge-with-us", section: "content", contentKey: "description", contentValue: "Whether you are an individual seeking transformation or an organization ready to lead with consciousness, there is a place for you here." },

    // Options section
    { page: "emerge-with-us", section: "options", contentKey: "title", contentValue: "Ways to Engage" },
    { page: "emerge-with-us", section: "options", contentKey: "option1", contentValue: "1:1 Guidance" },
    { page: "emerge-with-us", section: "options", contentKey: "option1_imageUrl", contentValue: "" },
    { page: "emerge-with-us", section: "options", contentKey: "option2", contentValue: "Group Programs" },
    { page: "emerge-with-us", section: "options", contentKey: "option2_imageUrl", contentValue: "" },
    { page: "emerge-with-us", section: "options", contentKey: "option3", contentValue: "Community Events" },
    { page: "emerge-with-us", section: "options", contentKey: "option3_imageUrl", contentValue: "" },

    // Overview section
    { page: "emerge-with-us", section: "overview", contentKey: "title", contentValue: "Our Vision" },
    { page: "emerge-with-us", section: "overview", contentKey: "paragraph1", contentValue: "Just Empower exists to catalyze the rise of her—a movement grounded in embodied transformation and conscious leadership." },
    { page: "emerge-with-us", section: "overview", contentKey: "paragraph2", contentValue: "We believe that when women reclaim their sovereignty, heal their lineage, and lead from embodied truth, the ripple effect transforms communities, systems, and the world." },
  ];

  for (const content of contentData) {
    // Check if record already exists
    const existing = await db.select()
      .from(siteContent)
      .where(
        and(
          eq(siteContent.page, content.page),
          eq(siteContent.section, content.section),
          eq(siteContent.contentKey, content.contentKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ↳ Already exists: ${content.section}.${content.contentKey} - skipping`);
    } else {
      await db.insert(siteContent).values(content);
      console.log(`  ✓ Created: ${content.section}.${content.contentKey}`);
    }
  }

  console.log("✅ 'emerge-with-us' content seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
