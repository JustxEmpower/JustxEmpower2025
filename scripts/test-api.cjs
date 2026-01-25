require('dotenv').config();
const mysql = require('mysql2/promise');

// Simulate what the API does
function safeJsonParse(jsonString, defaultValue) {
  if (!jsonString || jsonString === '' || jsonString === 'null' || jsonString === 'undefined') {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

async function testApi() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute("SELECT * FROM products WHERE id = 4");
  
  if (rows.length > 0) {
    const product = rows[0];
    console.log('=== Raw Product ===');
    console.log('dimensions field:', product.dimensions);
    
    console.log('\n=== After safeJsonParse (what API returns) ===');
    const parsedDimensions = safeJsonParse(product.dimensions, {});
    console.log('parsedDimensions:', JSON.stringify(parsedDimensions, null, 2));
    console.log('\nproductDetails value:', parsedDimensions.productDetails);
  } else {
    console.log('Product not found');
  }
  
  await conn.end();
}

testApi().catch(console.error);
