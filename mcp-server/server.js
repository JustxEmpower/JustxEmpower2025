#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import express from "express";

const PORT = parseInt(process.env.MCP_PORT || "3847", 10);
const TOKEN = process.env.MCP_TOKEN || "";
const PROJECT_ROOT = process.env.JXE_PROJECT_ROOT || path.resolve(new URL(".", import.meta.url).pathname, "..");

function safePath(rel) {
  const abs = path.resolve(PROJECT_ROOT, rel);
  if (!abs.startsWith(PROJECT_ROOT)) throw new Error("Path escapes project root");
  return abs;
}

function run(cmd) {
  try { return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 15000, maxBuffer: 1024*1024 }); }
  catch (e) { return e.stdout || e.stderr || e.message; }
}

const TEXT_EXTS = new Set([".ts",".tsx",".js",".jsx",".cjs",".mjs",".json",".md",".css",".html",".sql",".sh",".yml",".yaml",".toml",".txt",".prisma",".svg",".xml",".gitignore"]);
function isText(f) { return TEXT_EXTS.has(path.extname(f).toLowerCase()) || path.extname(f) === ""; }

function registerTools(server) {
  server.tool("list_directory", "List files/dirs at a path relative to project root.",
    { path: z.string().default(".") },
    async ({ path: rel }) => {
      const abs = safePath(rel);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return { content: [{ type: "text", text: "Not a valid directory: " + rel }] };
      const entries = fs.readdirSync(abs, { withFileTypes: true }).filter(e => e.name !== ".git");
      const lines = entries.map(e => {
        if (e.isDirectory()) return `📁 ${e.name}/`;
        const kb = (fs.statSync(path.join(abs, e.name)).size / 1024).toFixed(1);
        return `📄 ${e.name}  (${kb}KB)`;
      });
      return { content: [{ type: "text", text: lines.join("\n") }] };
    });

  server.tool("read_file", "Read file contents with optional line range.",
    { path: z.string(), start_line: z.number().optional(), end_line: z.number().optional() },
    async ({ path: rel, start_line, end_line }) => {
      const abs = safePath(rel);
      if (!fs.existsSync(abs)) return { content: [{ type: "text", text: "Not found: " + rel }] };
      if (!isText(abs) && fs.statSync(abs).size > 50000) return { content: [{ type: "text", text: "Binary file: " + rel }] };
      let lines = fs.readFileSync(abs, "utf-8").split("\n");
      const total = lines.length;
      if (start_line || end_line) { const s = Math.max(1, start_line||1)-1; const e = Math.min(total, end_line||total); lines = lines.slice(s, e); return { content: [{ type: "text", text: `${rel} (${s+1}-${e} of ${total})\n\n` + lines.map((l,i)=>`${s+i+1}\t${l}`).join("\n") }] }; }
      if (total > 500) lines = lines.slice(0, 500);
      return { content: [{ type: "text", text: `${rel} (${Math.min(total,500)} of ${total} lines)\n\n` + lines.map((l,i)=>`${i+1}\t${l}`).join("\n") }] };
    });

  server.tool("search_codebase", "Grep the codebase.",
    { query: z.string(), path: z.string().default("."), include: z.string().optional(), max_results: z.number().default(50) },
    async ({ query, path: rel, include, max_results }) => {
      const abs = safePath(rel);
      let cmd = `grep -rn --color=never -F`;
      if (include) cmd += ` --include="${include}"`;
      cmd += ` "${query.replace(/"/g,'\\"')}" "${abs}" | head -${max_results}`;
      const r = run(cmd).replace(new RegExp(PROJECT_ROOT+"/","g"), "");
      return { content: [{ type: "text", text: r || "No results" }] };
    });

  server.tool("git_log", "Recent git commits.", { count: z.number().default(15) },
    async ({ count }) => ({ content: [{ type: "text", text: run(`git log -n ${count} --pretty=format:"%h %ad %s" --date=short`) }] }));

  server.tool("git_status", "Current git status.", {},
    async () => ({ content: [{ type: "text", text: `Branch: ${run("git branch --show-current").trim()}\n${run("git status --short") || "(clean)"}` }] }));

  server.tool("project_overview", "High-level project map.", {},
    async () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf-8"));
      const deps = Object.keys(pkg.dependencies||{}).slice(0,25).join(", ");
      const pages = run("ls client/src/pages/ 2>/dev/null").trim();
      const srv = run("ls server/*.ts 2>/dev/null").trim();
      return { content: [{ type: "text", text: `# JustxEmpower2025\n\nDeps: ${deps}\n\nPages:\n${pages}\n\nServer:\n${srv}` }] };
    });

  server.tool("git_diff", "Show diffs.", { target: z.string().default("") },
    async ({ target }) => ({ content: [{ type: "text", text: run(`git diff ${target} | head -300`) || "(no diff)" }] }));
}

// Express + SSE
const app = express();
const transports = {};

if (TOKEN) {
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    const auth = req.headers.authorization;
    if (auth && auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "Unauthorized" });
    next();
  });
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/sse", async (req, res) => {
  console.log("[MCP] SSE connection opened");
  const server = new McpServer({ name: "jxe-codebase", version: "1.0.0" });
  registerTools(server);
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = { transport, server };
  res.on("close", () => { delete transports[transport.sessionId]; console.log("[MCP] SSE closed"); });
  await server.connect(transport);
});

app.post("/messages", express.json(), async (req, res) => {
  const sid = req.query.sessionId;
  const entry = transports[sid];
  if (!entry) return res.status(400).json({ error: "Unknown session" });
  await entry.transport.handlePostMessage(req, res);
});

app.listen(PORT, "0.0.0.0", () => console.log(`[MCP] Listening on http://0.0.0.0:${PORT}/sse`));
