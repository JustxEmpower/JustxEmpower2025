/**
 * Generate warm-smile versions of avatar faces using Replicate's expression-editor.
 * Uses fofr/expression-editor (LivePortrait) to add a gentle, warm smile.
 *
 * Usage: REPLICATE_API_TOKEN=xxx node scripts/generate-smiling-avatars.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACES_DIR = path.join(__dirname, '../client/public/assets/avatars/faces');
const OUTPUT_DIR = path.join(__dirname, '../client/public/assets/avatars/faces-smiling');

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_TOKEN) {
  console.error('Missing REPLICATE_API_TOKEN');
  process.exit(1);
}

// Avatars to process (skip Aoede — she already smiles)
const AVATARS = [
  { name: 'KORE', file: 'KORE.png' },
  { name: 'LEDA', file: 'LEDA.png' },
  { name: 'THEIA', file: 'THEIA.jpg' },
  { name: 'SELENE', file: 'SELENE.jpg' },
  { name: 'ZEPHYR', file: 'ZEPHYR.png' },
];

// Expression parameters for a warm, gentle smile (not over-the-top)
const SMILE_PARAMS = {
  smile: 0.55,           // Gentle warm smile, not a grin
  aaa: 0.05,             // Very slight mouth open
  eee: 0.15,             // Slight lip stretch for natural smile
  woo: 0.0,
  blink: 0.0,
  eyebrow: 0.15,         // Slight eyebrow raise for warmth
  pupil_x: 0.0,
  pupil_y: 0.0,
  rotate_pitch: 0.0,
  rotate_yaw: 0.0,
  rotate_roll: 0.0,
  output_format: 'png',
  output_quality: 95,
};

async function fileToDataUri(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function createPrediction(imageDataUri) {
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      version: 'bf913bc90e1c44ba288ba3942a538693b72e8cc7df576f3beebe56adc0a92b86',
      input: {
        image: imageDataUri,
        ...SMILE_PARAMS,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function waitForPrediction(predictionId) {
  const maxWait = 120_000; // 2 minutes
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` },
    });
    const data = await res.json();

    if (data.status === 'succeeded') return data.output;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${predictionId} ${data.status}: ${data.error}`);
    }

    console.log(`  ... ${data.status}, waiting...`);
    await new Promise(r => setTimeout(r, 3000));
  }

  throw new Error(`Prediction ${predictionId} timed out`);
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buf);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const avatar of AVATARS) {
    const inputPath = path.join(FACES_DIR, avatar.file);
    if (!fs.existsSync(inputPath)) {
      console.log(`[SKIP] ${avatar.name}: file not found at ${inputPath}`);
      continue;
    }

    console.log(`[${avatar.name}] Converting to data URI...`);
    const dataUri = await fileToDataUri(inputPath);

    console.log(`[${avatar.name}] Sending to Replicate expression-editor...`);
    const prediction = await createPrediction(dataUri);

    let outputUrl;
    if (prediction.status === 'succeeded') {
      outputUrl = prediction.output;
    } else if (prediction.id) {
      console.log(`[${avatar.name}] Prediction ${prediction.id} — waiting...`);
      outputUrl = await waitForPrediction(prediction.id);
    } else {
      console.error(`[${avatar.name}] Unexpected response:`, prediction);
      continue;
    }

    const outFile = `${avatar.name}-smile.png`;
    const outputPath = path.join(OUTPUT_DIR, outFile);
    console.log(`[${avatar.name}] Downloading result to ${outFile}...`);
    await downloadImage(outputUrl, outputPath);
    console.log(`[${avatar.name}] Done!`);
  }

  console.log(`\nAll smiling avatars saved to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
