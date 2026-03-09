import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const SECTION_META: Record<number, { title: string; glyph: string; subtitle: string; isSpecial: boolean; weight: number }> = {
  1: { title: "Voice & Visibility", glyph: "🜂", subtitle: "The terrain of your truth.", isSpecial: false, weight: 1.0 },
  2: { title: "Relational Patterns", glyph: "☽", subtitle: "The mirror of how you love.", isSpecial: false, weight: 1.0 },
  3: { title: "Wound Imprints", glyph: "⚖", subtitle: "The archaeology of what was absorbed.", isSpecial: false, weight: 1.25 },
  4: { title: "Mirror Patterns", glyph: "🝊", subtitle: "The reflection mechanisms.", isSpecial: false, weight: 1.0 },
  5: { title: "Survival Archetypes", glyph: "🝸", subtitle: "The strategies that kept you alive.", isSpecial: false, weight: 1.25 },
  6: { title: "Soul Disconnection", glyph: "🜃", subtitle: "The spaces where you lost yourself.", isSpecial: false, weight: 1.0 },
  7: { title: "Somatic Embodiment", glyph: "⚳", subtitle: "The body's memory.", isSpecial: false, weight: 1.0 },
  8: { title: "Lineage Imprint", glyph: "🜄", subtitle: "The inherited patterns.", isSpecial: false, weight: 1.0 },
  9: { title: "Money & Survival", glyph: "🝮", subtitle: "The economics of worth.", isSpecial: false, weight: 1.0 },
  10: { title: "Longing & Reclamation", glyph: "☿", subtitle: "The ache beneath the surface.", isSpecial: false, weight: 1.0 },
  11: { title: "Thresholds", glyph: "♀", subtitle: "The edges of becoming.", isSpecial: false, weight: 1.25 },
  12: { title: "Open-Ended Integration", glyph: "🜁", subtitle: "Your own words.", isSpecial: true, weight: 0 },
  13: { title: "Masculine Mirror", glyph: "👁", subtitle: "The masculine imprint.", isSpecial: false, weight: 1.5 },
  14: { title: "Abuse Bond Imprint", glyph: "🌀", subtitle: "The bonds that bound.", isSpecial: true, weight: 2.0 },
  15: { title: "Escape/Power/Control Loops", glyph: "✦", subtitle: "The behavioral loops.", isSpecial: false, weight: 1.5 },
  16: { title: "Womb Mapping", glyph: "◯", subtitle: "The cyclical field.", isSpecial: false, weight: 1.0 },
};

const SECTION_FILE_MAP: Record<number, string> = {
  1: "Section_1.json",
  2: "S2_Relational_Patterns.json",
  3: "S3_Wound_Imprints.json",
  4: "S4_Mirror_Patterns.json",
  5: "S5_Survival_Archetypes.json",
  6: "S6_Soul_Disconnection.json",
  7: "S7_Somatic_Embodiment.json",
  8: "S8_Lineage_Imprint.json",
  9: "S9_Money_Survival.json",
  10: "S10_Longing_Reclamation.json",
  11: "S11_Thresholds.json",
  12: "S12_Open-Ended_Integration.json",
  13: "S13_Masculine_Mirror.json",
  14: "S14_Abuse_Bond_Imprint.json",
  15: "S15_Escape_Power_Loops.json",
  16: "S16_Womb_Mapping.json",
};

interface RawQuestion {
  id: string;
  question_text: string;
  is_ghost: boolean;
  answers: {
    code: string;
    text: string;
    spectrum_depth: string;
    ar_primary: string;
    ar_secondary: string;
    wi: string;
    mp: string;
    mmi?: string;
    abi?: string;
    epcl?: string;
    womb_field?: string;
  }[];
}

async function main() {
  console.log("🜂 Seeding Living Codex database...\n");

  // Clear existing data
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();
  console.log("Cleared existing data.");

  // Create sections
  for (const [num, meta] of Object.entries(SECTION_META)) {
    await prisma.section.create({
      data: {
        id: parseInt(num),
        title: meta.title,
        glyph: meta.glyph,
        subtitle: meta.subtitle,
        isSpecial: meta.isSpecial,
        weight: meta.weight,
      },
    });
  }
  console.log("Created 16 sections.");

  // Load questions and answers from extracted JSON
  const dataDir = path.resolve(__dirname, "../../data");
  let totalQuestions = 0;
  let totalAnswers = 0;

  for (const [sectionNum, fileName] of Object.entries(SECTION_FILE_MAP)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${fileName} not found`);
      continue;
    }

    const questions: RawQuestion[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const secNum = parseInt(sectionNum);
    const isOpenEnded = secNum === 12;

    for (const q of questions) {
      const qNum = parseInt(q.id.replace(/\D/g, "")) || 0;
      if (qNum === 0) continue;

      const question = await prisma.question.create({
        data: {
          sectionNum: secNum,
          questionNum: qNum,
          questionText: q.question_text.split("\n\n")[0] || q.question_text,
          invitation: q.question_text.includes("✦")
            ? q.question_text.split("✦")[1]?.trim() || null
            : null,
          isGhost: q.is_ghost,
          isOpenEnded: isOpenEnded,
        },
      });
      totalQuestions++;

      // Create answers (not for open-ended S12)
      if (!isOpenEnded && q.answers) {
        for (const a of q.answers) {
          if (!a.code || !a.text) continue;

          await prisma.answer.create({
            data: {
              questionId: question.id,
              code: a.code,
              text: a.text,
              spectrumDepth: a.spectrum_depth?.replace(/[●◐★○\s]/g, "").toUpperCase() || "UNKNOWN",
              arPrimary: a.ar_primary || "",
              arSecondary: a.ar_secondary || "",
              wi: a.wi || "",
              mp: a.mp || "",
              mmi: a.mmi || null,
              abi: a.abi || null,
              epcl: a.epcl || null,
              wombField: a.womb_field || null,
            },
          });
          totalAnswers++;
        }
      }
    }
    console.log(`  S${sectionNum} ${SECTION_META[secNum].title}: ${questions.length} questions loaded`);
  }

  // Create admin user (April)
  const bcrypt = require("bcryptjs");
  const adminHash = await bcrypt.hash("codex-admin-2025", 10);
  await prisma.user.upsert({
    where: { email: "april@justxempower.com" },
    update: {},
    create: {
      email: "april@justxempower.com",
      name: "April",
      passwordHash: adminHash,
      role: "admin",
    },
  });
  console.log("\nCreated admin user (april@justxempower.com)");

  console.log(`\n✦ Seed complete: ${totalQuestions} questions, ${totalAnswers} answers loaded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
