import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: true }
});

const db = drizzle(connection);

// Insert AI settings
await connection.execute(`
  INSERT INTO aiSettings (geminiApiKey, chatEnabled, chatBubbleColor, chatBubblePosition, systemPrompt, updatedAt)
  VALUES (?, 1, '#000000', 'bottom-right', 'You are an empathetic AI assistant for Just Empower, a platform dedicated to personal growth, healing, and empowerment. Guide visitors with compassion and understanding, answer questions about services, recommend resources, and help them on their journey of self-discovery. Maintain a warm, supportive, and professional tone.', NOW())
  ON DUPLICATE KEY UPDATE geminiApiKey = VALUES(geminiApiKey), updatedAt = NOW()
`, ['AIzaSyDuBe8CimGb1w81izfGBRgp_Vf9qNZlYkQ']);

console.log('✅ AI settings initialized with Gemini API key');

await connection.end();
