import dotenv from "dotenv";
dotenv.config({ override: true });

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import { siteSettings, pages } from "../../drizzle/schema";
import { createStripeWebhookRouter } from "../stripeWebhook";
import { createKlingRouter } from "../klingRouter";
import { createTTSRouter } from "../ttsRouter";
import { createSimliRouter } from "../simliRouter";
import { createShareImageRouter } from "../shareImageRouter";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook — must be mounted BEFORE json body parser (needs raw body for signature verification)
  app.use("/api/stripe/webhook", createStripeWebhookRouter());
  
  // Configure body parser with larger size limit for file uploads (200MB for videos)
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ limit: "200mb", extended: true }));
  
  // Global error handler for payload too large
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.type === 'entity.too.large') {
      console.error('[Server] Payload too large:', err.message);
      return res.status(413).json({ error: 'Payload too large. Maximum file size is 200MB.' });
    }
    next(err);
  });
  
  // Kling Avatar API proxy (PiAPI) — keeps API key server-side
  app.use("/api/kling", createKlingRouter());

  // Kokoro TTS — server-side neural text-to-speech
  app.use("/api/tts", createTTSRouter());

  // Simli avatar lip-sync — session token proxy (keeps API key server-side)
  app.use("/api/simli", createSimliRouter());

  // Share image generator — renders Codex share snippets as branded PNGs
  app.use("/api/share-image", createShareImageRouter());

  // tRPC API with increased body size limit
  app.use(
    "/api/trpc",
    express.json({ limit: "200mb" }),
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        console.error(`[tRPC Error] ${path}:`, error.message);
      },
    })
  );

  // ── Share Landing Page — SSR with OG meta tags for social media crawlers ──
  app.get("/share/:publicId", async (req, res, next) => {
    try {
      const { publicId } = req.params;
      const db = await getDb();
      if (!db) return next(); // fall through to SPA

      const { codexShareSnippets } = await import("../../drizzle/schema");
      const [snippet] = await db.select().from(codexShareSnippets)
        .where(eq(codexShareSnippets.publicId, publicId))
        .limit(1);

      if (!snippet) return next(); // fall through to SPA 404

      const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
      const shareUrl = `${siteUrl}/share/${publicId}`;
      const imageUrl = `${siteUrl}/api/share-image/${publicId}`;
      const snippetText = snippet.snippet;
      const hashtags = snippet.hashtags ? JSON.parse(snippet.hashtags) : [];
      const description = `${snippetText} ${hashtags.slice(0, 3).join(" ")}`;

      // Serve HTML with OG tags — social crawlers get rich previews
      res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${snippetText.substring(0, 60)}... — The Living Codex</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="A Reflection from The Living Codex" />
  <meta property="og:description" content="${snippetText.replace(/"/g, '&quot;')}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:site_name" content="The Living Codex by Just Empower" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="A Reflection from The Living Codex" />
  <meta name="twitter:description" content="${snippetText.replace(/"/g, '&quot;')}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: linear-gradient(135deg, #EDE5D8, #D8CFC2);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      max-width: 540px;
      width: 100%;
      background: rgba(255,255,255,0.5);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.7);
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 60px rgba(0,0,0,0.08);
    }
    .diamond { font-size: 1.5rem; color: #B8976A; opacity: 0.5; margin-bottom: 1rem; }
    .label { font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: #8B7B6B; margin-bottom: 0.5rem; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .snippet { font-size: 1.35rem; font-style: italic; font-weight: 300; color: #221E1A; line-height: 1.7; margin: 1.5rem 0; }
    .hashtags { font-size: 0.75rem; color: #B87B65; font-family: 'Helvetica Neue', Arial, sans-serif; margin-bottom: 1.5rem; }
    .divider { width: 80px; height: 1px; background: rgba(184,151,106,0.2); margin: 1.5rem auto; }
    .brand { font-size: 0.7rem; letter-spacing: 0.15em; color: #221E1A; opacity: 0.35; text-transform: uppercase; }
    .sub-brand { font-size: 0.55rem; letter-spacing: 0.2em; color: #221E1A; opacity: 0.2; text-transform: uppercase; font-family: 'Helvetica Neue', Arial, sans-serif; margin-top: 0.25rem; }
    .cta {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.75rem 2rem;
      border-radius: 2rem;
      background: rgba(184,123,101,0.08);
      border: 1px solid rgba(184,123,101,0.15);
      color: #B87B65;
      text-decoration: none;
      font-size: 0.85rem;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      transition: all 200ms ease;
    }
    .cta:hover { background: rgba(184,123,101,0.15); }
    ${snippet.archetype ? `.archetype { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: #B8976A; font-family: 'Helvetica Neue', Arial, sans-serif; margin-bottom: 0.25rem; }` : ''}
  </style>
</head>
<body>
  <div class="card">
    <div class="diamond">◇</div>
    <div class="label">A Reflection from The Living Codex</div>
    ${snippet.archetype ? `<div class="archetype">${snippet.archetype}</div>` : ''}
    <div class="snippet">"${snippetText}"</div>
    <div class="hashtags">${hashtags.join("  ")}</div>
    <div class="divider"></div>
    <div class="brand">The Living Codex</div>
    <div class="sub-brand">by Just Empower</div>
    <a href="${siteUrl}" class="cta">Begin Your Journey</a>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error("[Codex] Share page SSR error:", err);
      next(); // fall through to SPA
    }
  });

  // SEO Routes - robots.txt and sitemap.xml
  app.get("/robots.txt", async (_req, res) => {
    try {
      const db = await getDb();
      
      let robotsContent = `User-agent: *\nAllow: /\nSitemap: https://justxempower.com/sitemap.xml`;
      
      if (db) {
        const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, "seo_robotsTxt")).limit(1);
        if (setting?.settingValue) {
          robotsContent = setting.settingValue;
        }
      }
      
      res.type("text/plain").send(robotsContent);
    } catch (error) {
      console.error("[SEO] robots.txt error:", error);
      res.type("text/plain").send("User-agent: *\nAllow: /");
    }
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const db = await getDb();
      
      const baseUrl = "https://justxempower.com";
      let urls = [
        { loc: baseUrl, priority: "1.0" },
        { loc: `${baseUrl}/about`, priority: "0.8" },
        { loc: `${baseUrl}/emerge-with-us`, priority: "0.8" },
        { loc: `${baseUrl}/rooted-unity`, priority: "0.8" },
        { loc: `${baseUrl}/blog`, priority: "0.8" },
        { loc: `${baseUrl}/events`, priority: "0.8" },
        { loc: `${baseUrl}/shop`, priority: "0.8" },
        { loc: `${baseUrl}/contact`, priority: "0.7" },
      ];
      
      if (db) {
        const publishedPages = await db.select().from(pages).where(eq(pages.published, 1));
        publishedPages.forEach(page => {
          if (!urls.find(u => u.loc.endsWith(`/${page.slug}`))) {
            urls.push({ loc: `${baseUrl}/${page.slug}`, priority: "0.7" });
          }
        });
      }
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>weekly</changefreq>
  </url>`).join("\n")}
</urlset>`;
      
      res.type("application/xml").send(sitemap);
    } catch (error) {
      console.error("[SEO] sitemap.xml error:", error);
      res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
    }
  });
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    // Dynamic import to avoid loading vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Import serveStatic from a separate file that doesn't import vite
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
