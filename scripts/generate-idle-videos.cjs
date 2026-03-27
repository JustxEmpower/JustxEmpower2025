/**
 * Generate idle animation videos from smiling face PNGs via Replicate API
 * Uses minimax/video-01-live for portrait-to-video idle animation
 */

const fs = require('fs');
const path = require('path');

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_TOKEN) { console.error('Set REPLICATE_API_TOKEN env var'); process.exit(1); }
const FACES_DIR = path.join(__dirname, '..', 'client', 'public', 'assets', 'avatars', 'faces-smiling');
const OUTPUT_DIR = path.join(__dirname, '..', 'client', 'public', 'assets', 'avatars', 'idle-videos');

const GUIDES = ['KORE', 'LEDA', 'SELENE', 'THEIA', 'ZEPHYR'];

async function createPrediction(guideName) {
  const imagePath = path.join(FACES_DIR, `${guideName}-smile.png`);
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;

  console.log(`[${guideName}] Starting Replicate prediction...`);

  const res = await fetch('https://api.replicate.com/v1/models/minimax/video-01-live/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      input: {
        first_frame_image: dataUri,
        prompt: "a woman looking at the camera with a gentle warm smile, subtle natural breathing movement, slight head micro-movements, soft natural blinking, calm peaceful idle portrait, photorealistic, cinematic lighting",
        prompt_optimizer: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[${guideName}] Create failed: ${err}`);
    return null;
  }

  const prediction = await res.json();
  console.log(`[${guideName}] Prediction created: ${prediction.id} (status: ${prediction.status})`);
  return prediction;
}

async function pollPrediction(id, guideName) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` },
    });
    const pred = await res.json();

    if (pred.status === 'succeeded') {
      console.log(`[${guideName}] Succeeded!`);
      return pred.output;
    } else if (pred.status === 'failed' || pred.status === 'canceled') {
      console.error(`[${guideName}] Failed: ${pred.error || 'unknown'}`);
      return null;
    }

    if (i % 6 === 0) console.log(`[${guideName}] Still processing... (${pred.status}, ${i * 5}s)`);
  }
  console.error(`[${guideName}] Timed out`);
  return null;
}

async function downloadVideo(url, guideName) {
  const outPath = path.join(OUTPUT_DIR, `${guideName.toLowerCase()}-idle.mp4`);
  console.log(`[${guideName}] Downloading to ${outPath}...`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[${guideName}] Download failed: ${res.status}`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`[${guideName}] Saved! (${(buffer.length / 1024).toFixed(0)} KB)`);
  return true;
}

async function main() {
  console.log('=== Generating idle videos via Replicate ===');

  // Start all predictions
  const predictions = [];
  for (const guide of GUIDES) {
    const pred = await createPrediction(guide);
    if (pred) predictions.push({ guide, id: pred.id });
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n${predictions.length} predictions started. Polling...`);

  // Poll all in parallel
  const results = await Promise.all(
    predictions.map(async ({ guide, id }) => {
      const output = await pollPrediction(id, guide);
      if (output) {
        const videoUrl = typeof output === 'string' ? output : (Array.isArray(output) ? output[0] : null);
        if (videoUrl) {
          await downloadVideo(videoUrl, guide);
          return { guide, success: true };
        }
      }
      return { guide, success: false };
    })
  );

  console.log('\n=== Results ===');
  for (const r of results) {
    console.log(`${r.guide}: ${r.success ? 'SUCCESS' : 'FAILED'}`);
  }
}

main().catch(console.error);
