import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const pageSlugs = ["accessibility", "privacy-policy", "terms-of-service", "cookie-policy"];

// Delete all numbered sections from pageSections for these legal pages
for (const slug of pageSlugs) {
  // First find the page ID
  const [pages] = await conn.execute(
    `SELECT id FROM pages WHERE slug = ?`,
    [slug]
  );
  
  if (pages.length > 0) {
    const pageId = pages[0].id;
    // Delete all sections for this page from pageSections
    const [result] = await conn.execute(
      `DELETE FROM pageSections WHERE pageId = ?`,
      [pageId]
    );
    console.log(`${slug} (pageId ${pageId}): deleted ${result.affectedRows} sections from pageSections`);
  } else {
    console.log(`${slug}: page not found in pages table`);
  }
}

await conn.end();
console.log("Done!");
