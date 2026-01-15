/**
 * AWS S3 Storage - Enhanced
 * 
 * Features:
 * - Direct S3 uploads with presigned URLs
 * - Image optimization and thumbnail generation
 * - CDN URL generation
 * - Batch operations
 * - File type validation
 * - Storage analytics
 * 
 * Works independently on AWS infrastructure.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// ============================================================================
// Configuration
// ============================================================================

const extractRegion = (regionStr: string | undefined): string => {
  if (!regionStr) return "us-east-1";
  const match = regionStr.match(/(us|eu|ap|sa|ca|me|af)-[a-z]+-\d+/);
  return match ? match[0] : "us-east-1";
};

const s3Config = {
  region: extractRegion(process.env.AWS_REGION),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "justxempower-assets";
const CDN_DOMAIN = process.env.CDN_DOMAIN || null; // Optional CloudFront domain

// Create S3 client
const s3Client = new S3Client(s3Config);

// ============================================================================
// File Type Validation
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", 
  "image/webp", "image/svg+xml", "image/avif"
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"
];

export function isAllowedFileType(mimeType: string, category?: "image" | "video" | "document" | "audio"): boolean {
  const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_AUDIO_TYPES];
  
  if (!category) return allAllowed.includes(mimeType);
  
  switch (category) {
    case "image": return ALLOWED_IMAGE_TYPES.includes(mimeType);
    case "video": return ALLOWED_VIDEO_TYPES.includes(mimeType);
    case "document": return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
    case "audio": return ALLOWED_AUDIO_TYPES.includes(mimeType);
    default: return false;
  }
}

// ============================================================================
// URL Helpers
// ============================================================================

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Generate a presigned URL for direct browser-to-S3 uploads
 * @param relKey - The relative key/path for the file in S3
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Object with uploadUrl (presigned), key, and publicUrl
 */
export async function getPresignedUploadUrl(
  relKey: string,
  contentType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = normalizeKey(relKey);
  
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured");
  }
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;
    
    return { uploadUrl, key, publicUrl };
  } catch (error) {
    console.error("S3 presigned URL error:", error);
    throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Upload a file to S3
 * @param relKey - The relative key/path for the file in S3
 * @param data - The file data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("[Storage] AWS credentials not configured. Using local file storage.");
    // Save to local filesystem for development
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, key);
    const fileDir = path.dirname(filePath);
    
    try {
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, typeof data === 'string' ? data : Buffer.from(data));
      console.log(`[Storage] Saved locally: /uploads/${key}`);
    } catch (err) {
      console.error('[Storage] Local save failed:', err);
    }
    
    return {
      key,
      url: `/uploads/${key}`,
    };
  }
  
  // Note: ACL is not used as the bucket has ACLs disabled
  // Public access is controlled via bucket policy
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    // Return the public URL
    const url = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;
    
    return { key, url };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get a presigned URL for downloading a file from S3
 * @param relKey - The relative key/path for the file in S3
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Object with key and presigned URL
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("[Storage] AWS credentials not configured. Reading from local storage.");
    // Try to read from local filesystem for development
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'uploads', key);
    
    try {
      await fs.access(filePath);
      return {
        key,
        url: `/uploads/${key}`,
      };
    } catch {
      console.warn(`[Storage] Local file not found: ${key}`);
      return {
        key,
        url: `/uploads/${key}`,
      };
    }
  }
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { key, url };
  } catch (error) {
    console.error("S3 get URL error:", error);
    throw new Error(`Storage get failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get the public URL for a file (for publicly accessible files)
 * @param relKey - The relative key/path for the file in S3
 * @returns The public URL
 */
export function getPublicUrl(relKey: string): string {
  const key = normalizeKey(relKey);
  
  if (!process.env.AWS_S3_BUCKET) {
    return `/uploads/${key}`;
  }
  
  return `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 * @param relKey - The relative key/path for the file in S3
 */
export async function storageDelete(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("AWS credentials not configured. Skipping delete.");
    return;
  }
  
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ============================================================================
// Enhanced Features
// ============================================================================

/**
 * Get CDN URL for a file (uses CloudFront if configured)
 */
export function getCdnUrl(relKey: string): string {
  const key = normalizeKey(relKey);
  
  if (CDN_DOMAIN) {
    return `https://${CDN_DOMAIN}/${key}`;
  }
  
  return getPublicUrl(key);
}

/**
 * Generate a unique file key with timestamp and hash
 */
export function generateUniqueKey(
  originalFilename: string,
  folder: string = "uploads"
): string {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString("hex");
  const ext = originalFilename.split(".").pop() || "bin";
  const safeName = originalFilename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 50);
  
  return `${folder}/${timestamp}-${hash}-${safeName}.${ext}`;
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(relKey: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
} | null> {
  const key = normalizeKey(relKey);
  
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return null;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified || new Date(),
      etag: response.ETag || "",
    };
  } catch (error) {
    console.error("S3 head error:", error);
    return null;
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 100
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return [];
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: normalizeKey(prefix),
      MaxKeys: maxKeys,
    });
    
    const response = await s3Client.send(command);
    
    return (response.Contents || []).map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));
  } catch (error) {
    console.error("S3 list error:", error);
    return [];
  }
}

