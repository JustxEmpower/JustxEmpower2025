/**
 * Generate idle animation videos for avatar guide selector using Replicate's LivePortrait model.
 * Takes still face images and creates subtle breathing/blinking idle loops.
 *
 * Usage: node scripts/generate-idle-videos.mjs
 * Requires: REPLICATE_API_TOKEN in .env
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const FACES_DIR = path.join(__dirname, '..', 'public', 'assets', 'avatars', 'faces');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'avatars', 'idle-videos');

const GUIDES = [
  { id: 'kore', file: 'KORE.png' },
  { id: 'zephyr', file: 'ZEPHYR.png' },
  { id: 'leda', file: 'LEDA.png' },
];

async function generateIdleVideo(guide) {
  const inputPath = path.join(FACES_DIR, guide.file);
  if (!fs.existsSync(inputPath)) {
    console.error(`[SKIP] ${guide.id}: ${guide.file} not found in ${FACES_DIR}`);
    return null;
  }

  console.log(`[${guide.id}] Reading face image: ${inputPath}`);
  const imageData = fs.readFileSync(inputPath);
  const base64 = imageData.toString('base64');
  const mimeType = guide.file.endsWith('.jpg') || guide.file.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
  const dataUri = `data:${mimeType};base64,${base64}`;

  console.log(`[${guide.id}] Calling Replicate LivePortrait...`);

  try {
    // Use LivePortrait model for subtle idle animation
    const output = await replicate.run(
      "fofr/live-portrait:067dd98cc7e7f40b3a1744df65f4de2e6e4e0c0aa0b6964b5cd27b2cc6c8f6a5",
      {
        input: {
          image: dataUri,
          // Subtle idle movements - gentle breathing and micro-expressions
          driving_video: "https://github.com/KwaiVGI/LivePortrait/raw/main/assets/examples/driving/d0.mp4",
          live_portrait_dsize: 512,
          live_portrait_scale: 2.3,
          video_select_every_n_frames: 2,
          live_portrait_lip_zero: true,
          live_portrait_relative: true,
          live_portrait_vx_ratio: 0,
          live_portrait_vy_ratio: 0,
          live_portrait_stitching: true,
        }
      }
    );

    if (output) {
      const videoUrl = typeof output === 'string' ? output : output.toString();
      console.log(`[${guide.id}] Video generated: ${videoUrl}`);

      // Download the video
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      const outputPath = path.join(OUTPUT_DIR, `${guide.id}-idle.mp4`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`[${guide.id}] Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
      return outputPath;
    }
  } catch (err) {
    console.error(`[${guide.id}] Replicate error:`, err.message);

    // Fallback: try with a different model (SadTalker)
    console.log(`[${guide.id}] Trying fallback model...`);
    try {
      const output = await replicate.run(
        "cjwbw/sadtalker:3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
        {
          input: {
            source_image: dataUri,
            driven_audio: "https://github.com/OpenTalker/SadTalker/raw/main/examples/driven_audio/bus_chinese.wav",
            preprocess: "crop",
            still_mode: true,
            expression_scale: 0.5,
          }
        }
      );
      if (output) {
        const videoUrl = typeof output === 'string' ? output : output.toString();
        const response = await fetch(videoUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const outputPath = path.join(OUTPUT_DIR, `${guide.id}-idle.mp4`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`[${guide.id}] Saved (fallback): ${outputPath}`);
        return outputPath;
      }
    } catch (err2) {
      console.error(`[${guide.id}] Fallback also failed:`, err2.message);
    }
  }
  return null;
}

async function main() {
  console.log('=== Generating Idle Animation Videos ===');
  console.log(`Faces dir: ${FACES_DIR}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Check which face files exist
  const available = GUIDES.filter(g => {
    const exists = fs.existsSync(path.join(FACES_DIR, g.file));
    if (!exists) console.warn(`⚠ Missing: ${g.file}`);
    return exists;
  });

  if (available.length === 0) {
    console.error('\nNo face images found! Please save face images to:');
    console.error(`  ${FACES_DIR}/kore-face.png`);
    console.error(`  ${FACES_DIR}/zephyr-face.png`);
    console.error(`  ${FACES_DIR}/leda-face.png`);
    process.exit(1);
  }

  console.log(`\nProcessing ${available.length} face(s)...\n`);

  // Process sequentially to avoid rate limits
  const results = [];
  for (const guide of available) {
    const result = await generateIdleVideo(guide);
    results.push({ id: guide.id, path: result });
  }

  console.log('\n=== Results ===');
  results.forEach(r => {
    console.log(`  ${r.id}: ${r.path ? '✓ ' + r.path : '✗ FAILED'}`);
  });

  // Also copy face images as portraits
  console.log('\n=== Copying face images as portraits ===');
  for (const guide of available) {
    const src = path.join(FACES_DIR, guide.file);
    const dst = path.join(FACES_DIR, '..', 'portraits', `${guide.id}-portrait.png`);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`  ${guide.id}: ${dst}`);
  }

  console.log('\nDone! Update GuideCharacters.ts with new portrait and video URLs.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
