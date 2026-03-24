#!/usr/bin/env node
import { S3Client, PutObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = 'justxempower-assets';
const LOCAL_BASE = 'public/assets/avatars/atlas';
const S3_PREFIX = 'avatars/atlas';
const GUIDES = ['kore','aoede','leda','theia','selene','zephyr'];
const MIME = {'.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};

async function setCORS() {
  await s3.send(new PutBucketCorsCommand({ Bucket: BUCKET, CORSConfiguration: { CORSRules: [{
    AllowedHeaders:['*'], AllowedMethods:['GET','HEAD'],
    AllowedOrigins:['https://justxempower.com','https://www.justxempower.com','http://localhost:5173','http://localhost:3000'],
    ExposeHeaders:['Content-Length','Content-Type'], MaxAgeSeconds:86400
  }]}}));
  console.log('CORS configured');
}

async function upload(localPath, s3Key) {
  const body = readFileSync(localPath);
  const ext = path.extname(localPath).toLowerCase();
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: s3Key, Body: body,
    ContentType: MIME[ext]||'application/octet-stream',
    CacheControl: ext==='.mp4'?'public, max-age=604800':'public, max-age=86400',
  }));
  return body.length;
}

async function main() {
  const args = process.argv.slice(2);
  await setCORS();
  if (args.includes('--cors-only')) return;

  const guides = args.includes('--guide') ? [args[args.indexOf('--guide')+1]] : GUIDES;
  const files = ['idle-video.mp4','atlas-video.mp4','viseme-sprite.png','viseme-index.json'];
  let n = 0;
  for (const g of guides) {
    for (const f of files) {
      const lp = path.join(LOCAL_BASE, g, f);
      if (!existsSync(lp)) continue;
      const s3k = `${S3_PREFIX}/${g}/${f}`;
      const sz = await upload(lp, s3k);
      console.log(`  ${g}/${f} (${(sz/1024/1024).toFixed(1)}MB)`);
      n++;
    }
  }
  console.log(`Done: ${n} files uploaded`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
