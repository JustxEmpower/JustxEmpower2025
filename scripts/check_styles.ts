import mysql from 'mysql2/promise';

async function checkStyles() {
  const connection = await mysql.createConnection({
    host: 'justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com',
    user: 'justxempower',
    password: 'JustEmpower2025Secure',
    database: 'justxempower'
  });

  // Check home page hero content with their styles
  const [result] = await connection.execute(`
    SELECT 
      sc.id, sc.page, sc.section, sc.contentKey,
      cts.isBold, cts.isItalic, cts.isUnderline, cts.fontSize, cts.fontColor, cts.fontOverride
    FROM siteContent sc
    LEFT JOIN contentTextStyles cts ON sc.id = cts.contentId
    WHERE sc.page = 'home' AND sc.section = 'hero'
  `);
  
  console.log('=== Home Hero Content with Styles ===');
  console.log(JSON.stringify(result, null, 2));

  await connection.end();
}

checkStyles().catch(console.error);
