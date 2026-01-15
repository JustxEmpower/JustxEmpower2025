/**
 * Enhanced Backup System - Server-Side Implementation
 * Time Machine-inspired comprehensive backup solution
 * 
 * File: /server/backupSystem.ts
 * 
 * Features:
 * - Comprehensive data capture (all tables)
 * - Media metadata preservation
 * - Configuration snapshots
 * - Incremental backup support
 * - Automated scheduling
 * - Granular restore options
 * - Validation and integrity checks
 */

import { getDb } from "./db";
import { 
  // Core content
  backups, articles, pages, pageBlocks, siteContent, media,
  // Configuration
  themeSettings, navigation, seoSettings, brandAssets,
  fontSettings, contentTextStyles, sectionBackgrounds,
  // Forms
  formFields, formSubmissions, contactSubmissions,
  // System
  redirects, siteSettings, blockTemplates, blockVersions,
  users, adminUsers, adminSessions,
  // AI
  aiSettings, aiChatConversations, aiFeedback,
  // E-commerce
  products, productCategories, productVariants, orders, orderItems,
  discountCodes, shoppingCarts,
  // Events
  events, eventAttendees, eventRegistrations, eventTicketTypes,
  // Resources
  resources, resourceCategories, resourceDownloads,
  // Marketing
  newsletterSubscribers, emailSettings, carouselOfferings,
  // Analytics (optional - can be large)
  analyticsEvents, analyticsPageViews, analyticsSessions, visitorProfiles
} from "../drizzle/schema";
import { eq, sql, desc, asc, and, gte, lte } from "drizzle-orm";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";

// ============================================================================
// TYPES
// ============================================================================

interface BackupOptions {
  backupName: string;
  description?: string;
  backupType?: "manual" | "auto" | "scheduled";
  includeMedia?: boolean;
  includeConfig?: boolean;
  createdBy?: string;
}

interface MediaFileInfo {
  key: string;           // S3 key (path)
  size: number;          // File size in bytes
  lastModified: string;  // ISO timestamp
  backupKey?: string;    // Key in backup folder after copy
}

interface BackupData {
  version: string;
  timestamp: string;
  metadata: {
    name: string;
    description?: string;
    type: string;
    createdBy?: string;
    tablesIncluded: string[];
    recordCounts: Record<string, number>;
    checksum?: string;
    mediaFilesCount?: number;
    mediaFilesSize?: number;  // Total size in bytes
    mediaBackupFolder?: string;  // S3 folder where media files are copied
  };
  data: Record<string, any[]>;
  mediaFiles?: MediaFileInfo[];  // List of media files included in backup
}

interface RestoreOptions {
  backupId: number;
  tables?: string[];  // Selective restore - if empty, restore all
  dryRun?: boolean;   // Preview what would be restored
}

