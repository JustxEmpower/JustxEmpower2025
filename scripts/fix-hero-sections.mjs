import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Default hero images/videos for each page
const heroDefaults = {
  60001: { // home
    imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/builds/latest/public/media/09/About-Founder-NH-Roots.jpg'
  },
  60003: { // philosophy
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60004: { // offerings
    imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/builds/latest/public/media/09/About-Founder-NH-Roots.jpg'
  },
  60005: { // contact
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60006: { // resources
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60007: { // walk-with-us
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60008: { // community-events
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60009: { // journal
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60010: { // shop
    videoUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4'
  },
  60012: { // workshops
    imageUrl: 'https://justxempower-assets.s3.us-east-1.amazonaws.com/builds/latest/public/media/09/About-Founder-NH-Roots.jpg'
  }
};

async function fixHeroSections() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log('Fixing Hero sections with empty fields...\n');
  
  let updated = 0;
  
  for (const [pageId, defaults] of Object.entries(heroDefaults)) {
    // Get current hero section content
    const [rows] = await conn.execute(
      'SELECT id, content FROM pageSections WHERE pageId = ? AND title = "Hero Section"',
      [pageId]
    );
    
    if (rows.length === 0) {
      console.log(`No Hero Section found for pageId ${pageId}`);
      continue;
    }
    
    const row = rows[0];
    let content = {};
    try {
      content = JSON.parse(row.content || '{}');
    } catch(e) {
      content = {};
    }
    
    // Merge defaults into content (only fill empty fields)
    let changed = false;
    for (const [key, value] of Object.entries(defaults)) {
      if (!content[key] || content[key] === '') {
        content[key] = value;
        changed = true;
        console.log(`  pageId ${pageId}: Setting ${key}`);
      }
    }
    
    if (changed) {
      await conn.execute(
        'UPDATE pageSections SET content = ? WHERE id = ?',
        [JSON.stringify(content), row.id]
      );
      updated++;
    }
  }
  
  console.log(`\nUpdated ${updated} Hero sections`);
  
  await conn.end();
}

fixHeroSections().catch(console.error);
