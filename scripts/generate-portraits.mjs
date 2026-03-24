#!/usr/bin/env node
/**
 * generate-portraits.mjs
 *
 * Generates professional, diverse avatar portraits for all 6 Living Codex™ guides
 * using Replicate FLUX 1.1 Pro, then uploads them to S3.
 *
 * Usage:
 *   node scripts/generate-portraits.mjs                 # all 6 guides
 *   node scripts/generate-portraits.mjs --guide kore    # single guide
 *   node scripts/generate-portraits.mjs --dry-run       # show prompts only
 */

import Replicate from 'replicate';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = 'justxempower-assets';
const S3_PREFIX = 'avatars/portraits';
const LOCAL_DIR = path.resolve('public/assets/avatars/portraits');

// FLUX 1.1 Pro — highest quality photorealistic generation
const MODEL = 'black-forest-labs/flux-1.1-pro';

/**
 * Portrait prompts — professional, diverse, approachable.
 * Each guide is a distinct person with a specific professional archetype.
 * Framing: head-and-shoulders, centered, direct eye contact.
 * Style: professional headshot with warm, editorial lighting.
 */
const GUIDE_PROMPTS = {
  kore: {
    prompt: `Professional headshot portrait of a warm woman in her late 30s. Light brown hair styled in a soft updo with a few loose strands. Kind brown eyes with crow's feet from genuine smiling. Wearing a cream silk blouse with a simple thin gold chain necklace. Minimal natural makeup. Soft warm ambient lighting from the left. Neutral warm-toned background. Shoulders visible, centered composition. Gentle welcoming half-smile. Looks like a life coach or counselor. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted',
  },
  aoede: {
    prompt: `Professional headshot portrait of a creative Black woman in her early 40s. Natural coily hair with distinguished silver-grey streaks, styled freely. Warm dark brown eyes with an intelligent, thoughtful gaze. Wearing a deep plum or burgundy wrap-style top, modest neckline. Small artistic silver earrings. Minimal makeup, natural skin texture visible. Warm studio lighting with subtle purple-toned backdrop. Shoulders visible, centered composition. Thoughtful, knowing expression with slight closed-mouth smile. Looks like a poet, professor, or creative writing mentor. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted, young looking',
  },
  leda: {
    prompt: `Professional headshot portrait of a nurturing East Asian woman in her mid 30s. Shoulder-length straight dark hair, parted softly to one side. Gentle dark eyes with a compassionate, calming presence. Wearing a soft rose pink cardigan layered over a white crew-neck blouse. Small pearl stud earrings. Minimal natural makeup, soft dewy skin. Soft diffused natural lighting, pale warm background. Shoulders visible, centered composition. Warm, empathetic expression with a gentle closed-mouth smile. Looks like a therapist or grief counselor. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted',
  },
  theia: {
    prompt: `Professional headshot portrait of a grounded South Asian woman in her early 40s. Dark hair pulled back loosely in a low bun, a few wisps framing her face. Calm, steady dark eyes with a wise, knowing gaze. Wearing an olive green linen top with a natural wooden bead bracelet on one wrist. Tiny gold nose stud. Minimal makeup, natural warm-toned skin. Warm natural lighting with soft green-toned earthy background. Shoulders visible, centered composition. Serene, centered expression with a knowing slight smile. Looks like a yoga therapist or somatic practitioner. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted',
  },
  selene: {
    prompt: `Professional headshot portrait of a serene mixed-race woman in her late 30s. Wavy dark brown hair past her shoulders, naturally textured. Thoughtful hazel-brown eyes behind thin wire-frame glasses. Wearing a slate blue structured blazer over a white crew-neck top. Small minimalist silver bar necklace. Minimal makeup, a few freckles visible. Cool-toned studio lighting with soft blue-grey gradient background. Shoulders visible, centered composition. Calm, introspective expression with an intelligent, approachable half-smile. Looks like a university librarian or research scholar. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted',
  },
  zephyr: {
    prompt: `Professional headshot portrait of a confident Latina woman in her mid 30s. Dark auburn hair in a polished low bun. Bright, determined dark eyes with an encouraging expression. Wearing a warm amber or burnt orange structured blouse with small gold hoop earrings. Minimal professional makeup, healthy glowing skin. Warm golden-hour style lighting with soft warm gradient background. Shoulders visible, centered composition. Confident, encouraging expression with an open, genuine smile showing some teeth. Looks like an executive coach or leadership mentor. Shot on 85mm lens, shallow depth of field, photorealistic, high resolution.`,
    negative: 'sexy, cleavage, revealing, glamorous, heavy makeup, model, seductive, cartoon, anime, illustration, blurry, distorted',
  },
};

// ============================================================================
// Main
// ============================================================================

const args = process.argv.slice(2);
const singleGuide = args.includes('--guide') ? args[args.indexOf('--guide') + 1] : null;
const dryRun = args.includes('--dry-run');

const guides = singleGuide
  ? [singleGuide]
  : Object.keys(GUIDE_PROMPTS);

async function generatePortrait(guideId) {
  const config = GUIDE_PROMPTS[guideId];
  if (!config) {
    console.error(`❌ Unknown guide: ${guideId}`);
    return null;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎨 ${guideId.toUpperCase()} — Generating portrait`);
  console.log(`${'═'.repeat(60)}`);

  if (dryRun) {
    console.log(`   Prompt: ${config.prompt.slice(0, 120)}...`);
    return null;
  }

  const startTime = Date.now();

  try {
    console.log(`   📡 Calling Replicate FLUX 1.1 Pro...`);

    const output = await replicate.run(MODEL, {
      input: {
        prompt: config.prompt,
        aspect_ratio: '3:4',       // portrait orientation
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 2,
        prompt_upsampling: true,    // let FLUX enhance the prompt
      },
    });

    // Replicate output can be: string URL, FileOutput with .url(), array, or ReadableStream
    let imageBuffer;

    if (typeof output === 'string') {
      // Direct URL string
      console.log(`   📥 Downloading from: ${output.slice(0, 80)}...`);
      const response = await fetch(output);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (output && typeof output[Symbol.asyncIterator] === 'function') {
      // AsyncIterable (FileOutput) — read as stream
      console.log(`   📥 Reading stream output...`);
      const chunks = [];
      for await (const chunk of output) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      imageBuffer = Buffer.concat(chunks);
    } else if (output && typeof output.url === 'function') {
      // FileOutput with .url() method
      const url = output.url();
      console.log(`   📥 Downloading from: ${String(url).slice(0, 80)}...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (Array.isArray(output) && output.length > 0) {
      // Array of outputs — take first
      const first = output[0];
      const url = typeof first === 'string' ? first : first?.url?.() || String(first);
      console.log(`   📥 Downloading from: ${url.slice(0, 80)}...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Last resort: try toString or converting to URL
      const url = String(output);
      if (url.startsWith('http')) {
        console.log(`   📥 Downloading from: ${url.slice(0, 80)}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        console.log(`   ⚠️  Output type debug:`, typeof output, Object.keys(output || {}));
        throw new Error(`Cannot handle output: ${typeof output}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Generated in ${elapsed}s (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

    // Save locally
    mkdirSync(LOCAL_DIR, { recursive: true });
    const localPath = path.join(LOCAL_DIR, `portrait-${guideId}.jpg`);
    writeFileSync(localPath, imageBuffer);
    console.log(`   💾 Saved: ${localPath}`);

    // Upload to S3
    const s3Key = `${S3_PREFIX}/portrait-${guideId}.jpg`;
    console.log(`   ☁️  Uploading to s3://${S3_BUCKET}/${s3Key}...`);

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=86400',
    }));

    const publicUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
    console.log(`   ✅ Uploaded: ${publicUrl}`);

    return { guideId, localPath, publicUrl, size: imageBuffer.length };

  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Living Codex™ — Professional Avatar Portrait Generator ║');
  console.log('║  Replicate FLUX 1.1 Pro → S3                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n   Guides: ${guides.join(', ')}`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   S3 Bucket: ${S3_BUCKET}`);

  if (dryRun) {
    console.log('\n   🏃 DRY RUN — showing prompts only\n');
  }

  const results = [];

  for (const guideId of guides) {
    const result = await generatePortrait(guideId);
    if (result) results.push(result);
  }

  if (!dryRun && results.length > 0) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ COMPLETE — ${results.length}/${guides.length} portraits generated`);
    console.log(`${'═'.repeat(60)}`);
    for (const r of results) {
      console.log(`   ${r.guideId}: ${r.publicUrl} (${(r.size / 1024).toFixed(0)}KB)`);
    }
    console.log(`\n   Next step: node scripts/generate-kling-atlas.mjs`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
