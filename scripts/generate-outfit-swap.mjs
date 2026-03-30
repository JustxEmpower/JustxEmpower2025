#!/usr/bin/env node
/**
 * Generate new outfit portraits for Leda and Zephyr
 * Step 1: Generate outfit body image via FLUX
 * Step 2: Face swap using the original Simli face image
 * This preserves the exact face identity for Simli compatibility.
 */
import Replicate from 'replicate';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'public', 'assets', 'avatars');

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Convert local file to data URI for Replicate
async function fileToDataUri(filePath) {
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(filePath).slice(1);
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

// Download URL to file
async function downloadToFile(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buffer);
  console.log(`  Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return outPath;
}

// Extract image URL from Replicate output (handles various formats)
function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (output?.url) return typeof output.url === 'function' ? output.url() : output.url;
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first?.url) return typeof first.url === 'function' ? first.url() : first.url;
  }
  return null;
}

const JOBS = [
  {
    name: 'Leda',
    faceImage: path.join(ASSETS, 'faces', 'LEDA.png'),
    outfitPrompt: `Portrait photograph of a woman, flirty but chic outfit — fitted dusty rose silk camisole layered under an oversized cream linen blazer pushed up at the sleeves, delicate layered gold chain necklaces, small gold hoop earrings. She has a warm playful half-smile. Style is high-end but approachable and down to earth, effortless fashion. Soft golden hour lighting from the left, warm bokeh background suggesting a sunlit cafe terrace. Professional editorial fashion photography, 85mm f/1.4, shallow depth of field, warm color grading. Square 1024x1024.`,
    outputFile: 'leda-flirty-chic-faceswap.png',
  },
  {
    name: 'Zephyr',
    faceImage: path.join(ASSETS, 'faces', 'ZEPHYR.png'),
    outfitPrompt: `Portrait photograph of a woman, sophisticated outfit with regal elegance — structured deep burgundy velvet blazer with subtle sheen over a high-neck cream silk blouse, statement architectural gold ear cuffs, hair styled with effortless grace. She has a confident knowing expression, slight smile, eyes that command respect. Rich warm studio lighting with golden rim light, deep warm library background with leather and wood tones. Professional portrait photography, Vogue editorial quality, 85mm f/1.2, shallow depth of field, rich warm tones. Square 1024x1024.`,
    outputFile: 'zephyr-regal-elegant-faceswap.png',
  },
];

async function processJob(job) {
  console.log(`\n═══ ${job.name} ═══`);

  // Step 1: Generate outfit body
  console.log(`[1/2] Generating outfit body image...`);
  const bodyOutput = await replicate.run('black-forest-labs/flux-1.1-pro', {
    input: {
      prompt: job.outfitPrompt,
      width: 1024,
      height: 1024,
      num_inference_steps: 50,
      guidance_scale: 7.5,
      output_format: 'png',
    },
  });
  const bodyUrl = extractUrl(bodyOutput);
  if (!bodyUrl) {
    console.error(`  FAILED: Could not get body image URL`);
    return null;
  }
  const bodyPath = path.join(ASSETS, 'portraits', `${job.name.toLowerCase()}-body-temp.png`);
  await downloadToFile(bodyUrl, bodyPath);

  // Step 2: Face swap — put the original face onto the outfit body
  console.log(`[2/2] Face swapping original ${job.name} face onto outfit...`);
  const faceDataUri = await fileToDataUri(job.faceImage);
  const bodyDataUri = await fileToDataUri(bodyPath);

  try {
    const swapOutput = await replicate.run('cdingram/face-swap:d1d6ea8c', {
      input: {
        source_image: faceDataUri,   // face to extract FROM (original Leda/Zephyr)
        target_image: bodyDataUri,   // image to put the face ONTO (outfit body)
      },
    });
    const swapUrl = extractUrl(swapOutput);
    if (!swapUrl) {
      console.log(`  Face swap output:`, JSON.stringify(swapOutput).substring(0, 200));
      // Try alternate face swap model
      console.log(`  Trying alternate face swap model...`);
      const swap2 = await replicate.run('omniedgeio/face-swap:c2d783366db1a51bfe4e43bb601c2c66dc47edac16b1e5af6e6e27331a03e35e', {
        input: {
          target_image: bodyDataUri,
          swap_image: faceDataUri,
        },
      });
      const swap2Url = extractUrl(swap2);
      if (swap2Url) {
        const finalPath = path.join(ASSETS, 'portraits', job.outputFile);
        await downloadToFile(swap2Url, finalPath);
        // Clean up temp
        await fs.unlink(bodyPath).catch(() => {});
        return finalPath;
      }
      console.error(`  FAILED: No URL from face swap`);
      return null;
    }
    const finalPath = path.join(ASSETS, 'portraits', job.outputFile);
    await downloadToFile(swapUrl, finalPath);
    // Clean up temp
    await fs.unlink(bodyPath).catch(() => {});
    return finalPath;
  } catch (err) {
    console.error(`  Face swap error:`, err.message);
    // If face swap fails, just use the outfit body as-is
    console.log(`  Using outfit body image as fallback`);
    const finalPath = path.join(ASSETS, 'portraits', job.outputFile);
    await fs.rename(bodyPath, finalPath);
    return finalPath;
  }
}

async function main() {
  console.log('=== Living Codex — Outfit + Face Swap Pipeline ===');
  for (const job of JOBS) {
    const result = await processJob(job);
    console.log(`  Result: ${result || 'FAILED'}`);
  }
  console.log('\nDone. Review the images, then upload to Simli to create new faces.');
}

main().catch(console.error);