interface RestoreResult {
  success: boolean;
  restored: string[];
  errors: string[];
  summary: string;
  recordsRestored: number;
  dryRun: boolean;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  recordCounts: Record<string, number>;
  estimatedSize: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKUP_VERSION = "2.0.0";
const BATCH_SIZE = 100;
const MAX_BACKUP_SIZE_MB = 500;

// Table registry with schema references - COMPLETE LIST OF ALL TABLES
// Priority levels: 1=Critical, 2=Important, 3=Settings, 4=Structure, 5=Business, 6=Features, 7=System, 8=Optional, 9=Analytics
const TABLE_REGISTRY: Record<string, { schema: any; priority: number; category: string }> = {
  // ============================================================================
  // CORE CONTENT (Priority 1 - Critical) - Must be backed up first
  // ============================================================================
  pages: { schema: pages, priority: 1, category: "content" },
  pageBlocks: { schema: pageBlocks, priority: 1, category: "content" },
  siteContent: { schema: siteContent, priority: 1, category: "content" },
  articles: { schema: articles, priority: 1, category: "content" },
  carouselOfferings: { schema: carouselOfferings, priority: 1, category: "content" },
  
  // ============================================================================
  // MEDIA & ASSETS (Priority 2 - Important)
  // ============================================================================
  media: { schema: media, priority: 2, category: "media" },
  brandAssets: { schema: brandAssets, priority: 2, category: "media" },
  
  // ============================================================================
  // CONFIGURATION (Priority 3 - Settings)
  // ============================================================================
  themeSettings: { schema: themeSettings, priority: 3, category: "config" },
  navigation: { schema: navigation, priority: 3, category: "config" },
  seoSettings: { schema: seoSettings, priority: 3, category: "config" },
  siteSettings: { schema: siteSettings, priority: 3, category: "config" },
  fontSettings: { schema: fontSettings, priority: 3, category: "config" },
  contentTextStyles: { schema: contentTextStyles, priority: 3, category: "config" },
  sectionBackgrounds: { schema: sectionBackgrounds, priority: 3, category: "config" },
  emailSettings: { schema: emailSettings, priority: 3, category: "config" },
  
  // ============================================================================
  // TEMPLATES & FORMS (Priority 4 - Structure)
  // ============================================================================
  blockTemplates: { schema: blockTemplates, priority: 4, category: "templates" },
  blockVersions: { schema: blockVersions, priority: 4, category: "templates" },
  formFields: { schema: formFields, priority: 4, category: "forms" },
  formSubmissions: { schema: formSubmissions, priority: 4, category: "forms" },
  contactSubmissions: { schema: contactSubmissions, priority: 4, category: "forms" },
  
  // ============================================================================
  // E-COMMERCE (Priority 5 - Business Critical)
  // ============================================================================
  products: { schema: products, priority: 5, category: "ecommerce" },
  productCategories: { schema: productCategories, priority: 5, category: "ecommerce" },
  productVariants: { schema: productVariants, priority: 5, category: "ecommerce" },
  orders: { schema: orders, priority: 5, category: "ecommerce" },
  orderItems: { schema: orderItems, priority: 5, category: "ecommerce" },
  discountCodes: { schema: discountCodes, priority: 5, category: "ecommerce" },
  shoppingCarts: { schema: shoppingCarts, priority: 5, category: "ecommerce" },
  
  // ============================================================================
  // EVENTS & CALENDAR (Priority 6 - Features)
  // ============================================================================
  events: { schema: events, priority: 6, category: "events" },
  eventAttendees: { schema: eventAttendees, priority: 6, category: "events" },
  eventRegistrations: { schema: eventRegistrations, priority: 6, category: "events" },
  eventTicketTypes: { schema: eventTicketTypes, priority: 6, category: "events" },
  
  // ============================================================================
  // RESOURCES (Priority 6 - Features)
  // ============================================================================
  resources: { schema: resources, priority: 6, category: "resources" },
  resourceCategories: { schema: resourceCategories, priority: 6, category: "resources" },
  resourceDownloads: { schema: resourceDownloads, priority: 6, category: "resources" },
  
  // ============================================================================
  // MARKETING (Priority 6 - Features)
  // ============================================================================
  newsletterSubscribers: { schema: newsletterSubscribers, priority: 6, category: "marketing" },
  
  // ============================================================================
  // SYSTEM (Priority 7 - Infrastructure)
  // ============================================================================
  users: { schema: users, priority: 7, category: "system" },
  adminUsers: { schema: adminUsers, priority: 7, category: "system" },
  adminSessions: { schema: adminSessions, priority: 7, category: "system" },
  redirects: { schema: redirects, priority: 7, category: "system" },
  
  // ============================================================================
  // AI FEATURES (Priority 8 - Optional)
  // ============================================================================
  aiSettings: { schema: aiSettings, priority: 8, category: "ai" },
  aiChatConversations: { schema: aiChatConversations, priority: 8, category: "ai" },
  aiFeedback: { schema: aiFeedback, priority: 8, category: "ai" },
  
  // ============================================================================
  // ANALYTICS (Priority 9 - Optional, can be large)
  // These are excluded by default to keep backups small
  // ============================================================================
  analyticsEvents: { schema: analyticsEvents, priority: 9, category: "analytics" },
  analyticsPageViews: { schema: analyticsPageViews, priority: 9, category: "analytics" },
  analyticsSessions: { schema: analyticsSessions, priority: 9, category: "analytics" },
  visitorProfiles: { schema: visitorProfiles, priority: 9, category: "analytics" },
};

// ============================================================================
// S3 CLIENT (using shared storage helpers)
// ============================================================================

// Extract region from AWS_REGION (handles various formats)
const extractRegion = (regionStr: string | undefined): string => {
  if (!regionStr) return "us-east-1";
  const match = regionStr.match(/(us|eu|ap|sa|ca|me|af)-[a-z]+-\d+/);
  return match ? match[0] : "us-east-1";
};

const s3Client = new S3Client({
  region: extractRegion(process.env.AWS_REGION),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BACKUP_BUCKET || "justxempower-backups";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique backup key for S3
 */
function generateBackupKey(backupName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sanitizedName = backupName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50);
  return `backups/${timestamp}_${sanitizedName}.json`;
}

/**
 * Calculate checksum for backup integrity verification
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Safely serialize data, handling circular references and special types
 */
function safeSerialize(data: any): any {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) return data.toISOString();
  if (typeof data === "bigint") return data.toString();
  if (Buffer.isBuffer(data)) return data.toString("base64");
  if (Array.isArray(data)) return data.map(safeSerialize);
  if (typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = safeSerialize(value);
    }
    return result;
  }
  return data;
}

// ============================================================================
// S3 MEDIA FILE BACKUP FUNCTIONS
// ============================================================================

/**
 * List all media files in S3 bucket (under media/ prefix)
 */
