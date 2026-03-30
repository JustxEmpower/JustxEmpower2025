import { int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for blog posts/journal entries
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  date: varchar("date", { length: 50 }),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  published: int("published").default(1).notNull(), // 1 = published, 0 = draft
  status: varchar("status", { length: 20 }).default("published").notNull(), // published, draft, scheduled
  publishDate: timestamp("publishDate"), // For scheduled publishing
  displayOrder: int("displayOrder").default(0).notNull(), // For custom ordering in listings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Site content table for managing page sections, hero text, and media
 */
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  page: varchar("page", { length: 100 }).notNull(), // 'home', 'about', 'philosophy', etc.
  section: varchar("section", { length: 100 }).notNull(), // 'hero', 'about', 'offerings', etc.
  contentKey: varchar("contentKey", { length: 100 }).notNull(), // 'title', 'subtitle', 'description', 'videoUrl', 'imageUrl'
  contentValue: text("contentValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Admin users table for custom admin authentication (separate from OAuth users)
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: varchar("role", { length: 50 }).default("editor").notNull(), // 'super_admin', 'admin', 'editor', 'viewer'
  permissions: text("permissions"), // JSON array of permissions
  mailchimpApiKey: varchar("mailchimpApiKey", { length: 255 }),
  mailchimpAudienceId: varchar("mailchimpAudienceId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Admin sessions table for persistent session storage
 */
export const adminSessions = mysqlTable("adminSessions", {
  token: varchar("token", { length: 255 }).notNull().primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

/**
 * Media library table for tracking uploaded images and videos
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  s3Key: varchar("s3Key", { length: 500 }).notNull(), // S3 storage key
  url: varchar("url", { length: 1000 }).notNull(), // Public URL
  thumbnailUrl: varchar("thumbnailUrl", { length: 1000 }), // Thumbnail URL for videos
  altText: varchar("altText", { length: 500 }), // AI-generated or manual alt text for accessibility
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  uploadedBy: varchar("uploadedBy", { length: 100 }), // admin username
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * Theme settings table for design system control
 */
export const themeSettings = mysqlTable("themeSettings", {
  id: int("id").autoincrement().primaryKey(),
  // Color Palette
  primaryColor: varchar("primaryColor", { length: 50 }).default("#000000"),
  secondaryColor: varchar("secondaryColor", { length: 50 }).default("#ffffff"),
  accentColor: varchar("accentColor", { length: 50 }).default("#1a1a1a"),
  backgroundColor: varchar("backgroundColor", { length: 50 }).default("#ffffff"),
  textColor: varchar("textColor", { length: 50 }).default("#000000"),
  
  // Typography
  headingFont: varchar("headingFont", { length: 255 }).default("Playfair Display"),
  bodyFont: varchar("bodyFont", { length: 255 }).default("Inter"),
  headingFontUrl: varchar("headingFontUrl", { length: 500 }),
  bodyFontUrl: varchar("bodyFontUrl", { length: 500 }),
  
  // Spacing & Layout
  containerMaxWidth: varchar("containerMaxWidth", { length: 50 }).default("1280px"),
  sectionSpacing: varchar("sectionSpacing", { length: 50 }).default("120px"),
  borderRadius: varchar("borderRadius", { length: 50 }).default("8px"),
  
  // Animations
  enableAnimations: int("enableAnimations").default(1).notNull(),
  animationSpeed: varchar("animationSpeed", { length: 50 }).default("0.6s"),
  
  // Background Images
  heroBackgroundImage: varchar("heroBackgroundImage", { length: 1000 }),
  heroBackgroundVideo: varchar("heroBackgroundVideo", { length: 1000 }),
  shopBackgroundImage: varchar("shopBackgroundImage", { length: 1000 }),
  eventsBackgroundImage: varchar("eventsBackgroundImage", { length: 1000 }),
  footerBackgroundImage: varchar("footerBackgroundImage", { length: 1000 }),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = typeof themeSettings.$inferInsert;

/**
 * Brand assets table for logo and brand image management
 */
export const brandAssets = mysqlTable("brandAssets", {
  id: int("id").autoincrement().primaryKey(),
  assetType: mysqlEnum("assetType", ["logo_header", "logo_footer", "logo_mobile", "logo_preloader", "favicon", "og_image", "twitter_image"]).notNull(),
  assetUrl: varchar("assetUrl", { length: 1000 }).notNull(),
  assetName: varchar("assetName", { length: 255 }),
  width: int("width"),
  height: int("height"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

/**
 * Pages table for dynamic page management
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  template: varchar("template", { length: 100 }).default("default"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  ogImage: varchar("ogImage", { length: 1000 }),
  published: int("published").default(1).notNull(),
  showInNav: int("showInNav").default(1).notNull(),
  navOrder: int("navOrder").default(0),
  parentId: int("parentId"), // For sub-pages/dropdown menus - null means top-level
  // Trash bin functionality
  deletedAt: timestamp("deletedAt"), // When moved to trash (null = not deleted)
  deletedBy: varchar("deletedBy", { length: 100 }), // Who deleted it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Page sections table for storing content sections per page
 */
export const pageSections = mysqlTable("pageSections", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  sectionType: mysqlEnum("sectionType", [
    "header", "hero", "content", "carousel", "grid", "form", "video", "quote", "cta",
    "calendar", "footer", "newsletter", "community", "testimonials", "gallery", "map",
    "products", "articles", "team", "faq", "pricing", "features", "stats", "social",
    "rooted-unity", "pillar-grid", "pillars", "principles", "volumes", "options",
    "mission", "vision", "ethos"
  ]).notNull(),
  sectionOrder: int("sectionOrder").default(0).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"), // Stored as JSON string in text field
  requiredFields: text("requiredFields"), // Stored as JSON string in text field
  isVisible: int("isVisible").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageSection = typeof pageSections.$inferSelect;
export type InsertPageSection = typeof pageSections.$inferInsert;

/**
 * Navigation items table for menu management
 */
export const navigation = mysqlTable("navigation", {
  id: int("id").autoincrement().primaryKey(),
  location: mysqlEnum("location", ["header", "footer"]).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  order: int("order").default(0).notNull(),
  isExternal: int("isExternal").default(0).notNull(),
  openInNewTab: int("openInNewTab").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  parentId: int("parentId"), // for nested menus
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Navigation = typeof navigation.$inferSelect;
export type InsertNavigation = typeof navigation.$inferInsert;

/**
 * SEO settings table for meta tags and structured data
 */
export const seoSettings = mysqlTable("seoSettings", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 255 }).notNull().unique(), // 'home', 'about', etc.
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  metaKeywords: text("metaKeywords"),
  ogTitle: varchar("ogTitle", { length: 255 }),
  ogDescription: text("ogDescription"),
  ogImage: varchar("ogImage", { length: 1000 }),
  twitterCard: varchar("twitterCard", { length: 50 }).default("summary_large_image"),
  canonicalUrl: varchar("canonicalUrl", { length: 500 }),
  noIndex: int("noIndex").default(0).notNull(),
  structuredData: text("structuredData"), // JSON-LD
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SEOSettings = typeof seoSettings.$inferSelect;
export type InsertSEOSettings = typeof seoSettings.$inferInsert;

/**
 * Site settings table for analytics, custom code, and integrations
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;


/**
 * AI chat conversations table for visitor chat history
 */
export const aiChatConversations = mysqlTable("aiChatConversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  visitorId: varchar("visitorId", { length: 255 }), // optional identifier
  message: text("message").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  context: text("context"), // page context, visitor intent, etc.
  sentiment: varchar("sentiment", { length: 50 }), // positive, neutral, negative
  topic: varchar("topic", { length: 100 }), // conversation topic (e.g., "leadership", "empowerment", "coaching")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIChatConversation = typeof aiChatConversations.$inferSelect;
export type InsertAIChatConversation = typeof aiChatConversations.$inferInsert;

/**
 * AI settings table for API keys and configuration
 */
export const aiSettings = mysqlTable("aiSettings", {
  id: int("id").autoincrement().primaryKey(),
  geminiApiKey: varchar("geminiApiKey", { length: 500 }),
  chatEnabled: int("chatEnabled").default(1).notNull(),
  chatBubbleColor: varchar("chatBubbleColor", { length: 50 }).default("#000000"),
  chatBubblePosition: varchar("chatBubblePosition", { length: 50 }).default("bottom-right"),
  systemPrompt: text("systemPrompt"), // Custom AI personality/instructions
  autoResponses: text("autoResponses"), // JSON of common Q&A pairs
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AISettings = typeof aiSettings.$inferSelect;
export type InsertAISettings = typeof aiSettings.$inferInsert;


/**
 * AI feedback table for rating and improving responses
 */
export const aiFeedback = mysqlTable("aiFeedback", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  visitorId: varchar("visitorId", { length: 255 }),
  rating: mysqlEnum("rating", ["positive", "negative"]).notNull(),
  feedbackText: text("feedbackText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIFeedback = typeof aiFeedback.$inferSelect;
export type InsertAIFeedback = typeof aiFeedback.$inferInsert;

/**
 * AI Knowledge Base for training the AI with custom Q&A pairs
 */
export const aiKnowledgeBase = mysqlTable("aiKnowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "about", "services", "philosophy", "events", "products"
  question: text("question").notNull(), // The question or trigger phrase
  answer: text("answer").notNull(), // The ideal response
  keywords: text("keywords"), // JSON array of keywords for matching
  priority: int("priority").default(0).notNull(), // Higher priority = used first
  isActive: int("isActive").default(1).notNull(),
  usageCount: int("usageCount").default(0).notNull(), // Track how often this is used
  lastUsedAt: timestamp("lastUsedAt"),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAIKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;

/**
 * AI Training Logs for tracking improvements and learning
 */
export const aiTrainingLogs = mysqlTable("aiTrainingLogs", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["added", "updated", "deleted", "used", "feedback"]).notNull(),
  knowledgeId: int("knowledgeId"),
  conversationId: int("conversationId"),
  details: text("details"), // JSON with action details
  performedBy: varchar("performedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AITrainingLog = typeof aiTrainingLogs.$inferSelect;
export type InsertAITrainingLog = typeof aiTrainingLogs.$inferInsert;

/**
 * Visitor profiles for persistent conversation memory
 */
export const visitorProfiles = mysqlTable("visitorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }).notNull().unique(),
  firstVisit: timestamp("firstVisit").defaultNow().notNull(),
  lastVisit: timestamp("lastVisit").defaultNow().onUpdateNow().notNull(),
  totalConversations: int("totalConversations").default(0).notNull(),
  preferences: text("preferences"), // JSON: interests, topics discussed, etc.
  context: text("context"), // JSON: journey stage, pain points, goals
});

export type VisitorProfile = typeof visitorProfiles.$inferSelect;
export type InsertVisitorProfile = typeof visitorProfiles.$inferInsert;


/**
 * Analytics page views table
 */
export const analyticsPageViews = mysqlTable("analyticsPageViews", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  page: varchar("page", { length: 500 }).notNull(),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;
export type InsertAnalyticsPageView = typeof analyticsPageViews.$inferInsert;

/**
 * Analytics sessions table
 */
export const analyticsSessions = mysqlTable("analyticsSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 255 }),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  pageCount: int("pageCount").default(0).notNull(),
  duration: int("duration").default(0).notNull(), // in seconds
});

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type InsertAnalyticsSession = typeof analyticsSessions.$inferInsert;

/**
 * Analytics events table for custom tracking
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(), // e.g., "button_click", "form_submit", "ai_chat_open"
  eventData: text("eventData"), // JSON
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Page content blocks for visual block editor
 */
export const pageBlocks = mysqlTable("pageBlocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // Changed from enum to varchar to support all JE block types
  content: text("content"), // JSON string with block-specific data
  order: int("order").notNull().default(0),
  settings: text("settings"), // JSON string with block settings (alignment, colors, spacing)
  visibility: text("visibility"), // JSON string with visibility conditions (device, auth, schedule)
  animation: text("animation"), // JSON string with animation settings (type, trigger, timing)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageBlock = typeof pageBlocks.$inferSelect;
export type InsertPageBlock = typeof pageBlocks.$inferInsert;

// Parsed version of PageBlock with JSON fields converted to objects
export type ParsedPageBlock = Omit<PageBlock, 'content' | 'settings' | 'animation' | 'visibility'> & {
  content: any;
  settings: any;
  animation: any;
  visibility: any;
};

/**
 * Block templates for saving and reusing block combinations
 */
export const blockTemplates = mysqlTable("blockTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  blocks: text("blocks").notNull(), // JSON array of block configurations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlockTemplate = typeof blockTemplates.$inferSelect;
export type InsertBlockTemplate = typeof blockTemplates.$inferInsert;

/**
 * Block versions for tracking history and enabling restore
 */
export const blockVersions = mysqlTable("blockVersions", {
  id: int("id").autoincrement().primaryKey(),
  blockId: int("blockId").notNull(),
  pageId: int("pageId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // Changed from enum to varchar to support all JE block types
  content: text("content"),
  order: int("order").notNull(),
  settings: text("settings"),
  versionNumber: int("versionNumber").notNull(),
  createdBy: varchar("createdBy", { length: 255 }), // username who made the change
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockVersion = typeof blockVersions.$inferSelect;
export type InsertBlockVersion = typeof blockVersions.$inferInsert;

/**
 * Form fields table for customizable contact forms
 */
export const formFields = mysqlTable("formFields", {
  id: int("id").autoincrement().primaryKey(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(), // e.g., "name", "email", "message"
  fieldLabel: varchar("fieldLabel", { length: 255 }).notNull(), // Display label
  fieldType: mysqlEnum("fieldType", ["text", "email", "tel", "textarea", "select", "checkbox"]).notNull(),
  placeholder: varchar("placeholder", { length: 255 }),
  required: int("required").default(1).notNull(),
  order: int("order").default(0).notNull(),
  options: text("options"), // JSON array for select/checkbox options
  validation: text("validation"), // JSON validation rules
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;

/**
 * Form submissions table for storing contact form data
 */
export const formSubmissions = mysqlTable("formSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  formData: text("formData").notNull(), // JSON of all form fields
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  isRead: int("isRead").default(0).notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

/**
 * URL redirects table for SEO and site restructuring
 */
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  fromPath: varchar("fromPath", { length: 500 }).notNull(),
  toPath: varchar("toPath", { length: 500 }).notNull(),
  redirectType: mysqlEnum("redirectType", ["301", "302"]).default("301").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Redirect = typeof redirects.$inferSelect;
export type InsertRedirect = typeof redirects.$inferInsert;

/**
 * Database backups table for backup/restore functionality
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  backupName: varchar("backupName", { length: 255 }).notNull(),
  backupType: varchar("backupType", { length: 50 }).notNull(), // 'manual', 'scheduled', 'auto'
  backupData: longtext("backupData"), // JSON dump of database (LONGTEXT for large backups up to 4GB)
  s3Key: varchar("s3Key", { length: 500 }), // S3 storage key for backup file
  s3Url: varchar("s3Url", { length: 1000 }), // S3 URL for backup file
  fileSize: int("fileSize").notNull(), // Size in bytes
  description: text("description"), // Optional description of what changed
  tablesIncluded: text("tablesIncluded"), // JSON array of table names included in backup
  createdBy: varchar("createdBy", { length: 100 }), // Admin username who created backup
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  verificationStatus: varchar("verificationStatus", { length: 20 }), // 'verified', 'warning', 'error', or null
  lastVerifiedAt: timestamp("lastVerifiedAt"), // When the backup was last verified
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * Email settings table for email provider configuration and weekly reports
 */
export const emailSettings = mysqlTable("emailSettings", {
  id: int("id").autoincrement().primaryKey(),
  emailProvider: varchar("emailProvider", { length: 50 }), // 'sendgrid', 'mailgun', 'ses', 'smtp', etc.
  apiKey: varchar("apiKey", { length: 500 }),
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 255 }),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUsername: varchar("smtpUsername", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 255 }),
  weeklyReportEnabled: int("weeklyReportEnabled").default(0).notNull(),
  reportRecipients: text("reportRecipients"), // JSON array of email addresses
  reportDay: int("reportDay").default(1), // 0=Sunday, 1=Monday, etc.
  reportTime: varchar("reportTime", { length: 5 }).default("09:00"), // HH:MM format
  lastSentAt: timestamp("lastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;


/**
 * ==========================================
 * SHOP / E-COMMERCE TABLES
 * ==========================================
 */

/**
 * Product categories for shop organization
 */
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  parentId: int("parentId"), // For nested categories
  order: int("order").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * Products table for shop items
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }).unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  price: int("price").notNull(), // Price in cents
  compareAtPrice: int("compareAtPrice"), // Original price for showing discounts
  costPrice: int("costPrice"), // Cost for profit calculations
  categoryId: int("categoryId"),
  images: text("images"), // JSON array of image URLs
  featuredImage: varchar("featuredImage", { length: 1000 }),
  stock: int("stock").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(5),
  trackInventory: int("trackInventory").default(1).notNull(),
  weight: int("weight"), // Weight in grams for shipping
  dimensions: text("dimensions"), // JSON: {length, width, height}
  tags: text("tags"), // JSON array of tags
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(), // For manual product ordering
  deletedAt: timestamp("deletedAt"), // Soft delete timestamp
  archivedReason: varchar("archivedReason", { length: 255 }), // Reason for archiving
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product variants (size, color, etc.)
 */
export const productVariants = mysqlTable("productVariants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Small / Red"
  sku: varchar("sku", { length: 100 }),
  price: int("price"), // Override price if different
  stock: int("stock").default(0).notNull(),
  options: text("options"), // JSON: {size: "S", color: "Red"}
  imageUrl: varchar("imageUrl", { length: 1000 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

/**
 * Shopping cart for persistent cart storage
 */
export const shoppingCarts = mysqlTable("shoppingCarts", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  userId: int("userId"), // Optional: for logged-in users
  items: text("items").notNull(), // JSON array of cart items
  subtotal: int("subtotal").default(0).notNull(), // In cents
  discountCode: varchar("discountCode", { length: 100 }),
  discountAmount: int("discountAmount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt"), // For cart abandonment
});

export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type InsertShoppingCart = typeof shoppingCarts.$inferInsert;

/**
 * Discount codes for promotions
 */
export const discountCodes = mysqlTable("discountCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed", "free_shipping"]).notNull(),
  value: int("value").notNull(), // Percentage (0-100) or fixed amount in cents
  minOrderAmount: int("minOrderAmount"), // Minimum order for discount
  maxUses: int("maxUses"), // Total uses allowed
  usedCount: int("usedCount").default(0).notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  userId: int("userId"), // Optional: for guest checkout
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled", "refunded", "on_hold"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded", "partially_refunded", "disputed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // stripe, paypal, etc.
  paymentIntentId: varchar("paymentIntentId", { length: 255 }), // Stripe payment intent
  subtotal: int("subtotal").notNull(), // In cents
  discountAmount: int("discountAmount").default(0),
  discountCode: varchar("discountCode", { length: 100 }),
  shippingAmount: int("shippingAmount").default(0),
  taxAmount: int("taxAmount").default(0),
  total: int("total").notNull(), // In cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  // Shipping address
  shippingFirstName: varchar("shippingFirstName", { length: 100 }),
  shippingLastName: varchar("shippingLastName", { length: 100 }),
  shippingAddress1: varchar("shippingAddress1", { length: 255 }),
  shippingAddress2: varchar("shippingAddress2", { length: 255 }),
  shippingCity: varchar("shippingCity", { length: 100 }),
  shippingState: varchar("shippingState", { length: 100 }),
  shippingPostalCode: varchar("shippingPostalCode", { length: 20 }),
  shippingCountry: varchar("shippingCountry", { length: 100 }),
  // Billing address (if different)
  billingFirstName: varchar("billingFirstName", { length: 100 }),
  billingLastName: varchar("billingLastName", { length: 100 }),
  billingAddress1: varchar("billingAddress1", { length: 255 }),
  billingAddress2: varchar("billingAddress2", { length: 255 }),
  billingCity: varchar("billingCity", { length: 100 }),
  billingState: varchar("billingState", { length: 100 }),
  billingPostalCode: varchar("billingPostalCode", { length: 20 }),
  billingCountry: varchar("billingCountry", { length: 100 }),
  // Tracking
  carrier: varchar("carrier", { length: 50 }),
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  trackingUrl: varchar("trackingUrl", { length: 500 }),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  notes: text("notes"), // Internal notes
  customerNotes: text("customerNotes"), // Customer order notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items (line items)
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  name: varchar("name", { length: 255 }).notNull(), // Product name at time of order
  sku: varchar("sku", { length: 100 }),
  price: int("price").notNull(), // Price per unit in cents
  quantity: int("quantity").notNull(),
  total: int("total").notNull(), // price * quantity
  imageUrl: varchar("imageUrl", { length: 1000 }),
  options: text("options"), // JSON: variant options selected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * ==========================================
 * EVENTS TABLES
 * ==========================================
 */

/**
 * Events table for workshops, retreats, etc.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  eventType: mysqlEnum("eventType", ["workshop", "retreat", "webinar", "meetup", "conference", "other"]).default("workshop").notNull(),
  // Date and time
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  timezone: varchar("timezone", { length: 100 }).default("America/Los_Angeles"),
  isAllDay: int("isAllDay").default(0).notNull(),
  // Location
  locationType: mysqlEnum("locationType", ["in_person", "virtual", "hybrid"]).default("in_person").notNull(),
  venue: varchar("venue", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  virtualUrl: varchar("virtualUrl", { length: 500 }), // Zoom/Meet link
  virtualPassword: varchar("virtualPassword", { length: 100 }),
  // Pricing
  isFree: int("isFree").default(0).notNull(),
  price: int("price").default(0), // In cents
  earlyBirdPrice: int("earlyBirdPrice"), // In cents
  earlyBirdDeadline: timestamp("earlyBirdDeadline"),
  // Capacity
  capacity: int("capacity"), // Max attendees
  registrationCount: int("registrationCount").default(0).notNull(),
  waitlistEnabled: int("waitlistEnabled").default(0).notNull(),
  // Media
  featuredImage: varchar("featuredImage", { length: 1000 }),
  images: text("images"), // JSON array
  // Registration
  registrationOpen: int("registrationOpen").default(1).notNull(),
  registrationDeadline: timestamp("registrationDeadline"),
  requiresApproval: int("requiresApproval").default(0).notNull(),
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  // Status
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event ticket types (for multi-tier pricing)
 */
export const eventTicketTypes = mysqlTable("eventTicketTypes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "General Admission", "VIP"
  description: text("description"),
  price: int("price").notNull(), // In cents
  quantity: int("quantity"), // Max tickets of this type
  soldCount: int("soldCount").default(0).notNull(),
  maxPerOrder: int("maxPerOrder").default(10),
  salesStart: timestamp("salesStart"),
  salesEnd: timestamp("salesEnd"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventTicketType = typeof eventTicketTypes.$inferSelect;
export type InsertEventTicketType = typeof eventTicketTypes.$inferInsert;

/**
 * Event registrations
 */
export const eventRegistrations = mysqlTable("eventRegistrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId"), // Optional: for guest registration
  ticketTypeId: int("ticketTypeId"),
  confirmationNumber: varchar("confirmationNumber", { length: 50 }).notNull().unique(),
  // Registrant info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  // Payment
  quantity: int("quantity").default(1).notNull(),
  unitPrice: int("unitPrice").notNull(), // In cents
  total: int("total").notNull(), // In cents
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentIntentId: varchar("paymentIntentId", { length: 255 }),
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "waitlisted", "cancelled", "attended", "no_show"]).default("pending").notNull(),
  checkedInAt: timestamp("checkedInAt"),
  // Additional info
  dietaryRestrictions: text("dietaryRestrictions"),
  specialRequests: text("specialRequests"),
  customFields: text("customFields"), // JSON for event-specific fields
  notes: text("notes"), // Admin notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;

/**
 * Event attendees (for group registrations)
 */
export const eventAttendees = mysqlTable("eventAttendees", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  eventId: int("eventId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  ticketTypeId: int("ticketTypeId"),
  checkedInAt: timestamp("checkedInAt"),
  qrCode: varchar("qrCode", { length: 255 }), // Unique QR code for check-in
  dietaryRestrictions: text("dietaryRestrictions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = typeof eventAttendees.$inferInsert;

/**
 * ==========================================
 * BACKGROUND IMAGE SETTINGS
 * ==========================================
 */

/**
 * Section backgrounds for customizable page backgrounds
 */
export const sectionBackgrounds = mysqlTable("sectionBackgrounds", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(), // e.g., "hero", "footer", "philosophy", "offerings"
  backgroundType: mysqlEnum("backgroundType", ["color", "image", "video", "gradient"]).default("color").notNull(),
  backgroundColor: varchar("backgroundColor", { length: 50 }),
  backgroundImage: varchar("backgroundImage", { length: 1000 }),
  backgroundVideo: varchar("backgroundVideo", { length: 1000 }),
  gradientStart: varchar("gradientStart", { length: 50 }),
  gradientEnd: varchar("gradientEnd", { length: 50 }),
  gradientDirection: varchar("gradientDirection", { length: 50 }).default("to bottom"),
  overlayColor: varchar("overlayColor", { length: 50 }), // For image/video overlay
  overlayOpacity: int("overlayOpacity").default(50), // 0-100
  backgroundPosition: varchar("backgroundPosition", { length: 50 }).default("center center"),
  backgroundSize: varchar("backgroundSize", { length: 50 }).default("cover"),
  backgroundAttachment: mysqlEnum("backgroundAttachment", ["scroll", "fixed"]).default("scroll"),
  isActive: int("isActive").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SectionBackground = typeof sectionBackgrounds.$inferSelect;
export type InsertSectionBackground = typeof sectionBackgrounds.$inferInsert;


/**
 * ==========================================
 * RESOURCES / DOCUMENT LIBRARY
 * ==========================================
 */

/**
 * Resource categories for organizing downloadable content
 */
export const resourceCategories = mysqlTable("resourceCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // Icon name or URL
  order: int("order").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type InsertResourceCategory = typeof resourceCategories.$inferInsert;

/**
 * Resources table for downloadable files and documents
 */
export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  categoryId: int("categoryId"),
  // File info
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(), // pdf, docx, xlsx, etc.
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  // Thumbnail/preview
  thumbnailUrl: varchar("thumbnailUrl", { length: 1000 }),
  // Access control
  isPublic: int("isPublic").default(1).notNull(), // 1 = public, 0 = requires login
  requiresEmail: int("requiresEmail").default(0).notNull(), // Capture email before download
  // Pricing
  isPremium: int("isPremium").default(0).notNull(), // 1 = paid content, 0 = free
  price: int("price").default(0), // Price in cents (e.g., 999 = $9.99)
  allowPreview: int("allowPreview").default(1).notNull(), // Allow preview even for premium content
  // Analytics
  downloadCount: int("downloadCount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  // SEO
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  // Status
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published").notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  // Timestamps
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Resource downloads tracking for analytics
 */
export const resourceDownloads = mysqlTable("resourceDownloads", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId").notNull(),
  visitorId: varchar("visitorId", { length: 255 }),
  email: varchar("email", { length: 320 }), // If captured
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
});

export type ResourceDownload = typeof resourceDownloads.$inferSelect;
export type InsertResourceDownload = typeof resourceDownloads.$inferInsert;


/**
 * Contact form submissions
 */
export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "archived"]).default("new").notNull(),
  notes: text("notes"), // Admin notes
  repliedAt: timestamp("repliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;


/**
 * Newsletter subscribers (backup storage when Mailchimp is not configured)
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  status: mysqlEnum("status", ["subscribed", "unsubscribed", "pending"]).default("subscribed").notNull(),
  source: varchar("source", { length: 100 }).default("website"), // website, popup, footer, etc.
  syncedToMailchimp: int("syncedToMailchimp").default(0).notNull(), // 0 = not synced, 1 = synced
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;


/**
 * Carousel offerings for homepage dynamic carousel
 */
export const carouselOfferings = mysqlTable("carouselOfferings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  link: varchar("link", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  order: int("order").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CarouselOffering = typeof carouselOfferings.$inferSelect;
export type InsertCarouselOffering = typeof carouselOfferings.$inferInsert;


/**
 * Site-wide font settings for typography management
 */
export const fontSettings = mysqlTable("fontSettings", {
  id: int("id").autoincrement().primaryKey(),
  // Primary fonts for headings and body
  headingFont: varchar("headingFont", { length: 255 }).default("Cormorant Garamond").notNull(),
  bodyFont: varchar("bodyFont", { length: 255 }).default("Inter").notNull(),
  accentFont: varchar("accentFont", { length: 255 }).default("Cormorant Garamond"), // For special elements
  // Font weights
  headingWeight: varchar("headingWeight", { length: 10 }).default("400"),
  bodyWeight: varchar("bodyWeight", { length: 10 }).default("400"),
  // Font sizes (base sizes, can be scaled)
  headingBaseSize: varchar("headingBaseSize", { length: 20 }).default("3rem"),
  bodyBaseSize: varchar("bodyBaseSize", { length: 20 }).default("1rem"),
  // Line heights
  headingLineHeight: varchar("headingLineHeight", { length: 10 }).default("1.2"),
  bodyLineHeight: varchar("bodyLineHeight", { length: 10 }).default("1.6"),
  // Letter spacing
  headingLetterSpacing: varchar("headingLetterSpacing", { length: 20 }).default("0"),
  bodyLetterSpacing: varchar("bodyLetterSpacing", { length: 20 }).default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FontSettings = typeof fontSettings.$inferSelect;
export type InsertFontSettings = typeof fontSettings.$inferInsert;

/**
 * Content text styling for individual content items
 */
export const contentTextStyles = mysqlTable("contentTextStyles", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull(), // References siteContent.id
  isBold: int("isBold").default(0).notNull(),
  isItalic: int("isItalic").default(0).notNull(),
  isUnderline: int("isUnderline").default(0).notNull(),
  fontOverride: varchar("fontOverride", { length: 255 }), // Optional per-field font override
  fontSize: varchar("fontSize", { length: 50 }), // Font size (e.g., "16px", "1.2rem", "small", "large")
  fontColor: varchar("fontColor", { length: 50 }), // Font color (e.g., "#000000", "rgb(0,0,0)")
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentTextStyle = typeof contentTextStyles.$inferSelect;
export type InsertContentTextStyle = typeof contentTextStyles.$inferInsert;


/**
 * Inventory Reservations - holds stock during checkout process
 * Prevents overselling by temporarily reserving inventory
 */
export const inventoryReservations = mysqlTable("inventoryReservations", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 15-minute hold
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryReservation = typeof inventoryReservations.$inferSelect;
export type InsertInventoryReservation = typeof inventoryReservations.$inferInsert;

/**
 * Cart Sync Log - for debugging cart synchronization issues
 * Tracks merge, push, pull, and conflict resolution events
 */
export const cartSyncLog = mysqlTable("cartSyncLog", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  action: mysqlEnum("action", ["merge", "push", "pull", "conflict"]).notNull(),
  beforeState: text("beforeState"),
  afterState: text("afterState"),
  resolved: text("resolved"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartSyncLog = typeof cartSyncLog.$inferSelect;
export type InsertCartSyncLog = typeof cartSyncLog.$inferInsert;


/**
 * Carousels - Master table for all carousel instances
 * Supports multiple carousel types: hero, featured, testimonial, gallery, card, custom
 */
export const carousels = mysqlTable("carousels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  type: mysqlEnum("type", ["hero", "featured", "testimonial", "gallery", "card", "custom"]).default("featured").notNull(),
  settings: text("settings"), // JSON: autoPlay, interval, showArrows, showDots, pauseOnHover, loop
  styling: text("styling"), // JSON: custom CSS overrides
  active: int("active").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Carousel = typeof carousels.$inferSelect;
export type InsertCarousel = typeof carousels.$inferInsert;

/**
 * Carousel Slides - Individual slides within a carousel
 * Flexible schema supports all carousel types
 */
export const carouselSlides = mysqlTable("carousel_slides", {
  id: int("id").autoincrement().primaryKey(),
  carouselId: int("carousel_id").notNull(), // References carousels.id
  title: varchar("title", { length: 500 }),
  subtitle: varchar("subtitle", { length: 500 }),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 1000 }),
  videoUrl: varchar("video_url", { length: 1000 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
  altText: varchar("alt_text", { length: 500 }),
  ctaText: varchar("cta_text", { length: 255 }),
  ctaLink: varchar("cta_link", { length: 1000 }),
  ctaStyle: mysqlEnum("cta_style", ["primary", "secondary", "ghost", "outline"]).default("primary"),
  // Testimonial-specific fields
  authorName: varchar("author_name", { length: 255 }),
  authorRole: varchar("author_role", { length: 255 }),
  authorAvatar: varchar("author_avatar", { length: 1000 }),
  rating: int("rating"), // 1-5 stars
  // Styling and visibility
  styling: text("styling"), // JSON: custom per-slide styles
  visible: int("visible").default(1).notNull(), // 1 = visible, 0 = hidden
  startDate: timestamp("start_date"), // For scheduled visibility
  endDate: timestamp("end_date"),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CarouselSlide = typeof carouselSlides.$inferSelect;
export type InsertCarouselSlide = typeof carouselSlides.$inferInsert;

/**
 * Page Zones table for injecting Page Builder blocks into existing React pages
 * This enables hybrid editing: existing pages keep their structure, but zones
 * can have dynamic blocks added/edited via Page Builder
 */
export const pageZones = mysqlTable("pageZones", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(), // 'home', 'about', 'philosophy', etc.
  zoneName: varchar("zoneName", { length: 100 }).notNull(), // 'after-hero', 'before-footer', 'sidebar', etc.
  blocks: longtext("blocks"), // JSON array of Page Builder blocks
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageZone = typeof pageZones.$inferSelect;
export type InsertPageZone = typeof pageZones.$inferInsert;

/**
 * Block Store table for custom reusable blocks created in Page Builder
 * These blocks can be added to any page zone and appear in the Zone Manager sidebar
 */
export const blockStore = mysqlTable("blockStore", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Display name in sidebar
  description: text("description"), // Brief description of the block
  category: varchar("category", { length: 100 }).default("custom").notNull(), // 'custom', 'hero', 'content', etc.
  icon: varchar("icon", { length: 50 }).default("box"), // Lucide icon name
  blockType: varchar("blockType", { length: 100 }).notNull(), // Base block type or 'custom-composite'
  content: longtext("content").notNull(), // JSON: Full block content with all settings
  thumbnail: varchar("thumbnail", { length: 1000 }), // Preview image URL
  tags: text("tags"), // JSON array of tags for filtering
  isPublic: int("isPublic").default(1).notNull(), // 1 = visible in sidebar, 0 = hidden/archived
  usageCount: int("usageCount").default(0).notNull(), // Track how often this block is used
  createdBy: varchar("createdBy", { length: 100 }), // Admin username who created it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlockStoreItem = typeof blockStore.$inferSelect;
export type InsertBlockStoreItem = typeof blockStore.$inferInsert;

/**
 * Page Content Schema table - Defines what sections and fields each page should have
 * This is the single source of truth for the Content Editor
 */
export const pageContentSchema = mysqlTable("pageContentSchema", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  template: varchar("template", { length: 50 }).default("default"),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull(),
  sectionDisplayName: varchar("sectionDisplayName", { length: 255 }).notNull(),
  sectionType: varchar("sectionType", { length: 50 }).notNull(),
  sectionOrder: int("sectionOrder").default(0),
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(),
  fieldLabel: varchar("fieldLabel", { length: 255 }).notNull(),
  fieldType: varchar("fieldType", { length: 50 }).notNull(), // text, textarea, media, url
  fieldOrder: int("fieldOrder").default(0),
  isRequired: int("isRequired").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageContentSchema = typeof pageContentSchema.$inferSelect;
export type InsertPageContentSchema = typeof pageContentSchema.$inferInsert;

/**
 * Admin Notifications — persistent notification system for sales, shipments, alerts
 */
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["order", "payment", "shipment", "refund", "dispute", "event_registration", "low_stock", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: varchar("link", { length: 500 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  read: int("read").default(0).notNull(),
  dismissed: int("dismissed").default(0).notNull(),
  relatedId: int("relatedId"), // order id, registration id, etc.
  relatedType: varchar("relatedType", { length: 50 }), // "order", "registration", etc.
  metadata: text("metadata"), // JSON string for extra data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

/**
 * ==========================================
 * CUSTOMER ACCOUNTS TABLES
 * ==========================================
 */

/**
 * Customers table — customer accounts for the storefront
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  tier: mysqlEnum("tier", ["customer", "vip", "wholesale"]).default("customer").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  preferences: text("preferences"), // JSON: communication prefs, size prefs, etc.
  emailVerified: int("emailVerified").default(0).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 255 }),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  // Living Codex fields
  codexTier: varchar("codexTier", { length: 30 }), // threshold | self_guided | awakening | reclamation | legacy
  codexPurchaseDate: timestamp("codexPurchaseDate"),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Customer sessions — JWT-backed session tokens
 */
export const customerSessions = mysqlTable("customerSessions", {
  token: varchar("token", { length: 255 }).notNull().primaryKey(),
  customerId: int("customerId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerSession = typeof customerSessions.$inferSelect;

/**
 * Customer addresses — address book (multiple per customer)
 */
export const customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  label: varchar("label", { length: 50 }), // Home, Work, etc.
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("US").notNull(),
  phone: varchar("phone", { length: 50 }),
  isDefaultShipping: int("isDefaultShipping").default(0).notNull(),
  isDefaultBilling: int("isDefaultBilling").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = typeof customerAddresses.$inferInsert;

/**
 * Customer wishlist — saved products
 */
export const customerWishlist = mysqlTable("customerWishlist", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type CustomerWishlistItem = typeof customerWishlist.$inferSelect;
export type InsertCustomerWishlistItem = typeof customerWishlist.$inferInsert;


/**
 * ==========================================
 * LIVING CODEX™ TABLES
 * Matches existing Prisma-created tables in RDS (varchar(30) cuid IDs)
 * ==========================================
 */

/**
 * Codex users (Prisma-created, separate from JXE customers)
 */
export const codexUsers = mysqlTable("codex_users", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("client").notNull(), // client | admin
  tier: varchar("tier", { length: 30 }), // threshold | self_guided | awakening | reclamation | legacy
  purchaseDate: timestamp("purchaseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexUser = typeof codexUsers.$inferSelect;
export type InsertCodexUser = typeof codexUsers.$inferInsert;

/**
 * Codex assessment sessions
 */
export const codexAssessments = mysqlTable("codex_assessments", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  status: varchar("status", { length: 30 }).default("not_started").notNull(),
  currentSection: int("currentSection").default(1).notNull(),
  currentQuestion: int("currentQuestion").default(1).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexAssessment = typeof codexAssessments.$inferSelect;
export type InsertCodexAssessment = typeof codexAssessments.$inferInsert;

/**
 * Codex individual question responses
 */
export const codexResponses = mysqlTable("codex_responses", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  assessmentId: varchar("assessmentId", { length: 30 }).notNull(),
  sectionNum: int("sectionNum").notNull(),
  questionId: varchar("questionId", { length: 30 }).notNull(),
  answerCode: varchar("answerCode", { length: 10 }),
  openText: text("openText"),
  isGhost: int("isGhost").default(0).notNull(),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export type CodexResponse = typeof codexResponses.$inferSelect;
export type InsertCodexResponse = typeof codexResponses.$inferInsert;

/**
 * Codex scoring results
 */
export const codexScorings = mysqlTable("codex_scorings", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  assessmentId: varchar("assessmentId", { length: 30 }).notNull().unique(),
  resultJson: longtext("resultJson").notNull(),
  scoredAt: timestamp("scoredAt").defaultNow().notNull(),
});

export type CodexScoring = typeof codexScorings.$inferSelect;
export type InsertCodexScoring = typeof codexScorings.$inferInsert;

/**
 * Codex mirror reports
 */
export const codexMirrorReports = mysqlTable("codex_mirror_reports", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  assessmentId: varchar("assessmentId", { length: 30 }),
  scoringId: varchar("scoringId", { length: 30 }),
  status: varchar("status", { length: 30 }).default("generating").notNull(),
  contentJson: longtext("contentJson").notNull(),
  aprilNote: text("aprilNote"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  releasedAt: timestamp("releasedAt"),
});

export type CodexMirrorReport = typeof codexMirrorReports.$inferSelect;
export type InsertCodexMirrorReport = typeof codexMirrorReports.$inferInsert;

/**
 * Codex scroll journal entries
 */
export const codexScrollEntries = mysqlTable("codex_scroll_entries", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  moduleNum: int("moduleNum").notNull(),
  promptId: varchar("promptId", { length: 30 }).notNull(),
  responseText: text("responseText"),
  ledgerJson: text("ledgerJson"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexScrollEntry = typeof codexScrollEntries.$inferSelect;
export type InsertCodexScrollEntry = typeof codexScrollEntries.$inferInsert;

/**
 * Codex admin notes on clients
 */
export const codexAdminNotes = mysqlTable("codex_admin_notes", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexAdminNote = typeof codexAdminNotes.$inferSelect;
export type InsertCodexAdminNote = typeof codexAdminNotes.$inferInsert;

/**
 * Codex assessment section definitions
 */
export const codexSections = mysqlTable("codex_sections", {
  id: int("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  glyph: varchar("glyph", { length: 10 }),
  entryText: text("entryText"),
  isSpecial: int("isSpecial").default(0).notNull(),
  weight: varchar("weight", { length: 20 }).default("1").notNull(),
});

export type CodexSection = typeof codexSections.$inferSelect;
export type InsertCodexSection = typeof codexSections.$inferInsert;

/**
 * Codex assessment questions
 */
export const codexQuestions = mysqlTable("codex_questions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  sectionNum: int("sectionNum").notNull(),
  questionNum: int("questionNum").notNull(),
  questionText: text("questionText").notNull(),
  invitation: text("invitation"),
  isGhost: int("isGhost").default(0).notNull(),
  isOpenEnded: int("isOpenEnded").default(0).notNull(),
});

export type CodexQuestion = typeof codexQuestions.$inferSelect;
export type InsertCodexQuestion = typeof codexQuestions.$inferInsert;

/**
 * Codex answer options with scoring metadata
 */
export const codexAnswers = mysqlTable("codex_answers", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  questionId: varchar("questionId", { length: 30 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  answerText: text("text").notNull(),
  spectrumDepth: varchar("spectrumDepth", { length: 30 }).notNull(),
  arPrimary: varchar("arPrimary", { length: 50 }).notNull(),
  arSecondary: varchar("arSecondary", { length: 50 }).notNull(),
  wi: varchar("wi", { length: 50 }).notNull(),
  mp: varchar("mp", { length: 50 }).notNull(),
  mmi: varchar("mmi", { length: 50 }),
  abi: varchar("abi", { length: 50 }),
  epcl: varchar("epcl", { length: 50 }),
  wombField: varchar("wombField", { length: 50 }),
});

export type CodexAnswer = typeof codexAnswers.$inferSelect;
export type InsertCodexAnswer = typeof codexAnswers.$inferInsert;

/**
 * Codex journal entries — prompted reflections with AI-powered insights
 */
export const codexJournalEntries = mysqlTable("codex_journal_entries", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mood: varchar("mood", { length: 50 }),
  themes: text("themes"), // JSON array of theme strings
  aiPrompt: text("aiPrompt"), // the Gemini prompt that inspired this entry
  aiSummary: text("aiSummary"), // Gemini-generated reflection on the entry
  phase: varchar("phase", { length: 50 }),
  archetypeContext: varchar("archetypeContext", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CodexJournalEntry = typeof codexJournalEntries.$inferSelect;
export type InsertCodexJournalEntry = typeof codexJournalEntries.$inferInsert;

/**
 * Codex AI guide conversations
 */
export const codexGuideConversations = mysqlTable("codex_guide_conversations", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  guideId: varchar("guideId", { length: 50 }).notNull(), // orientation, archetype, wound, shadow, embodiment, sovereignty
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CodexGuideConversation = typeof codexGuideConversations.$inferSelect;
export type InsertCodexGuideConversation = typeof codexGuideConversations.$inferInsert;

/**
 * Codex AI guide messages within conversations
 */
export const codexGuideMessages = mysqlTable("codex_guide_messages", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  conversationId: varchar("conversationId", { length: 30 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexGuideMessage = typeof codexGuideMessages.$inferSelect;
export type InsertCodexGuideMessage = typeof codexGuideMessages.$inferInsert;

/**
 * Codex user settings (weather zip, guide preferences, etc.)
 */
export const codexUserSettings = mysqlTable("codex_user_settings", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  weatherZip: varchar("weatherZip", { length: 100 }),
  weatherLat: varchar("weatherLat", { length: 20 }),
  weatherLon: varchar("weatherLon", { length: 20 }),
  guideStyle: varchar("guideStyle", { length: 50 }).default("poetic"),
  guideFrequency: varchar("guideFrequency", { length: 50 }).default("daily"),
  preferredGuideId: varchar("preferredGuideId", { length: 30 }), // kore, aoede, leda, theia, selene, zephyr
  preferredVoiceId: varchar("preferredVoiceId", { length: 50 }), // Kokoro voice ID e.g. af_kore
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CodexUserSettings = typeof codexUserSettings.$inferSelect;
export type InsertCodexUserSettings = typeof codexUserSettings.$inferInsert;

export const codexAIGovernance = mysqlTable("codex_ai_governance", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  configValue: longtext("configValue").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  guideId: varchar("guideId", { length: 50 }),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  isActive: int("isActive").default(1).notNull(),
  updatedBy: varchar("updatedBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexAIGovernance = typeof codexAIGovernance.$inferSelect;

export const codexEscalationResources = mysqlTable("codex_escalation_resources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }),
  availability: varchar("availability", { length: 100 }).default("24/7"),
  category: varchar("category", { length: 100 }).notNull(),
  triggerTypes: text("triggerTypes"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexEscalationResource = typeof codexEscalationResources.$inferSelect;

export const codexEscalationTemplates = mysqlTable("codex_escalation_templates", {
  id: int("id").autoincrement().primaryKey(),
  severity: varchar("severity", { length: 20 }).notNull(),
  templateText: longtext("templateText").notNull(),
  label: varchar("label", { length: 255 }),
  isActive: int("isActive").default(1).notNull(),
  updatedBy: varchar("updatedBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexEscalationTemplate = typeof codexEscalationTemplates.$inferSelect;

export const codexEscalationLog = mysqlTable("codex_escalation_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 30 }),
  sessionId: varchar("sessionId", { length: 255 }),
  triggerType: varchar("triggerType", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  detectedPatterns: text("detectedPatterns"),
  userMessageExcerpt: text("userMessageExcerpt"),
  aiResponseGiven: text("aiResponseGiven"),
  action: varchar("action", { length: 50 }).notNull(),
  resourcesOffered: text("resourcesOffered"),
  resolved: int("resolved").default(0).notNull(),
  resolvedBy: varchar("resolvedBy", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexEscalationLogEntry = typeof codexEscalationLog.$inferSelect;

/**
 * Codex user streaks — daily engagement tracking (Doc 02)
 */
export const codexUserStreaks = mysqlTable("codex_user_streaks", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }), // YYYY-MM-DD
  lastActivityType: varchar("lastActivityType", { length: 50 }),
  gracePeriodUsed: int("gracePeriodUsed").default(0).notNull(), // 0 or 1
  totalActiveDays: int("totalActiveDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexUserStreak = typeof codexUserStreaks.$inferSelect;
export type InsertCodexUserStreak = typeof codexUserStreaks.$inferInsert;

/**
 * Codex milestones — achievement tracking (Doc 02)
 */
export const codexMilestones = mysqlTable("codex_milestones", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  milestoneType: varchar("milestoneType", { length: 60 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  narrative: text("narrative"),
  value: text("value"), // JSON for extra data
  celebrated: int("celebrated").default(0).notNull(), // 0 or 1 — has user seen celebration?
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
export type CodexMilestone = typeof codexMilestones.$inferSelect;
export type InsertCodexMilestone = typeof codexMilestones.$inferInsert;

/**
 * Codex companion state — Tamagotchi-style AI companion (Doc 02)
 */
export const codexCompanionState = mysqlTable("codex_companion_state", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  mood: varchar("mood", { length: 30 }).default("calm").notNull(), // radiant | content | calm | restless | dormant
  energy: int("energy").default(50).notNull(), // 0-100
  lastInteractionAt: timestamp("lastInteractionAt"),
  daysWithoutInteraction: int("daysWithoutInteraction").default(0).notNull(),
  totalInteractions: int("totalInteractions").default(0).notNull(),
  gardenLevel: int("gardenLevel").default(1).notNull(), // 1-5 visual evolution
  gardenElements: text("gardenElements"), // JSON — unlocked garden decorations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexCompanionState = typeof codexCompanionState.$inferSelect;
export type InsertCodexCompanionState = typeof codexCompanionState.$inferInsert;

/**
 * Codex journal ownership — ISBN verification, self-declaration, bundled purchase (Doc 07)
 */
export const codexJournalOwnership = mysqlTable("codex_journal_ownership", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  bookId: varchar("bookId", { length: 10 }).notNull(), // 1a | 1b | 1c
  verificationType: varchar("verificationType", { length: 30 }).notNull(), // isbn | self_declaration | bundled_purchase
  isbn: varchar("isbn", { length: 30 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  verified: int("verified").default(1).notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexJournalOwnership = typeof codexJournalOwnership.$inferSelect;
export type InsertCodexJournalOwnership = typeof codexJournalOwnership.$inferInsert;

/**
 * Bridge entries — user reflections linking a physical journal section to a Codex assessment section (Doc 07)
 */
export const codexBridgeEntries = mysqlTable("codex_bridge_entries", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  bookId: varchar("bookId", { length: 10 }).notNull(), // 1a | 1b | 1c
  journalSection: varchar("journalSection", { length: 60 }).notNull(), // e.g. "1a_ch3_naming"
  codexSection: int("codexSection"), // maps to assessment section 1–16
  entryText: text("entryText").notNull(), // user's bridge reflection
  aiReflection: text("aiReflection"), // AI-generated bridge insight
  themes: text("themes"), // JSON array of detected themes
  maternalPattern: varchar("maternalPattern", { length: 60 }), // present_mother | lost_mother | absent_mother
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexBridgeEntry = typeof codexBridgeEntries.$inferSelect;
export type InsertCodexBridgeEntry = typeof codexBridgeEntries.$inferInsert;

/**
 * Maternal resonance — AI analysis of echoes between journal entries and Codex assessment data (Doc 07)
 */
export const codexMaternalResonance = mysqlTable("codex_maternal_resonance", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  bookId: varchar("bookId", { length: 10 }).notNull(),
  resonanceType: varchar("resonanceType", { length: 30 }).notNull(), // echo | mirror | wound_source | gift | unresolved
  sourceJournalRef: varchar("sourceJournalRef", { length: 60 }), // journal section reference
  sourceCodexRef: varchar("sourceCodexRef", { length: 60 }), // codex section/archetype reference
  pattern: text("pattern").notNull(), // description of the detected resonance
  strength: int("strength").default(50).notNull(), // 0-100 resonance strength
  aiInsight: text("aiInsight"), // AI-generated insight about this resonance
  acknowledged: int("acknowledged").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexMaternalResonance = typeof codexMaternalResonance.$inferSelect;
export type InsertCodexMaternalResonance = typeof codexMaternalResonance.$inferInsert;

/**
 * Social share snippets — AI-generated poetic quotes from journal entries with public share URLs
 */
export const codexShareSnippets = mysqlTable("codex_share_snippets", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(), // short public URL slug
  userId: varchar("userId", { length: 30 }).notNull(),
  journalEntryId: varchar("journalEntryId", { length: 30 }).notNull(),
  snippet: text("snippet").notNull(), // AI-generated poetic shareable text
  hashtags: text("hashtags"), // JSON array of hashtag strings
  imageUrl: text("imageUrl"), // URL to the generated share image
  phase: varchar("phase", { length: 50 }), // user's codex phase at time of share
  archetype: varchar("archetype", { length: 100 }), // user's primary archetype at time of share
  mood: varchar("mood", { length: 50 }), // mood of the original journal entry
  viewCount: int("viewCount").default(0).notNull(),
  shareCount: int("shareCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexShareSnippet = typeof codexShareSnippets.$inferSelect;
export type InsertCodexShareSnippet = typeof codexShareSnippets.$inferInsert;

/**
 * Custom holographic backgrounds — user-uploaded high-res images
 */
export const codexCustomBackgrounds = mysqlTable("codex_custom_backgrounds", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: text("imageUrl").notNull(), // stored image URL (S3 or base64 data URL)
  width: int("width").notNull(),
  height: int("height").notNull(),
  fileSizeKb: int("fileSizeKb"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexCustomBackground = typeof codexCustomBackgrounds.$inferSelect;
export type InsertCodexCustomBackground = typeof codexCustomBackgrounds.$inferInsert;

// ── PHASE 2: SEALED SCROLL MECHANISM ──────────────────────────────────

/**
 * Sealed scroll layers — one row per user per layer (1-5)
 * Tracks seal state, unlock progress, generated content, and view timestamps.
 */
export const codexScrollLayers = mysqlTable("codex_scroll_layers", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  layer: int("layer").notNull(), // 1-5
  sealed: int("sealed").default(1).notNull(), // 1 = sealed, 0 = unsealed
  unlockProgress: text("unlockProgress"), // JSON: ScrollUnlockCondition[]
  unlockedAt: timestamp("unlockedAt"),
  contentData: longtext("contentData"), // JSON: ScrollLayerContent
  viewedAt: timestamp("viewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexScrollLayer = typeof codexScrollLayers.$inferSelect;
export type InsertCodexScrollLayer = typeof codexScrollLayers.$inferInsert;

/**
 * Records interactions with individual scroll layer sections.
 * Used for tracking check-ins (interactionType = "check_in") and reflections.
 */
export const codexScrollInteractions = mysqlTable("codex_scroll_interactions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  layerId: varchar("layerId", { length: 30 }).notNull(), // FK → codex_scroll_layers.id
  sectionId: varchar("sectionId", { length: 60 }), // e.g. "layer_2_body", "layer_3_revelation"
  interactionType: varchar("interactionType", { length: 30 }).notNull(), // "check_in" | "reflection" | "viewed"
  responseText: text("responseText"),
  reflectionDepth: varchar("reflectionDepth", { length: 10 }), // 0.0-1.0 stored as string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexScrollInteraction = typeof codexScrollInteractions.$inferSelect;
export type InsertCodexScrollInteraction = typeof codexScrollInteractions.$inferInsert;

// ── PHASE 3: GUIDED REFLECTION DIALOGUE ───────────────────────────────

/**
 * Dialogue sessions — each guided reflection conversation.
 */
export const codexDialogueSessions = mysqlTable("codex_dialogue_sessions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  type: varchar("type", { length: 40 }).notNull(), // DialogueType enum values
  guideId: varchar("guideId", { length: 30 }), // optional: which guide character
  exchangeCount: int("exchangeCount").default(0).notNull(),
  maxDepthReached: varchar("maxDepthReached", { length: 10 }).default("0").notNull(), // 0.0-1.0
  challengeId: varchar("challengeId", { length: 30 }), // FK → codex_real_world_challenges.id
  status: varchar("status", { length: 20 }).default("active").notNull(), // active | completed | challenge_pending
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexDialogueSession = typeof codexDialogueSessions.$inferSelect;
export type InsertCodexDialogueSession = typeof codexDialogueSessions.$inferInsert;

/**
 * Individual exchanges within a dialogue session.
 */
export const codexDialogueExchanges = mysqlTable("codex_dialogue_exchanges", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  sessionId: varchar("sessionId", { length: 30 }).notNull(), // FK → codex_dialogue_sessions.id
  exchangeIndex: int("exchangeIndex").notNull(), // 0-based position in session
  guidePrompt: text("guidePrompt").notNull(),
  userResponse: text("userResponse"),
  guideReflection: text("guideReflection"),
  depthScore: varchar("depthScore", { length: 10 }), // 0.0-1.0 as string
  patternDetected: text("patternDetected"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexDialogueExchange = typeof codexDialogueExchanges.$inferSelect;
export type InsertCodexDialogueExchange = typeof codexDialogueExchanges.$inferInsert;

/**
 * Real-world challenges issued after dialogue sessions.
 */
export const codexRealWorldChallenges = mysqlTable("codex_real_world_challenges", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  sessionId: varchar("sessionId", { length: 30 }), // FK → codex_dialogue_sessions.id
  challengeText: text("challengeText").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // gentle | moderate | confronting
  timeframe: varchar("timeframe", { length: 255 }).notNull(),
  archetypeTarget: varchar("archetypeTarget", { length: 100 }).notNull(),
  intentDescription: text("intentDescription"),
  reportBackText: text("reportBackText"),
  guideResponse: text("guideResponse"),
  reportDepth: varchar("reportDepth", { length: 10 }), // 0.0-1.0 as string
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexRealWorldChallenge = typeof codexRealWorldChallenges.$inferSelect;
export type InsertCodexRealWorldChallenge = typeof codexRealWorldChallenges.$inferInsert;

/**
 * Micro-revelations — "aha moments" detected or generated during dialogue.
 */
export const codexMicroRevelations = mysqlTable("codex_micro_revelations", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  sessionId: varchar("sessionId", { length: 30 }).notNull(), // FK → codex_dialogue_sessions.id
  content: text("content").notNull(),
  type: varchar("type", { length: 40 }).notNull(), // pattern_named | wound_connection | archetype_activation | shadow_glimpse | gift_emerging
  archetypeRelevance: text("archetypeRelevance"),
  viewed: int("viewed").default(0).notNull(), // 1 = user has seen it
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexMicroRevelation = typeof codexMicroRevelations.$inferSelect;
export type InsertCodexMicroRevelation = typeof codexMicroRevelations.$inferInsert;

// ── PHASE 4: LIVING MIRROR REPORT ─────────────────────────────────────

/**
 * Mirror snapshots — extracted themes/tone from any content source (journal, check-in, dialogue).
 */
export const codexMirrorSnapshots = mysqlTable("codex_mirror_snapshots", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  sourceType: varchar("sourceType", { length: 30 }).notNull(), // journal | check_in | dialogue | assessment
  sourceId: varchar("sourceId", { length: 30 }).notNull(),
  dominantThemes: text("dominantThemes"), // JSON: string[]
  emotionalTone: text("emotionalTone"), // JSON: { primary, secondary, valence }
  avoidancePatterns: text("avoidancePatterns"), // plain text description
  growthIndicators: text("growthIndicators"), // plain text description
  userLanguage: text("userLanguage"), // JSON: string[] — actual phrases the user used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexMirrorSnapshot = typeof codexMirrorSnapshots.$inferSelect;
export type InsertCodexMirrorSnapshot = typeof codexMirrorSnapshots.$inferInsert;

/**
 * Mirror addendums — dynamic additions to the living mirror report.
 */
export const codexMirrorAddendums = mysqlTable("codex_mirror_addendums", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  reportId: varchar("reportId", { length: 30 }), // FK → codex_mirror_reports.id (optional)
  type: varchar("type", { length: 40 }).notNull(), // pattern_shift | growth_recognition | new_insight | temporal_reflection
  content: text("content").notNull(),
  patternShiftData: text("patternShiftData"), // JSON: PatternShift (if type=pattern_shift)
  viewedAt: timestamp("viewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexMirrorAddendum = typeof codexMirrorAddendums.$inferSelect;
export type InsertCodexMirrorAddendum = typeof codexMirrorAddendums.$inferInsert;

/**
 * Pattern shifts — detected before/after changes in user's patterns over time.
 */
export const codexPatternShifts = mysqlTable("codex_pattern_shifts", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  pattern: text("pattern").notNull(), // the pattern being tracked
  direction: varchar("direction", { length: 20 }).notNull(), // emerging | resolving | deepening | shifting
  evidenceBefore: text("evidenceBefore").notNull(),
  evidenceAfter: text("evidenceAfter").notNull(),
  narrative: text("narrative").notNull(), // human-readable shift description
  confidenceScore: varchar("confidenceScore", { length: 10 }).default("0.5").notNull(), // 0.0-1.0 as string
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});
export type CodexPatternShift = typeof codexPatternShifts.$inferSelect;
export type InsertCodexPatternShift = typeof codexPatternShifts.$inferInsert;

// ── PHASE 5: CHECK-IN RITUAL SYSTEM ───────────────────────────────────

/**
 * Check-in sessions — daily or weekly ritual responses.
 */
export const codexCheckIns = mysqlTable("codex_check_ins", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // daily | weekly
  questionsData: text("questionsData").notNull(), // JSON: CheckInQuestion[]
  responsesData: text("responsesData"), // JSON: { questionId, response }[]
  patternsExtracted: text("patternsExtracted"), // JSON: string[]
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexCheckIn = typeof codexCheckIns.$inferSelect;
export type InsertCodexCheckIn = typeof codexCheckIns.$inferInsert;

/**
 * Check-in patterns — aggregated recurring patterns from check-in history.
 */
export const codexCheckInPatterns = mysqlTable("codex_check_in_patterns", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  pattern: varchar("pattern", { length: 300 }).notNull(),
  frequency: int("frequency").default(1).notNull(),
  trend: varchar("trend", { length: 20 }).default("stable").notNull(), // rising | falling | stable | new
  relatedArchetype: varchar("relatedArchetype", { length: 100 }),
  firstDetectedAt: timestamp("firstDetectedAt").defaultNow().notNull(),
  lastDetectedAt: timestamp("lastDetectedAt").defaultNow().notNull(),
});
export type CodexCheckInPattern = typeof codexCheckInPatterns.$inferSelect;
export type InsertCodexCheckInPattern = typeof codexCheckInPatterns.$inferInsert;

// ── PHASE 6: GUIDE MEMORY ─────────────────────────────────────────────

/**
 * Guide memory — per-user per-guide relationship tracking.
 */
export const codexGuideMemory = mysqlTable("codex_guide_memory", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  guideId: varchar("guideId", { length: 30 }).notNull(),
  intimacyLevel: int("intimacyLevel").default(0).notNull(), // 0-10
  totalSessions: int("totalSessions").default(0).notNull(),
  totalExchanges: int("totalExchanges").default(0).notNull(),
  recurringThemes: text("recurringThemes"), // JSON: string[]
  userLanguage: text("userLanguage"), // JSON: string[] — characteristic phrases
  lastInteractionAt: timestamp("lastInteractionAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CodexGuideMemoryRecord = typeof codexGuideMemory.$inferSelect;
export type InsertCodexGuideMemoryRecord = typeof codexGuideMemory.$inferInsert;

/**
 * Guide key moments — significant exchanges worth referencing in future sessions.
 */
export const codexGuideKeyMoments = mysqlTable("codex_guide_key_moments", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  guideId: varchar("guideId", { length: 30 }).notNull(),
  content: text("content").notNull(), // the key moment text
  context: text("context").notNull(), // surrounding context
  emotionalIntensity: varchar("emotionalIntensity", { length: 20 }).default("moderate").notNull(), // low | moderate | high | peak
  referenced: int("referenced").default(0).notNull(), // 0=never referenced, count of references
  lastReferencedAt: timestamp("lastReferencedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexGuideKeyMoment = typeof codexGuideKeyMoments.$inferSelect;
export type InsertCodexGuideKeyMoment = typeof codexGuideKeyMoments.$inferInsert;

// ── PHASE 7: PREDICTIVE ENGINE ────────────────────────────────────────

/**
 * Predictions — computed scores and intervention recommendations per user.
 */
export const codexPredictions = mysqlTable("codex_predictions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  predictionData: text("predictionData"), // JSON: full prediction detail object
  selfSabotageScore: varchar("selfSabotageScore", { length: 10 }).default("0").notNull(), // 0.0-1.0 as string
  phaseReadinessScore: varchar("phaseReadinessScore", { length: 10 }).default("0").notNull(), // 0.0-1.0 as string
  retentionRiskScore: varchar("retentionRiskScore", { length: 10 }).default("0").notNull(), // 0.0-1.0 as string
  interventionRecommended: varchar("interventionRecommended", { length: 50 }), // mirror_nudge | guide_prompt | challenge_reissue | streak_recovery
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexPrediction = typeof codexPredictions.$inferSelect;
export type InsertCodexPrediction = typeof codexPredictions.$inferInsert;

/**
 * Prediction outcomes — tracks accuracy of past predictions.
 */
export const codexPredictionOutcomes = mysqlTable("codex_prediction_outcomes", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  predictionId: varchar("predictionId", { length: 30 }).notNull(), // FK → codex_predictions.id
  predictedEvent: varchar("predictedEvent", { length: 100 }).notNull(),
  actualOutcome: varchar("actualOutcome", { length: 100 }),
  accuracy: varchar("accuracy", { length: 10 }), // 0.0-1.0 as string
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CodexPredictionOutcome = typeof codexPredictionOutcomes.$inferSelect;
export type InsertCodexPredictionOutcome = typeof codexPredictionOutcomes.$inferInsert;

// ── PHASE 8: EVENT BUS ────────────────────────────────────────────────

/**
 * Codex events — typed event log with reaction tracking.
 */
export const codexEvents = mysqlTable("codex_events", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  eventType: varchar("eventType", { length: 60 }).notNull(), // assessment_completed | journal_created | check_in_completed | dialogue_completed | challenge_reported_back | scroll_layer_unlocked | pattern_shift_detected | milestone_earned | phase_transition
  eventData: text("eventData"), // JSON: event payload
  reactionsTriggered: text("reactionsTriggered"), // JSON: string[] — names of reactions that ran
  errors: text("errors"), // JSON: { reaction, error }[] — reactions that failed
  emittedAt: timestamp("emittedAt").defaultNow().notNull(),
});
export type CodexEvent = typeof codexEvents.$inferSelect;
export type InsertCodexEvent = typeof codexEvents.$inferInsert;

// ── PHASE 1: ADAPTIVE ASSESSMENT ENGINE ──────────────────────────────

/**
 * Adaptive assessment sessions — stores the full Bayesian state per user session.
 */
export const codexAdaptiveSessions = mysqlTable("codex_adaptive_sessions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  assessmentId: varchar("assessmentId", { length: 30 }).notNull(),
  /** Full AdaptiveState as JSON. */
  state: text("state").notNull(),
  /** AdaptiveConfig as JSON (only non-default values recorded). */
  config: text("config"),
  phase: varchar("phase", { length: 30 }).notNull().default("broad_signal"),
  questionsAsked: int("questionsAsked").default(0).notNull(),
  topArchetype: varchar("topArchetype", { length: 100 }),
  /** Top posterior probability stored as string (e.g. "0.82"). */
  topConfidence: varchar("topConfidence", { length: 10 }),
  /** Current Shannon entropy stored as string (e.g. "1.45"). */
  entropy: varchar("entropy", { length: 10 }),
  /** 0 = active, 1 = terminated. */
  terminated: int("terminated").default(0).notNull(),
  terminationReason: varchar("terminationReason", { length: 60 }),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CodexAdaptiveSession = typeof codexAdaptiveSessions.$inferSelect;
export type InsertCodexAdaptiveSession = typeof codexAdaptiveSessions.$inferInsert;

/**
 * Question signal profiles — precomputed discrimination weights per question.
 * Seeded by scripts/initializeQuestionSignals.ts.
 */
export const codexQuestionSignals = mysqlTable("codex_question_signals", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  questionId: varchar("questionId", { length: 30 }).notNull().unique(),
  sectionNum: int("sectionNum").notNull(),
  /** JSON: Record<archetype, weight 0-1> */
  archetypeWeights: text("archetypeWeights").notNull(),
  /** JSON: Record<woundCode, weight 0-1> */
  woundWeights: text("woundWeights").notNull(),
  /** Expected information gain stored as string (e.g. "0.347"). */
  informationGain: varchar("informationGain", { length: 10 }),
  /** Discriminative power (variance of archetype weights) stored as string. */
  discriminativePower: varchar("discriminativePower", { length: 10 }),
  /** How many adaptive sessions have asked this question. */
  timesAsked: int("timesAsked").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexQuestionSignal = typeof codexQuestionSignals.$inferSelect;
export type InsertCodexQuestionSignal = typeof codexQuestionSignals.$inferInsert;

/**
 * Adaptive assessment responses — individual answers with posterior snapshots.
 */
export const codexAdaptiveResponses = mysqlTable("codex_adaptive_responses", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  sessionId: varchar("sessionId", { length: 30 }).notNull(),
  questionId: varchar("questionId", { length: 30 }).notNull(),
  /** Zero-based position in this session's question sequence. */
  questionIndex: int("questionIndex").notNull(),
  answerCode: varchar("answerCode", { length: 10 }),
  openText: text("openText"),
  /** JSON: top-5 ArchetypePrior[] snapshot after this answer. */
  posteriorsSnapshot: text("posteriorsSnapshot"),
  /** Entropy immediately after this answer stored as string (e.g. "2.14"). */
  entropyAtAnswer: varchar("entropyAtAnswer", { length: 10 }),
  phaseAtAnswer: varchar("phaseAtAnswer", { length: 30 }),
  /** Client-reported time to answer in milliseconds. */
  responseTimeMs: int("responseTimeMs"),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export type CodexAdaptiveResponse = typeof codexAdaptiveResponses.$inferSelect;
export type InsertCodexAdaptiveResponse = typeof codexAdaptiveResponses.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY SYSTEM — Circles, Threading, Reactions, Moderation, Resonance
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Circles — the containers for community groups.
 * Types: general, archetype, phase, resonance_pod, mirror_pair,
 *        wound_kinship, complement, offering, reflection
 */
export const codexCircles = mysqlTable("codex_circles", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleType: varchar("circleType", { length: 30 }).notNull(), // general | archetype | phase | resonance_pod | mirror_pair | wound_kinship | complement | offering | reflection
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  /** For archetype circles — the archetype key (e.g. "silent-flame") */
  archetypeFilter: varchar("archetypeFilter", { length: 100 }),
  /** For phase circles — the phase number */
  phaseFilter: int("phaseFilter"),
  /** For wound kinship circles — the wound code */
  woundFilter: varchar("woundFilter", { length: 100 }),
  maxMembers: int("maxMembers").default(0).notNull(), // 0 = unlimited
  isActive: int("isActive").default(1).notNull(),
  visibility: varchar("visibility", { length: 20 }).default("public").notNull(), // public | private | hidden
  facilitatorType: varchar("facilitatorType", { length: 20 }).default("ai").notNull(), // ai | elder | admin | none
  /** JSON: AI guide config for weekly prompts */
  aiPromptConfig: text("aiPromptConfig"),
  /** JSON: flexible circle metadata */
  metadata: text("metadata"),
  createdBy: varchar("createdBy", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexCircle = typeof codexCircles.$inferSelect;
export type InsertCodexCircle = typeof codexCircles.$inferInsert;

/**
 * Circle memberships — tracks who belongs to which circle.
 */
export const codexCircleMembers = mysqlTable("codex_circle_members", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleId: varchar("circleId", { length: 30 }).notNull(),
  userId: varchar("userId", { length: 30 }).notNull(),
  role: varchar("role", { length: 20 }).default("member").notNull(), // member | facilitator | elder | observer
  status: varchar("status", { length: 20 }).default("active").notNull(), // active | invited | pending | exited | graduated
  trustScore: int("trustScore").default(50).notNull(), // 0-100
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  exitedAt: timestamp("exitedAt"),
  exitReason: varchar("exitReason", { length: 100 }),
  lastActiveAt: timestamp("lastActiveAt"),
  notificationPref: varchar("notificationPref", { length: 20 }).default("digest").notNull(), // all | digest | mentions | none
});

export type CodexCircleMember = typeof codexCircleMembers.$inferSelect;
export type InsertCodexCircleMember = typeof codexCircleMembers.$inferInsert;

/**
 * Community threads — discussion topics within circles.
 */
export const codexCommunityThreads = mysqlTable("codex_community_threads", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleId: varchar("circleId", { length: 30 }).notNull(),
  authorId: varchar("authorId", { length: 30 }).notNull(),
  threadType: varchar("threadType", { length: 30 }).default("discussion").notNull(), // discussion | ceremony | prompt | milestone | offering | reflection | introduction
  title: varchar("title", { length: 500 }).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  isLocked: int("isLocked").default(0).notNull(),
  isAnonymous: int("isAnonymous").default(0).notNull(), // Veil Mode
  replyCount: int("replyCount").default(0).notNull(),
  aiGenerated: int("aiGenerated").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active | closed | moderated | archived
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexCommunityThread = typeof codexCommunityThreads.$inferSelect;
export type InsertCodexCommunityThread = typeof codexCommunityThreads.$inferInsert;

/**
 * Community messages — individual posts within threads.
 */
export const codexCommunityMessages = mysqlTable("codex_community_messages", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  threadId: varchar("threadId", { length: 30 }).notNull(),
  authorId: varchar("authorId", { length: 30 }).notNull(),
  parentMessageId: varchar("parentMessageId", { length: 30 }), // for nested replies
  content: text("content").notNull(),
  contentType: varchar("contentType", { length: 30 }).default("text").notNull(), // text | voice | journal_excerpt | prompt_response | ai_reflection | ceremony_step
  isAnonymous: int("isAnonymous").default(0).notNull(), // Veil Mode
  isAI: int("isAI").default(0).notNull(),
  moderationStatus: varchar("moderationStatus", { length: 20 }).default("approved").notNull(), // pending | approved | flagged | removed
  moderationNote: text("moderationNote"),
  /** JSON cache: { witnessed: 3, resonates: 5, holding_space: 2, flame: 1, mirror: 0, offering: 0 } */
  reactionSummary: text("reactionSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexCommunityMessage = typeof codexCommunityMessages.$inferSelect;
export type InsertCodexCommunityMessage = typeof codexCommunityMessages.$inferInsert;

/**
 * Reactions — meaningful community reactions (not likes/hearts).
 * witnessed | resonates | holding_space | flame | mirror | offering
 */
export const codexReactions = mysqlTable("codex_reactions", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  messageId: varchar("messageId", { length: 30 }).notNull(),
  userId: varchar("userId", { length: 30 }).notNull(),
  reactionType: varchar("reactionType", { length: 20 }).notNull(), // witnessed | resonates | holding_space | flame | mirror | offering
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexReaction = typeof codexReactions.$inferSelect;
export type InsertCodexReaction = typeof codexReactions.$inferInsert;

/**
 * Trust events — delta tracking for community trust scores.
 */
export const codexTrustEvents = mysqlTable("codex_trust_events", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  circleId: varchar("circleId", { length: 30 }),
  eventType: varchar("eventType", { length: 40 }).notNull(), // positive_contribution | consistent_presence | ceremony_participation | offering_given | flag_received | warning_issued | boundary_violation | moderation_action
  delta: int("delta").notNull(), // positive or negative
  reason: varchar("reason", { length: 255 }),
  issuedBy: varchar("issuedBy", { length: 20 }).notNull(), // system | ai | moderator | admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexTrustEvent = typeof codexTrustEvents.$inferSelect;
export type InsertCodexTrustEvent = typeof codexTrustEvents.$inferInsert;

/**
 * Moderation log — audit trail for all community moderation actions.
 */
export const codexModerationLog = mysqlTable("codex_moderation_log", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  messageId: varchar("messageId", { length: 30 }),
  userId: varchar("userId", { length: 30 }).notNull(), // subject of moderation
  moderatorType: varchar("moderatorType", { length: 20 }).notNull(), // ai | elder | admin
  moderatorId: varchar("moderatorId", { length: 30 }), // userId if human moderator
  action: varchar("action", { length: 20 }).notNull(), // approve | flag | remove | restore | escalate | warn | mute
  reason: text("reason"),
  aiConfidence: varchar("aiConfidence", { length: 10 }), // e.g. "0.92"
  previousStatus: varchar("previousStatus", { length: 20 }),
  newStatus: varchar("newStatus", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexModerationLogEntry = typeof codexModerationLog.$inferSelect;
export type InsertCodexModerationLogEntry = typeof codexModerationLog.$inferInsert;

/**
 * Ceremonies — AI-facilitated group sessions within circles.
 */
export const codexCeremonies = mysqlTable("codex_ceremonies", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleId: varchar("circleId", { length: 30 }).notNull(),
  hostId: varchar("hostId", { length: 30 }), // userId or null for AI-hosted
  ceremonyType: varchar("ceremonyType", { length: 40 }).notNull(), // weekly_reflection | phase_entry | phase_exit | wound_exploration | moon_cycle | seasonal | pod_introduction | mirror_reveal | offering_match | collective_mirror | milestone_celebration
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  /** JSON: ordered list of prompt steps for the ceremony */
  promptSequenceJson: longtext("promptSequenceJson"),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(), // scheduled | active | completed | cancelled
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  maxParticipants: int("maxParticipants").default(12).notNull(),
  /** JSON: array of participating userIds */
  participantIds: text("participantIds"),
  /** JSON: AI-generated collective reflection after completion */
  synthesisJson: longtext("synthesisJson"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexCeremony = typeof codexCeremonies.$inferSelect;
export type InsertCodexCeremony = typeof codexCeremonies.$inferInsert;

/**
 * Collective mirrors — AI synthesis of circle patterns over time.
 */
export const codexCollectiveMirrors = mysqlTable("codex_collective_mirrors", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleId: varchar("circleId", { length: 30 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  /** JSON: full synthesis report — themes, patterns, movements, edges, invitations */
  reportJson: longtext("reportJson"),
  memberCount: int("memberCount").notNull(),
  activeCount: int("activeCount").notNull(),
  /** JSON: string[] top themes */
  dominantThemes: text("dominantThemes"),
  /** JSON: { shadow, threshold, gift, movement } */
  spectrumShift: text("spectrumShift"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type CodexCollectiveMirror = typeof codexCollectiveMirrors.$inferSelect;
export type InsertCodexCollectiveMirror = typeof codexCollectiveMirrors.$inferInsert;

/**
 * Resonance matches — pairwise matching scores between users.
 * Stores sub-scores for transparency on WHY two users match.
 */
export const codexResonanceMatches = mysqlTable("codex_resonance_matches", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userIdA: varchar("userIdA", { length: 30 }).notNull(),
  userIdB: varchar("userIdB", { length: 30 }).notNull(),
  matchMode: varchar("matchMode", { length: 20 }).notNull(), // resonance | complement | kinship
  /** Overall resonance score 0-1000 (stored as int, divide by 1000 for 0.000-1.000) */
  overallScore: int("overallScore").notNull(),
  /** JSON: { archetypeOverlap, woundKinship, spectrumCorrelation, mirrorAlignment, phaseProximity, contradictionResonance, integrationParity } */
  subscoreJson: text("subscoreJson"),
  /** JSON: string[] shared archetype names */
  sharedArchetypes: text("sharedArchetypes"),
  /** JSON: string[] shared wound codes */
  sharedWounds: text("sharedWounds"),
  /** JSON: string[] shared mirror pattern codes */
  sharedMirrors: text("sharedMirrors"),
  computedAt: timestamp("computedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type CodexResonanceMatch = typeof codexResonanceMatches.$inferSelect;
export type InsertCodexResonanceMatch = typeof codexResonanceMatches.$inferInsert;

/**
 * Offering holders — Phase 8-9 women who mentor earlier-phase women.
 */
export const codexOfferingHolders = mysqlTable("codex_offering_holders", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).default("applied").notNull(), // applied | approved | active | paused | retired | declined
  /** JSON: application text and readiness data */
  applicationJson: text("applicationJson"),
  /** AI-computed readiness score 0-100 */
  aiReadinessScore: int("aiReadinessScore"),
  approvedBy: varchar("approvedBy", { length: 30 }),
  /** JSON: string[] wound codes and archetype keys this holder specializes in */
  specializations: text("specializations"),
  maxSeekers: int("maxSeekers").default(3).notNull(),
  currentSeekerCount: int("currentSeekerCount").default(0).notNull(),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexOfferingHolder = typeof codexOfferingHolders.$inferSelect;
export type InsertCodexOfferingHolder = typeof codexOfferingHolders.$inferInsert;

/**
 * Offering matches — elder-seeker pairings within Offering Circles.
 */
export const codexOfferingMatches = mysqlTable("codex_offering_matches", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  holderId: varchar("holderId", { length: 30 }).notNull(), // FK -> codex_offering_holders.id
  seekerUserId: varchar("seekerUserId", { length: 30 }).notNull(), // FK -> codex_users.id
  circleId: varchar("circleId", { length: 30 }), // FK -> codex_circles.id (the offering circle)
  matchScore: int("matchScore"), // 0-1000
  /** JSON: reasons for the match */
  matchReason: text("matchReason"),
  status: varchar("status", { length: 20 }).default("proposed").notNull(), // proposed | accepted | active | completed | ended
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  /** JSON: feedback from both parties */
  feedbackJson: text("feedbackJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexOfferingMatch = typeof codexOfferingMatches.$inferSelect;
export type InsertCodexOfferingMatch = typeof codexOfferingMatches.$inferInsert;

/**
 * Genome vectors — normalized numeric embeddings of each user's psychic genome
 * for fast approximate nearest-neighbor matching.
 */
export const codexGenomeVectors = mysqlTable("codex_genome_vectors", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull().unique(),
  /** JSON: number[] — normalized archetype scores (15-dimensional) */
  archetypeVector: text("archetypeVector"),
  /** JSON: number[] — normalized wound scores */
  woundVector: text("woundVector"),
  /** JSON: number[] — [shadowPct, thresholdPct, giftPct] */
  spectrumVector: text("spectrumVector"),
  /** JSON: number[] — normalized mirror pattern scores */
  mirrorVector: text("mirrorVector"),
  /** JSON: number[] — one-hot phase encoding */
  phaseVector: text("phaseVector"),
  /** JSON: number[] — full concatenated + weighted composite */
  compositeVector: text("compositeVector"),
  /** Which scoring generated this vector */
  scoringId: varchar("scoringId", { length: 30 }),
  computedAt: timestamp("computedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexGenomeVector = typeof codexGenomeVectors.$inferSelect;
export type InsertCodexGenomeVector = typeof codexGenomeVectors.$inferInsert;

// ============================================================================
// COMMUNITY MESSAGING — Direct messages + circle chat
// Inspired by EusoTrip messaging architecture, adapted for sacred community
// ============================================================================

/**
 * Conversations — DMs and group chats between circle members.
 * Linked to a circle context so messaging stays within community bounds.
 */
export const codexConversations = mysqlTable("codex_conversations", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  circleId: varchar("circleId", { length: 30 }), // null = cross-circle DM
  type: varchar("type", { length: 20 }).default("direct").notNull(), // direct | group | circle_chat
  name: varchar("name", { length: 255 }), // for group conversations
  createdById: varchar("createdById", { length: 30 }).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  lastMessagePreview: varchar("lastMessagePreview", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexConversation = typeof codexConversations.$inferSelect;
export type InsertCodexConversation = typeof codexConversations.$inferInsert;

/**
 * Conversation participants — membership, read state, preferences.
 */
export const codexConversationParticipants = mysqlTable("codex_conversation_participants", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  conversationId: varchar("conversationId", { length: 30 }).notNull(),
  userId: varchar("userId", { length: 30 }).notNull(),
  role: varchar("role", { length: 20 }).default("member").notNull(), // owner | admin | member
  unreadCount: int("unreadCount").default(0).notNull(),
  lastReadAt: timestamp("lastReadAt"),
  isPinned: boolean("isPinned").default(false).notNull(),
  isMuted: boolean("isMuted").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
});

export type CodexConversationParticipant = typeof codexConversationParticipants.$inferSelect;
export type InsertCodexConversationParticipant = typeof codexConversationParticipants.$inferInsert;

/**
 * Direct/chat messages — real-time messages within conversations.
 * Separate from community thread messages (which are discussion-oriented).
 */
export const codexDirectMessages = mysqlTable("codex_direct_messages", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  conversationId: varchar("conversationId", { length: 30 }).notNull(),
  senderId: varchar("senderId", { length: 30 }).notNull(),
  content: text("content"),
  contentType: varchar("contentType", { length: 30 }).default("text").notNull(), // text | image | voice_note | journal_share | prompt_share | system
  parentMessageId: varchar("parentMessageId", { length: 30 }), // reply threading
  isUnsent: boolean("isUnsent").default(false).notNull(),
  /** JSON: array of { userId, readAt } */
  readReceipts: text("readReceipts"),
  /** JSON: arbitrary metadata (attachment info, shared content refs, etc.) */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CodexDirectMessage = typeof codexDirectMessages.$inferSelect;
export type InsertCodexDirectMessage = typeof codexDirectMessages.$inferInsert;

/**
 * Message attachments — files, images, voice notes shared in messages.
 */
export const codexMessageAttachments = mysqlTable("codex_message_attachments", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  messageId: varchar("messageId", { length: 30 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // image | document | audio | voice_note
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"), // bytes
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodexMessageAttachment = typeof codexMessageAttachments.$inferSelect;
export type InsertCodexMessageAttachment = typeof codexMessageAttachments.$inferInsert;

/**
 * User presence — tracks online/active status for circle members.
 */
export const codexUserPresence = mysqlTable("codex_user_presence", {
  id: varchar("id", { length: 30 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 30 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("offline").notNull(), // online | away | offline
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  /** JSON: { circleId, view } — what the user is currently viewing */
  activeContext: text("activeContext"),
});
