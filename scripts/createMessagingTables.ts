import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  const statements = [
    `CREATE TABLE IF NOT EXISTS codex_conversations (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      circleId VARCHAR(30),
      type VARCHAR(20) NOT NULL DEFAULT 'direct',
      name VARCHAR(255),
      createdById VARCHAR(30) NOT NULL,
      lastMessageAt TIMESTAMP NULL,
      lastMessagePreview VARCHAR(200),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS codex_conversation_participants (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      conversationId VARCHAR(30) NOT NULL,
      userId VARCHAR(30) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      unreadCount INT NOT NULL DEFAULT 0,
      lastReadAt TIMESTAMP NULL,
      isPinned BOOLEAN NOT NULL DEFAULT FALSE,
      isMuted BOOLEAN NOT NULL DEFAULT FALSE,
      isArchived BOOLEAN NOT NULL DEFAULT FALSE,
      joinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      leftAt TIMESTAMP NULL,
      INDEX idx_conv_user (conversationId, userId),
      INDEX idx_user_convs (userId)
    )`,
    `CREATE TABLE IF NOT EXISTS codex_direct_messages (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      conversationId VARCHAR(30) NOT NULL,
      senderId VARCHAR(30) NOT NULL,
      content TEXT,
      contentType VARCHAR(30) NOT NULL DEFAULT 'text',
      parentMessageId VARCHAR(30),
      isUnsent BOOLEAN NOT NULL DEFAULT FALSE,
      readReceipts TEXT,
      metadata TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_conv_messages (conversationId, createdAt),
      INDEX idx_sender (senderId)
    )`,
    `CREATE TABLE IF NOT EXISTS codex_message_attachments (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      messageId VARCHAR(30) NOT NULL,
      type VARCHAR(20) NOT NULL,
      fileName VARCHAR(255),
      fileUrl TEXT,
      fileSize INT,
      mimeType VARCHAR(100),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_message (messageId)
    )`,
    `CREATE TABLE IF NOT EXISTS codex_user_presence (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      userId VARCHAR(30) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'offline',
      lastSeenAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      activeContext TEXT
    )`,
  ];

  for (const stmt of statements) {
    const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await db.execute(sql.raw(stmt));
      console.log(`✓ Created ${tableName}`);
    } catch (e: any) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`○ ${tableName} already exists`);
      } else {
        console.error(`✗ ${tableName}: ${e.message}`);
      }
    }
  }

  await connection.end();
  console.log("\nDone — messaging tables ready.");
}

main().catch(console.error);
