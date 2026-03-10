/**
 * Seed codex_questions and codex_answers from Living Codex JSON data files.
 * Run from project root: node scripts/seed-codex-questions.js
 */
const dotenv = require("dotenv");
dotenv.config({ quiet: true });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");

const SECTION_FILE_MAP = {
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

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DB_HOST,
    user: process.env.DATABASE_USER || process.env.DB_USER,
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DB_NAME,
  });

  console.log("Connected to database.");

  // Check current counts
  const [[{ qc }]] = await conn.query("SELECT COUNT(*) as qc FROM codex_questions");
  const [[{ ac }]] = await conn.query("SELECT COUNT(*) as ac FROM codex_answers");
  console.log(`Current: ${qc} questions, ${ac} answers`);

  if (qc > 0) {
    console.log("Questions already exist. Clearing...");
    await conn.query("DELETE FROM codex_answers");
    await conn.query("DELETE FROM codex_questions");
  }

  const dataDir = path.resolve(__dirname, "../living-codex-data");
  let totalQ = 0, totalA = 0;

  for (const [secNumStr, fileName] of Object.entries(SECTION_FILE_MAP)) {
    const secNum = parseInt(secNumStr);
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${fileName} not found`);
      continue;
    }

    const questions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const isOpenEnded = secNum === 12;

    for (const q of questions) {
      const qNum = parseInt(q.id.replace(/\D/g, "")) || 0;
      if (qNum === 0) continue;

      const qId = nanoid(25);
      const questionText = q.question_text.split("\n\n")[0] || q.question_text;
      const invitation = q.question_text.includes("\u2726")
        ? q.question_text.split("\u2726")[1]?.trim() || null
        : null;

      await conn.query(
        "INSERT INTO codex_questions (id, sectionNum, questionNum, questionText, invitation, isGhost, isOpenEnded) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [qId, secNum, qNum, questionText, invitation, q.is_ghost ? 1 : 0, isOpenEnded ? 1 : 0]
      );
      totalQ++;

      if (!isOpenEnded && q.answers) {
        for (const a of q.answers) {
          if (!a.code || !a.text) continue;
          const aId = nanoid(25);
          const spectrum = (a.spectrum_depth || "").replace(/[●◐★○\s]/g, "").toUpperCase() || "UNKNOWN";

          await conn.query(
            "INSERT INTO codex_answers (id, questionId, code, text, spectrumDepth, arPrimary, arSecondary, wi, mp, mmi, abi, epcl, wombField) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [aId, qId, a.code, a.text, spectrum, a.ar_primary || "", a.ar_secondary || "", a.wi || "", a.mp || "", a.mmi || null, a.abi || null, a.epcl || null, a.womb_field || null]
          );
          totalA++;
        }
      }
    }
    console.log(`  S${secNum}: ${questions.length} questions loaded`);
  }

  console.log(`\nSeed complete: ${totalQ} questions, ${totalA} answers.`);
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
