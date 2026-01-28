const mysql = require('mysql2/promise');

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection(dbUrl);

  // Media fields to restore - extracted from deleted entries
  const mediaFields = [
    // HOME
    { page: 'home', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/home-hero.mp4' },
    { page: 'home', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/home-hero.jpg' },
    { page: 'home', section: 'community', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/community.jpg' },
    { page: 'home', section: 'philosophy', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/philosophy.jpg' },
    { page: 'home', section: 'pointsOfAccess', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/points-of-access.jpg' },
    
    // OFFERINGS
    { page: 'offerings', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/offerings-hero.jpg' },
    { page: 'offerings', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/offerings-hero.mp4' },
    { page: 'offerings', section: 'emerge', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/emerge.jpg' },
    { page: 'offerings', section: 'rootedUnity', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/rooted-unity.jpg' },
    { page: 'offerings', section: 'seeds', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/seeds.jpg' },
    { page: 'offerings', section: 'sheWrites', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/she-writes.jpg' },
    
    // PHILOSOPHY
    { page: 'philosophy', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/philosophy-hero.mp4' },
    { page: 'philosophy', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/philosophy-hero.jpg' },
    { page: 'philosophy', section: 'pillars', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/pillars.jpg' },
    { page: 'philosophy', section: 'principles', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/principles.jpg' },
    
    // WALK-WITH-US
    { page: 'walk-with-us', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/walk-with-us-hero.jpg' },
    { page: 'walk-with-us', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/walk-with-us-hero.mp4' },
    { page: 'walk-with-us', section: 'quote', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/walk-with-us-quote.jpg' },
    
    // RESOURCES
    { page: 'resources', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/resources-hero.jpg' },
    { page: 'resources', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/resources-hero.mp4' },
    
    // CONTACT
    { page: 'contact', section: 'hero', contentKey: 'imageUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/images/contact-hero.jpg' },
    { page: 'contact', section: 'hero', contentKey: 'videoUrl', contentValue: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/videos/contact-hero.mp4' },
    
    // COMMUNITY-EVENTS
    { page: 'community-events', section: 'hero', contentKey: 'imageUrl', contentValue: '' },
    { page: 'community-events', section: 'hero', contentKey: 'videoUrl', contentValue: '' },
  ];

  console.log(`Restoring ${mediaFields.length} media fields...\n`);

  for (const field of mediaFields) {
    try {
      // Check if field already exists
      const [existing] = await conn.execute(
        'SELECT id FROM siteContent WHERE page = ? AND section = ? AND contentKey = ?',
        [field.page, field.section, field.contentKey]
      );
      
      if (existing.length > 0) {
        console.log(`  EXISTS: ${field.page}.${field.section}.${field.contentKey}`);
      } else {
        await conn.execute(
          'INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES (?, ?, ?, ?)',
          [field.page, field.section, field.contentKey, field.contentValue]
        );
        console.log(`  ADDED: ${field.page}.${field.section}.${field.contentKey}`);
      }
    } catch (err) {
      console.error(`  ERROR: ${field.page}.${field.section}.${field.contentKey}: ${err.message}`);
    }
  }

  // Show final counts
  const [rows] = await conn.execute(
    `SELECT page, COUNT(*) as total FROM siteContent 
     WHERE page IN ('home', 'offerings', 'philosophy', 'walk-with-us', 'resources', 'contact', 'community-events')
     GROUP BY page ORDER BY page`
  );
  
  console.log('\nFinal entry counts:');
  for (const row of rows) {
    console.log(`  ${row.page}: ${row.total}`);
  }

  await conn.end();
  console.log('\nDone!');
}

run().catch(console.error);
