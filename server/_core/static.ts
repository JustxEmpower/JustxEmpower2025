import express, { type Express } from "express";
import fs from "fs";
import path from "path";

interface SEOMeta {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
}

// Route-specific SEO defaults
const routeSEO: Record<string, Partial<SEOMeta>> = {
  "/": {
    title: "Just Empower | Where Empowerment Becomes Embodiment",
    description: "Discover empowerment resources, wellness guidance, and community support at Just Empower. Transform your life through mindfulness, self-care, and personal growth.",
    keywords: "empowerment, wellness, community, self-care, mindfulness, personal growth",
  },
  "/about": {
    title: "About Us | Just Empower",
    description: "Learn about Just Empower's mission to provide empowerment resources and wellness guidance for personal transformation.",
  },
  "/shop": {
    title: "Shop | Just Empower",
    description: "Explore our collection of wellness products, empowerment resources, and self-care essentials at Just Empower.",
  },
  "/events": {
    title: "Events | Just Empower",
    description: "Join our community events, workshops, and gatherings focused on empowerment and wellness.",
  },
  "/journal": {
    title: "Journal | Just Empower",
    description: "Read inspiring articles, wellness tips, and empowerment stories from the Just Empower community.",
  },
  "/contact": {
    title: "Contact Us | Just Empower",
    description: "Get in touch with Just Empower. We'd love to hear from you and support your empowerment journey.",
  },
  "/resources": {
    title: "Resources | Just Empower",
    description: "Access free empowerment resources, guides, and tools to support your personal growth journey.",
  },
};

async function getGlobalSEOSettings(): Promise<Partial<SEOMeta>> {
  try {
    const { getDb } = await import("../db");
    const { siteSettings } = await import("../schema");
    const db = await getDb();
    
    if (!db) return {};
    
    const settings = await db.select().from(siteSettings);
    const getVal = (key: string) => settings.find(s => s.settingKey === key)?.settingValue || "";
    
    return {
      title: getVal("seo_siteTitle"),
      description: getVal("seo_siteDescription"),
      keywords: getVal("seo_siteKeywords"),
      ogImage: getVal("seo_ogDefaultImage"),
    };
  } catch (error) {
    console.error("[SEO] Failed to load global settings:", error);
    return {};
  }
}

async function getPageSEO(slug: string): Promise<Partial<SEOMeta>> {
  try {
    const { getDb } = await import("../db");
    const { seoSettings, pages } = await import("../schema");
    const { eq, isNull, and } = await import("drizzle-orm");
    const db = await getDb();
    
    if (!db) return {};
    
    // Try to get page-specific SEO
    const [pageSeo] = await db.select().from(seoSettings).where(eq(seoSettings.pageSlug, slug)).limit(1);
    if (pageSeo) {
      return {
        title: pageSeo.metaTitle || undefined,
        description: pageSeo.metaDescription || undefined,
        keywords: pageSeo.metaKeywords || undefined,
        ogImage: pageSeo.ogImage || undefined,
        ogTitle: pageSeo.ogTitle || undefined,
        ogDescription: pageSeo.ogDescription || undefined,
      };
    }
    
    // Try to get page meta from pages table
    const [page] = await db.select().from(pages).where(and(eq(pages.slug, slug), isNull(pages.deletedAt))).limit(1);
    if (page) {
      return {
        title: page.metaTitle || page.title,
        description: page.metaDescription || undefined,
        ogImage: page.ogImage || undefined,
      };
    }
    
    return {};
  } catch (error) {
    console.error("[SEO] Failed to load page SEO:", error);
    return {};
  }
}

function injectMetaTags(html: string, meta: SEOMeta): string {
  const baseUrl = "https://justxempower.com";
  
  // Build meta tags string
  const metaTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    ${meta.keywords ? `<meta name="keywords" content="${meta.keywords}" />` : ""}
    <link rel="canonical" href="${meta.canonicalUrl}" />
    
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${meta.canonicalUrl}" />
    <meta property="og:title" content="${meta.ogTitle || meta.title}" />
    <meta property="og:description" content="${meta.ogDescription || meta.description}" />
    <meta property="og:site_name" content="Just Empower" />
    ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}" />` : ""}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.ogTitle || meta.title}" />
    <meta name="twitter:description" content="${meta.ogDescription || meta.description}" />
    ${meta.ogImage ? `<meta name="twitter:image" content="${meta.ogImage}" />` : ""}
  `;
  
  // Replace the closing </title> tag and inject our meta tags after it
  // Or inject before </head>
  return html.replace(
    /<title>.*?<\/title>/,
    metaTags.trim()
  );
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  
  console.log(`[Static] Serving static files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Serve index.html with injected meta tags
  app.get("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    try {
      let html = fs.readFileSync(indexPath, "utf-8");
      
      const urlPath = req.path;
      const slug = urlPath === "/" ? "" : urlPath.slice(1);
      const baseUrl = "https://justxempower.com";
      
      // Get SEO data from multiple sources
      const globalSEO = await getGlobalSEOSettings();
      const routeDefaults = routeSEO[urlPath] || {};
      const pageSEO = slug ? await getPageSEO(slug) : {};
      
      // Merge SEO data (page > route > global > fallback)
      const meta: SEOMeta = {
        title: pageSEO.title || routeDefaults.title || globalSEO.title || "Just Empower | Where Empowerment Becomes Embodiment",
        description: pageSEO.description || routeDefaults.description || globalSEO.description || "Discover empowerment resources, wellness guidance, and community support at Just Empower.",
        keywords: pageSEO.keywords || routeDefaults.keywords || globalSEO.keywords || "empowerment, wellness, community",
        ogImage: pageSEO.ogImage || globalSEO.ogImage || "",
        ogTitle: pageSEO.ogTitle || pageSEO.title || routeDefaults.title || globalSEO.title || "Just Empower",
        ogDescription: pageSEO.ogDescription || pageSEO.description || routeDefaults.description || globalSEO.description || "",
        canonicalUrl: `${baseUrl}${urlPath}`,
      };
      
      // Inject meta tags into HTML
      html = injectMetaTags(html, meta);
      
      res.send(html);
    } catch (error) {
      console.error("[Static] Error serving page:", error);
      res.sendFile(indexPath);
    }
  });
}
