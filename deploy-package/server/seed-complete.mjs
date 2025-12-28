import { drizzle } from "drizzle-orm/mysql2";
import { articles, siteContent, adminUsers } from "../drizzle/schema.js";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding complete database with ALL content sections...");

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

  // Comprehensive site content for ALL sections
  console.log("Seeding comprehensive site content...");
  const contentData = [
    // ===== HOME PAGE =====
    { page: "home", section: "hero", contentKey: "title", contentValue: "Catalyzing the Rise of Her" },
    { page: "home", section: "hero", contentKey: "subtitle", contentValue: "Welcome to Just Empower" },
    { page: "home", section: "hero", contentKey: "description", contentValue: "Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership." },
    { page: "home", section: "hero", contentKey: "videoUrl", contentValue: "/home-slide-1.mp4" },
    { page: "home", section: "hero", contentKey: "buttonText", contentValue: "Discover More" },
    { page: "home", section: "hero", contentKey: "buttonLink", contentValue: "/about" },
    
    { page: "home", section: "philosophy", contentKey: "title", contentValue: "The Philosophy" },
    { page: "home", section: "philosophy", contentKey: "subtitle", contentValue: "Our Approach" },
    { page: "home", section: "philosophy", contentKey: "description", contentValue: "Just Empower operates at the intersection of personal healing and systemic change. We believe that true empowerment is a homecoming—a return to the voice, clarity, and sovereignty that have always lived within you." },
    { page: "home", section: "philosophy", contentKey: "imageUrl", contentValue: "/media/12/IMG_0513-1280x1358.jpg" },
    
    { page: "home", section: "community", contentKey: "title", contentValue: "Emerge With Us" },
    { page: "home", section: "community", contentKey: "subtitle", contentValue: "Community" },
    { page: "home", section: "community", contentKey: "description", contentValue: "We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity. Join a community of women dedicated to rewriting the narrative of leadership and legacy." },
    { page: "home", section: "community", contentKey: "imageUrl", contentValue: "/media/11/Tri-Cover-1280x960.jpg" },
    
    // ===== ABOUT PAGE (FOUNDER) =====
    { page: "about", section: "hero", contentKey: "title", contentValue: "The Founder" },
    { page: "about", section: "hero", contentKey: "subtitle", contentValue: "April Gambardella" },
    { page: "about", section: "hero", contentKey: "description", contentValue: "Steward of Embodied Change & Energetic Coherence" },
    { page: "about", section: "hero", contentKey: "videoUrl", contentValue: "/media/09/seeds-of-power.mp4" },
    
    { page: "about", section: "opening", contentKey: "paragraph1", contentValue: "From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself." },
    { page: "about", section: "opening", contentKey: "paragraph2", contentValue: "That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration." },
    { page: "about", section: "opening", contentKey: "paragraph3", contentValue: "Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality." },
    
    { page: "about", section: "truth", contentKey: "title", contentValue: "Just Empower is Built on This Truth" },
    { page: "about", section: "truth", contentKey: "description", contentValue: "Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike." },
    
    { page: "about", section: "depth", contentKey: "title", contentValue: "The Depth Beneath the Framework" },
    { page: "about", section: "depth", contentKey: "paragraph1", contentValue: "Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence." },
    { page: "about", section: "depth", contentKey: "paragraph2", contentValue: "My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience." },
    { page: "about", section: "depth", contentKey: "paragraph3", contentValue: "With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth." },
    { page: "about", section: "depth", contentKey: "paragraph4", contentValue: "I was not taught—I was tempered. Not by intellect, but by initiation." },
    { page: "about", section: "depth", contentKey: "paragraph5", contentValue: "The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower." },
    
    // ===== PHILOSOPHY PAGE =====
    { page: "philosophy", section: "hero", contentKey: "title", contentValue: "Our Philosophy" },
    { page: "philosophy", section: "hero", contentKey: "subtitle", contentValue: "Embodiment Over Intellectualization" },
    { page: "philosophy", section: "hero", contentKey: "description", contentValue: "True transformation is not a concept—it is a lived experience." },
    { page: "philosophy", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-fog-slide-3.mp4" },
    
    { page: "philosophy", section: "main", contentKey: "paragraph1", contentValue: "Just Empower is rooted in the understanding that real change happens not in the mind alone, but in the body, the nervous system, and the energetic field." },
    { page: "philosophy", section: "main", contentKey: "paragraph2", contentValue: "We honor the intelligence of the feminine—the intuitive, the cyclical, the regenerative. Our work bridges ancient wisdom and modern science to create pathways of healing that are both grounded and transcendent." },
    
    // ===== OFFERINGS PAGE =====
    { page: "offerings", section: "hero", contentKey: "title", contentValue: "Our Offerings" },
    { page: "offerings", section: "hero", contentKey: "subtitle", contentValue: "Seeds of a New Paradigm" },
    { page: "offerings", section: "hero", contentKey: "description", contentValue: "Transformational programs designed to restore alignment and catalyze conscious leadership." },
    { page: "offerings", section: "hero", contentKey: "videoUrl", contentValue: "/media/seeds-of-video-2.mp4" },
    
    // ===== JOURNAL PAGE =====
    { page: "journal", section: "hero", contentKey: "title", contentValue: "The Journal" },
    { page: "journal", section: "hero", contentKey: "subtitle", contentValue: "Wisdom & Reflections" },
    { page: "journal", section: "hero", contentKey: "description", contentValue: "Insights on embodied transformation, conscious leadership, and the rise of her." },
    { page: "journal", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-fog-slide-3.mp4" },
    
    // ===== CONTACT PAGE =====
    { page: "contact", section: "hero", contentKey: "title", contentValue: "Connect" },
    { page: "contact", section: "hero", contentKey: "subtitle", contentValue: "Begin the Conversation" },
    { page: "contact", section: "hero", contentKey: "description", contentValue: "Reach out to explore how we can support your journey." },
    { page: "contact", section: "hero", contentKey: "videoUrl", contentValue: "/media/home-top-2.mp4" },
    
    { page: "contact", section: "info", contentKey: "email", contentValue: "partners@justxempower.com" },
    { page: "contact", section: "info", contentKey: "phone", contentValue: "(512) 730-9586" },
    { page: "contact", section: "info", contentKey: "address", contentValue: "Austin, Texas" },
  ];

  for (const content of contentData) {
    await db.insert(siteContent).values(content).onDuplicateKeyUpdate({
      set: { contentValue: content.contentValue, updatedAt: new Date() }
    });
  }

  console.log("✅ Database seeded successfully with complete content!");
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
