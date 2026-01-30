import { eq, desc, isNull, isNotNull, lt, and } from "drizzle-orm";
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

// ==========================================
// SAFE JSON PARSING UTILITY
// ==========================================

/**
 * Safely parses JSON with fallback value
 * Handles malformed JSON, plain strings, and null values
 */
function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  
  // Already an object (shouldn't happen but defensive)
  if (typeof value === 'object') return value as T;
  
  // Trim whitespace
  const trimmed = value.trim();
  
  // Empty string
  if (trimmed === '') return fallback;
  
  // Check if it looks like JSON
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed ?? fallback;
    } catch (e) {
      console.warn('[safeParseJSON] Failed to parse:', e, 'Value:', trimmed.substring(0, 100));
      return fallback;
    }
  }
  
  // Plain text - wrap in object
  if (typeof value === 'string' && value.trim()) {
    return { html: value, text: value } as unknown as T;
  }
  
  return fallback;
}

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
  
  // Sort by displayOrder first (ascending), then by createdAt (descending) for articles with same order
  let query = db.select().from(articles).orderBy(articles.displayOrder, desc(articles.createdAt));
  
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
  
  // First check if a record exists with this page+section+contentKey combination
  const existing = await db.select()
    .from(siteContent)
    .where(
      and(
        eq(siteContent.page, content.page),
        eq(siteContent.section, content.section),
        eq(siteContent.contentKey, content.contentKey)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing record
    await db.update(siteContent)
      .set({ contentValue: content.contentValue, updatedAt: new Date() })
      .where(eq(siteContent.id, existing[0].id));
  } else {
    // Insert new record
    await db.insert(siteContent).values(content);
  }
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
  // Only return non-deleted pages
  return await db.select().from(pages).where(isNull(pages.deletedAt)).orderBy(pages.navOrder);
}

// Get all pages in trash
export async function getTrashedPages() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pages).where(isNotNull(pages.deletedAt)).orderBy(desc(pages.deletedAt));
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
  const pageId = result.insertId;
  
  // Auto-create default siteContent sections for the new page
  // This ensures the page appears in the Content Editor with editable sections
  const defaultSections = [
    // Hero Section
    { section: 'hero', contentKey: 'title', contentValue: data.title },
    { section: 'hero', contentKey: 'subtitle', contentValue: '' },
    { section: 'hero', contentKey: 'description', contentValue: '' },
    { section: 'hero', contentKey: 'imageUrl', contentValue: '' },
    { section: 'hero', contentKey: 'videoUrl', contentValue: '' },
    { section: 'hero', contentKey: 'ctaText', contentValue: '' },
    { section: 'hero', contentKey: 'ctaLink', contentValue: '' },
    // Main Content Section
    { section: 'main', contentKey: 'title', contentValue: '' },
    { section: 'main', contentKey: 'description', contentValue: '' },
    { section: 'main', contentKey: 'paragraph1', contentValue: '' },
    { section: 'main', contentKey: 'paragraph2', contentValue: '' },
    { section: 'main', contentKey: 'imageUrl', contentValue: '' },
    // Newsletter Section
    { section: 'newsletter', contentKey: 'title', contentValue: 'Stay Connected' },
    { section: 'newsletter', contentKey: 'description', contentValue: 'Subscribe to receive updates and insights.' },
    { section: 'newsletter', contentKey: 'buttonText', contentValue: 'Subscribe' },
    { section: 'newsletter', contentKey: 'placeholder', contentValue: 'Enter your email' },
  ];
  
  try {
    for (const section of defaultSections) {
      await db.insert(siteContent).values({
        page: data.slug,
        section: section.section,
        contentKey: section.contentKey,
        contentValue: section.contentValue,
      });
    }
    console.log(`Created default siteContent sections for page: ${data.slug}`);
  } catch (error) {
    console.error('Failed to create default siteContent sections:', error);
    // Don't throw - page creation should still succeed even if section creation fails
  }
  
  return { id: pageId };
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
  
  // If slug is being changed, migrate all associated content
  if (data.slug) {
    // Get the current page to find the old slug
    const [currentPage] = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id));
    
    if (currentPage && currentPage.slug !== data.slug) {
      const oldSlug = currentPage.slug;
      const newSlug = data.slug;
      
      console.log(`Migrating content from slug "${oldSlug}" to "${newSlug}"`);
      
      // Migrate all siteContent records from old slug to new slug
      await db.update(siteContent)
        .set({ page: newSlug })
        .where(eq(siteContent.page, oldSlug));
      
      console.log(`Content migration complete: ${oldSlug} -> ${newSlug}`);
    }
  }
  
  // Update the page itself
  await db.update(pages).set(data).where(eq(pages.id, id));
  return { success: true };
}

