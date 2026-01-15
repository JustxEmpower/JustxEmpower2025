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

  // SEO Routes - robots.txt and sitemap.xml
  app.get("/robots.txt", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { siteSettings } = await import("../schema");
      const { eq } = await import("drizzle-orm");
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
      const { getDb } = await import("../db");
      const { pages } = await import("../schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      
      const baseUrl = "https://justxempower.com";
      let urls = [
        { loc: baseUrl, priority: "1.0" },
        { loc: `${baseUrl}/about`, priority: "0.8" },
        { loc: `${baseUrl}/events`, priority: "0.8" },
        { loc: `${baseUrl}/shop`, priority: "0.8" },
        { loc: `${baseUrl}/journal`, priority: "0.7" },
        { loc: `${baseUrl}/contact`, priority: "0.6" },
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
