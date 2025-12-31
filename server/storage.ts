// AWS S3 Storage helpers - Direct S3 SDK implementation
// Works independently on AWS infrastructure without Manus APIs

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Configuration from environment variables
// Extract region from AWS_REGION (handles both "us-east-1" and "USEast(N.Virginia)us-east-1" formats)
const extractRegion = (regionStr: string | undefined): string => {
  if (!regionStr) return "us-east-1";
  // Check if it contains a standard region format like us-east-1
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

// Use elasticbeanstalk bucket which has proper permissions
const BUCKET_NAME = process.env.AWS_S3_BUCKET || "elasticbeanstalk-us-east-1-137738969420";
// Media files will be stored under justxempower-media/ prefix
const MEDIA_PREFIX = "justxempower-media/";

// Create S3 client
const s3Client = new S3Client(s3Config);

function normalizeKey(relKey: string): string {
  // Add media prefix if not already present
  const key = relKey.replace(/^\/+/, "");
  if (!key.startsWith(MEDIA_PREFIX) && !key.startsWith("backups/")) {
    return MEDIA_PREFIX + key;
  }
  return key;
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
    console.warn("AWS credentials not configured. Using fallback local storage simulation.");
    // Return a placeholder URL for development/testing
    return {
      key,
      url: `/uploads/${key}`,
    };
  }
  
  // Don't use ACL - the bucket may not allow it
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
    console.warn("AWS credentials not configured. Using fallback local storage simulation.");
    return {
      key,
      url: `/uploads/${key}`,
    };
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
