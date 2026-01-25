require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkProducts() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT id, name, status FROM products');
  console.log('Products in database:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

checkProducts().catch(console.error);
