import { drizzle } from "drizzle-orm/mysql2";
import { articles, siteContent, adminUsers } from "../drizzle/schema.js";
import crypto from "crypto";

// Simple password hashing using Node.js built-in crypto
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  console.log("Creating admin user...");
  await db.insert(adminUsers).values({
    username: "JusticeEmpower",
    passwordHash: hashPassword("EmpowerX2025"),
  }).onDuplicateKeyUpdate({
    set: { passwordHash: hashPassword("EmpowerX2025") }
  });

  // Seed articles
  console.log("Seeding articles...");
  const articlesData = [
    {
      title: "Sacred Reciprocity",
      slug: "sacred-reciprocity",
      category: "NATURE",
      date: "JULY 2025",
      excerpt: "Nature does not hoard; it circulates. To live in alignment with the earth is to understand the law of sacred reciprocity—that we must give back what we take, and honor the cycles that sustain us.",
      content: "Nature does not hoard; it circulates. To live in alignment with the earth is to understand the law of sacred reciprocity—that we must give back what we take, and honor the cycles that sustain us.\n\nThis principle extends beyond environmental stewardship into every relationship, every exchange, every act of creation. When we operate from a place of reciprocity, we acknowledge that we are not separate from the web of life—we are woven into it.\n\nTrue empowerment recognizes this interdependence and acts accordingly.",
      imageUrl: "/media/12/IMG_0513-1280x1358.jpg",
      published: 1,
    },
    {
      title: "Voice as Vessel",
      slug: "voice-as-vessel",
      category: "EXPRESSION",
      date: "JUNE 2025",
      excerpt: "Your voice is not just a tool for communication; it is a vessel for your soul's frequency. Reclaiming your voice is an act of spiritual sovereignty.",
      content: "Your voice is not just a tool for communication; it is a vessel for your soul's frequency. Reclaiming your voice is an act of spiritual sovereignty.\n\nFor too long, women have been told to soften, to shrink, to make themselves palatable. But the voice that emerges from embodied truth cannot be contained. It carries the resonance of lifetimes, the wisdom of ancestors, the clarity of purpose.\n\nWhen you speak from this place, you do not seek permission—you claim your right to be heard.",
      imageUrl: "/media/12/IMG_0516-800x1044.jpg",
      published: 1,
    },
    {
      title: "Ancestral Healing",
      slug: "ancestral-healing",
      category: "LINEAGE",
      date: "MAY 2025",
      excerpt: "We are the dream of our ancestors. Healing our lineage is not about blaming the past, but about liberating the future from the patterns that no longer serve.",
      content: "We are the dream of our ancestors. Healing our lineage is not about blaming the past, but about liberating the future from the patterns that no longer serve.\n\nEvery wound we heal within ourselves ripples backward and forward through time. We become the bridge between what was and what will be—the ones who chose to break the cycle, to rewrite the story, to remember what was forgotten.\n\nThis is not a burden. It is a sacred calling.",
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop",
      published: 1,
    },
  ];

  for (const article of articlesData) {
    await db.insert(articles).values(article).onDuplicateKeyUpdate({
      set: { ...article, updatedAt: new Date() }
    });
  }

  // Seed site content
  console.log("Seeding site content...");
  const contentData = [
    // Home page
    { page: "home", section: "hero", contentKey: "title", contentValue: "Catalyzing the Rise of Her" },
    { page: "home", section: "hero", contentKey: "subtitle", contentValue: "Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership." },
    { page: "home", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-top-2.mp4" },
    
    // About page
    { page: "about", section: "hero", contentKey: "title", contentValue: "Our Story" },
    { page: "about", section: "hero", contentKey: "subtitle", contentValue: "Stewardship of Embodied Change" },
    { page: "about", section: "hero", contentKey: "videoUrl", contentValue: "/media/seeds-of-power.mp4" },
    
    // Philosophy page
    { page: "philosophy", section: "hero", contentKey: "title", contentValue: "Our Philosophy" },
    { page: "philosophy", section: "hero", contentKey: "subtitle", contentValue: "Embodiment Over Intellectualization" },
    { page: "philosophy", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-fog-slide-3.mp4" },
    
    // Offerings page
    { page: "offerings", section: "hero", contentKey: "title", contentValue: "Our Offerings" },
    { page: "offerings", section: "hero", contentKey: "subtitle", contentValue: "Seeds of a New Paradigm" },
    { page: "offerings", section: "hero", contentKey: "videoUrl", contentValue: "/media/seeds-of-video-2.mp4" },
    
    // Journal page
    { page: "journal", section: "hero", contentKey: "title", contentValue: "The Journal" },
    { page: "journal", section: "hero", contentKey: "subtitle", contentValue: "Wisdom & Reflections" },
    { page: "journal", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-fog-slide-3.mp4" },
    
    // Contact page
    { page: "contact", section: "hero", contentKey: "title", contentValue: "Connect" },
    { page: "contact", section: "hero", contentKey: "subtitle", contentValue: "Begin the Conversation" },
    { page: "contact", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-top-2.mp4" },
  ];

  for (const content of contentData) {
    await db.insert(siteContent).values(content).onDuplicateKeyUpdate({
      set: { contentValue: content.contentValue, updatedAt: new Date() }
    });
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
