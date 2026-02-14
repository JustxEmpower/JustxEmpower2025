import mysql from "mysql2/promise";

async function seed() {
  console.log("🌱 Seeding 'emerge-with-us' page content...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const contentData = [
    ["emerge-with-us", "hero", "title", "Emerge With Us"],
    ["emerge-with-us", "hero", "subtitle", "Step Into Your Power"],
    ["emerge-with-us", "hero", "videoUrl", ""],
    ["emerge-with-us", "hero", "imageUrl", ""],
    ["emerge-with-us", "main", "title", "A New Paradigm of Partnership"],
    ["emerge-with-us", "main", "description", "Just Empower invites aligned partners and individuals to join us in co-creating a world rooted in consciousness, compassion, and sacred reciprocity."],
    ["emerge-with-us", "partners", "title", "For Partners & Organizations"],
    ["emerge-with-us", "partners", "description", "Collaborate with us to bring transformational programs and conscious leadership initiatives to your organization or community."],
    ["emerge-with-us", "partners", "ctaText", "Partner With Us"],
    ["emerge-with-us", "partners", "ctaLink", "/contact"],
    ["emerge-with-us", "individuals", "title", "For Individuals"],
    ["emerge-with-us", "individuals", "description", "Begin your personal journey of embodied transformation. Explore our offerings designed to catalyze your emergence."],
    ["emerge-with-us", "individuals", "ctaText", "Explore Offerings"],
    ["emerge-with-us", "individuals", "ctaLink", "/offerings"],
    ["emerge-with-us", "quote", "text", "We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity."],
    ["emerge-with-us", "quote", "imageUrl", ""],
    ["emerge-with-us", "content", "heading", "The Invitation"],
    ["emerge-with-us", "content", "description", "Whether you are an individual seeking transformation or an organization ready to lead with consciousness, there is a place for you here."],
    ["emerge-with-us", "options", "title", "Ways to Engage"],
    ["emerge-with-us", "options", "option1", "1:1 Guidance"],
    ["emerge-with-us", "options", "option1_imageUrl", ""],
    ["emerge-with-us", "options", "option2", "Group Programs"],
    ["emerge-with-us", "options", "option2_imageUrl", ""],
    ["emerge-with-us", "options", "option3", "Community Events"],
    ["emerge-with-us", "options", "option3_imageUrl", ""],
    ["emerge-with-us", "overview", "title", "Our Vision"],
    ["emerge-with-us", "overview", "paragraph1", "Just Empower exists to catalyze the rise of her—a movement grounded in embodied transformation and conscious leadership."],
    ["emerge-with-us", "overview", "paragraph2", "We believe that when women reclaim their sovereignty, heal their lineage, and lead from embodied truth, the ripple effect transforms communities, systems, and the world."],
  ];

  for (const [page, section, contentKey, contentValue] of contentData) {
    const [existing] = await connection.execute(
      "SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ? LIMIT 1",
      [page, section, contentKey]
    );
    if (existing.length > 0) {
      console.log(`  ↳ Already exists: ${section}.${contentKey} - skipping`);
    } else {
      await connection.execute(
        "INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)",
        [page, section, contentKey, contentValue]
      );
      console.log(`  ✓ Created: ${section}.${contentKey}`);
    }
  }

  await connection.end();
  console.log("✅ 'emerge-with-us' content seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
