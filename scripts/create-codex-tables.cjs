const mysql = require('mysql2/promise');

const url = 'mysql://justxempower:JustEmpower2025Secure@justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com:3306/justxempower';

async function main() {
  const conn = await mysql.createConnection(url);

  const tables = [
    `CREATE TABLE IF NOT EXISTS codex_journal_entries (
      id varchar(30) NOT NULL PRIMARY KEY,
      userId varchar(30) NOT NULL,
      title varchar(255) NOT NULL,
      content text NOT NULL,
      mood varchar(50) DEFAULT NULL,
      themes text DEFAULT NULL,
      aiPrompt text DEFAULT NULL,
      aiSummary text DEFAULT NULL,
      phase varchar(50) DEFAULT NULL,
      archetypeContext varchar(100) DEFAULT NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS codex_guide_conversations (
      id varchar(30) NOT NULL PRIMARY KEY,
      userId varchar(30) NOT NULL,
      guideId varchar(50) NOT NULL,
      title varchar(255) DEFAULT NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS codex_guide_messages (
      id varchar(30) NOT NULL PRIMARY KEY,
      conversationId varchar(30) NOT NULL,
      role varchar(20) NOT NULL,
      content text NOT NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS codex_user_settings (
      id varchar(30) NOT NULL PRIMARY KEY,
      userId varchar(30) NOT NULL,
      weatherZip varchar(10) DEFAULT NULL,
      weatherLat varchar(20) DEFAULT NULL,
      weatherLon varchar(20) DEFAULT NULL,
      guideStyle varchar(50) DEFAULT 'poetic',
      guideFrequency varchar(50) DEFAULT 'daily',
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    const name = sql.match(/EXISTS\s+(\w+)/)[1];
    try {
      await conn.execute(sql);
      console.log('OK:', name);
    } catch (e) {
      console.log('FAIL:', name, e.message);
    }
  }

  await conn.end();
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
