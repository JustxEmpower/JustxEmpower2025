import mysql from "mysql2/promise";

async function seed() {
  console.log("🌱 Seeding 'blog' page hero content...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const contentData = [
    ["blog", "hero", "title", "She Writes"],
    ["blog", "hero", "subtitle", "Stories, Reflections & Sacred Musings"],
    ["blog", "hero", "description", "A space for the words that move through us — reflections on embodied transformation, conscious leadership, and the rising of her."],
    ["blog", "hero", "videoUrl", ""],
    ["blog", "hero", "imageUrl", ""],
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
  console.log("✅ 'blog' hero content seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
