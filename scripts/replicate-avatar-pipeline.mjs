#!/usr/bin/env node
/**
 * replicate-avatar-pipeline.mjs
 *
 * Automated avatar asset generation pipeline for Living Codex™
 * Uses Replicate API to:
 *   1. Train a LoRA on founder reference photos
 *   2. Generate 6 Founder Prime portraits
 *   3. Generate 24 diverse preset portraits
 *   4. Generate expression sheets for all 30 characters
 *   5. Post-process (face fix, thumbnails, NSFW safety check)
 *
 * Prerequisites:
 *   - Node.js 18+
 *   - npm install replicate
 *   - REPLICATE_API_TOKEN env var set
 *   - Founder photos in training-data/founder-photos/
 *
 * Usage:
 *   node scripts/replicate-avatar-pipeline.mjs [--skip-training] [--only-primes] [--only-presets] [--only-expressions]
 */

import Replicate from 'replicate';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, existsSync } from 'fs';
import { execSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Replicate API token (from env) */
  apiToken: process.env.REPLICATE_API_TOKEN,

  /** Base model for image generation */
  imageModel: 'black-forest-labs/flux-1.1-pro',

  /** LoRA trainer model */
  trainerModel: 'ostris/flux-dev-lora-trainer',

  /** Face enhancement model */
  faceFixModel: 'tencentarc/gfpgan',

  /** NSFW detection model */
  nsfwModel: 'andreasjansson/nsfw_image_detection',

  /** LoRA trigger word */
  triggerWord: 'LIVINGCODEX_FOUNDER',

  /** How many candidate images to generate per portrait */
  candidatesPerPortrait: 2,

  /** Output directories */
  outputDir: 'generated-avatars',
  trainingDataDir: 'training-data/founder-photos',

  /** Final deploy directory */
  deployDir: 'public/assets/avatars',

  /** Image generation defaults */
  imageDefaults: {
    width: 1024,
    height: 1024,
    num_inference_steps: 50,
    guidance_scale: 7.5,
  },

  /** LoRA training defaults */
  trainingDefaults: {
    steps: 1200,
    learning_rate: 0.0004,
    batch_size: 1,
    resolution: '1024',
    lora_rank: 32,
    optimizer: 'adamw8bit',
    caption_dropout_rate: 0.05,
  },

  /** Expression img2img strength (lower = more identity preservation) */
  expressionStrength: 0.35,
};

/** Shared negative prompt for all generations */
const NEGATIVE_PROMPT =
  'cartoon, anime, illustration, painting, deformed, ugly, duplicate, morbid, nsfw, nudity, revealing clothing, childlike, extra limbs, bad anatomy, sexualized, watermark, text, signature';

// ============================================================================
// Founder Prime Definitions
// ============================================================================

const FOUNDER_BASE = `${CONFIG.triggerWord}, a woman in her 30s, olive skin tone, green-hazel eyes, long dark wavy brown hair, visible full sleeve tattoo on right arm, athletic-curvy body type, small gold nose ring, gold feather earrings`;

