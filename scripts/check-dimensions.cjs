require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDimensions() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT id, name, dimensions FROM products');
  
  for (const row of rows) {
    console.log(`\n=== Product: ${row.name} (ID: ${row.id}) ===`);
    console.log('Raw dimensions:', row.dimensions);
    if (row.dimensions) {
      try {
        const parsed = JSON.parse(row.dimensions);
        console.log('Parsed productDetails:', parsed.productDetails ? parsed.productDetails.substring(0, 100) + '...' : 'NOT FOUND');
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }
  }
  
  await conn.end();
}

checkDimensions().catch(console.error);