async function listAllMediaFiles(): Promise<MediaFileInfo[]> {
  const mediaFiles: MediaFileInfo[] = [];
  let continuationToken: string | undefined;
  
  const MEDIA_BUCKET = process.env.AWS_S3_BUCKET || "justxempower-assets";
  
  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: MEDIA_BUCKET,
        Prefix: "media/",
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });
      
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Size !== undefined) {
            mediaFiles.push({
              key: obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
            });
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`[Backup] Found ${mediaFiles.length} media files in S3`);
    return mediaFiles;
  } catch (error) {
    console.error("[Backup] Error listing media files:", error);
    return [];
  }
}

/**
 * Copy media files to backup folder in S3
 */
async function copyMediaFilesToBackup(
  mediaFiles: MediaFileInfo[],
  backupFolder: string
): Promise<{ copied: number; failed: number; totalSize: number }> {
  const MEDIA_BUCKET = process.env.AWS_S3_BUCKET || "justxempower-assets";
  let copied = 0;
  let failed = 0;
  let totalSize = 0;
  
  console.log(`[Backup] Starting to copy ${mediaFiles.length} media files to ${backupFolder}`);
  
  // Process in batches to avoid overwhelming S3
  const BATCH_SIZE = 50;
  for (let i = 0; i < mediaFiles.length; i += BATCH_SIZE) {
    const batch = mediaFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (file) => {
      try {
        // Create backup key by prepending backup folder
        const backupKey = `${backupFolder}/${file.key}`;
        
        const command = new CopyObjectCommand({
          Bucket: MEDIA_BUCKET,
          CopySource: `${MEDIA_BUCKET}/${file.key}`,
          Key: backupKey,
        });
        
        await s3Client.send(command);
        file.backupKey = backupKey;
        copied++;
        totalSize += file.size;
      } catch (error) {
        console.error(`[Backup] Failed to copy ${file.key}:`, error);
        failed++;
      }
    }));
    
    // Log progress
    console.log(`[Backup] Progress: ${Math.min(i + BATCH_SIZE, mediaFiles.length)}/${mediaFiles.length} files processed`);
  }
  
  console.log(`[Backup] Media copy complete: ${copied} copied, ${failed} failed, ${(totalSize / 1024 / 1024).toFixed(2)} MB total`);
  return { copied, failed, totalSize };
}

/**
 * Restore media files from backup folder
 */
async function restoreMediaFilesFromBackup(
  mediaFiles: MediaFileInfo[],
  backupFolder: string
): Promise<{ restored: number; failed: number }> {
  const MEDIA_BUCKET = process.env.AWS_S3_BUCKET || "justxempower-assets";
  let restored = 0;
  let failed = 0;
  
  console.log(`[Restore] Starting to restore ${mediaFiles.length} media files from ${backupFolder}`);
  
  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < mediaFiles.length; i += BATCH_SIZE) {
    const batch = mediaFiles.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (file) => {
      try {
        const backupKey = file.backupKey || `${backupFolder}/${file.key}`;
        
        const command = new CopyObjectCommand({
          Bucket: MEDIA_BUCKET,
          CopySource: `${MEDIA_BUCKET}/${backupKey}`,
          Key: file.key,
        });
        
        await s3Client.send(command);
        restored++;
      } catch (error) {
        console.error(`[Restore] Failed to restore ${file.key}:`, error);
        failed++;
      }
    }));
    
    console.log(`[Restore] Progress: ${Math.min(i + BATCH_SIZE, mediaFiles.length)}/${mediaFiles.length} files processed`);
  }
  
  console.log(`[Restore] Media restore complete: ${restored} restored, ${failed} failed`);
  return { restored, failed };
}

/**
 * Delete backup media folder from S3
 */
async function deleteBackupMediaFolder(backupFolder: string): Promise<void> {
  const MEDIA_BUCKET = process.env.AWS_S3_BUCKET || "justxempower-assets";
  
  try {
    // List all objects in the backup folder
    let continuationToken: string | undefined;
    const keysToDelete: string[] = [];
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: MEDIA_BUCKET,
        Prefix: backupFolder,
        ContinuationToken: continuationToken,
      });
      
      const response = await s3Client.send(listCommand);
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            keysToDelete.push(obj.Key);
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    // Delete in batches
    for (let i = 0; i < keysToDelete.length; i += 1000) {
      const batch = keysToDelete.slice(i, i + 1000);
      await Promise.all(batch.map(key => 
        s3Client.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }))
      ));
    }
    
    console.log(`[Backup] Deleted ${keysToDelete.length} files from backup folder ${backupFolder}`);
  } catch (error) {
    console.error(`[Backup] Error deleting backup folder ${backupFolder}:`, error);
  }
}

/**
 * Validate backup data before restore
 */
