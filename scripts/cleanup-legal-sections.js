import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const pageSlugs = ["accessibility", "privacy-policy", "terms-of-service", "cookie-policy"];

// Delete ALL siteContent sections for legal pages (Hero, Measures, etc.)
// The legal pages will only use LegalPageEditorNew sections
console.log("=== Deleting all siteContent sections for legal pages ===");
for (const slug of pageSlugs) {
  const [result] = await conn.execute(
    `DELETE FROM siteContent WHERE page = ?`,
    [slug]
  );
  console.log(`${slug}: deleted ${result.affectedRows} entries from siteContent`);
}

await conn.end();
console.log("\nDone!");
