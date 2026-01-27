require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [nonTest] = await conn.query("SELECT COUNT(*) as cnt FROM siteContent WHERE contentValue != 'TEST'");
  console.log('Non-TEST fields:', nonTest[0].cnt);
  
  const [sample] = await conn.query(`
    SELECT page, section, contentKey, LEFT(contentValue, 50) as val 
    FROM siteContent 
    WHERE contentValue != 'TEST' 
    LIMIT 10
  `);
  
  console.log('\nSample non-TEST content:');
  sample.forEach(s => console.log(`  ${s.page}.${s.section}.${s.contentKey} = "${s.val}"`));
  
  await conn.end();
}

check().catch(console.error);