function validateBackupData(data: BackupData): ValidationResult {
  const issues: string[] = [];
  const recordCounts: Record<string, number> = {};
  let totalRecords = 0;

  // Check version
  if (!data.version) {
    issues.push("Missing backup version");
  }

  // Check timestamp
  if (!data.timestamp) {
    issues.push("Missing backup timestamp");
  }

  // Check metadata
  if (!data.metadata) {
    issues.push("Missing backup metadata");
  }

  // Check data
  if (!data.data || typeof data.data !== "object") {
    issues.push("Missing or invalid backup data");
    return { valid: false, issues, recordCounts, estimatedSize: 0 };
  }

  // Count records per table
  for (const [table, records] of Object.entries(data.data)) {
    if (Array.isArray(records)) {
      recordCounts[table] = records.length;
      totalRecords += records.length;
    } else {
      issues.push(`Invalid data format for table: ${table}`);
    }
  }

  // Check if backup has meaningful data
  if (totalRecords < 5) {
    issues.push(`Backup contains only ${totalRecords} records - may be corrupted or incomplete`);
  }

  // Estimate size
  const estimatedSize = JSON.stringify(data).length;

  return {
    valid: issues.length === 0 || (issues.length === 1 && totalRecords >= 5),
    issues,
    recordCounts,
    estimatedSize,
  };
}

// ============================================================================
// CORE BACKUP FUNCTIONS
// ============================================================================

/**
 * Create a comprehensive backup of all database tables
 */
