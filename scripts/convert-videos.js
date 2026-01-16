import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "justxempower-assets";
const TMP_DIR = "/tmp/video-convert";

// Ensure tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

console.log("=== VIDEO CONVERSION: .mov to .mp4 ===\n");

// Find all .mov video references in siteContent
console.log("1. Finding all .mov video references...");
const [movVideos] = await conn.execute(`
  SELECT id, page, section, contentKey, contentValue 
  FROM siteContent 
  WHERE contentValue LIKE '%.mov%' OR contentValue LIKE '%.MOV%'
`);

console.log(`Found ${movVideos.length} .mov video references:\n`);
console.table(movVideos.map(v => ({ id: v.id, page: v.page, section: v.section, key: v.contentKey })));

if (movVideos.length === 0) {
  console.log("No .mov videos found. Exiting.");
  await conn.end();
  process.exit(0);
}

// Process each video
for (const video of movVideos) {
  const movUrl = video.contentValue;
  console.log(`\n--- Processing: ${video.page}/${video.section}/${video.contentKey} ---`);
  console.log(`Original URL: ${movUrl}`);
  
  // Extract S3 key from URL
  let s3Key;
  if (movUrl.includes("justxempower-assets.s3")) {
    s3Key = movUrl.split(".amazonaws.com/")[1];
  } else if (movUrl.includes("elasticbeanstalk-us-east-1")) {
    // Legacy bucket - different handling
    console.log("Skipping legacy bucket video - manual conversion needed");
    continue;
  } else if (movUrl.startsWith("/media/") || movUrl.startsWith("media/")) {
    s3Key = movUrl.startsWith("/") ? movUrl.slice(1) : movUrl;
  } else {
    console.log(`Unknown URL format: ${movUrl}`);
    continue;
  }
  
  const mp4Key = s3Key.replace(/\.mov$/i, ".mp4");
  const movFilename = path.basename(s3Key);
  const mp4Filename = movFilename.replace(/\.mov$/i, ".mp4");
  const localMovPath = path.join(TMP_DIR, movFilename);
  const localMp4Path = path.join(TMP_DIR, mp4Filename);
  
  try {
    // Download .mov from S3
    console.log(`Downloading from S3: ${s3Key}`);
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    const response = await s3.send(getCmd);
    await pipeline(response.Body, fs.createWriteStream(localMovPath));
    console.log(`Downloaded to: ${localMovPath}`);
    
    // Convert to .mp4 using ffmpeg
    console.log(`Converting to MP4...`);
    execSync(`ffmpeg -i "${localMovPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart -y "${localMp4Path}"`, { stdio: 'inherit' });
    console.log(`Converted to: ${localMp4Path}`);
    
    // Upload .mp4 to S3
    console.log(`Uploading to S3: ${mp4Key}`);
    const mp4Data = fs.readFileSync(localMp4Path);
    const putCmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: mp4Key,
      Body: mp4Data,
      ContentType: "video/mp4"
    });
    await s3.send(putCmd);
    console.log(`Uploaded: ${mp4Key}`);
    
    // Update database
    const newUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${mp4Key}`;
    console.log(`Updating database to: ${newUrl}`);
    await conn.execute(
      `UPDATE siteContent SET contentValue = ? WHERE id = ?`,
      [newUrl, video.id]
    );
    console.log(`✅ Updated record ID ${video.id}`);
    
    // Cleanup temp files
    fs.unlinkSync(localMovPath);
    fs.unlinkSync(localMp4Path);
    
  } catch (err) {
    console.error(`❌ Error processing ${s3Key}:`, err.message);
  }
}

// Verify updates
console.log("\n\n=== VERIFICATION ===");
const [updated] = await conn.execute(`
  SELECT page, section, contentKey, contentValue 
  FROM siteContent 
  WHERE contentKey LIKE '%video%' OR contentKey LIKE '%Video%'
`);
console.table(updated);

await conn.end();
console.log("\n=== CONVERSION COMPLETE ===");
