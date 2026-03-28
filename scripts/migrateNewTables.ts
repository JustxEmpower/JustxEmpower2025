/**
 * Migrate New Codex Phase Tables
 * ============================================================
 * Reads the SQL migration file (drizzle/0006_glamorous_snowbird.sql),
 * checks which tables already exist, and creates only the missing ones.
 *
 * Run:
 *   npx tsx scripts/migrateNewTables.ts
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Target tables ──────────────────────────────────────────────────────

const REQUIRED_TABLES = [
  "codex_adaptive_sessions",
  "codex_adaptive_responses",
  "codex_question_signals",
  "codex_check_ins",
  "codex_check_in_patterns",
  "codex_dialogue_sessions",
  "codex_dialogue_exchanges",
  "codex_micro_revelations",
  "codex_real_world_challenges",
  "codex_mirror_snapshots",
  "codex_mirror_addendums",
  "codex_pattern_shifts",
  "codex_guide_memory",
  "codex_guide_key_moments",
  "codex_predictions",
  "codex_prediction_outcomes",
  "codex_events",
  "codex_scroll_layers",
  "codex_scroll_interactions",
  "codex_companion_state",
  "codex_milestones",
  "codex_user_streaks",
];

// ── DB connection ──────────────────────────────────────────────────────

const DB_URL =
  process.env.DATABASE_URL ??
  `mysql://${process.env.DB_USER ?? "root"}:${process.env.DB_PASS ?? ""}@${process.env.DB_HOST ?? "localhost"}:3306/${process.env.DB_NAME ?? "justxempower"}`;

// ── Parse SQL file ─────────────────────────────────────────────────────

function extractCreateStatements(sql: string): Map<string, string> {
  const map = new Map<string, string>();

  // Split on the drizzle statement breakpoint marker
  const blocks = sql.split("--> statement-breakpoint");

  for (const block of blocks) {
    const trimmed = block.trim();
    // Match CREATE TABLE `tableName` (...)
    const match = trimmed.match(/^CREATE\s+TABLE\s+`(\w+)`/i);
    if (match) {
      const tableName = match[1];
      map.set(tableName, trimmed);
    }
  }

  return map;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Codex Phase Table Migration ===\n");

  // 1. Read SQL file
  const sqlPath = resolve(
    import.meta.dirname ?? ".",
    "..",
    "drizzle",
    "0006_glamorous_snowbird.sql"
  );
  console.log(`Reading SQL from: ${sqlPath}`);
  const sqlContent = readFileSync(sqlPath, "utf-8");
  const createStatements = extractCreateStatements(sqlContent);
  console.log(`Found ${createStatements.size} CREATE TABLE statements in SQL file.\n`);

  // 2. Connect to database
  console.log(`Connecting to database...`);
  const connection = await mysql.createConnection(DB_URL);
  console.log("Connected.\n");

  try {
    // 3. Get existing tables
    const [rows] = await connection.query("SHOW TABLES");
    const existingTables = new Set(
      (rows as any[]).map((row: any) => Object.values(row)[0] as string)
    );
    console.log(`Database has ${existingTables.size} existing tables.\n`);

    // 4. Compare and create missing tables
    const alreadyExist: string[] = [];
    const created: string[] = [];
    const notInSql: string[] = [];
    const errors: { table: string; error: string }[] = [];

    for (const tableName of REQUIRED_TABLES) {
      if (existingTables.has(tableName)) {
        alreadyExist.push(tableName);
        continue;
      }

      const createStmt = createStatements.get(tableName);
      if (!createStmt) {
        notInSql.push(tableName);
        continue;
      }

      try {
        await connection.query(createStmt);
        created.push(tableName);
        console.log(`  CREATED: ${tableName}`);
      } catch (err: any) {
        errors.push({ table: tableName, error: err.message });
        console.error(`  ERROR creating ${tableName}: ${err.message}`);
      }
    }

    // 5. Report
    console.log("\n=== Migration Report ===\n");

    if (alreadyExist.length > 0) {
      console.log(`Already existed (${alreadyExist.length}):`);
      alreadyExist.forEach((t) => console.log(`  - ${t}`));
    }

    if (created.length > 0) {
      console.log(`\nCreated (${created.length}):`);
      created.forEach((t) => console.log(`  + ${t}`));
    }

    if (notInSql.length > 0) {
      console.log(`\nNot found in SQL file (${notInSql.length}):`);
      notInSql.forEach((t) => console.log(`  ? ${t}`));
    }

    if (errors.length > 0) {
      console.log(`\nErrors (${errors.length}):`);
      errors.forEach((e) => console.log(`  ! ${e.table}: ${e.error}`));
    }

    console.log(
      `\nDone. ${created.length} tables created, ${alreadyExist.length} already existed.`
    );
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