export async function createBackup(options: BackupOptions): Promise<{ 
  success: boolean; 
  backupId: number;
  s3Url: string | null;
  size: number;
}> {
  const {
    backupName,
    description,
    backupType = "manual",
    includeMedia = true,
    includeConfig = true,
    createdBy,
  } = options;

  console.log(`[Backup] Starting backup: ${backupName}`);
  const startTime = Date.now();

  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    // Determine which tables to backup
    // By default, exclude analytics tables (priority 9) as they can be very large
    // Include everything else unless specifically excluded
    const tablesToBackup = Object.entries(TABLE_REGISTRY)
      .filter(([_, info]) => {
        // Exclude analytics by default (can be millions of rows)
        if (info.category === "analytics") return false;
        // Optional exclusions based on backup options
        if (!includeMedia && info.category === "media") return false;
        if (!includeConfig && info.category === "config") return false;
        return true;
      })
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([name]) => name);
    
    console.log(`[Backup] Will backup ${tablesToBackup.length} tables: ${tablesToBackup.join(", ")}`);

    // Export all tables
    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};

    for (const tableName of tablesToBackup) {
      const tableInfo = TABLE_REGISTRY[tableName];
      if (!tableInfo) continue;

      try {
        const records = await db.select().from(tableInfo.schema);
        backupData[tableName] = safeSerialize(records);
        recordCounts[tableName] = records.length;
        console.log(`[Backup] Exported ${tableName}: ${records.length} records`);
      } catch (error) {
        console.error(`[Backup] Error exporting ${tableName}:`, error);
        backupData[tableName] = [];
        recordCounts[tableName] = 0;
      }
    }

    // Create backup structure
    const timestamp = new Date().toISOString();
    const mediaBackupFolder = `backups/media/${timestamp.replace(/[:.]/g, "-")}_${backupName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
    
    const fullBackup: BackupData = {
      version: BACKUP_VERSION,
      timestamp,
      metadata: {
        name: backupName,
        description,
        type: backupType,
        createdBy,
        tablesIncluded: tablesToBackup,
        recordCounts,
        mediaBackupFolder,
      },
      data: backupData,
    };

    // Check if AWS credentials are configured
    const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    // Backup media files to S3 if credentials are available and media is included
    if (hasAwsCredentials && includeMedia) {
      console.log(`[Backup] Starting media files backup...`);
      try {
        // List all media files
        const mediaFiles = await listAllMediaFiles();
        
        if (mediaFiles.length > 0) {
          // Copy media files to backup folder
          const copyResult = await copyMediaFilesToBackup(mediaFiles, mediaBackupFolder);
          
          // Add media info to backup metadata
          fullBackup.mediaFiles = mediaFiles;
          fullBackup.metadata.mediaFilesCount = copyResult.copied;
          fullBackup.metadata.mediaFilesSize = copyResult.totalSize;
          
          console.log(`[Backup] Media backup complete: ${copyResult.copied} files, ${(copyResult.totalSize / 1024 / 1024).toFixed(2)} MB`);
        } else {
          console.log(`[Backup] No media files found to backup`);
          fullBackup.metadata.mediaFilesCount = 0;
          fullBackup.metadata.mediaFilesSize = 0;
        }
      } catch (mediaError) {
        console.error("[Backup] Media backup failed, continuing with database backup:", mediaError);
        fullBackup.metadata.mediaFilesCount = 0;
        fullBackup.metadata.mediaFilesSize = 0;
      }
    } else {
      fullBackup.metadata.mediaFilesCount = 0;
      fullBackup.metadata.mediaFilesSize = 0;
    }

    // Serialize backup
    const backupJson = JSON.stringify(fullBackup, null, 2);
    const backupSize = Buffer.byteLength(backupJson, "utf-8");
    
    // Add checksum
    fullBackup.metadata.checksum = calculateChecksum(backupJson);

    const totalSize = backupSize + (fullBackup.metadata.mediaFilesSize || 0);
    console.log(`[Backup] Database size: ${(backupSize / 1024 / 1024).toFixed(2)} MB, Media size: ${((fullBackup.metadata.mediaFilesSize || 0) / 1024 / 1024).toFixed(2)} MB, Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Try to upload to S3 using the shared storage helper
    let s3Url: string | null = null;
    let s3Key: string | null = null;
    
    if (hasAwsCredentials) {
      try {
        s3Key = generateBackupKey(backupName);
        const result = await storagePut(s3Key, backupJson, "application/json");
        s3Url = result.url;
        console.log(`[Backup] Uploaded to S3: ${s3Url}`);
      } catch (s3Error) {
        console.error("[Backup] S3 upload failed, storing in database:", s3Error);
        s3Key = null;
        s3Url = null;
      }
    } else {
      console.log("[Backup] AWS credentials not configured, storing backup in database only");
    }

    // Store backup metadata in database
    // MySQL doesn't support .returning(), so we use insertId from the result
    // Always store backup data in database as a reliable fallback
    const insertResult = await db.insert(backups).values({
      backupName,
      backupType,
      backupData: backupJson, // Always store in DB for reliability
      s3Key,
      s3Url,
      fileSize: backupSize,
      description: description || null,
      tablesIncluded: JSON.stringify(tablesToBackup),
      createdBy: createdBy || null,
    });

    // Get the inserted ID from MySQL result
    const backupId = Number((insertResult as any).insertId || (insertResult as any)[0]?.insertId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Backup] Complete in ${duration}s. ID: ${backupId}`);

    return {
      success: true,
      backupId,
      s3Url,
      size: backupSize,
    };

  } catch (error) {
    console.error("[Backup] Failed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Backup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Restore database from a backup
 */
export async function restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
  const { backupId, tables, dryRun = false } = options;

  console.log(`[Restore] Starting restore from backup ID: ${backupId}${dryRun ? " (DRY RUN)" : ""}`);
  const startTime = Date.now();

  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const restored: string[] = [];
  const errors: string[] = [];
  let recordsRestored = 0;

  try {
    // Fetch backup metadata
    const [backup] = await db.select().from(backups).where(eq(backups.id, backupId));
    
    if (!backup) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Backup not found",
      });
    }

    // Fetch backup data
    let backupDataJson: string;

    if (backup.s3Url && backup.s3Key) {
      try {
        const response = await s3Client.send(new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: backup.s3Key,
        }));
        backupDataJson = await response.Body?.transformToString() || "";
      } catch (s3Error) {
        console.error("[Restore] S3 fetch failed, trying database fallback:", s3Error);
        if (backup.backupData) {
          backupDataJson = backup.backupData;
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Backup data not found in S3 or database",
          });
        }
      }
    } else if (backup.backupData) {
      backupDataJson = backup.backupData;
    } else {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Backup data not found",
      });
    }

    // Parse backup data
    let backupData: BackupData;
    try {
      backupData = JSON.parse(backupDataJson);
    } catch (parseError) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Backup data is corrupted or invalid JSON",
      });
    }

    // Validate backup data
    const validation = validateBackupData(backupData);
    if (!validation.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Backup validation failed: ${validation.issues.join(", ")}`,
      });
    }

    console.log(`[Restore] Backup validated. Records: ${Object.values(validation.recordCounts).reduce((a, b) => a + b, 0)}`);

    // Determine which tables to restore
    const tablesToRestore = tables && tables.length > 0
      ? tables.filter(t => TABLE_REGISTRY[t] && backupData.data[t])
      : Object.keys(TABLE_REGISTRY).filter(t => backupData.data[t]);

    // Sort by priority (restore in correct order for foreign keys)
    tablesToRestore.sort((a, b) => {
      const priorityA = TABLE_REGISTRY[a]?.priority || 999;
      const priorityB = TABLE_REGISTRY[b]?.priority || 999;
      return priorityA - priorityB;
    });

    if (dryRun) {
      // Return preview of what would be restored
      for (const tableName of tablesToRestore) {
        const records = backupData.data[tableName];
        if (records && records.length > 0) {
          restored.push(`${tableName}: ${records.length} records would be restored`);
          recordsRestored += records.length;
        }
      }
    } else {
      // Perform actual restore
      for (const tableName of tablesToRestore) {
        const tableInfo = TABLE_REGISTRY[tableName];
        const records = backupData.data[tableName];

        if (!tableInfo || !records || records.length === 0) {
          continue;
        }

        try {
          console.log(`[Restore] Restoring ${tableName}: ${records.length} records`);

          // Delete existing data
          await db.delete(tableInfo.schema);

          // Insert in batches
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            
            // Clean up records (remove auto-generated fields if needed)
            const cleanedBatch = batch.map(record => {
              const cleaned = { ...record };
              // Convert date strings back to dates
              for (const [key, value] of Object.entries(cleaned)) {
                if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                  cleaned[key] = new Date(value);
                }
              }
              return cleaned;
            });

            await db.insert(tableInfo.schema).values(cleanedBatch);
          }

          restored.push(`${tableName}: ${records.length} records`);
          recordsRestored += records.length;

        } catch (tableError) {
          const errorMsg = `Failed to restore ${tableName}: ${tableError instanceof Error ? tableError.message : "Unknown error"}`;
          console.error(`[Restore] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Restore media files if available and not a dry run
    let mediaRestoreResult = { restored: 0, failed: 0 };
    if (!dryRun && backupData.mediaFiles && backupData.mediaFiles.length > 0 && backupData.metadata.mediaBackupFolder) {
      console.log(`[Restore] Starting media files restore...`);
      try {
        mediaRestoreResult = await restoreMediaFilesFromBackup(
          backupData.mediaFiles,
          backupData.metadata.mediaBackupFolder
        );
        
        if (mediaRestoreResult.restored > 0) {
          restored.push(`Media files: ${mediaRestoreResult.restored} files restored`);
        }
        if (mediaRestoreResult.failed > 0) {
          errors.push(`Media files: ${mediaRestoreResult.failed} files failed to restore`);
        }
      } catch (mediaError) {
        console.error("[Restore] Media restore failed:", mediaError);
        errors.push(`Media restore failed: ${mediaError instanceof Error ? mediaError.message : "Unknown error"}`);
      }
    } else if (dryRun && backupData.mediaFiles && backupData.mediaFiles.length > 0) {
      restored.push(`Media files: ${backupData.mediaFiles.length} files would be restored`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const mediaInfo = backupData.mediaFiles && backupData.mediaFiles.length > 0
      ? ` + ${mediaRestoreResult.restored || backupData.mediaFiles.length} media files`
      : "";
    const summary = dryRun
      ? `Dry run complete. Would restore ${recordsRestored} records across ${restored.length} tables${mediaInfo}.`
      : `Restore complete in ${duration}s. Restored ${recordsRestored} records across ${restored.length} tables${mediaInfo}.`;

    console.log(`[Restore] ${summary}`);

    return {
      success: errors.length === 0,
      restored,
      errors,
      summary,
      recordsRestored,
      dryRun,
    };

  } catch (error) {
    console.error("[Restore] Failed:", error);
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Restore failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Download backup data as JSON
 */
export async function downloadBackup(backupId: number): Promise<{
  backupData: string;
  s3Url: string | null;
  fileName: string;
}> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const [backup] = await db.select().from(backups).where(eq(backups.id, backupId));
  
  if (!backup) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Backup not found",
    });
  }

  let backupData: string;

  if (backup.s3Url && backup.s3Key) {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: backup.s3Key,
      }));
      backupData = await response.Body?.transformToString() || "";
    } catch (s3Error) {
      console.error("[Download] S3 fetch failed:", s3Error);
      if (backup.backupData) {
        backupData = backup.backupData;
      } else {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Backup data not available",
        });
      }
    }
  } else if (backup.backupData) {
    backupData = backup.backupData;
  } else {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Backup data not available",
    });
  }

  const timestamp = new Date(backup.createdAt).toISOString().split("T")[0];
  const fileName = `${backup.backupName.replace(/\s+/g, "_")}_${timestamp}.json`;

  return {
    backupData,
    s3Url: backup.s3Url,
    fileName,
  };
}

/**
 * List all backups with pagination
 */
export async function listBackups(options?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<{
  backups: any[];
  total: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const { limit = 50, offset = 0, type } = options || {};

  const conditions = type ? eq(backups.backupType, type) : undefined;

  const [allBackups, countResult] = await Promise.all([
    db.select({
      id: backups.id,
      backupName: backups.backupName,
      backupType: backups.backupType,
      fileSize: backups.fileSize,
      description: backups.description,
      tablesIncluded: backups.tablesIncluded,
      createdBy: backups.createdBy,
      createdAt: backups.createdAt,
      s3Url: backups.s3Url,
      verificationStatus: backups.verificationStatus,
      lastVerifiedAt: backups.lastVerifiedAt,
    })
    .from(backups)
    .where(conditions)
    .orderBy(desc(backups.createdAt))
    .limit(limit)
    .offset(offset),
    
    db.select({ count: sql<number>`count(*)` }).from(backups).where(conditions),
  ]);

  return {
    backups: allBackups,
    total: countResult[0]?.count || 0,
  };
}

/**
 * Delete a backup (including media files)
 */
export async function deleteBackup(backupId: number, deleteMediaFiles: boolean = false): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const [backup] = await db.select().from(backups).where(eq(backups.id, backupId));
  
  if (!backup) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Backup not found",
    });
  }

  // Delete media backup folder if requested
  if (deleteMediaFiles && backup.backupData) {
    try {
      const backupData: BackupData = JSON.parse(backup.backupData);
      if (backupData.metadata?.mediaBackupFolder) {
        console.log(`[Delete] Deleting media backup folder: ${backupData.metadata.mediaBackupFolder}`);
        await deleteBackupMediaFolder(backupData.metadata.mediaBackupFolder);
      }
    } catch (parseError) {
      console.error("[Delete] Failed to parse backup data for media deletion:", parseError);
    }
  }

  // Delete backup JSON from S3 if exists
  if (deleteMediaFiles && backup.s3Key) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: backup.s3Key,
      }));
      console.log(`[Delete] Deleted backup JSON from S3: ${backup.s3Key}`);
    } catch (s3Error) {
      console.error("[Delete] S3 delete failed:", s3Error);
    }
  }

  await db.delete(backups).where(eq(backups.id, backupId));

  return { success: true };
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  totalBackups: number;
  totalSize: number;
  oldestBackup: string | null;
  newestBackup: string | null;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const allBackups = await db.select({
    backupType: backups.backupType,
    fileSize: backups.fileSize,
    createdAt: backups.createdAt,
  }).from(backups).orderBy(asc(backups.createdAt));

  const byType: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let totalSize = 0;

  for (const backup of allBackups) {
    totalSize += backup.fileSize || 0;
    byType[backup.backupType] = (byType[backup.backupType] || 0) + 1;
    
    const month = new Date(backup.createdAt).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  }

  return {
    totalBackups: allBackups.length,
    totalSize,
    oldestBackup: allBackups.length > 0 ? allBackups[0].createdAt.toISOString() : null,
    newestBackup: allBackups.length > 0 ? allBackups[allBackups.length - 1].createdAt.toISOString() : null,
    byType,
    byMonth,
  };
}

// ============================================================================
// SCHEDULED BACKUP SYSTEM
// ============================================================================

/**
 * Configuration for scheduled backups (store in database)
 */
export interface ScheduleConfig {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  time: string;  // HH:mm format
  retentionDays: number;
  lastRun?: string;
  nextRun?: string;
}

/**
 * Run scheduled backup (call from cron job)
 */
export async function runScheduledBackup(): Promise<void> {
  console.log("[Scheduled Backup] Starting...");

  try {
    const result = await createBackup({
      backupName: `Scheduled Backup - ${new Date().toLocaleDateString()}`,
      description: "Automated scheduled backup",
      backupType: "scheduled",
      includeMedia: true,
      includeConfig: true,
      createdBy: "system",
    });

    console.log(`[Scheduled Backup] Complete. ID: ${result.backupId}`);

    // Clean up old backups (retention policy)
    await cleanupOldBackups(30); // Default 30 days

  } catch (error) {
    console.error("[Scheduled Backup] Failed:", error);
  }
}

/**
 * Delete backups older than retention period
 */
export async function cleanupOldBackups(retentionDays: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const oldBackups = await db.select({ id: backups.id })
    .from(backups)
    .where(
      and(
        eq(backups.backupType, "scheduled"),
        lte(backups.createdAt, cutoffDate)
      )
    );

  let deleted = 0;
  for (const backup of oldBackups) {
    try {
      await deleteBackup(backup.id);
      deleted++;
    } catch (error) {
      console.error(`[Cleanup] Failed to delete backup ${backup.id}:`, error);
    }
  }

  console.log(`[Cleanup] Deleted ${deleted} old backups`);
  return deleted;
}

// ============================================================================
// BACKUP VERIFICATION SYSTEM
// ============================================================================

export interface VerificationResult {
  backupId: number;
  backupName: string;
  backupDate: string;
  verified: boolean;
  status: "verified" | "warning" | "error";
  summary: {
    totalTables: number;
    matchedTables: number;
    mismatchedTables: number;
    missingTables: number;
  };
  details: Array<{
    table: string;
    backupCount: number;
    liveCount: number;
    status: "match" | "mismatch" | "missing" | "new_data";
    difference: number;
  }>;
  verifiedAt: string;
}

/**
 * Get live database counts for all tables
 */
export async function getLiveDatabaseCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const counts: Record<string, number> = {};

  // Query count for each table in the registry
  for (const [tableName, config] of Object.entries(TABLE_REGISTRY)) {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(config.schema);
      counts[tableName] = Number(result[0]?.count || 0);
    } catch (error) {
      console.error(`[Verify] Failed to count ${tableName}:`, error);
      counts[tableName] = -1; // Indicate error
    }
  }

  return counts;
}

/**
 * Verify backup integrity against live database
 */
export async function verifyBackup(backupId: number): Promise<VerificationResult> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  // Get the backup record
  const backup = await db.select().from(backups).where(eq(backups.id, backupId)).limit(1);
  if (backup.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Backup not found" });
  }

  const backupRecord = backup[0];
  let backupData: BackupData;

  // Parse backup data (column is 'backupData' not 'data')
  // First try to get from S3 if available, as database might have truncated data
  let rawBackupData: string | null = null;
  
  if (backupRecord.s3Key && backupRecord.s3Url) {
    try {
      console.log(`[Verify] Fetching backup data from S3: ${backupRecord.s3Key}`);
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: backupRecord.s3Key,
      }));
      rawBackupData = await response.Body?.transformToString() || null;
      console.log(`[Verify] S3 data length: ${rawBackupData?.length || 0} bytes`);
    } catch (s3Error) {
      console.error("[Verify] S3 fetch failed, falling back to database:", s3Error);
    }
  }
  
  // Fall back to database if S3 failed or not available
  if (!rawBackupData && backupRecord.backupData) {
    rawBackupData = typeof backupRecord.backupData === 'string' 
      ? backupRecord.backupData 
      : JSON.stringify(backupRecord.backupData);
    console.log(`[Verify] Using database data, length: ${rawBackupData?.length || 0} bytes`);
  }
  
  if (!rawBackupData) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Backup has no data" });
  }
  
  // Parse the JSON with better error handling
  try {
    backupData = JSON.parse(rawBackupData);
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error(`[Verify] JSON parse failed: ${errorMsg}`);
    console.error(`[Verify] Data preview: ${rawBackupData.substring(0, 500)}...`);
    
    // Check if data appears truncated
    if (errorMsg.includes('position') || errorMsg.includes('Unterminated')) {
      throw new TRPCError({ 
        code: "BAD_REQUEST", 
        message: `Backup data appears to be corrupted or truncated. The backup may need to be recreated. Error: ${errorMsg}` 
      });
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: `Failed to parse backup data: ${errorMsg}` });
  }

  // Get live database counts
  const liveCounts = await getLiveDatabaseCounts();

  // Compare backup counts with live counts
  const details: VerificationResult["details"] = [];
  let matchedTables = 0;
  let mismatchedTables = 0;
  let missingTables = 0;

  // Get backup record counts from metadata or calculate from data
  const backupCounts: Record<string, number> = {};
  
  if (backupData.metadata?.recordCounts) {
    Object.assign(backupCounts, backupData.metadata.recordCounts);
  } else {
    // Calculate from actual backup data (use 'data' property, not 'tables')
    for (const [tableName, records] of Object.entries(backupData.data || {})) {
      backupCounts[tableName] = Array.isArray(records) ? records.length : 0;
    }
  }

  // Compare each table
  const allTables = new Set([...Object.keys(liveCounts), ...Object.keys(backupCounts)]);
  
  for (const tableName of Array.from(allTables)) {
    const backupCount = backupCounts[tableName] ?? -1;
    const liveCount = liveCounts[tableName] ?? -1;
    const difference = liveCount - backupCount;

    let status: "match" | "mismatch" | "missing" | "new_data";
    
    if (backupCount === -1) {
      status = "missing";
      missingTables++;
    } else if (liveCount === -1) {
      status = "missing";
      missingTables++;
    } else if (backupCount === liveCount) {
      status = "match";
      matchedTables++;
    } else if (liveCount > backupCount) {
      status = "new_data"; // New records added since backup
      mismatchedTables++;
    } else {
      status = "mismatch"; // Data deleted since backup
      mismatchedTables++;
    }

    details.push({
      table: tableName,
      backupCount: backupCount === -1 ? 0 : backupCount,
      liveCount: liveCount === -1 ? 0 : liveCount,
      status,
      difference,
    });
  }

  // Sort by status (errors first, then mismatches, then matches)
  const statusOrder = { missing: 0, mismatch: 1, new_data: 2, match: 3 };
  details.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  // Determine overall status
  // Missing tables = tables in live DB but not in backup (e.g., new tables added after backup)
  // This is a warning, not an error - the backup is still valid for what it contains
  let overallStatus: "verified" | "warning";
  if (mismatchedTables > 0 || missingTables > 0) {
    overallStatus = "warning"; // Data changed since backup OR new tables added (normal)
  } else {
    overallStatus = "verified";
  }

  // Save verification status to database
  const verifiedAt = new Date();
  await db.update(backups)
    .set({
      verificationStatus: overallStatus,
      lastVerifiedAt: verifiedAt,
    })
    .where(eq(backups.id, backupId));

  return {
    backupId,
    backupName: backupRecord.backupName,
    backupDate: backupRecord.createdAt.toISOString(),
    verified: overallStatus === "verified",
    status: overallStatus,
    summary: {
      totalTables: allTables.size,
      matchedTables,
      mismatchedTables,
      missingTables,
    },
    details,
    verifiedAt: verifiedAt.toISOString(),
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  createBackup,
  restoreBackup,
  downloadBackup,
  listBackups,
  deleteBackup,
  getBackupStats,
  runScheduledBackup,
  cleanupOldBackups,
};
