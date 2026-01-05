import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Update home hero video URL to a working video
  const videoUrl = 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/OWq_P7pPl7FcH6xEaM2mb.mp4';
  
  await conn.execute(
    `UPDATE siteContent SET contentValue = ? WHERE page = 'home' AND section = 'hero' AND contentKey = 'videoUrl'`,
    [videoUrl]
  );
  
  console.log('Updated home hero video URL to:', videoUrl);
  
  // Also update founder video URL
  const founderVideoUrl = 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/Dsb2B6tn7x1Hpsnh-ZT8c.mp4';
  
  await conn.execute(
    `UPDATE siteContent SET contentValue = ? WHERE page = 'founder' AND section = 'hero' AND contentKey = 'videoUrl'`,
    [founderVideoUrl]
  );
  
  console.log('Updated founder hero video URL to:', founderVideoUrl);
  
  await conn.end();
  console.log('Done!');
}

main().catch(console.error);