// Soft delete - move to trash
export async function softDeletePage(id: number, deletedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pages).set({
    deletedAt: new Date(),
    deletedBy: deletedBy || 'admin',
    showInNav: 0, // Remove from navigation when trashed
  }).where(eq(pages.id, id));
  return { success: true };
}

// Restore from trash
export async function restorePage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pages).set({
    deletedAt: null,
    deletedBy: null,
  }).where(eq(pages.id, id));
  return { success: true };
}

// Permanent delete (empty from trash)
export async function permanentlyDeletePage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Also delete associated page blocks and site content
  await db.delete(pageBlocks).where(eq(pageBlocks.pageId, id));
  
  // Get the page slug to delete associated site content
  const [page] = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id));
  if (page) {
    await db.delete(siteContent).where(eq(siteContent.page, page.slug));
  }
  
  await db.delete(pages).where(eq(pages.id, id));
  return { success: true };
}

// Empty all trash (permanently delete all trashed pages)
export async function emptyTrash() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all trashed pages
  const trashedPages = await db.select().from(pages).where(isNotNull(pages.deletedAt));
  
  // Delete each page and its associated content
  for (const page of trashedPages) {
    await db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id));
    await db.delete(siteContent).where(eq(siteContent.page, page.slug));
    await db.delete(pages).where(eq(pages.id, page.id));
  }
  
  return { success: true, deletedCount: trashedPages.length };
}

// Auto-cleanup: delete pages that have been in trash longer than retention days
export async function cleanupExpiredTrash(retentionDays: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // Get expired trashed pages
  const expiredPages = await db.select().from(pages)
    .where(and(
      isNotNull(pages.deletedAt),
      lt(pages.deletedAt, cutoffDate)
    ));
  
  // Delete each expired page and its associated content
  for (const page of expiredPages) {
    await db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id));
    await db.delete(siteContent).where(eq(siteContent.page, page.slug));
    await db.delete(pages).where(eq(pages.id, page.id));
  }
  
  return { success: true, deletedCount: expiredPages.length };
}

// Legacy delete function (now calls soft delete)
export async function deletePage(id: number) {
  return await softDeletePage(id);
}

export async function reorderPages(pageOrders: { id: number; navOrder: number; parentId?: number | null }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update each page's navOrder and optionally parentId
  for (const page of pageOrders) {
    const updateData: { navOrder: number; parentId?: number | null } = { navOrder: page.navOrder };
    
    // Only update parentId if it's explicitly provided (including null to remove parent)
    if (page.parentId !== undefined) {
      updateData.parentId = page.parentId;
    }
    
    await db.update(pages).set(updateData).where(eq(pages.id, page.id));
  }
  
  return { success: true };
}


// ============= PAGE BLOCKS MANAGEMENT =============

export async function getPageBlocks(pageId: number): Promise<ParsedPageBlock[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const blocks = await db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, pageId))
      .orderBy(pageBlocks.order);
    
    // Parse JSON fields with safe fallbacks
    return blocks.map(block => {
      try {
        return {
          ...block,
          content: safeParseJSON(block.content, {}),
          settings: safeParseJSON(block.settings, {
            fullWidth: false,
            paddingTop: 0,
            paddingBottom: 0,
          }),
          visibility: safeParseJSON(block.visibility, {
            desktop: true,
            tablet: true,
            mobile: true,
          }),
          animation: safeParseJSON(block.animation, {
            type: 'none',
            duration: 0.5,
            delay: 0,
          }),
        };
      } catch (parseError) {
        console.error(`[getPageBlocks] Error parsing block ${block.id}:`, parseError);
        // Return block with empty content rather than failing entirely
        return {
          ...block,
          content: {},
          settings: { fullWidth: false, paddingTop: 0, paddingBottom: 0 },
          visibility: { desktop: true, tablet: true, mobile: true },
          animation: { type: 'none' as const, duration: 0.5, delay: 0 },
        };
      }
    });
  } catch (error) {
    console.error(`[getPageBlocks] Failed to fetch blocks for page ${pageId}:`, error);
    return [];
  }
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
    type: data.type as "text" | "image" | "video" | "quote" | "cta" | "spacer",
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


