/**
 * Share Image Generator — renders Codex share snippets as branded PNG images
 * Used for og:image meta tags and downloadable social media images
 */
import { Router } from "express";
import sharp from "sharp";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ── Mood-to-color mapping ──
const MOOD_COLORS: Record<string, { bg1: string; bg2: string; accent: string }> = {
  contemplative: { bg1: "#EDE5D8", bg2: "#D8CFC2", accent: "#B8976A" },
  activated: { bg1: "#F0E8DB", bg2: "#E8D9C4", accent: "#C9A84C" },
  heavy: { bg1: "#E8DFD4", bg2: "#D6CBC0", accent: "#B87B65" },
  tender: { bg1: "#EDEBE5", bg2: "#DDD8D0", accent: "#7D8E7F" },
  expansive: { bg1: "#EEE8E0", bg2: "#E0D6CC", accent: "#A78BFA" },
  uncertain: { bg1: "#E8E2DB", bg2: "#D8D0C8", accent: "#8B7B6B" },
  raw: { bg1: "#EADDD5", bg2: "#D8C8BC", accent: "#B87B65" },
  grounded: { bg1: "#ECE4D8", bg2: "#DCD2C4", accent: "#B8976A" },
};

const DEFAULT_COLORS = { bg1: "#EDE5D8", bg2: "#D8CFC2", accent: "#B8976A" };

// ── SVG text wrapping helper ──
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

// ── XML escape ──
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createShareImageRouter(): Router {
  const r = Router();

  r.get("/:publicId", async (req, res) => {
    try {
      const { publicId } = req.params;
      const db = await getDb();
      if (!db) return res.status(500).send("DB unavailable");

      const [snippet] = await db.select().from(schema.codexShareSnippets)
        .where(eq(schema.codexShareSnippets.publicId, publicId))
        .limit(1);
      if (!snippet) return res.status(404).send("Not found");

      const colors = MOOD_COLORS[snippet.mood || ""] || DEFAULT_COLORS;
      const lines = wrapText(snippet.snippet, 32);
      const hashtags = snippet.hashtags ? JSON.parse(snippet.hashtags) : [];

      // Calculate dynamic sizing
      const lineHeight = 46;
      const snippetBlockHeight = lines.length * lineHeight + 20;
      const totalHeight = 630; // Instagram-friendly 1200x630
      const snippetStartY = Math.max(180, (totalHeight - snippetBlockHeight) / 2);

      // Build snippet text lines
      const snippetLines = lines.map((line, i) =>
        `<text x="600" y="${snippetStartY + i * lineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-style="italic" font-weight="300" fill="#221E1A" letter-spacing="0.5">${escapeXml(line)}</text>`
      ).join("\n      ");

      // Hashtags line
      const hashtagText = hashtags.slice(0, 4).join("  ");
      const hashtagY = snippetStartY + lines.length * lineHeight + 40;

      // Archetype badge
      const archetypeBadge = snippet.archetype
        ? `<text x="600" y="108" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" font-weight="500" fill="${colors.accent}" letter-spacing="3">${escapeXml(snippet.archetype.toUpperCase())}</text>`
        : "";

      const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.bg1}" />
        <stop offset="100%" stop-color="${colors.bg2}" />
      </linearGradient>
      <!-- Decorative circles -->
      <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.06" />
        <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.04" />
        <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)" />

    <!-- Decorative orbs -->
    <circle cx="200" cy="150" r="200" fill="url(#orb1)" />
    <circle cx="1000" cy="480" r="250" fill="url(#orb2)" />

    <!-- Top border accent -->
    <rect x="0" y="0" width="1200" height="3" fill="${colors.accent}" opacity="0.3" />

    <!-- Diamond logo mark -->
    <g transform="translate(600, 60)">
      <rect x="-10" y="-10" width="20" height="20" rx="4" fill="${colors.accent}" opacity="0.15" transform="rotate(45)" />
      <text x="0" y="5" text-anchor="middle" font-size="12" fill="${colors.accent}" opacity="0.6">◇</text>
    </g>

    <!-- Archetype badge -->
    ${archetypeBadge}

    <!-- Opening quote mark -->
    <text x="560" y="${snippetStartY - 30}" font-family="Georgia, serif" font-size="72" fill="${colors.accent}" opacity="0.2">"</text>

    <!-- Snippet text -->
    ${snippetLines}

    <!-- Closing quote mark -->
    <text x="640" y="${snippetStartY + lines.length * lineHeight + 10}" font-family="Georgia, serif" font-size="72" fill="${colors.accent}" opacity="0.2">"</text>

    <!-- Hashtags -->
    <text x="600" y="${hashtagY}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" fill="${colors.accent}" opacity="0.5" letter-spacing="1">${escapeXml(hashtagText)}</text>

    <!-- Divider line -->
    <line x1="520" y1="${hashtagY + 30}" x2="680" y2="${hashtagY + 30}" stroke="${colors.accent}" stroke-opacity="0.15" stroke-width="1" />

    <!-- Brand -->
    <text x="600" y="${hashtagY + 58}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="300" fill="#221E1A" opacity="0.4" letter-spacing="2">THE LIVING CODEX</text>
    <text x="600" y="${hashtagY + 78}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10" fill="#221E1A" opacity="0.25" letter-spacing="3">BY JUST EMPOWER</text>

    <!-- Bottom border accent -->
    <rect x="0" y="627" width="1200" height="3" fill="${colors.accent}" opacity="0.3" />
  </svg>`;

      // Render SVG to PNG using sharp
      const pngBuffer = await sharp(Buffer.from(svg))
        .png({ quality: 90 })
        .toBuffer();

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h
      res.setHeader("Content-Length", pngBuffer.length);
      res.send(pngBuffer);
    } catch (err) {
      console.error("[Codex] Share image generation error:", err);
      res.status(500).send("Image generation failed");
    }
  });

  return r;
}
