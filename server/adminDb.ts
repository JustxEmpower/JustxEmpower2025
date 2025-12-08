import { eq, desc } from "drizzle-orm";
import { adminUsers, articles, siteContent, InsertArticle, InsertSiteContent } from "../drizzle/schema";
import { getDb } from "./db";
import crypto from "crypto";

// Password hashing
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Admin user operations
export async function getAdminByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAdminPassword(username: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(adminUsers)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(adminUsers.username, username));
}

export async function updateAdminUsername(oldUsername: string, newUsername: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(adminUsers)
    .set({ username: newUsername, updatedAt: new Date() })
    .where(eq(adminUsers.username, oldUsername));
}

// Article operations
export async function getAllArticles(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(articles).orderBy(desc(articles.createdAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  if (offset) {
    query = query.offset(offset) as any;
  }
  
  return await query;
}

export async function getPublishedArticles(limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(articles)
    .where(eq(articles.published, 1))
    .orderBy(desc(articles.createdAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  if (offset) {
    query = query.offset(offset) as any;
  }
  
  return await query;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(articles).values(article);
  return result;
}

export async function updateArticle(id: number, article: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(articles)
    .set({ ...article, updatedAt: new Date() })
    .where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(articles).where(eq(articles.id, id));
}

// Site content operations
export async function getSiteContentByPage(page: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(siteContent).where(eq(siteContent.page, page));
}

export async function getSiteContentByPageAndSection(page: string, section: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(siteContent)
    .where(eq(siteContent.page, page));
}

export async function getAllSiteContent() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(siteContent);
}

export async function upsertSiteContent(content: InsertSiteContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(siteContent).values(content).onDuplicateKeyUpdate({
    set: { contentValue: content.contentValue, updatedAt: new Date() }
  });
}

export async function updateSiteContent(id: number, contentValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(siteContent)
    .set({ contentValue, updatedAt: new Date() })
    .where(eq(siteContent.id, id));
}