const FOUNDER_PRIMES = [
  {
    id: 'kore-prime',
    guide: 'kore',
    filename: 'portrait-kore',
    prompt: `${FOUNDER_BASE}, wearing flowing golden-cream sacred robes with intricate embroidery, gold circlet crown on head, tattoo sleeve visible through sheer fabric on right arm, layered gold necklaces, gold arm cuffs over tattoo sleeve, standing in a warm sacred temple space with soft golden light, portrait framing from waist up, looking directly at camera with wise gentle expression, professional portrait photography, soft studio lighting, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
  {
    id: 'aoede-prime',
    guide: 'aoede',
    filename: 'portrait-aoede',
    prompt: `${FOUNDER_BASE}, wearing a deep violet artistic draped dress with asymmetric neckline, silver moonstone pendant necklace, tattoo sleeve visible, standing in a creative studio space with mirrors and soft purple-violet lighting, portrait framing from waist up, looking at camera with creative inspired expression, professional portrait photography, soft studio lighting, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
  {
    id: 'leda-prime',
    guide: 'leda',
    filename: 'portrait-leda',
    prompt: `${FOUNDER_BASE}, hair pulled softly to one side, wearing a soft rose-blush flowing blouse with gathered neckline, delicate gold layered necklaces, holding an ornate leather journal, sitting in a warm garden alcove with climbing roses and soft natural light, portrait framing from waist up, looking at camera with warm compassionate expression, professional portrait photography, golden hour lighting, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
  {
    id: 'theia-prime',
    guide: 'theia',
    filename: 'portrait-theia',
    prompt: `${FOUNDER_BASE}, hair in loose waves, wearing an emerald green fitted sacred warrior tunic with gold arm cuffs, geometric shoulder detail, minimal gold jewelry, standing among ancient mossy stones in a misty forest clearing, portrait framing from waist up, looking at camera with grounded healing expression, professional portrait photography, soft diffused forest light, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
  {
    id: 'selene-prime',
    guide: 'selene',
    filename: 'portrait-selene',
    prompt: `${FOUNDER_BASE}, dark wavy hair in a sophisticated low bun, tattoo sleeve partially visible at wrist cuff, wearing an elegant sapphire blue fitted blazer-dress with pearl brooch, structured shoulders, reading glasses pushed up on head, standing in a grand library with floor-to-ceiling bookshelves and warm lamp light, portrait framing from waist up, looking at camera with scholarly knowing expression, professional portrait photography, warm library lighting, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
  {
    id: 'zephyr-prime',
    guide: 'zephyr',
    filename: 'portrait-zephyr',
    prompt: `${FOUNDER_BASE}, long wavy hair with natural movement, both arm tattoos clearly visible, wearing a warm coral-orange modern wrap top with flowing wide-leg pants, layered bracelets on both wrists, welcoming open posture, standing on a sunset terrace with warm city skyline behind, portrait framing from waist up, looking at camera with warm welcoming expression, professional portrait photography, golden hour sunset lighting, bokeh background, photorealistic, 8k, detailed skin texture`,
  },
];

// ============================================================================
// Diverse Preset Definitions
// ============================================================================

const DIVERSE_PRESETS = [
  // KORE presets
  {
    id: 'kore-amber',
    prompt: 'A photorealistic portrait of a warm approachable woman, amber medium skin with warm undertone, loose curly brown hair, dark brown eyes, athletic body type, woman in her 30s, wearing a tailored linen dress with natural fibers and an elegant draped shawl, amber pendant necklace and small earrings, standing in a warm sunlit room, portrait framing from waist up, looking at camera with inviting wise expression, professional portrait photography, soft studio lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'kore-obsidian',
    prompt: 'A photorealistic portrait of a powerful grounded woman, very dark obsidian skin with neutral undertone, natural coils black hair, warm brown eyes, curvy body type, woman in her 40s, wearing a structured wrap with geometric patterns and power stance accessories, gold crown and dark arm cuffs, in a dramatic studio with warm directional light, portrait framing from waist up, looking at camera with deep wisdom and authority, professional portrait photography, dramatic lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'kore-pearl',
    prompt: 'A photorealistic portrait of a serene luminous woman, fair pearl skin with cool undertone, straight rose-blonde hair, blue-teal eyes, slim body type, woman in her 20s, wearing a flowing ethereal gown in soft neutrals with shimmer, delicate circlet and crystal pendant, in a light airy space with soft diffused light, portrait framing from waist up, looking at camera with serene clarifying expression, professional portrait photography, soft ethereal lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'kore-sage',
    prompt: 'A photorealistic portrait of a balanced thoughtful elder woman, medium sage skin with neutral undertone, wavy auburn hair with silver streaks, olive green eyes, plus size body type, woman in her 50s or 60s, wearing layered earth-toned textiles with natural patterns and texture, sage pendant and warm headwrap accent, in a warm natural setting with golden afternoon light, portrait framing from waist up, looking at camera with gentle authority and warmth, professional portrait photography, golden hour lighting, bokeh background, photorealistic, 8k',
  },

  // AOEDE presets
  {
    id: 'aoede-indigo',
    prompt: 'A photorealistic portrait of a visionary creative woman, very dark obsidian skin, long locs with deep indigo highlights, striking golden amber eyes, slim body type, woman in her 20s, wearing flowing celestial robes with cosmic patterns and iridescent accents, gold crown and gold nose ring and delicate earrings, in a studio with dramatic starlit-purple lighting, portrait framing from waist up, looking at camera with inspired visionary expression, professional portrait photography, dramatic creative lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'aoede-copper',
    prompt: 'A photorealistic portrait of a grounded creative woman, copper medium-deep skin with warm undertone, braided auburn hair, warm brown eyes, athletic body type, woman in her 30s, wearing an artisan wrap with hand-woven patterns in clay and earth tones, copper pendant and dark arm cuffs, in a creative workshop with warm natural light, portrait framing from waist up, looking at camera with grounded creative expression, professional portrait photography, warm studio lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'aoede-ivory',
    prompt: 'A photorealistic portrait of a luminous ethereal artist, fair ivory skin with warm undertone, long flowing blonde wavy hair, grey eyes, curvy body type, woman in her 40s, wearing flowing silk robes in cream and gold with artistic draping, gold circlet and golden pendant and gold earrings, in an elegant art studio with warm candlelit atmosphere, portrait framing from waist up, looking at camera with inspired muse-like expression, professional portrait photography, warm golden lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'aoede-midnight',
    prompt: 'A photorealistic portrait of a powerful creative elder, darkest ebony skin with cool undertone, natural black afro hair, golden brown eyes, plus size body type, woman in her 50s or 60s, wearing powerful sacred robes in black with metallic gold accents, gold crown and layered gold pendant and silver arm cuffs, in a majestic studio with dramatic warm spotlight, portrait framing from waist up, looking at camera with commanding creative mastery, professional portrait photography, dramatic lighting, bokeh background, photorealistic, 8k',
  },

  // LEDA presets
  {
    id: 'leda-rose',
    prompt: 'A photorealistic portrait of a warm compassionate woman, light honey skin with warm undertone, wavy golden hair, rose-tinted brown eyes, curvy body type, woman in her 30s, wearing soft flowing robes in rose and cream with gentle embroidery, rose-pink pendant and delicate pink earrings, in a cozy reading nook with warm rose-gold light, portrait framing from waist up, looking at camera with warm compassionate gentle expression, professional portrait photography, soft warm lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'leda-mahogany',
    prompt: 'A photorealistic portrait of a nurturing grounded woman, deep mahogany skin with rich warm undertone, cornrows dark brown hair, golden brown eyes, plus size body type, woman in her 40s, wearing warm layered wraps in natural fibers with heritage patterns, dark headwrap accent and copper pendant, in a warm garden room with soft natural afternoon light, portrait framing from waist up, looking at camera with nurturing depth and presence, professional portrait photography, warm natural lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'leda-honey',
    prompt: 'A photorealistic portrait of a sweet encouraging young woman, light honey skin with warm undertone, loose curly caramel hair, warm hazel-gold eyes, athletic body type, woman in her 20s, wearing an elegant modern dress in warm tones with soft textures, gold circlet and delicate gold earrings, in a bright modern space with warm morning sunlight, portrait framing from waist up, looking at camera with encouraging sweet expression, professional portrait photography, bright warm lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'leda-willow',
    prompt: 'A photorealistic portrait of a gentle flowing elder woman, medium sage skin with neutral undertone, long flowing olive-green tinted hair with silver streaks, deep sage green eyes, slim body type, woman in her 50s or 60s, wearing flowing robes in sage and cream with graceful movement, sage pendant and natural headwrap accent, in a peaceful willow garden with soft diffused light, portrait framing from waist up, looking at camera with gentle reflective wisdom, professional portrait photography, soft natural lighting, bokeh background, photorealistic, 8k',
  },

  // THEIA presets
  {
    id: 'theia-jade',
    prompt: 'A photorealistic portrait of a peaceful healing woman, deep sienna skin with warm undertone, braided brown hair, bright emerald green eyes, curvy body type, woman in her 40s, wearing healing robes in jade and green tones with grounding earth elements, jade pendant and sage green arm cuffs, in a serene forest clearing with soft green-filtered light, portrait framing from waist up, looking at camera with peaceful grounded healing presence, professional portrait photography, soft natural forest light, bokeh background, photorealistic, 8k',
  },
  {
    id: 'theia-garnet',
    prompt: 'A photorealistic portrait of a powerful healer, very dark obsidian skin with neutral undertone, natural coils black hair, deep garnet-red eyes, athletic body type, woman in her 30s, wearing sacred healing garments in deep reds and golds, garnet crown and deep red pendant, in a warm healing sanctum with amber candlelight, portrait framing from waist up, looking at camera with powerful rooted healing expression, professional portrait photography, warm dramatic lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'theia-silver',
    prompt: 'A photorealistic portrait of a cool calming young healer, fair pearl skin with cool undertone, straight silver-white hair, steel blue eyes, slim body type, woman in her 20s, wearing cool-toned healing robes with silver and blue accents, silver circlet and sky blue pendant and pale blue earrings, in a calm moonlit healing space with cool soft light, portrait framing from waist up, looking at camera with calm intuitive soothing expression, professional portrait photography, cool silver lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'theia-bronze',
    prompt: 'A photorealistic portrait of a warm steady elder healer, medium-deep bronze skin with bronze undertone, long locs dark brown hair with grey streaks, warm brown-green eyes, plus size body type, woman in her 50s or 60s, wearing grounding robes in bronze tones with natural textures, textured headwrap accent and bronze pendant and earthy arm cuffs, in a warm grounding earth space with rich amber light, portrait framing from waist up, looking at camera with warm steady ancient healing wisdom, professional portrait photography, warm amber lighting, bokeh background, photorealistic, 8k',
  },

  // SELENE presets
  {
    id: 'selene-sapphire',
    prompt: 'A photorealistic portrait of a brilliant young scholar, very dark obsidian skin, long flowing straight black hair, deep sapphire blue eyes, slim body type, woman in her 20s, wearing professional scholarly robes in sapphire with gold trimming, blue circlet and gold pendant and royal blue earrings, in a grand library with dramatic warm reading lamp light, portrait framing from waist up, looking at camera with brilliant scholarly intensity, professional portrait photography, warm library lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'selene-ebony',
    prompt: 'A photorealistic portrait of a powerful knowledge guardian, darkest ebony skin with cool undertone, natural coils black hair, striking golden eyes, athletic body type, woman in her 40s, wearing powerful scholarly robes in black and gold with archival patterns, gold crown and gold pendant and silver arm cuffs, in an ancient archive with dramatic torchlight, portrait framing from waist up, looking at camera with commanding authority of deep knowledge, professional portrait photography, dramatic warm lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'selene-opal',
    prompt: 'A photorealistic portrait of a luminous multifaceted librarian, fair ivory skin with warm undertone, wavy sandy blonde hair, steel blue eyes, curvy body type, woman in her 30s, wearing an elegant scholarly dress in cream and iridescent tones with literary motifs, opal circlet and blue pendant and gold earrings, in a beautiful modern library with warm afternoon light through tall windows, portrait framing from waist up, looking at camera with warm intellectual curiosity, professional portrait photography, warm natural lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'selene-teak',
    prompt: 'A photorealistic portrait of a seasoned elder wisdom keeper, very deep teak skin with warm undertone, cornrows very dark hair with silver threads, warm amber eyes, plus size body type, woman in her 50s or 60s, wearing richly textured scholarly robes in deep wood tones with heritage patterns, warm headwrap accent and copper pendant and dark arm cuffs, in a grand old library with warm golden lamplight, portrait framing from waist up, looking at camera with enduring seasoned wisdom and warmth, professional portrait photography, warm golden lighting, bokeh background, photorealistic, 8k',
  },

  // ZEPHYR presets
  {
    id: 'zephyr-coral',
    prompt: 'A photorealistic portrait of a vibrant welcoming young woman, copper medium-deep skin with warm undertone, loose curly auburn hair, warm coral-toned eyes, curvy body type, woman in her 20s, wearing warm flowing robes in coral and gold with communal motifs, coral pendant and orange earrings and gold nose ring, on a warm sunlit terrace with warm community gathering in soft focus behind, portrait framing from waist up, looking at camera with vibrant welcoming joyful expression, professional portrait photography, warm golden sunlight, bokeh background, photorealistic, 8k',
  },
  {
    id: 'zephyr-umber',
    prompt: 'A photorealistic portrait of a grounded steady community elder, deep mahogany skin with warm undertone, braided dark brown hair, warm brown eyes, plus size body type, woman in her 40s, wearing grounding community robes in umber and earth tones with inclusive patterns, dark headwrap accent and sienna pendant and warm arm cuffs, in a warm community gathering hall with ambient golden light, portrait framing from waist up, looking at camera with steady inclusive grounded warmth, professional portrait photography, warm ambient lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'zephyr-cream',
    prompt: 'A photorealistic portrait of a gentle inclusive community guide, light honey skin with warm undertone, long flowing golden hair, warm gold-brown eyes, slim body type, woman in her 30s, wearing an elegant welcoming dress in cream with community symbols, gold circlet and golden pendant, in an elegant welcoming space with warm soft light, portrait framing from waist up, looking at camera with gentle inclusive inviting expression, professional portrait photography, soft warm lighting, bokeh background, photorealistic, 8k',
  },
  {
    id: 'zephyr-sienna',
    prompt: 'A photorealistic portrait of a wise elder community leader, deep sienna skin with warm undertone, natural afro dark brown hair with grey highlights, warm golden-brown eyes, athletic body type, woman in her 50s or 60s, wearing powerful community robes in sienna with inclusive and protective symbols, gold crown and orange pendant and copper arm cuffs, on a warm sunset terrace with community celebration in soft focus behind, portrait framing from waist up, looking at camera with powerful warm leadership and joy, professional portrait photography, sunset golden hour lighting, bokeh background, photorealistic, 8k',
  },
];

// ============================================================================
// Expression Definitions
// ============================================================================

const EXPRESSIONS = [
  {
    emotion: 'neutral',
    modifier: 'calm relaxed gentle resting face, neutral expression, soft eyes',
  },
  {
    emotion: 'joy',
    modifier: 'genuine warm smile, raised cheeks, slight eye crinkle, joyful happy expression',
  },
  {
    emotion: 'concern',
    modifier: 'slight brow furrow, empathetic expression, gentle concern, caring look',
  },
  {
    emotion: 'curiosity',
    modifier: 'raised eyebrows, slightly wide eyes, subtle intrigued smile, curious engaged expression',
  },
  {
    emotion: 'empowerment',
    modifier: 'confident smile, strong direct gaze, lifted chin, empowered proud expression',
  },
  {
    emotion: 'calm',
    modifier: 'peaceful closed-mouth smile, very soft eyes, deeply relaxed serene features, meditative calm expression',
  },
];

// ============================================================================
// Pipeline Functions
// ============================================================================

const replicate = new Replicate({ auth: CONFIG.apiToken });

/** Rate-limit-aware wrapper around replicate.run with retry */
async function replicateRun(model, options, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await replicate.run(model, options);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(err?.message?.match(/resets in ~(\d+)s/)?.[1] || '10', 10);
        const waitSec = Math.max(retryAfter + 2, 8);
        console.log(`   ⏳ Rate limited, waiting ${waitSec}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw err;
    }
  }
}

/** Ensure output directories exist */
async function setupDirectories() {
  const dirs = [
    CONFIG.outputDir,
    `${CONFIG.outputDir}/primes`,
    `${CONFIG.outputDir}/presets`,
    `${CONFIG.outputDir}/expressions/primes`,
    `${CONFIG.outputDir}/expressions/presets`,
    `${CONFIG.outputDir}/thumbnails`,
    `${CONFIG.outputDir}/approved`,
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  console.log('✅ Output directories created');
}

/** Download an image from URL to local path */
async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
  console.log(`  💾 Saved: ${outputPath}`);
  return outputPath;
}

/** Run NSFW safety check on an image */
async function checkNSFW(imageUrl) {
  try {
    const output = await replicateRun(CONFIG.nsfwModel, {
      input: { image: imageUrl },
    });
    const nsfwScore = output?.nsfw_score ?? output?.score ?? 0;
    if (nsfwScore > 0.3) {
      console.warn(`  ⚠️  NSFW score ${nsfwScore.toFixed(3)} — REJECTED`);
      return false;
    }
    console.log(`  ✅ NSFW check passed (score: ${nsfwScore.toFixed(3)})`);
    return true;
  } catch (err) {
    console.warn(`  ⚠️  NSFW check failed (${err.message}), proceeding with caution`);
    return true; // Don't block on API errors
  }
}

/** Enhance face quality with GFPGAN */
async function enhanceFace(imageUrl) {
  try {
    const output = await replicateRun(CONFIG.faceFixModel, {
      input: { img: imageUrl, version: 'v1.4', scale: 2 },
    });
    console.log('  🎨 Face enhancement complete');
    return output;
  } catch (err) {
    console.warn(`  ⚠️  Face enhancement failed: ${err.message}`);
    return imageUrl;
  }
}

// ============================================================================
// Step 1: LoRA Training
// ============================================================================

async function trainLoRA() {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: LoRA Training on Founder Reference Photos');
  console.log('═'.repeat(60));

  // Check for existing LoRA weights
  const loraPath = `${CONFIG.outputDir}/lora-weights.safetensors`;
  if (existsSync(loraPath)) {
    console.log('⏩ LoRA weights already exist, skipping training');
    console.log(`   Path: ${loraPath}`);
    return loraPath;
  }

  // Check training data exists
  if (!existsSync(CONFIG.trainingDataDir)) {
    console.error(`\n❌ Training data directory not found: ${CONFIG.trainingDataDir}`);
    console.error('   Please create this directory and add 10-20 founder reference photos.');
    console.error('   Supported formats: .jpg, .jpeg, .png');
    console.error('\n   Example:');
    console.error('     mkdir -p training-data/founder-photos');
    console.error('     cp ~/Photos/founder-*.jpg training-data/founder-photos/');
    process.exit(1);
  }

  // Select best training images and resize to 1024x1024 (Replicate ~100MB upload limit)
  console.log('📦 Selecting and resizing training images...');
  const prepDir = `${CONFIG.outputDir}/training-prep`;
  await fs.mkdir(prepDir, { recursive: true });

  // Priority photos from the training spec
  const priorityNames = [
    'AprilG-2', 'AprilG-4', 'AprilG-9', 'IMG_0511', 'IMG_3295',
  ];

  // Get all photos, sort priority first, then by size (larger = better quality)
  const allPhotos = (await fs.readdir(CONFIG.trainingDataDir))
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

  const withStats = await Promise.all(
    allPhotos.map(async (f) => ({
      name: f,
      size: (await fs.stat(path.join(CONFIG.trainingDataDir, f))).size,
      isPriority: priorityNames.some((p) => f.startsWith(p)),
    }))
  );

  // Priority first, then largest files, cap at 25 images
  withStats.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return b.size - a.size;
  });
  const selected = withStats.slice(0, 25);
  console.log(`   Selected ${selected.length}/${allPhotos.length} best photos`);

  // Check for sips (macOS image resizer) — no extra deps needed
  let hasResize = false;
  try { execSync('which sips', { stdio: 'pipe' }); hasResize = true; } catch {}

  // Copy and resize selected images
  for (const photo of selected) {
    const src = path.join(CONFIG.trainingDataDir, photo.name);
    const dest = path.join(prepDir, photo.name);
    await fs.copyFile(src, dest);
    if (hasResize) {
      try {
        execSync(`sips -Z 1024 "${dest}" 2>/dev/null`, { stdio: 'pipe' });
      } catch {}
    }
  }

  const zipPath = `${CONFIG.outputDir}/training-data.zip`;
  // Remove old zip if exists
  try { await fs.unlink(zipPath); } catch {}
  execSync(`cd "${prepDir}" && zip -j "${path.resolve(zipPath)}" *.{jpg,jpeg,png} 2>/dev/null || true`);

  if (!existsSync(zipPath)) {
    console.error('❌ Failed to create training data zip.');
    process.exit(1);
  }

  const zipStats = await fs.stat(zipPath);
  console.log(`   Zip size: ${(zipStats.size / 1024 / 1024).toFixed(1)}MB (resized to 1024px)`);

  // Upload and train
  console.log('🚀 Starting LoRA training on Replicate...');
  console.log('   This typically takes 15-30 minutes.\n');

  // Get latest version of the trainer model
  const trainerModel = await replicate.models.get('ostris', 'flux-dev-lora-trainer');
  const trainerVersion = trainerModel.latest_version?.id;
  if (!trainerVersion) {
    console.error('❌ Could not find latest version of flux-dev-lora-trainer');
    process.exit(1);
  }
  console.log(`   Trainer version: ${trainerVersion}`);

  // Upload training images — trainer expects a URL string, not the file object
  const trainingFileObj = await replicate.files.create(await fs.readFile(zipPath));
  const trainingFileUrl = trainingFileObj?.urls?.get || trainingFileObj;
  console.log(`   Training file uploaded: ${trainingFileUrl}`);

  // Ensure destination model exists on Replicate
  const destOwner = process.env.REPLICATE_USERNAME || 'your-username';
  const destName = 'living-codex-founder-lora';
  let modelExists = false;
  try {
    await replicate.models.get(destOwner, destName);
    console.log(`   Destination model ${destOwner}/${destName} already exists`);
    modelExists = true;
  } catch (e) {
    if (e?.response?.status !== 404) {
      console.log(`   Model check returned ${e?.response?.status || 'error'}, assuming not found`);
    }
  }
  if (!modelExists) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`   Creating destination model ${destOwner}/${destName} (attempt ${attempt})...`);
        await replicate.models.create(destOwner, destName, {
          visibility: 'private',
          hardware: 'gpu-t4',
          description: 'Living Codex founder avatar LoRA',
        });
        console.log(`   ✅ Destination model created`);
        break;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 500 && attempt < 3) {
          console.log(`   ⚠️  Server error, retrying in 5s...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        if (status === 409) {
          console.log(`   Model already exists (409), proceeding`);
          break;
        }
        throw err;
      }
    }
  }

  const training = await replicate.trainings.create('ostris', 'flux-dev-lora-trainer', trainerVersion, {
    destination: `${destOwner}/${destName}`,
    input: {
      input_images: trainingFileUrl,
      trigger_word: CONFIG.triggerWord,
      autocaption: true,
      autocaption_prefix: `A photo of ${CONFIG.triggerWord}, a woman in her 30s with olive skin, green-hazel eyes, long dark wavy hair, visible tattoo sleeve on right arm`,
      ...CONFIG.trainingDefaults,
    },
  });

  console.log(`   Training ID: ${training.id}`);
  console.log(`   Status URL: https://replicate.com/trainings/${training.id}`);

  // Poll for completion
  let status = training;
  while (status.status !== 'succeeded' && status.status !== 'failed') {
    await new Promise((r) => setTimeout(r, 30000)); // Check every 30s
    status = await replicate.trainings.get(training.id);
    const elapsed = ((Date.now() - new Date(training.created_at).getTime()) / 60000).toFixed(1);
    console.log(`   [${elapsed}min] Status: ${status.status}...`);
  }

  if (status.status === 'failed') {
    console.error('❌ LoRA training failed:', status.error);
    process.exit(1);
  }

  console.log('✅ LoRA training complete!');
  console.log(`   Model: ${status.output?.version || 'check Replicate dashboard'}`);

  // Save LoRA URL for generation
  const loraUrl = status.output?.weights || status.output?.version;
  await fs.writeFile(`${CONFIG.outputDir}/lora-url.txt`, loraUrl);
  console.log(`   LoRA URL saved to: ${CONFIG.outputDir}/lora-url.txt`);

  return loraUrl;
}

// ============================================================================
// Step 2: Generate Founder Prime Portraits
// ============================================================================

async function generateFounderPrimes(loraUrl) {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 2: Generating 6 Founder Prime Portraits');
  console.log('═'.repeat(60));

  const results = [];

  for (const prime of FOUNDER_PRIMES) {
    // Skip if we already have a candidate
    const existingPath = `${CONFIG.outputDir}/primes/${prime.filename}-candidate-1.png`;
    if (existsSync(existingPath)) {
      console.log(`\n⏩ Skipping ${prime.id} (already have candidate)`);
      results.push({ ...prime, candidates: [{ path: existingPath, url: null }], selected: { path: existingPath, url: null } });
      continue;
    }
    console.log(`\n🖼️  Generating: ${prime.id} (${prime.guide})`);

    const candidates = [];
    for (let i = 0; i < CONFIG.candidatesPerPortrait; i++) {
      console.log(`   Candidate ${i + 1}/${CONFIG.candidatesPerPortrait}...`);

      try {
        // Delay between requests to respect rate limits
        if (i > 0) await new Promise((r) => setTimeout(r, 3000));
        const output = await replicateRun(CONFIG.imageModel, {
          input: {
            prompt: prime.prompt,
            negative_prompt: NEGATIVE_PROMPT,
            ...CONFIG.imageDefaults,
            ...(loraUrl ? { lora_weights: loraUrl, lora_scale: 0.85 } : {}),
          },
        });

        const imageUrl = Array.isArray(output) ? output[0] : output;

        // Safety check
        const safe = await checkNSFW(imageUrl);
        if (!safe) {
          console.log(`   Candidate ${i + 1} failed safety check, skipping`);
          continue;
        }

        // Download candidate
        const candidatePath = `${CONFIG.outputDir}/primes/${prime.filename}-candidate-${i + 1}.png`;
        await downloadImage(imageUrl, candidatePath);
        candidates.push({ path: candidatePath, url: imageUrl });
      } catch (err) {
        console.error(`   ❌ Candidate ${i + 1} failed: ${err.message}`);
      }
    }

    if (candidates.length === 0) {
      console.error(`   ❌ No valid candidates for ${prime.id}!`);
      continue;
    }

    results.push({
      ...prime,
      candidates,
      // Auto-select first candidate; manual review recommended
      selected: candidates[0],
    });

    console.log(`   ✅ ${candidates.length} candidates generated for ${prime.id}`);
  }

  // Save manifest
  await fs.writeFile(
    `${CONFIG.outputDir}/primes/manifest.json`,
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✅ Founder Primes complete: ${results.length}/6 guides`);
  console.log('   📋 Review candidates in generated-avatars/primes/');
  console.log('   Select the best candidate for each guide before proceeding.');

  return results;
}

// ============================================================================
// Step 3: Generate Diverse Preset Portraits
// ============================================================================

async function generateDiversePresets() {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 3: Generating 24 Diverse Preset Portraits');
  console.log('═'.repeat(60));

  const results = [];

  for (const preset of DIVERSE_PRESETS) {
    const existingPreset = `${CONFIG.outputDir}/presets/${preset.id}-candidate-1.png`;
    if (existsSync(existingPreset)) {
      console.log(`\n⏩ Skipping ${preset.id} (already have candidate)`);
      results.push({ ...preset, candidates: [{ path: existingPreset, url: null }], selected: { path: existingPreset, url: null } });
      continue;
    }
    console.log(`\n🖼️  Generating: ${preset.id}`);

    const candidates = [];
    for (let i = 0; i < CONFIG.candidatesPerPortrait; i++) {
      console.log(`   Candidate ${i + 1}/${CONFIG.candidatesPerPortrait}...`);

      try {
        if (i > 0) await new Promise((r) => setTimeout(r, 3000));
        const output = await replicateRun(CONFIG.imageModel, {
          input: {
            prompt: preset.prompt,
            negative_prompt: NEGATIVE_PROMPT,
            ...CONFIG.imageDefaults,
          },
        });

        const imageUrl = Array.isArray(output) ? output[0] : output;

        const safe = await checkNSFW(imageUrl);
        if (!safe) continue;

        const candidatePath = `${CONFIG.outputDir}/presets/${preset.id}-candidate-${i + 1}.png`;
        await downloadImage(imageUrl, candidatePath);
        candidates.push({ path: candidatePath, url: imageUrl });
      } catch (err) {
        console.error(`   ❌ Candidate ${i + 1} failed: ${err.message}`);
      }
    }

    if (candidates.length > 0) {
      results.push({ ...preset, candidates, selected: candidates[0] });
      console.log(`   ✅ ${candidates.length} candidates for ${preset.id}`);
    } else {
      console.error(`   ❌ No valid candidates for ${preset.id}!`);
    }
  }

  await fs.writeFile(
    `${CONFIG.outputDir}/presets/manifest.json`,
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✅ Diverse Presets complete: ${results.length}/24`);
  return results;
}

// ============================================================================
// Step 4: Generate Expression Sheets
// ============================================================================

async function generateExpressions(primeResults, presetResults) {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 4: Generating Expression Sheets');
  console.log('═'.repeat(60));

  const allCharacters = [
    ...primeResults.map((p) => ({
      id: p.id,
      basePrompt: p.prompt,
      selectedUrl: p.selected?.url,
      outputDir: `${CONFIG.outputDir}/expressions/primes`,
    })),
    ...presetResults.map((p) => ({
      id: p.id,
      basePrompt: p.prompt,
      selectedUrl: p.selected?.url,
      outputDir: `${CONFIG.outputDir}/expressions/presets`,
    })),
  ];

  let completed = 0;
  const total = allCharacters.length * EXPRESSIONS.length;

  for (const char of allCharacters) {
    if (!char.selectedUrl) {
      console.log(`⏩ Skipping expressions for ${char.id} (no base image)`);
      continue;
    }

    console.log(`\n😊 Generating expressions for: ${char.id}`);

    for (const expr of EXPRESSIONS) {
      console.log(`   ${expr.emotion}...`);

      try {
        // Use img2img from the base portrait to maintain identity
        const expressionPrompt = char.basePrompt
          .replace(
            /looking at camera with .+? expression/,
            `looking at camera with ${expr.modifier}`
          )
          .replace(
            /portrait framing from waist up/,
            'close-up face portrait, head and shoulders'
          );

        await new Promise((r) => setTimeout(r, 3000));
        const output = await replicateRun(CONFIG.imageModel, {
          input: {
            prompt: expressionPrompt,
            negative_prompt: NEGATIVE_PROMPT,
            width: 512,
            height: 512,
            num_inference_steps: 40,
            guidance_scale: 7.0,
            // If the model supports img2img:
            // image: char.selectedUrl,
            // prompt_strength: CONFIG.expressionStrength,
          },
        });

        const imageUrl = Array.isArray(output) ? output[0] : output;
        const exprPath = `${char.outputDir}/${char.id}-expr-${expr.emotion}.png`;
        await downloadImage(imageUrl, exprPath);
        completed++;
      } catch (err) {
        console.error(`   ❌ ${expr.emotion} failed: ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Expressions complete: ${completed}/${total}`);
}

// ============================================================================
// Step 5: Post-Processing
// ============================================================================

async function postProcess() {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 5: Post-Processing');
  console.log('═'.repeat(60));

  // Generate thumbnails for all selected portraits
  console.log('\n📐 Generating thumbnails (256×256)...');

  const portraitDirs = [`${CONFIG.outputDir}/primes`, `${CONFIG.outputDir}/presets`];

  for (const dir of portraitDirs) {
    if (!existsSync(dir)) continue;
    const files = await fs.readdir(dir);
    const selectedFiles = files.filter((f) => f.includes('candidate-1') && f.endsWith('.png'));

    for (const file of selectedFiles) {
      const inputPath = path.join(dir, file);
      const thumbName = file.replace('-candidate-1', '-thumb');
      const thumbPath = `${CONFIG.outputDir}/thumbnails/${thumbName}`;

      try {
        // Use ImageMagick if available, otherwise skip
        execSync(`convert "${inputPath}" -resize 256x256 "${thumbPath}" 2>/dev/null`);
        console.log(`  📐 ${thumbName}`);
      } catch {
        console.log(`  ⚠️  ImageMagick not available for thumbnails. Install with: sudo apt install imagemagick`);
        break;
      }
    }
  }

  console.log('\n✅ Post-processing complete');
}

// ============================================================================
// Step 6: Deploy to public/assets
// ============================================================================

async function deploy() {
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 6: Deploy Assets');
  console.log('═'.repeat(60));

  console.log('\n⚠️  MANUAL STEP REQUIRED:');
  console.log('   1. Review all candidates in generated-avatars/');
  console.log('   2. For each character, rename your preferred candidate:');
  console.log('      mv generated-avatars/primes/portrait-kore-candidate-2.png \\');
  console.log('         public/assets/avatars/kore-prime/portrait-kore.png');
  console.log('   3. Generate final thumbnails');
  console.log('   4. Run: npm run build');
  console.log('\n   Or run this script with --auto-deploy to use candidate-1 for all.\n');

  if (process.argv.includes('--auto-deploy')) {
    console.log('🚀 Auto-deploying candidate-1 for all characters...');

    // Create deploy directories
    await fs.mkdir(`${CONFIG.deployDir}/kore-prime`, { recursive: true });
    await fs.mkdir(`${CONFIG.deployDir}/kore-prime/expressions`, { recursive: true });
    await fs.mkdir(`${CONFIG.deployDir}/presets`, { recursive: true });
    await fs.mkdir(`${CONFIG.deployDir}/presets/expressions`, { recursive: true });

    // Copy Founder Primes
    for (const prime of FOUNDER_PRIMES) {
      const src = `${CONFIG.outputDir}/primes/${prime.filename}-candidate-1.png`;
      const dest = `${CONFIG.deployDir}/kore-prime/${prime.filename}.png`;
      if (existsSync(src)) {
        await fs.copyFile(src, dest);
        console.log(`  📁 ${prime.filename}.png → kore-prime/`);
      }
    }

    // Copy Presets
    for (const preset of DIVERSE_PRESETS) {
      const src = `${CONFIG.outputDir}/presets/${preset.id}-candidate-1.png`;
      const dest = `${CONFIG.deployDir}/presets/${preset.id}.png`;
      if (existsSync(src)) {
        await fs.copyFile(src, dest);
        console.log(`  📁 ${preset.id}.png → presets/`);
      }
    }

    console.log('\n✅ Auto-deploy complete');
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Living Codex™ Avatar Asset Generation Pipeline       ║');
  console.log('║   Replicate API — FLUX + LoRA                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (!CONFIG.apiToken) {
    console.error('❌ REPLICATE_API_TOKEN not set!');
    console.error('   Get your token at: https://replicate.com/account/api-tokens');
    console.error('   Then: export REPLICATE_API_TOKEN="r8_your_token_here"');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const skipTraining = args.includes('--skip-training');
  const onlyPrimes = args.includes('--only-primes');
  const onlyPresets = args.includes('--only-presets');
  const onlyExpressions = args.includes('--only-expressions');
  const runAll = !onlyPrimes && !onlyPresets && !onlyExpressions;

  await setupDirectories();

  // Step 1: Train LoRA (unless skipped)
  let loraUrl;
  if (!skipTraining && (runAll || onlyPrimes)) {
    loraUrl = await trainLoRA();
  } else {
    // Try to load existing LoRA URL
    const loraUrlPath = `${CONFIG.outputDir}/lora-url.txt`;
    if (existsSync(loraUrlPath)) {
      loraUrl = (await fs.readFile(loraUrlPath, 'utf-8')).trim();
      console.log(`📋 Using existing LoRA: ${loraUrl}`);
    } else if (runAll || onlyPrimes) {
      console.warn('⚠️  No LoRA URL found — generating founder primes without LoRA (no likeness match)');
      console.warn('   Retry LoRA training later when Replicate API is stable.');
    }
  }

  // Step 2: Founder Primes
  let primeResults = [];
  if (runAll || onlyPrimes) {
    primeResults = await generateFounderPrimes(loraUrl);
  }

  // Step 3: Diverse Presets
  let presetResults = [];
  if (runAll || onlyPresets) {
    presetResults = await generateDiversePresets();
  }

  // Step 4: Expression Sheets
  if (runAll || onlyExpressions) {
    // Load results from manifests if running expressions only
    if (onlyExpressions) {
      try {
        primeResults = JSON.parse(await fs.readFile(`${CONFIG.outputDir}/primes/manifest.json`, 'utf-8'));
        presetResults = JSON.parse(await fs.readFile(`${CONFIG.outputDir}/presets/manifest.json`, 'utf-8'));
      } catch {
        console.error('❌ Run portrait generation first before generating expressions.');
        process.exit(1);
      }
    }
    await generateExpressions(primeResults, presetResults);
  }

  // Step 5: Post-process
  if (runAll) {
    await postProcess();
  }

  // Step 6: Deploy
  await deploy();

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Pipeline complete!');
  console.log('═'.repeat(60));
  console.log(`\nOutput: ${CONFIG.outputDir}/`);
  console.log('Next steps:');
  console.log('  1. Review candidates in generated-avatars/');
  console.log('  2. Select best candidates for each character');
  console.log('  3. Run with --auto-deploy or manually copy to public/assets/avatars/');
  console.log('  4. npm run build && pm2 restart living-codex');
}

main().catch((err) => {
  console.error('\n💥 Pipeline error:', err);
  process.exit(1);
});
