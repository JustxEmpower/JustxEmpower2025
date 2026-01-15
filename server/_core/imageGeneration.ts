/**
 * Image Generation & Analysis - Enhanced
 *
 * Provides AI-powered image capabilities using Google Gemini:
 * - Image analysis and description
 * - Content moderation
 * - Object detection
 * - Text extraction (OCR)
 * - Placeholder image generation
 *
 * Example usage:
 *   const description = await analyzeImage("https://example.com/image.jpg");
 *   const isAppropriate = await moderateImage(imageBuffer);
 *   const text = await extractText("https://example.com/document.jpg");
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// Types
// ============================================================================

export type GenerateImageOptions = {
  prompt: string;
  width?: number;
  height?: number;
  style?: "photo" | "illustration" | "abstract" | "minimal";
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
  placeholder?: string;
};

export type ImageAnalysisResult = {
  description: string;
  tags: string[];
  colors: string[];
  objects: string[];
  text?: string;
  isAppropriate: boolean;
  confidence: number;
};

// ============================================================================
// Gemini Client
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[ImageAI] GEMINI_API_KEY not configured");
    return null;
  }
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

// ============================================================================
// Image Analysis (Gemini Vision)
// ============================================================================

/**
 * Analyze an image using Gemini Vision AI
 * 
 * @param imageSource - URL or base64 image data
 * @param mimeType - Image MIME type (default: image/jpeg)
 * @returns Detailed image analysis
 */
export async function analyzeImage(
  imageSource: string,
  mimeType: string = "image/jpeg"
): Promise<ImageAnalysisResult | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare image data
    let imageData: { inlineData: { data: string; mimeType: string } };
    
    if (imageSource.startsWith("http")) {
      // Fetch image from URL
      const response = await fetch(imageSource);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageData = { inlineData: { data: base64, mimeType } };
    } else {
      // Assume base64
      imageData = { inlineData: { data: imageSource, mimeType } };
    }

    const prompt = `Analyze this image and provide:
1. A detailed description (2-3 sentences)
2. Tags (5-10 relevant keywords)
3. Dominant colors (3-5 colors)
4. Objects detected (list main objects)
5. Any text visible in the image
6. Is this image appropriate for a wellness/empowerment website? (yes/no)
7. Confidence score (0-100)

Format as JSON:
{
  "description": "...",
  "tags": ["tag1", "tag2"],
  "colors": ["color1", "color2"],
  "objects": ["object1", "object2"],
  "text": "any visible text or null",
  "isAppropriate": true/false,
  "confidence": 85
}`;

    const result = await model.generateContent([prompt, imageData]);
    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || "",
        tags: parsed.tags || [],
        colors: parsed.colors || [],
        objects: parsed.objects || [],
        text: parsed.text || undefined,
        isAppropriate: parsed.isAppropriate ?? true,
        confidence: parsed.confidence || 50,
      };
    }
    
    return null;
  } catch (error) {
    console.error("[ImageAI] Analysis error:", error);
    return null;
  }
}

/**
 * Check if an image is appropriate for the website
 * 
 * @param imageSource - URL or base64 image data
 * @returns true if appropriate, false if flagged
 */
export async function moderateImage(
  imageSource: string,
  mimeType: string = "image/jpeg"
): Promise<boolean> {
  const analysis = await analyzeImage(imageSource, mimeType);
  return analysis?.isAppropriate ?? true;
}

/**
 * Extract text from an image (OCR)
 * 
 * @param imageSource - URL or base64 image data
 * @returns Extracted text or null
 */
export async function extractText(
  imageSource: string,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    let imageData: { inlineData: { data: string; mimeType: string } };
    
    if (imageSource.startsWith("http")) {
      const response = await fetch(imageSource);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageData = { inlineData: { data: base64, mimeType } };
    } else {
      imageData = { inlineData: { data: imageSource, mimeType } };
    }

    const result = await model.generateContent([
      "Extract all visible text from this image. Return only the text, preserving formatting where possible. If no text is visible, respond with 'NO_TEXT_FOUND'.",
      imageData,
    ]);
    
    const text = result.response.text().trim();
    return text === "NO_TEXT_FOUND" ? null : text;
  } catch (error) {
    console.error("[ImageAI] OCR error:", error);
    return null;
  }
}

/**
 * Generate alt text for an image (accessibility)
 * 
 * @param imageSource - URL or base64 image data
 * @returns Concise alt text for screen readers
 */
export async function generateAltText(
  imageSource: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const client = getGeminiClient();
  if (!client) return "Image";

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    let imageData: { inlineData: { data: string; mimeType: string } };
    
    if (imageSource.startsWith("http")) {
      const response = await fetch(imageSource);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageData = { inlineData: { data: base64, mimeType } };
    } else {
      imageData = { inlineData: { data: imageSource, mimeType } };
    }

    const result = await model.generateContent([
      "Generate a concise, descriptive alt text for this image suitable for screen readers. Keep it under 125 characters. Focus on the main subject and action. Do not start with 'Image of' or 'Picture of'.",
      imageData,
    ]);
    
    return result.response.text().trim() || "Image";
  } catch (error) {
    console.error("[ImageAI] Alt text error:", error);
    return "Image";
  }
}

