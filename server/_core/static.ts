import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production, dist/index.js runs from dist/, so public is at dist/public
  // import.meta.dirname in dist/index.js is the dist folder itself
  const distPath = path.resolve(import.meta.dirname, "public");
  
  console.log(`[Static] Serving static files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
