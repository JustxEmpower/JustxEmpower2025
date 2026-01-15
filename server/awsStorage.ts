// AWS S3 storage helper for direct S3 uploads
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = process.env.AWS_S3_BUCKET || "justxempower-assets";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      // Uses default credential provider chain (IAM role, env vars, etc.)
    });
  }
  return s3Client;
}

export async function uploadToS3(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
  
  // Note: ACL is not used as the bucket has ACLs disabled
  // Public access is controlled via bucket policy
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  
  await client.send(command);
  
  const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  return { key, url };
}

export async function getS3SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  
  return await getSignedUrl(client, command, { expiresIn });
}

export async function downloadFromS3(key: string): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  
  const response = await client.send(command);
  const body = await response.Body?.transformToString();
  return body || "";
}

export function isAwsEnvironment(): boolean {
  // Check if we're running in AWS (has IAM role or AWS credentials)
  return !!(process.env.AWS_EXECUTION_ENV || process.env.AWS_REGION || process.env.AWS_ACCESS_KEY_ID);
}
