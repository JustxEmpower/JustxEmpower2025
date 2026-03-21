import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  base: '/',
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Increase chunk size warning limit (500KB is too aggressive for modern apps)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial load
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-ui';
          }
          // Animation libraries
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-animation';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns/')) {
            return 'vendor-date';
          }
          // Charts
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // tRPC and React Query
          if (id.includes('node_modules/@trpc/') || id.includes('node_modules/@tanstack/')) {
            return 'vendor-trpc';
          }
          // Form handling
          if (id.includes('node_modules/react-hook-form/') || id.includes('node_modules/@hookform/') || id.includes('node_modules/zod/')) {
            return 'vendor-forms';
          }
          // Kokoro TTS + transformers.js (loaded lazily via dynamic import)
          if (id.includes('node_modules/kokoro-js/') || id.includes('node_modules/@huggingface/transformers/')) {
            return 'kokoro';
          }
          // ONNX runtime
          if (id.includes('node_modules/onnxruntime-')) {
            return 'onnx-runtime';
          }
          // Mermaid (heavy diagram library)
          if (id.includes('node_modules/mermaid/')) {
            return 'vendor-mermaid';
          }
          // Markdown rendering
          if (id.includes('node_modules/marked/') || id.includes('node_modules/markdown-') || id.includes('node_modules/remark-') || id.includes('node_modules/rehype-')) {
            return 'vendor-markdown';
          }
          // html2canvas
          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "justxempower.com",
      ".justxempower.com",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