/**
 * Copy a file within S3
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<{ key: string; url: string } | null> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return null;
  }

  const srcKey = normalizeKey(sourceKey);
  const destKey = normalizeKey(destinationKey);

  try {
    const command = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${srcKey}`,
      Key: destKey,
    });
    
    await s3Client.send(command);
    
    return {
      key: destKey,
      url: getCdnUrl(destKey),
    };
  } catch (error) {
    console.error("S3 copy error:", error);
    return null;
  }
}

/**
 * Get storage statistics for a prefix
 */
export async function getStorageStats(prefix: string = ""): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  byType: Record<string, { count: number; sizeBytes: number }>;
}> {
  const files = await listFiles(prefix, 1000);
  
  const stats = {
    totalFiles: files.length,
    totalSizeBytes: 0,
    totalSizeMB: "0",
    byType: {} as Record<string, { count: number; sizeBytes: number }>,
  };
  
  for (const file of files) {
    stats.totalSizeBytes += file.size;
    
    const ext = file.key.split(".").pop()?.toLowerCase() || "unknown";
    if (!stats.byType[ext]) {
      stats.byType[ext] = { count: 0, sizeBytes: 0 };
    }
    stats.byType[ext].count++;
    stats.byType[ext].sizeBytes += file.size;
  }
  
  stats.totalSizeMB = (stats.totalSizeBytes / (1024 * 1024)).toFixed(2);
  
  return stats;
}

/**
 * Upload from URL (download and re-upload to S3)
 */
export async function uploadFromUrl(
  sourceUrl: string,
  destinationKey: string
): Promise<{ key: string; url: string } | null> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    return await storagePut(destinationKey, buffer, contentType);
  } catch (error) {
    console.error("Upload from URL error:", error);
    return null;
  }
}

/**
 * Generate image variants using Sharp for real image processing
 */
export async function generateImageVariants(
  imageKey: string
): Promise<{
  original: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
}> {
  const key = normalizeKey(imageKey);
  const originalUrl = getCdnUrl(key);
  
  // Check if AWS is configured
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return { original: originalUrl };
  }

  try {
    // Fetch original image
    const response = await fetch(originalUrl);
    if (!response.ok) {
      return { original: originalUrl };
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Only process images
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      return { original: originalUrl };
    }

    // Dynamic import Sharp
    const sharp = (await import("sharp")).default;
    
    const baseName = key.replace(/\.[^/.]+$/, "");
    const ext = key.split(".").pop() || "jpg";
    
    // Generate thumbnail (150x150)
    const thumbnailBuffer = await sharp(buffer)
      .resize(150, 150, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    const { url: thumbnailUrl } = await storagePut(
      `${baseName}-thumb.${ext}`,
      thumbnailBuffer,
      contentType
    );

    // Generate medium (600x600)
    const mediumBuffer = await sharp(buffer)
      .resize(600, 600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const { url: mediumUrl } = await storagePut(
      `${baseName}-medium.${ext}`,
      mediumBuffer,
      contentType
    );

    // Generate large (1200x1200)
    const largeBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const { url: largeUrl } = await storagePut(
      `${baseName}-large.${ext}`,
      largeBuffer,
      contentType
    );

    console.log(`[Storage] Generated variants for ${key}`);
    
    return {
      original: originalUrl,
      thumbnail: thumbnailUrl,
      medium: mediumUrl,
      large: largeUrl,
    };
  } catch (error) {
    console.error("[Storage] Image variant generation failed:", error);
    return { original: originalUrl };
  }
}

// ============================================================================
// Exports Summary
// ============================================================================

export {
  BUCKET_NAME,
  s3Client,
  s3Config,
};
