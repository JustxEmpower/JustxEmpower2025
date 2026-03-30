#!/usr/bin/env node
/**
 * Generate new attire variants for Leda and Zephyr via Replicate FLUX 1.1 Pro
 */
import Replicate from 'replicate';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'avatars');

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const NEGATIVE_PROMPT = "cartoon, anime, illustration, painting, drawing, sketch, 3d render, CGI, ugly, deformed, disfigured, mutation, extra limbs, extra fingers, blurry, low quality, watermark, text, logo, nudity, nsfw, revealing, cleavage";

const PORTRAITS = [
  {
    id: 'leda-new-attire',
    filename: 'leda-flirty-chic.png',
    prompt: `Portrait photograph of a beautiful young woman with warm light olive skin, wavy honey-blonde hair, soft hazel-green eyes, gentle compassionate expression. She is wearing a flirty but chic outfit — a fitted silk camisole in dusty rose layered under an oversized cream linen blazer, delicate gold chain necklaces layered, small hoop earrings, one hand touching the blazer collar playfully. The style is high-end but approachable and down to earth — like she just came from brunch at a beautiful cafe. Soft natural lighting, warm tones, bokeh background with golden hour light. Professional fashion photography, editorial quality, 85mm lens, shallow depth of field. 1024x1024.`,
  },
  {
    id: 'zephyr-new-attire',
    filename: 'zephyr-regal-elegant.png',
    prompt: `Portrait photograph of a beautiful young woman with warm light olive skin, wavy honey-blonde hair, confident poised expression, slight knowing smile. She is wearing a sophisticated outfit with regal elegance — a structured deep burgundy velvet blazer over a high-neck cream silk blouse, statement gold ear cuffs, hair swept to one side with effortless grace. The look radiates quiet power and royal bearing — a modern queen who leads with presence not volume. Rich warm studio lighting with a subtle golden rim light, deep warm-toned background suggesting an elegant study or library. Professional portrait photography, editorial quality, 85mm lens, shallow depth of field. 1024x1024.`,
  },
];

async function generatePortrait(portrait) {
  console.log(`\n[Generate] Starting: ${portrait.id}`);
  console.log(`[Generate] Prompt: ${portrait.prompt.substring(0, 100)}...`);

  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: {
        prompt: portrait.prompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        output_format: 'png',
        output_quality: 95,
      },
    });

    // FLUX 1.1 Pro returns a URL or ReadableStream
    let imageUrl;
    if (typeof output === 'string') {
      imageUrl = output;
    } else if (output?.url) {
      imageUrl = output.url();
    } else if (Array.isArray(output)) {
      imageUrl = output[0];
      if (typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url();
    }

    if (!imageUrl) {
      console.log(`[Generate] Raw output:`, JSON.stringify(output).substring(0, 200));
      // Try to read as stream
      if (output && typeof output[Symbol.asyncIterator] === 'function') {
        const chunks = [];
        for await (const chunk of output) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const outPath = path.join(OUTPUT_DIR, 'portraits', portrait.filename);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, buffer);
        console.log(`[Generate] Saved (stream): ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
        return outPath;
      }
      throw new Error('Could not extract image URL from output');
    }

    console.log(`[Generate] Image URL: ${imageUrl}`);

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    const outPath = path.join(OUTPUT_DIR, 'portraits', portrait.filename);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, buffer);
    console.log(`[Generate] Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return outPath;
  } catch (err) {
    console.error(`[Generate] FAILED: ${portrait.id}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('=== Living Codex — New Attire Generation ===');
  console.log(`API Token: ${process.env.REPLICATE_API_TOKEN ? 'SET' : 'MISSING'}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);

  const results = [];
  for (const portrait of PORTRAITS) {
    const result = await generatePortrait(portrait);
    results.push({ id: portrait.id, path: result });
  }

  console.log('\n=== RESULTS ===');
  for (const r of results) {
    console.log(`  ${r.id}: ${r.path || 'FAILED'}`);
  }
}

main().catch(console.error);
