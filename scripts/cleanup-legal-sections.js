import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const pageSlugs = ["accessibility", "privacy-policy", "terms-of-service", "cookie-policy"];

// First, show what sections exist for each page
console.log("=== Current sections in siteContent ===");
for (const slug of pageSlugs) {
  const [rows] = await conn.execute(
    `SELECT DISTINCT section FROM siteContent WHERE page = ?`,
    [slug]
  );
  console.log(`${slug}: ${rows.map(r => r.section).join(", ") || "(none)"}`);
}

// Keep only hero section, delete everything else (the numbered sections come from legalSections JSON)
console.log("\n=== Deleting non-hero sections ===");
for (const slug of pageSlugs) {
  // Delete legalSections (the JSON that creates numbered sections in the editor)
  const [result1] = await conn.execute(
    `DELETE FROM siteContent WHERE page = ? AND section = 'legalSections'`,
    [slug]
  );
  console.log(`${slug}: deleted ${result1.affectedRows} legalSections entries`);
}

await conn.end();
console.log("\nDone!");
