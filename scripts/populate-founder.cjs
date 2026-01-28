const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'justxempower'
  });

  const content = [
    ['founder','hero','title','April Gambardella'],
    ['founder','hero','subtitle','FOUNDER & VISIONARY'],
    ['founder','hero','description','A journey of truth, healing, and empowerment.'],
    ['founder','hero','videoUrl',''],
    ['founder','hero','imageUrl',''],
    ['founder','opening','paragraph1','There are moments in life when everything shifts.'],
    ['founder','opening','paragraph2','My path has been shaped by experiences that demanded I look deeper.'],
    ['founder','opening','paragraph3','Just Empower was born from this journey.'],
    ['founder','truth','title','The Truth Behind Just Empower'],
    ['founder','truth','description','Just Empower exists because I believe in the profound capacity of every person to heal and grow.'],
    ['founder','depth','title','The Depth Beneath'],
    ['founder','depth','paragraph1','Before this work found me, I walked through my own dark nights.'],
    ['founder','remembrance','title','A Thread of Remembrance'],
    ['founder','remembrance','quote','We do not heal in isolation, but in community.'],
    ['founder','renewal','title','The Path of Renewal'],
    ['founder','renewal','paragraph1','Each day offers a new beginning.'],
    ['founder','future','title','Looking Forward'],
    ['founder','future','paragraph1','The future holds infinite possibilities.'],
  ];

  for (const [page, section, key, value] of content) {
    await conn.execute(
      `INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue)`,
      [page, section, key, value]
    );
    console.log(`Inserted: ${section}.${key}`);
  }

  await conn.end();
  console.log('Done!');
}

run().catch(console.error);
