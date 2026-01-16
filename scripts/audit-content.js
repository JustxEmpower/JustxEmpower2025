import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log("=== CONTENT AUDIT ===\n");

// Get all pages and their content counts
console.log("1. Pages with content in siteContent table:");
const [pages] = await conn.execute(`SELECT page, COUNT(*) as count FROM siteContent GROUP BY page ORDER BY page`);
console.table(pages);

// Get all sections per page
console.log("\n2. Sections per page:");
const [sections] = await conn.execute(`SELECT page, section, COUNT(*) as fields FROM siteContent GROUP BY page, section ORDER BY page, section`);
console.table(sections);

// Check contentTextStyles table
console.log("\n3. Text styles in database:");
const [styles] = await conn.execute(`SELECT COUNT(*) as totalStyles FROM contentTextStyles`);
console.log(`Total text styles saved: ${styles[0].totalStyles}`);

// Check for styles with fontSize or fontColor set
const [fontStyles] = await conn.execute(`SELECT COUNT(*) as count FROM contentTextStyles WHERE fontSize IS NOT NULL AND fontSize != '' OR fontColor IS NOT NULL AND fontColor != ''`);
console.log(`Styles with fontSize/fontColor: ${fontStyles[0].count}`);

// Check pages table
console.log("\n4. Pages in pages table:");
const [allPages] = await conn.execute(`SELECT slug, title, published FROM pages ORDER BY slug`);
console.table(allPages);

await conn.end();
console.log("\n=== AUDIT COMPLETE ===");
