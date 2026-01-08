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
  
  await db.update(pages).set(data).where(eq(pages.id, id));
  return { success: true };
}

export async function deletePage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(pages).where(eq(pages.id, id));
  return { success: true };
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
export async function syncPageBlocksToSiteContent(pageId: number, pageSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all blocks for this page
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(pageBlocks.order);

  // Delete existing siteContent entries for this page
  await db
    .delete(siteContent)
    .where(eq(siteContent.page, pageSlug));

  // Create siteContent entries for each block's content fields
  for (const block of blocks) {
    let content: Record<string, unknown> = {};
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch (e) {
      content = {};
    }

    // Get the original block type (stored in content._originalType)
    const blockType = (content._originalType as string) || block.type;
    const sectionName = `${blockType}-${block.order}`;

    // Extract text fields from the block content and save to siteContent
    const textFields = ['title', 'subtitle', 'description', 'headline', 'subheadline', 
                        'ctaText', 'ctaLink', 'buttonText', 'buttonLink', 'text', 'content',
                        'videoUrl', 'imageUrl', 'backgroundImage', 'posterImage', 'src',
                        'quote', 'author', 'authorTitle', 'label', 'heading'];

    for (const field of textFields) {
      if (content[field] !== undefined && content[field] !== null && content[field] !== '') {
        await db.insert(siteContent).values({
          page: pageSlug,
          section: sectionName,
          contentKey: field,
          contentValue: String(content[field]),
        });
      }
    }

    // Handle nested arrays like features, items, testimonials, etc.
    const arrayFields = ['features', 'items', 'testimonials', 'pillars', 'cards', 'buttons'];
    for (const arrayField of arrayFields) {
      if (Array.isArray(content[arrayField])) {
        await db.insert(siteContent).values({
          page: pageSlug,
          section: sectionName,
          contentKey: arrayField,
          contentValue: JSON.stringify(content[arrayField]),
        });
      }
    }
  }

  return { success: true, blocksCount: blocks.length };
}

/**
 * Updates siteContent from Content Editor back to Page Builder blocks
 */
export async function syncSiteContentToPageBlocks(pageSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the page by slug
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, pageSlug))
    .limit(1);

  if (!page) {
    return { success: false, error: 'Page not found' };
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
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, page.id))
    .orderBy(pageBlocks.order);

  // Update each block with its corresponding siteContent
  for (const block of blocks) {
    let content: Record<string, unknown> = {};
    try {
      content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
    } catch (e) {
      content = {};
    }

    const blockType = (content._originalType as string) || block.type;
    const sectionName = `${blockType}-${block.order}`;
    const sectionData = sectionContent[sectionName];

    if (sectionData) {
      // Update content fields from siteContent
      for (const [key, value] of Object.entries(sectionData)) {
        // Try to parse JSON for array fields
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            content[key] = parsed;
          } else {
            content[key] = value;
          }
        } catch {
          content[key] = value;
        }
      }

      // Update the block
      await db
        .update(pageBlocks)
        .set({ content: JSON.stringify(content) })
        .where(eq(pageBlocks.id, block.id));
    }
  }

  return { success: true, blocksUpdated: blocks.length };
}
