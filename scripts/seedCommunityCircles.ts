/**
 * Seed script: creates the initial community circles.
 *
 * Creates:
 *  - 1 General Circle (open to all)
 *  - 12 Core Archetype Circles
 *  - 3 Expansion Archetype Circles (Sovereign, Threshold Walker, Luminous Witness)
 *
 * Usage:  npx tsx scripts/seedCommunityCircles.ts
 */

import "dotenv/config";
import { nanoid } from "nanoid";
import { getDb } from "../server/db";
import { codexCircles } from "../drizzle/schema";

const CORE_ARCHETYPES = [
  { name: "The Silent Flame", key: "silent-flame", glyph: "◈" },
  { name: "The Forsaken Child", key: "forsaken-child", glyph: "☽" },
  { name: "The Pleaser Flame", key: "pleaser-flame", glyph: "⚖" },
  { name: "The Burdened Flame", key: "burdened-flame", glyph: "◊" },
  { name: "The Drifting One", key: "drifting-one", glyph: "∼" },
  { name: "The Guarded Mystic", key: "guarded-mystic", glyph: "◎" },
  { name: "The Spirit-Dimmed", key: "spirit-dimmed", glyph: "⚳" },
  { name: "The Fault-Bearer", key: "fault-bearer", glyph: "◇" },
  { name: "The Shielded One", key: "shielded-one", glyph: "◆" },
  { name: "The Rational Pilgrim", key: "rational-pilgrim", glyph: "☿" },
  { name: "The Living Flame", key: "living-flame", glyph: "♀" },
  { name: "The Rooted Flame", key: "rooted-flame", glyph: "∞" },
];

const EXPANSION_ARCHETYPES = [
  { name: "The Sovereign", key: "sovereign", glyph: "◎" },
  { name: "The Threshold Walker", key: "threshold-walker", glyph: "○" },
  { name: "The Luminous Witness", key: "luminous-witness", glyph: "✦" },
];

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Could not connect to database. Check DATABASE_URL.");
    process.exit(1);
  }

  console.log("🌱 Seeding community circles...\n");

  const circles = [];

  // 1. General Circle
  circles.push({
    id: nanoid(),
    circleType: "general",
    name: "The Gathering",
    slug: "general",
    description:
      "Open to all. Archetype-agnostic. Phase-agnostic. A space for women to connect, celebrate, and share — without structure, without expectation. The café.",
    maxMembers: 0,
    isActive: 1,
    visibility: "public",
    facilitatorType: "ai",
    createdBy: "system",
  });

  // 2. Core Archetype Circles (12)
  for (const arch of CORE_ARCHETYPES) {
    circles.push({
      id: nanoid(),
      circleType: "archetype",
      name: `${arch.glyph} ${arch.name} Circle`,
      slug: `archetype-${arch.key}`,
      description: `A circle for every woman whose primary archetype is ${arch.name}. Your people. Your fire.`,
      archetypeFilter: arch.key,
      maxMembers: 0,
      isActive: 1,
      visibility: "public",
      facilitatorType: "ai",
      aiPromptConfig: JSON.stringify({
        archetypeName: arch.name,
        archetypeKey: arch.key,
        glyph: arch.glyph,
        promptFrequency: "weekly",
      }),
      createdBy: "system",
    });
  }

  // 3. Expansion Archetype Circles (3)
  for (const arch of EXPANSION_ARCHETYPES) {
    circles.push({
      id: nanoid(),
      circleType: "archetype",
      name: `${arch.glyph} ${arch.name} Circle`,
      slug: `archetype-${arch.key}`,
      description: `A circle for every woman whose primary archetype is ${arch.name}. Your people. Your fire.`,
      archetypeFilter: arch.key,
      maxMembers: 0,
      isActive: 1,
      visibility: "public",
      facilitatorType: "ai",
      aiPromptConfig: JSON.stringify({
        archetypeName: arch.name,
        archetypeKey: arch.key,
        glyph: arch.glyph,
        promptFrequency: "weekly",
      }),
      createdBy: "system",
    });
  }

  // Insert all circles
  let inserted = 0;
  for (const circle of circles) {
    try {
      await db.insert(codexCircles).values(circle as any);
      console.log(`  ✓ ${circle.name}`);
      inserted++;
    } catch (err: any) {
      if (err?.code === "ER_DUP_ENTRY") {
        console.log(`  ○ ${circle.name} (already exists)`);
      } else {
        console.error(`  ✗ ${circle.name}:`, err.message);
      }
    }
  }

  console.log(`\n✅ Seeded ${inserted} circles (${circles.length - inserted} already existed).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
