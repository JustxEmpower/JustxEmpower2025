# Living Codex™ Avatar Training Specification

## LoRA Training + Asset Generation Pipeline via Replicate

**Last Updated:** 2026-03-20
**System:** Living Codex™ Holographic Avatar System
**Target:** 6 Founder Prime portraits, 24 diverse preset portraits, expression sheets, viseme sheets

---

## Table of Contents

1. [Overview](#overview)
2. [LoRA Training (Founder Likeness)](#lora-training)
3. [Founder Prime Portraits (6 images)](#founder-prime-portraits)
4. [Diverse Preset Portraits (24 images)](#diverse-preset-portraits)
5. [Expression Sheets](#expression-sheets)
6. [Viseme Sheets](#viseme-sheets)
7. [Asset Directory Structure](#asset-directory-structure)
8. [Image Specifications](#image-specifications)
9. [Safety & Content Guidelines](#safety-guidelines)
10. [Replicate API Reference](#replicate-api-reference)

---

## 1. Overview <a name="overview"></a>

The Living Codex avatar system renders photorealistic 3D humanoid guides using Three.js. Each guide needs:

| Asset Type | Count | Purpose |
|---|---|---|
| Founder Prime portraits | 6 | LoRA-generated founder in each guide's outfit/setting |
| Diverse preset portraits | 24 | 4 unique characters per guide (base SDXL, no LoRA) |
| Expression sheets | 30 | 6 emotions × (6 Primes + 24 presets) = 30 unique sheets |
| Viseme sheets | 30 | 15 mouth positions per character for lip-sync |

**Total images to generate:** ~180 individual assets

### Guides

| Guide | Role | Energy | Color Palette |
|---|---|---|---|
| **Kore** | Orientation Guide | Wise counselor | Gold, cream, warm earth |
| **Aoede** | Archetype Reflection | Creative artist | Violet, indigo, moonstone |
| **Leda** | Journal Companion | Nurturing companion | Rose, blush, soft pink |
| **Theia** | NS Support | Grounded healer | Emerald, jade, forest green |
| **Selene** | Resource Librarian | Scholarly wisdom | Sapphire, navy, pearl |
| **Zephyr** | Community Concierge | Warm connector | Coral, orange, sunset warm |

---

## 2. LoRA Training (Founder Likeness) <a name="lora-training"></a>

### Prerequisites

You need **10-20 high-quality reference photos** of the founder with:
- Multiple angles (front, 3/4 left, 3/4 right, profile)
- Multiple lighting conditions (natural, studio, warm, cool)
- Consistent recent appearance
- Clear visibility of: face, tattoo sleeve (right arm), body type
- Resolution: minimum 1024×1024 crop of face/upper body

### LoRA Training Configuration

**Model:** `ostris/flux-dev-lora-trainer` on Replicate
**Base model:** FLUX.1-dev (preferred) or SDXL 1.0

```json
{
  "input": {
    "input_images": "<zip of 10-20 founder photos>",
    "trigger_word": "LIVINGCODEX_FOUNDER",
    "autocaption": true,
    "autocaption_prefix": "A photo of LIVINGCODEX_FOUNDER, a woman in her 30s with olive-tan skin, hazel-green eyes, long blonde honey-blonde hair, visible colorful full sleeve tattoo on right arm, athletic-curvy body type",
    "steps": 1200,
    "learning_rate": 0.0004,
    "batch_size": 1,
    "resolution": "1024",
    "lora_rank": 32,
    "optimizer": "adamw8bit",
    "caption_dropout_rate": 0.05
  }
}
```

### Training Tips

- **Trigger word:** `LIVINGCODEX_FOUNDER` — used in every prompt to activate the LoRA
- **LoRA rank 32** balances quality vs. flexibility (rank 16 if you want more style freedom)
- **1200 steps** is the sweet spot for 10-20 images; reduce to 800 for 20+ images
- **Caption dropout 5%** prevents overfitting to specific captions
- After training, the LoRA weights file (~50-150MB) is used for all 6 Founder Prime generations

### Validation

After training, generate 3 test images with varied prompts to check:
- [ ] Face likeness accuracy (should be clearly recognizable)
- [ ] Tattoo sleeve renders on right arm
- [ ] Green-hazel eye color preserved
- [ ] Dark wavy hair texture correct
- [ ] Olive skin tone accurate
- [ ] Body type consistent (athletic-curvy)

---

## 3. Founder Prime Portraits (6 images) <a name="founder-prime-portraits"></a>

All Founder Primes share the same base appearance (LoRA-activated) but differ in outfit, setting, and accessories per guide role.

### Shared Base Prompt Elements

```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair, visible full sleeve tattoo on right arm,
athletic-curvy body type, small gold nose ring, gold feather earrings,
```

### Per-Guide Prompts

#### Kore Prime — Orientation Guide
**Output:** `portrait-kore.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair, visible full sleeve tattoo on right arm,
athletic-curvy body type, small gold nose ring, gold feather earrings,
wearing flowing golden-cream sacred robes with intricate embroidery,
gold circlet crown on head, tattoo sleeve visible through sheer fabric on right arm,
layered gold necklaces, gold arm cuffs over tattoo sleeve,
standing in a warm sacred temple space with soft golden light,
portrait framing from waist up, looking directly at camera with wise gentle expression,
professional portrait photography, soft studio lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```
**Negative:** `cartoon, anime, illustration, painting, deformed, ugly, duplicate, morbid, nsfw, nudity, revealing clothing, childlike`

#### Aoede Prime — Archetype Reflection
**Output:** `portrait-aoede.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair, visible full sleeve tattoo on right arm,
athletic-curvy body type, small gold nose ring, gold feather earrings,
wearing a deep violet artistic draped dress with asymmetric neckline,
silver moonstone pendant necklace, tattoo sleeve visible,
standing in a creative studio space with mirrors and soft purple-violet lighting,
portrait framing from waist up, looking at camera with creative inspired expression,
professional portrait photography, soft studio lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```

#### Leda Prime — Journal Companion
**Output:** `portrait-leda.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair pulled softly to one side, visible full sleeve tattoo on right arm,
athletic-curvy body type, small gold nose ring, gold feather earrings,
wearing a soft rose-blush flowing blouse with gathered neckline,
delicate gold layered necklaces, holding an ornate leather journal,
sitting in a warm garden alcove with climbing roses and soft natural light,
portrait framing from waist up, looking at camera with warm compassionate expression,
professional portrait photography, golden hour lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```

#### Theia Prime — NS Support
**Output:** `portrait-theia.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair in loose waves, visible full sleeve tattoo on right arm,
athletic-curvy body type, small gold nose ring, gold feather earrings,
wearing an emerald green fitted sacred warrior tunic with gold arm cuffs,
geometric shoulder detail, minimal gold jewelry,
standing among ancient mossy stones in a misty forest clearing,
portrait framing from waist up, looking at camera with grounded healing expression,
professional portrait photography, soft diffused forest light, bokeh background,
photorealistic, 8k, detailed skin texture
```

#### Selene Prime — Resource Librarian
**Output:** `portrait-selene.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
dark wavy brown hair in a sophisticated low bun, visible tattoo sleeve at wrist cuff,
athletic-curvy body type, small gold nose ring, gold earrings,
wearing an elegant sapphire blue fitted blazer-dress with pearl brooch,
structured shoulders, reading glasses pushed up on head,
standing in a grand library with floor-to-ceiling bookshelves and warm lamp light,
portrait framing from waist up, looking at camera with scholarly knowing expression,
professional portrait photography, warm library lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```

#### Zephyr Prime — Community Concierge
**Output:** `portrait-zephyr.png`
```
LIVINGCODEX_FOUNDER, a woman in her 30s, olive skin tone, green-hazel eyes,
long dark wavy brown hair with natural movement, both arm tattoos clearly visible,
athletic-curvy body type, small gold nose ring, gold feather earrings,
wearing a warm coral-orange modern wrap top with flowing wide-leg pants,
layered bracelets on both wrists, welcoming open posture,
standing on a sunset terrace with warm city skyline behind,
portrait framing from waist up, looking at camera with warm welcoming expression,
professional portrait photography, golden hour sunset lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```

### Generation Parameters (Founder Primes)

```json
{
  "model": "black-forest-labs/flux-1.1-pro",
  "input": {
    "prompt": "<guide-specific prompt above>",
    "negative_prompt": "cartoon, anime, illustration, painting, deformed, ugly, duplicate, morbid, nsfw, nudity, revealing clothing, childlike, extra limbs, bad anatomy",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 50,
    "guidance_scale": 7.5,
    "lora_weights": "<your-trained-lora-url>",
    "lora_scale": 0.85,
    "seed": -1,
    "num_outputs": 4
  }
}
```

Generate 4 candidates per guide and manually select the best one.

---

## 4. Diverse Preset Portraits (24 images) <a name="diverse-preset-portraits"></a>

These are **unique characters** — no LoRA needed. Use base FLUX or SDXL with detailed prompts.

### Prompt Template

```
A photorealistic portrait of [DESCRIPTION], [SKIN_TONE] skin,
[HAIR_STYLE] [HAIR_COLOR] hair, [EYE_COLOR] eyes, [BODY_TYPE] body type,
woman in her [AGE_RANGE], wearing [OUTFIT_DESCRIPTION],
[SACRED_ACCESSORIES], [SETTING],
portrait framing from waist up, looking at camera with [EXPRESSION],
professional portrait photography, soft studio lighting, bokeh background,
photorealistic, 8k, detailed skin texture
```

### Complete Preset Matrix

| Preset ID | Guide | Skin | Hair | Body | Age | Key Outfit |
|---|---|---|---|---|---|---|
| kore-amber | Kore | Amber/medium | Loose curls, brown | Athletic | 30s | Tailored linen dress, draped shawl |
| kore-obsidian | Kore | Obsidian/very dark | Natural coils, black | Curvy | 40s | Structured wrap, geometric patterns |
| kore-pearl | Kore | Pearl/fair cool | Straight, rose-blonde | Slim | 20s | Ethereal shimmer gown |
| kore-sage | Kore | Sage/medium neutral | Wavy, auburn | Plus size | 50+ | Layered earth-toned textiles |
| aoede-indigo | Aoede | Obsidian/very dark | Locs, indigo | Slim | 20s | Celestial robes, cosmic patterns |
| aoede-copper | Aoede | Copper/medium-deep | Braids, auburn | Athletic | 30s | Artisan wrap, clay tones |
| aoede-ivory | Aoede | Ivory/fair warm | Long flowing, blonde | Curvy | 40s | Silk robes cream and gold |
| aoede-midnight | Aoede | Ebony/darkest | Afro, black | Plus size | 50+ | Sacred robes, metallic gold |
| leda-rose | Leda | Honey/light warm | Wavy, golden | Curvy | 30s | Flowing robes rose and cream |
| leda-mahogany | Leda | Mahogany/deep warm | Cornrows, dark brown | Plus size | 40s | Warm layered wraps, natural fiber |
| leda-honey | Leda | Honey/light warm | Loose curls, caramel | Athletic | 20s | Elegant modern dress, warm tones |
| leda-willow | Leda | Sage/medium neutral | Long flowing, olive | Slim | 50+ | Flowing sage and cream robes |
| theia-jade | Theia | Sienna/deep warm | Braids, brown | Curvy | 40s | Healing robes, jade tones |
| theia-garnet | Theia | Obsidian/very dark | Natural coils, black | Athletic | 30s | Sacred healing garments, red+gold |
| theia-silver | Theia | Pearl/fair cool | Straight, silver | Slim | 20s | Cool-toned robes, silver+blue |
| theia-bronze | Theia | Bronze/medium-deep | Locs, dark brown | Plus size | 50+ | Grounding robes, bronze tones |
| selene-sapphire | Selene | Obsidian/very dark | Long flowing, black | Slim | 20s | Professional scholarly, sapphire+gold |
| selene-ebony | Selene | Ebony/darkest | Natural coils, black | Athletic | 40s | Powerful robes, black+gold |
| selene-opal | Selene | Ivory/fair warm | Wavy, sandy blonde | Curvy | 30s | Elegant scholarly, cream+iridescent |
| selene-teak | Selene | Teak/very deep | Cornrows, very dark | Plus size | 50+ | Richly textured, deep wood tones |
| zephyr-coral | Zephyr | Copper/medium-deep | Loose curls, auburn | Curvy | 20s | Warm flowing coral and gold |
| zephyr-umber | Zephyr | Mahogany/deep warm | Braids, dark brown | Plus size | 40s | Community robes, umber+earth |
| zephyr-cream | Zephyr | Honey/light warm | Long flowing, golden | Slim | 30s | Elegant welcoming cream dress |
| zephyr-sienna | Zephyr | Sienna/deep warm | Afro, dark brown | Athletic | 50+ | Powerful sienna community robes |

### Generation Parameters (Presets)

```json
{
  "model": "black-forest-labs/flux-1.1-pro",
  "input": {
    "prompt": "<preset-specific prompt>",
    "negative_prompt": "cartoon, anime, illustration, painting, deformed, ugly, duplicate, morbid, nsfw, nudity, revealing clothing, childlike, extra limbs, bad anatomy, sexualized",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 50,
    "guidance_scale": 7.5,
    "seed": -1,
    "num_outputs": 4
  }
}
```

---

## 5. Expression Sheets <a name="expression-sheets"></a>

Each character needs a **6-panel expression sheet** with consistent appearance across emotions.

### Emotions (matching `EXPRESSION_CONFIGS` in AvatarSystem.ts)

| Emotion | Facial Description | Use Case |
|---|---|---|
| **neutral** | Calm, relaxed, gentle resting face | Default idle state |
| **joy** | Genuine warm smile, raised cheeks, slight eye crinkle | Positive interactions, celebrations |
| **concern** | Slight brow furrow, empathetic downward mouth | Empathetic response to user distress |
| **curiosity** | Raised eyebrows, slightly wide eyes, subtle smile | Active listening, asking questions |
| **empowerment** | Confident smile, strong gaze, lifted chin | Encouraging/affirming moments |
| **calm** | Peaceful closed-mouth smile, soft eyes, relaxed features | Meditation, grounding exercises |

### Expression Sheet Prompt Template

```
A 2x3 grid expression sheet of [CHARACTER DESCRIPTION],
showing six emotions in separate panels: neutral, joy, concern, curiosity, empowerment, calm,
consistent appearance across all panels, same lighting and framing,
close-up face portrait, white background between panels,
photorealistic, 8k, professional headshot quality
```

### Generation Approach

**Option A (Recommended): Individual images with img2img**
1. Generate one "neutral" portrait per character
2. Use img2img with expression-specific prompts at 0.3-0.4 strength
3. This preserves identity consistency across emotions

**Option B: Grid generation**
1. Generate a single 2×3 grid image
2. Split into 6 individual expression files
3. Less consistent but faster

### Output Files

Per character, 6 images:
```
{preset-id}-expr-neutral.png
{preset-id}-expr-joy.png
{preset-id}-expr-concern.png
{preset-id}-expr-curiosity.png
{preset-id}-expr-empowerment.png
{preset-id}-expr-calm.png
```

---

## 6. Viseme Sheets <a name="viseme-sheets"></a>

For lip-sync, each character needs mouth position references matching the `VisemeConfig` in AvatarSystem.ts.

### Viseme Positions (15 standard visemes)

| Viseme | Phoneme | Mouth Shape |
|---|---|---|
| `sil` | Silence | Mouth closed, neutral |
| `PP` | p, b, m | Lips pressed together |
| `FF` | f, v | Lower lip under upper teeth |
| `TH` | th | Tongue between teeth |
| `DD` | t, d, n | Tongue behind upper teeth |
| `kk` | k, g | Back of tongue raised |
| `CH` | ch, j, sh | Lips slightly rounded, teeth close |
| `SS` | s, z | Teeth close together, slight smile |
| `nn` | n, l | Tongue tip up, mouth slightly open |
| `RR` | r | Lips slightly rounded |
| `aa` | a (as in "father") | Mouth wide open |
| `E` | e (as in "bed") | Mouth medium open, wide |
| `I` | i (as in "see") | Mouth slightly open, wide |
| `O` | o (as in "go") | Lips rounded, medium open |
| `U` | u (as in "you") | Lips tightly rounded |

### Generation Approach

**Recommended: Procedural generation in the renderer**

The current `RealisticAvatarRenderer.tsx` already handles visemes procedurally via morph targets (`jawOpen`, `lipWidth`, `lipRound`, `tongueUp`). Texture-based viseme sheets are **optional** and only needed if you want to add extra realism to the lip region.

If generating texture visemes:
- Use img2img from the neutral portrait at 0.2-0.3 strength
- Focus region: lower face only
- Generate as a **4×4 sprite sheet** (1024×1024 with 256×256 cells)

### Output Files (Optional)

```
{preset-id}-visemes.png  (4×4 sprite sheet)
```

---

## 7. Asset Directory Structure <a name="asset-directory-structure"></a>

```
public/assets/avatars/
├── kore-prime/
│   ├── portrait-kore.png          # Founder as Kore
│   ├── portrait-aoede.png         # Founder as Aoede
│   ├── portrait-leda.png          # Founder as Leda
│   ├── portrait-theia.png         # Founder as Theia
│   ├── portrait-selene.png        # Founder as Selene
│   ├── portrait-zephyr.png        # Founder as Zephyr
│   ├── portrait-kore-thumb.png    # 256×256 thumbnail
│   ├── portrait-aoede-thumb.png
│   ├── portrait-leda-thumb.png
│   ├── portrait-theia-thumb.png
│   ├── portrait-selene-thumb.png
│   ├── portrait-zephyr-thumb.png
│   └── expressions/
│       ├── kore-prime-expr-neutral.png
│       ├── kore-prime-expr-joy.png
│       ├── kore-prime-expr-concern.png
│       ├── kore-prime-expr-curiosity.png
│       ├── kore-prime-expr-empowerment.png
│       ├── kore-prime-expr-calm.png
│       ├── aoede-prime-expr-neutral.png
│       └── ... (6 emotions × 6 primes = 36 files)
├── presets/
│   ├── kore-amber.png
│   ├── kore-amber-thumb.png
│   ├── kore-obsidian.png
│   ├── kore-obsidian-thumb.png
│   ├── ... (24 presets × 2 sizes = 48 files)
│   └── expressions/
│       ├── kore-amber-expr-neutral.png
│       ├── kore-amber-expr-joy.png
│       └── ... (6 emotions × 24 presets = 144 files)
└── visemes/ (optional)
    ├── kore-prime-visemes.png
    └── ... (30 sprite sheets)
```

---

## 8. Image Specifications <a name="image-specifications"></a>

| Asset Type | Resolution | Format | Color Space |
|---|---|---|---|
| Portrait (full) | 1024×1024 | PNG | sRGB |
| Portrait (thumbnail) | 256×256 | PNG | sRGB |
| Expression image | 512×512 | PNG | sRGB |
| Viseme sprite sheet | 1024×1024 (4×4 grid) | PNG | sRGB |

### Post-Processing Pipeline

For each generated portrait:
1. **Select best** from 4 candidates
2. **Face-fix** with GFPGAN or CodeFormer if needed (Replicate: `tencentarc/gfpgan`)
3. **Upscale** to 1024×1024 if generated smaller (Replicate: `nightmareai/real-esrgan`)
4. **Generate thumbnail** at 256×256 with sharp downscale
5. **Optimize** with `pngquant` or `optipng` (target < 500KB per portrait)

---

## 9. Safety & Content Guidelines <a name="safety-guidelines"></a>

**MANDATORY for all generated images:**

- ✅ All avatars fully clothed in dignified, professional attire
- ✅ Age-appropriate appearance (adult women only, never childlike)
- ✅ Respectful, empowering representation of all body types
- ✅ Accurate, non-stereotypical depictions of diverse ethnicities
- ✅ Natural, non-sexualized poses (portrait framing, waist-up)
- ❌ No nudity, revealing clothing, or sexualized content
- ❌ No violent, distressing, or degrading imagery
- ❌ No stereotypical or caricatured ethnic features
- ❌ No childlike features on adult bodies

### Review Checklist

Before deploying any generated image:
- [ ] Character is clearly an adult woman
- [ ] Clothing is appropriate and dignified
- [ ] Skin tone matches the specified palette accurately
- [ ] No anatomical distortions or uncanny valley artifacts
- [ ] Expression is warm, professional, and empowering
- [ ] Cultural elements (if present) are respectful and accurate
- [ ] Image passes automated NSFW detection (use Replicate `nsfw_image_detection`)

---

## 10. Replicate API Reference <a name="replicate-api-reference"></a>

### Models Used

| Task | Model | Approx Cost |
|---|---|---|
| LoRA Training | `ostris/flux-dev-lora-trainer` | $3-8 per training run |
| Image Generation (LoRA) | `black-forest-labs/flux-1.1-pro` + LoRA | $0.05 per image |
| Image Generation (base) | `black-forest-labs/flux-1.1-pro` | $0.05 per image |
| Face Enhancement | `tencentarc/gfpgan` | $0.002 per image |
| Upscaling | `nightmareai/real-esrgan` | $0.01 per image |
| NSFW Check | `andreasjansson/nsfw_image_detection` | $0.002 per image |

### Estimated Total Cost

```
LoRA training:           1 run × $5        = $5.00
Founder Primes:          6 × 4 candidates  = 24 images × $0.05 = $1.20
Diverse Presets:         24 × 4 candidates = 96 images × $0.05 = $4.80
Expression sheets:       30 × 6 emotions   = 180 images × $0.05 = $9.00
Face enhancement:        ~60 selected      = 60 × $0.002 = $0.12
NSFW safety check:       ~60 final images  = 60 × $0.002 = $0.12
────────────────────────────────────────────────────────
ESTIMATED TOTAL:                                         ~$20-25
```

### API Key Setup

```bash
export REPLICATE_API_TOKEN="r8_your_token_here"
```

Get your token at: https://replicate.com/account/api-tokens

---

## Quick Start

```bash
# 1. Set your API token
export REPLICATE_API_TOKEN="r8_..."

# 2. Prepare founder photos (10-20 images in a folder)
# Place photos in: training-data/founder-photos/

# 3. Run the pipeline
node scripts/replicate-avatar-pipeline.mjs

# 4. Review generated images in: generated-avatars/
# 5. Copy approved images to: public/assets/avatars/
```

See `scripts/replicate-avatar-pipeline.mjs` for the complete automated pipeline.
