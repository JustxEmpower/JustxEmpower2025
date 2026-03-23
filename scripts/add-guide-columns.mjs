import 'dotenv/config';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

for (const [col, type] of [['preferredGuideId', 'VARCHAR(30)'], ['preferredVoiceId', 'VARCHAR(50)']]) {
  try {
    await conn.execute(`ALTER TABLE codex_user_settings ADD COLUMN ${col} ${type} DEFAULT NULL`);
    console.log(`✅ Added ${col}`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log(`⏩ ${col} already exists`);
    else console.error(`❌ ${col}: ${e.message}`);
  }
}

await conn.end();
console.log('Done');
process.exit(0);
