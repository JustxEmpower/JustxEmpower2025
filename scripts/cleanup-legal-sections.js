import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const pageSlugs = ["accessibility", "privacy-policy", "terms-of-service", "cookie-policy"];

// Delete the legalSections JSON data from siteContent (these are the numbered sections in the editor)
for (const slug of pageSlugs) {
  const [result] = await conn.execute(
    `DELETE FROM siteContent WHERE page = ? AND section = 'legalSections'`,
    [slug]
  );
  console.log(`${slug}: deleted ${result.affectedRows} legalSections entries from siteContent`);
}

await conn.end();
console.log("Done!");
