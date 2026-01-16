import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log("=== CONTENT CHECK ===\n");

// Check hero video URL
console.log("1. Home hero section content:");
const [hero] = await conn.execute(`SELECT contentKey, contentValue FROM siteContent WHERE page = 'home' AND section = 'hero'`);
console.table(hero);

// Check navigation/footer links
console.log("\n2. Footer navigation links:");
const [footerNav] = await conn.execute(`SELECT label, url FROM navigation WHERE location = 'footer'`);
console.table(footerNav);

// Check pages table
console.log("\n3. Published pages:");
const [pages] = await conn.execute(`SELECT slug, title, published FROM pages WHERE published = 1`);
console.table(pages);

await conn.end();
console.log("\n=== CHECK COMPLETE ===");