// ============= PAGE BUILDER TO SITE CONTENT SYNC =============

/**
 * Syncs Page Builder blocks to siteContent table for Content Editor access
 * This allows Content Editor to edit Page Builder page content
 */
export async function syncPageBlocksToSiteContent(
  pageId: number, 
  pageSlug: string,
  options: { fullSync?: boolean; deleteExisting?: boolean } = {}
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  console.log(`[syncPageBlocksToSiteContent] Starting sync for page ${pageId} (${pageSlug})`);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get all blocks for this page using the improved function
    const blocks = await getPageBlocks(pageId);
    
    if (blocks.length === 0) {
      console.log(`[syncPageBlocksToSiteContent] No blocks found for page ${pageId}`);
      return { synced: 0, errors: [] };
    }

    // Get existing content for this page
    const existingContent = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.page, pageSlug));

    const existingMap = new Map(
      existingContent.map(c => [`${c.section}:${c.contentKey}`, c])
    );

    // Define which fields to sync for each block type
    const syncableFields: Record<string, string[]> = {
      'je-hero-video': [
        'title', 'subtitle', 'description', 'ctaText', 'ctaLink',
        'videoUrl', 'imageUrl', 'posterImage', 'overlayOpacity',
        'minHeight', 'textAlign'
      ],
      'je-hero-image': [
        'title', 'subtitle', 'description', 'ctaText', 'ctaLink',
        'imageUrl', 'overlayOpacity', 'minHeight', 'textAlign'
      ],
      'je-hero-split': [
        'title', 'subtitle', 'description', 'ctaText', 'ctaLink',
        'imageUrl', 'imagePosition'
      ],
      'je-section-standard': [
        'title', 'subtitle', 'content', 'imageUrl', 'imagePosition',
        'ctaText', 'ctaLink'
      ],
      'je-section-fullwidth': [
        'title', 'subtitle', 'content', 'backgroundImage',
        'backgroundVideo', 'overlayOpacity', 'ctaText', 'ctaLink'
      ],
      'je-pillars': ['title', 'subtitle', 'pillars'],
      'je-principles': ['title', 'subtitle', 'principles'],
      'je-image': ['imageUrl', 'alt', 'caption', 'fullWidth'],
      'je-video': ['videoUrl', 'posterImage', 'title', 'autoplay', 'loop', 'muted'],
      'je-gallery': ['images', 'columns', 'gap'],
      'je-faq': ['title', 'subtitle', 'faqs'],
      'je-contact': ['title', 'subtitle', 'email', 'phone', 'address'],
      'je-newsletter': ['title', 'subtitle', 'placeholder', 'buttonText', 'backgroundColor'],
      // Generic blocks
      'hero': ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'backgroundImage', 'backgroundVideo'],
      'text': ['content', 'html'],
      'heading': ['text', 'level'],
      'image': ['src', 'alt', 'caption'],
      'video': ['src', 'poster', 'autoplay'],
      'quote': ['text', 'author', 'source'],
      'spacer': ['height'],
    };

    // Track which sections we've updated (for cleanup)
    const updatedSections = new Set<string>();

    // Process each block
    for (const block of blocks) {
      // Get the content and extract original type if available
      const content = block.content as Record<string, unknown> || {};
      
      // Use _originalType from content if available, otherwise use block.type
      const actualBlockType = (content._originalType as string) || block.type;
      
      // Create human-readable section name: "hero_video_1", "section_standard_2"
      const blockTypeName = actualBlockType
        .replace('je-', '')
        .replace(/-/g, '_');
      const sectionName = `${blockTypeName}_${block.order + 1}`;
      
      updatedSections.add(sectionName);

      // Get fields to sync - use defined list or all content keys (excluding _originalType)
      const fieldsToSync = syncableFields[actualBlockType] || Object.keys(content).filter(k => k !== '_originalType');
      
      for (const field of fieldsToSync) {
        const value = content[field];
        
        // Skip undefined values unless doing full sync
        if (value === undefined) {
          if (!options.fullSync) continue;
        }

        const key = `${sectionName}:${field}`;
        
        // Convert value to string, handling objects/arrays
        let stringValue: string;
        if (value === null || value === undefined) {
          stringValue = '';
        } else if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }
        
        try {
          const existing = existingMap.get(key);
          
          if (existing) {
            // Only update if value actually changed
            if (existing.contentValue !== stringValue) {
              await db
                .update(siteContent)
                .set({ contentValue: stringValue })
                .where(eq(siteContent.id, existing.id));
              syncedCount++;
            }
          } else {
            // Insert new
            await db.insert(siteContent).values({
              page: pageSlug,
              section: sectionName,
              contentKey: field,
              contentValue: stringValue,
            });
            syncedCount++;
          }
        } catch (fieldError) {
          const errorMsg = `Failed to sync field ${field} for block ${block.id}: ${fieldError}`;
          console.error(`[syncPageBlocksToSiteContent] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Optionally clean up orphaned sections
    if (options.deleteExisting) {
      const orphanedContent = existingContent.filter(c => !updatedSections.has(c.section));
      for (const orphan of orphanedContent) {
        await db.delete(siteContent).where(eq(siteContent.id, orphan.id));
      }
    }

    console.log(`[syncPageBlocksToSiteContent] Synced ${syncedCount} fields for page ${pageSlug}`);
    return { synced: syncedCount, errors };

  } catch (error) {
    console.error('[syncPageBlocksToSiteContent] Fatal error:', error);
    throw error;
  }
}

/**
 * Updates siteContent from Content Editor back to Page Builder blocks
 */
export async function syncSiteContentToPageBlocks(
  pageSlug: string,
  pageId?: number
): Promise<{ success: boolean; blocksUpdated: number; errors: string[] }> {
  const errors: string[] = [];
  let updatedCount = 0;

  console.log(`[syncSiteContentToPageBlocks] Starting reverse sync for ${pageSlug}`);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get the page by slug if pageId not provided
    let targetPageId = pageId;
    if (!targetPageId) {
      const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, pageSlug))
        .limit(1);

      if (!page) {
        return { success: false, blocksUpdated: 0, errors: ['Page not found'] };
      }
      targetPageId = page.id;
    }

    // Get all siteContent for this page
    const contentEntries = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.page, pageSlug));

    // Group content by section
    const sectionContent: Record<string, Record<string, string>> = {};
    for (const entry of contentEntries) {
      if (!sectionContent[entry.section]) {
        sectionContent[entry.section] = {};
      }
      sectionContent[entry.section][entry.contentKey] = entry.contentValue;
    }

    // Get all blocks for this page
    const blocks = await getPageBlocks(targetPageId);

    // Update each block with its corresponding siteContent
    for (const block of blocks) {
      const content = block.content as Record<string, unknown> || {};
      
      // Try both naming conventions for section matching
      const blockTypeName = block.type.replace('je-', '').replace(/-/g, '_');
      const sectionNameNew = `${blockTypeName}_${block.order + 1}`;
      const sectionNameOld = `${block.type}-${block.order}`;
      
      const sectionData = sectionContent[sectionNameNew] || sectionContent[sectionNameOld];

      if (sectionData) {
        // Update content fields from siteContent
        for (const [key, value] of Object.entries(sectionData)) {
          // Try to parse JSON for array fields and objects
          if (value.startsWith('[') || value.startsWith('{')) {
            try {
              content[key] = JSON.parse(value);
            } catch {
              content[key] = value;
            }
          } else {
            content[key] = value;
          }
        }

        // Update the block
        try {
          await db
            .update(pageBlocks)
            .set({ content: JSON.stringify(content) })
            .where(eq(pageBlocks.id, block.id));
          updatedCount++;
        } catch (updateError) {
          const errorMsg = `Failed to update block ${block.id}`;
          errors.push(errorMsg);
          console.error(`[syncSiteContentToPageBlocks] ${errorMsg}:`, updateError);
        }
      }
    }

    console.log(`[syncSiteContentToPageBlocks] Updated ${updatedCount} blocks`);
    return { success: true, blocksUpdated: updatedCount, errors };

  } catch (error) {
    console.error('[syncSiteContentToPageBlocks] Fatal error:', error);
    throw error;
  }
}
