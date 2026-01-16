import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log("=== FIXING FOOTER NAVIGATION ===\n");

// Check current footer links
const [current] = await conn.execute(`SELECT label, url FROM navigation WHERE location = 'footer' ORDER BY \`order\``);
console.log("Current footer links:");
console.table(current);

// Get the max order
const [maxOrder] = await conn.execute(`SELECT MAX(\`order\`) as maxOrder FROM navigation WHERE location = 'footer'`);
let nextOrder = (maxOrder[0].maxOrder || 0) + 1;

// Check if Accessibility exists
const [accessibility] = await conn.execute(`SELECT id FROM navigation WHERE location = 'footer' AND url = '/accessibility'`);
if (accessibility.length === 0) {
  console.log("\nAdding Accessibility link...");
  await conn.execute(
    `INSERT INTO navigation (location, label, url, \`order\`, isExternal, openInNewTab) VALUES ('footer', 'Accessibility', '/accessibility', ?, 0, 0)`,
    [nextOrder++]
  );
}

// Check if Cookie Policy exists
const [cookiePolicy] = await conn.execute(`SELECT id FROM navigation WHERE location = 'footer' AND url = '/cookie-policy'`);
if (cookiePolicy.length === 0) {
  console.log("Adding Cookie Policy link...");
  await conn.execute(
    `INSERT INTO navigation (location, label, url, \`order\`, isExternal, openInNewTab) VALUES ('footer', 'Cookie Policy', '/cookie-policy', ?, 0, 0)`,
    [nextOrder++]
  );
}

// Verify
const [updated] = await conn.execute(`SELECT label, url FROM navigation WHERE location = 'footer' ORDER BY \`order\``);
console.log("\nUpdated footer links:");
console.table(updated);

await conn.end();
console.log("\n=== DONE ===");
