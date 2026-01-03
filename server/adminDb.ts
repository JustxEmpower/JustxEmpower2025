import { eq, desc } from "drizzle-orm";
import { 
  adminUsers, 
  articles, 
  siteContent, 
  media, 
  themeSettings,
  brandAssets,
  pages,
  pageBlocks,
  blockVersions,
  navigation,
  seoSettings,
  siteSettings,
  aiChatConversations,
  aiSettings,
  aiFeedback,
  visitorProfiles,
  InsertArticle, 
  InsertSiteContent,
  ParsedPageBlock 
} from "../drizzle/schema";
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

// ============================================
// Media Management Functions
// ============================================

export async function createMedia(data: {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  url: string;
  type: "image" | "video";
  uploadedBy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(media).values(data);
  return result;
}

export async function getAllMedia() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(media).orderBy(desc(media.createdAt));
}

export async function getMediaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [result] = await db.select().from(media).where(eq(media.id, id));
  return result;
}

export async function deleteMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(media).where(eq(media.id, id));
}


// Theme Settings operations
export async function getThemeSettings() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(themeSettings).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateThemeSettings(settings: Partial<typeof themeSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getThemeSettings();
  
  if (existing) {
    await db.update(themeSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(themeSettings.id, existing.id));
  } else {
    await db.insert(themeSettings).values({
      ...settings,
      updatedAt: new Date(),
    } as any);
  }
}

// Brand Assets operations
export async function getAllBrandAssets() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(brandAssets).orderBy(desc(brandAssets.updatedAt));
}

export async function createBrandAsset(asset: typeof brandAssets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(brandAssets).values(asset);
}

export async function deleteBrandAsset(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(brandAssets).where(eq(brandAssets.id, id));
}


/**
 * Pages Management
 */
export async function getAllPages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pages).orderBy(pages.navOrder);
}

export async function getPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPage(data: {
  title: string;
  slug: string;
  template?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  published?: number;
  showInNav?: number;
  navOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(pages).values(data);
  return { id: result.insertId };
}

export async function updatePage(id: number, data: Partial<{
  title: string;
  slug: string;
  template: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  published: number;
  showInNav: number;
  navOrder: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pages).set(data).where(eq(pages.id, id));
  return { success: true };
}

export async function deletePage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(pages).where(eq(pages.id, id));
  return { success: true };
}

export async function reorderPages(pageOrders: { id: number; navOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update each page's navOrder
  for (const page of pageOrders) {
    await db.update(pages).set({ navOrder: page.navOrder }).where(eq(pages.id, page.id));
  }
  
  return { success: true };
}


// ============= PAGE BLOCKS MANAGEMENT =============

export async function getPageBlocks(pageId: number): Promise<ParsedPageBlock[]> {
  const db = await getDb();
  if (!db) return [];
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(pageBlocks.order);
  
  // Parse JSON fields - handle both JSON strings and plain strings
  return blocks.map(block => {
    let content = {};
    try {
      content = block.content ? JSON.parse(block.content) : {};
    } catch {
      // If content is not valid JSON, treat it as plain HTML text
      content = { html: block.content };
    }
    
    return {
      ...block,
      content,
      settings: block.settings ? JSON.parse(block.settings) : {},
      animation: block.animation ? JSON.parse(block.animation) : {},
      visibility: block.visibility ? JSON.parse(block.visibility) : {},
    };
  });
}

export async function createPageBlock(data: {
  pageId: number;
  type: string; // Accept any block type from Page Builder
  content: string;
  order: number;
  settings?: string;
  visibility?: string;
  animation?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(pageBlocks).values({
    pageId: data.pageId,
    type: data.type,
    content: data.content,
    order: data.order,
    settings: data.settings || "{}",
    visibility: data.visibility || "{}",
    animation: data.animation || "{}",
  });
  
  return { success: true, id: result.insertId };
}

export async function updatePageBlock(id: number, data: {
  content?: string;
  order?: number;
  settings?: string;
  visibility?: string;
  animation?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current block data before updating
  const [currentBlock] = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.id, id))
    .limit(1);
  
  if (currentBlock) {
    // Get the latest version number for this block
    const versions = await db
      .select()
      .from(blockVersions)
      .where(eq(blockVersions.blockId, id));
    
    const nextVersionNumber = versions.length + 1;
    
    // Save current state as a version
    await db.insert(blockVersions).values({
      blockId: id,
      pageId: currentBlock.pageId,
      type: currentBlock.type,
      content: currentBlock.content,
      order: currentBlock.order,
      settings: currentBlock.settings,
      versionNumber: nextVersionNumber,
      createdBy: "admin", // TODO: Get from context
    });
  }
  
  // Update the block
  await db
    .update(pageBlocks)
    .set(data)
    .where(eq(pageBlocks.id, id));
}

export async function deletePageBlock(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(pageBlocks)
    .where(eq(pageBlocks.id, id));
}

export async function reorderPageBlocks(blocks: { id: number; order: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const block of blocks) {
    await db
      .update(pageBlocks)
      .set({ order: block.order })
      .where(eq(pageBlocks.id, block.id));
  }
}


// ============= SEO SETTINGS MANAGEMENT =============

export async function addPageToSeoSettings(
  pageId: number,
  pageSlug: string,
  metaTitle?: string,
  metaDescription?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if SEO settings already exist for this page
  const existing = await db
    .select()
    .from(seoSettings)
    .where(eq(seoSettings.pageSlug, pageSlug))
    .limit(1);

  if (existing.length > 0) {
    // Update existing SEO settings if new values are provided
    if (metaTitle || metaDescription) {
      await db
        .update(seoSettings)
        .set({
          ...(metaTitle && { metaTitle }),
          ...(metaDescription && { metaDescription }),
        })
        .where(eq(seoSettings.pageSlug, pageSlug));
    }
    return { success: true, updated: true };
  }

  // Create new SEO settings entry (only use columns that exist in the schema)
  await db.insert(seoSettings).values({
    pageSlug,
    metaTitle: metaTitle || pageSlug,
    metaDescription: metaDescription || '',
    metaKeywords: '',
    ogTitle: metaTitle || pageSlug,
    ogDescription: metaDescription || '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    canonicalUrl: `/${pageSlug}`,
    noIndex: 0,
    structuredData: '',
  });

  return { success: true, created: true };
}
