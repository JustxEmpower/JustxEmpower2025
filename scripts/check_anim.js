import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection('mysql://justxempower:JustEmpower2025Secure@justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com:3306/justxempower');
  const [rows] = await c.query('SELECT id, content FROM pageBlocks WHERE pageId=67');
  let count = 0;
  rows.forEach(r => {
    try {
      const p = JSON.parse(r.content);
      if (p.animation) {
        count++;
        console.log('Block', r.id, 'animation:', p.animation.enabled, p.animation.category);
      }
    } catch(e) {}
  });
  console.log(count + ' blocks with animation in content');
  await c.end();
})();
