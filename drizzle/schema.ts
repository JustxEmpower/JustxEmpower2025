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
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
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
