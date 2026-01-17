// Script to seed test zone data
import 'dotenv/config';
import mysql from 'mysql2/promise';

const blocksData = JSON.stringify([{
  id: "test_block_1",
  type: "je-principles",
  content: {
    title: "Foundational Principles",
    principles: [
      { number: "01", title: "Embodiment", description: "Real change happens not in the mind alone, but in the body..." },
      { number: "02", title: "Sacred Reciprocity", description: "We honor the give and take of life..." },
      { number: "03", title: "Feminine Wisdom", description: "We honor the intelligence of the feminine..." }
    ]
  },
  order: 0
}]);

async function seedZone() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Check if zone exists
    const [rows] = await conn.execute(
      'SELECT id FROM pageZones WHERE pageSlug = ? AND zoneName = ?',
      ['home', 'after-hero']
    );
    
    if (rows.length > 0) {
      // Update existing
      await conn.execute(
        'UPDATE pageZones SET blocks = ?, isActive = 1 WHERE pageSlug = ? AND zoneName = ?',
        [blocksData, 'home', 'after-hero']
      );
      console.log('Updated existing zone');
    } else {
      // Insert new
      await conn.execute(
        'INSERT INTO pageZones (pageSlug, zoneName, blocks, isActive) VALUES (?, ?, ?, 1)',
        ['home', 'after-hero', blocksData]
      );
      console.log('Inserted new zone');
    }
    
    // Verify
    const [result] = await conn.execute(
      'SELECT * FROM pageZones WHERE pageSlug = ? AND zoneName = ?',
      ['home', 'after-hero']
    );
    console.log('Zone data:', result[0]);
    
  } finally {
    await conn.end();
  }
}

seedZone().catch(console.error);
