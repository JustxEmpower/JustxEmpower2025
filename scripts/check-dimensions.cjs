require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDimensions() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT id, name, imageUrl, images FROM products');
  
  for (const row of rows) {
    console.log(`\n=== Product: ${row.name} (ID: ${row.id}) ===`);
    console.log('imageUrl:', row.imageUrl);
    console.log('images:', row.images);
  }
  
  await conn.end();
}

checkDimensions().catch(console.error);