// ============================================================================
// AI Image Generation - Real Implementation
// ============================================================================

/**
 * Generate AI image using available services
 * Tries: Stability AI, DALL-E, Replicate in order
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const { prompt, width = 1024, height = 1024, style = "photo" } = options;

  // Try Stability AI first
  const stabilityKey = process.env.STABILITY_API_KEY;
  if (stabilityKey) {
    try {
      const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${stabilityKey}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          width: Math.min(width, 1024),
          height: Math.min(height, 1024),
          samples: 1,
          steps: 30,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { artifacts: Array<{ base64: string }> };
        if (data.artifacts?.[0]?.base64) {
          // Save to S3
          const { storagePut } = await import("../storage");
          const buffer = Buffer.from(data.artifacts[0].base64, "base64");
          const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
          console.log(`[ImageAI] Generated via Stability AI: ${url}`);
          return { url };
        }
      }
    } catch (error) {
      console.warn("[ImageAI] Stability AI failed:", error);
    }
  }

  // Try OpenAI DALL-E
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json",
        }),
      });

      if (response.ok) {
        const data = await response.json() as { data: Array<{ b64_json: string }> };
        if (data.data?.[0]?.b64_json) {
          const { storagePut } = await import("../storage");
          const buffer = Buffer.from(data.data[0].b64_json, "base64");
          const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
          console.log(`[ImageAI] Generated via DALL-E: ${url}`);
          return { url };
        }
      }
    } catch (error) {
      console.warn("[ImageAI] DALL-E failed:", error);
    }
  }

  // Try Replicate
  const replicateKey = process.env.REPLICATE_API_TOKEN;
  if (replicateKey) {
    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${replicateKey}`,
        },
        body: JSON.stringify({
          version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          input: { prompt, width, height },
        }),
      });

      if (response.ok) {
        const prediction = await response.json() as { id: string; urls: { get: string } };
        
        // Poll for completion
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(prediction.urls.get, {
            headers: { "Authorization": `Token ${replicateKey}` },
          });
          const status = await statusRes.json() as { status: string; output?: string[] };
          
          if (status.status === "succeeded" && status.output?.[0]) {
            console.log(`[ImageAI] Generated via Replicate: ${status.output[0]}`);
            return { url: status.output[0] };
          }
          if (status.status === "failed") break;
        }
      }
    } catch (error) {
      console.warn("[ImageAI] Replicate failed:", error);
    }
  }

  // Fallback: Use Unsplash for stock photos
  try {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey) {
      const searchTerms = prompt.split(" ").slice(0, 3).join(",");
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerms)}&w=${width}&h=${height}`,
        { headers: { "Authorization": `Client-ID ${unsplashKey}` } }
      );
      
      if (response.ok) {
        const data = await response.json() as { urls: { regular: string } };
        console.log(`[ImageAI] Found via Unsplash`);
        return { url: data.urls.regular };
      }
    }
  } catch (error) {
    console.warn("[ImageAI] Unsplash failed:", error);
  }

  // Last resort: Generate SVG
  console.warn("[ImageAI] No image service available, generating SVG");
  return { url: generateBrandedSVG(width, height, prompt) };
}

/**
 * Generate a branded SVG image with JE styling
 */
export function generateBrandedSVG(
  width: number = 800,
  height: number = 600,
  text?: string
): string {
  const displayText = text ? text.substring(0, 40) : "Just Empower";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8f8f7"/>
      <stop offset="50%" stop-color="#f0efe9"/>
      <stop offset="100%" stop-color="#e8e7e1"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c9a86c"/>
      <stop offset="50%" stop-color="#d4b87a"/>
      <stop offset="100%" stop-color="#c9a86c"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="${width * 0.1}" y="${height * 0.45}" width="${width * 0.8}" height="3" fill="url(#gold)" opacity="0.6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Georgia, serif" font-size="${Math.min(width, height) * 0.06}" 
        fill="#1a1a19" font-style="italic" opacity="0.7">${displayText}</text>
  <text x="50%" y="${height * 0.85}" dominant-baseline="middle" text-anchor="middle" 
        font-family="Georgia, serif" font-size="${Math.min(width, height) * 0.025}" 
        fill="#c9a86c" letter-spacing="3">JUST EMPOWER™</text>
</svg>`.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Get actual image dimensions by fetching and parsing
 */
export async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // PNG header check
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    
    // JPEG SOF0 marker
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
    
    return null;
  } catch (error) {
    console.error("[ImageAI] Dimension detection failed:", error);
    return null;
  }
}
