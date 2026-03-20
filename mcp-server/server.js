#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";

const PORT = parseInt(process.env.MCP_PORT || "3847", 10);
const TOKEN = process.env.MCP_TOKEN || "";
const PROJECT_ROOT = process.env.JXE_PROJECT_ROOT || path.resolve(new URL(".", import.meta.url).pathname, "..");
const MAX_FILE_LINES = 1000;

function safePath(rel) {
  const abs = path.resolve(PROJECT_ROOT, rel);
  if (!abs.startsWith(PROJECT_ROOT)) throw new Error("Path escapes project root");
  return abs;
}

function run(cmd, timeout = 15000) {
  try { return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8", timeout, maxBuffer: 2*1024*1024 }); }
  catch (e) { return e.stdout || e.stderr || e.message; }
}

const TEXT_EXTS = new Set([".ts",".tsx",".js",".jsx",".cjs",".mjs",".json",".md",".css",".html",".sql",".sh",".yml",".yaml",".toml",".txt",".prisma",".svg",".xml",".gitignore",".env",".lock",".conf",".service"]);
function isText(f) { return TEXT_EXTS.has(path.extname(f).toLowerCase()) || path.extname(f) === ""; }
function fileSize(abs) { try { return fs.statSync(abs).size; } catch { return 0; } }

function registerTools(server) {
  server.tool("list_directory", "List files/dirs at a path relative to project root.",
    { path: z.string().default(".") },
    async ({ path: rel }) => {
      const abs = safePath(rel);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return { content: [{ type: "text", text: "Not a valid directory: " + rel }] };
      const entries = fs.readdirSync(abs, { withFileTypes: true }).filter(e => e.name !== ".git" && e.name !== "node_modules");
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
      if (total > MAX_FILE_LINES) lines = lines.slice(0, MAX_FILE_LINES);
      return { content: [{ type: "text", text: `${rel} (${Math.min(total,MAX_FILE_LINES)} of ${total} lines)\n\n` + lines.map((l,i)=>`${i+1}\t${l}`).join("\n") }] };
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

  server.tool("project_overview", "Full project map including Living Codex integration.", {},
    async () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf-8"));
      const deps = Object.keys(pkg.dependencies||{}).slice(0,30).join(", ");
      const pages = run("ls client/src/pages/ 2>/dev/null").trim();
      const codexPages = run("ls client/src/pages/codex/ 2>/dev/null").trim();
      const srv = run("ls server/*.ts 2>/dev/null").trim();
      const codexLibs = run("ls server/lib/codex*.ts 2>/dev/null").trim();
      return { content: [{ type: "text", text: `# JustxEmpower2025 + Living Codex\nStack: Vite+React19+tRPC+Drizzle+MySQL/RDS+Express | EC2 PM2 :8083\n\nDeps: ${deps}\n\nPages:\n${pages}\n\nCodex Portal (client/src/pages/codex/):\n${codexPages}\n\nServer Routers:\n${srv}\n\nLiving Codex Modules (server/lib/):\n${codexLibs}` }] };
    });

  server.tool("git_diff", "Show diffs.", { target: z.string().default("") },
    async ({ target }) => ({ content: [{ type: "text", text: run(`git diff ${target} | head -300`) || "(no diff)" }] }));

  server.tool("codex_architecture", "Living Codex system architecture — modules, wiring, endpoints, safety layers.", {},
    async () => {
      const arch = `# Living Codex Architecture (27-agent build)

SERVER MODULES (server/lib/codex*.ts):
  Intelligence: codexAI.ts, codexScoringEngine.ts, codexRoutingEngine.ts, codexGrowthEngine.ts
  Research: codexResearchCorpus.ts (76 citations), codexCorpusCitations.ts, codexGuidePrompts.ts (6 guides), codexCorpusGovernance.ts
  Safety: codexEscalationEngine.ts → interceptUserMessage() + validateAIResponse()
  Assessment: codexAssessmentDomains1to4.ts, codexAssessmentDomains5to8.ts
  Reports: codexMirrorReport.ts, codexNotifications.ts, codexConstants.ts

CLIENT (client/src/pages/codex/):
  Shell: CodexPortalShell → Dashboard, Journey, Guide, Journal, Modules
  Enhanced: HolographicAvatar (Three.js, lazy), AIGuide, JournalVault, MyCodex, CodexEvents
  Journey: ArchetypeCard, SpectrumDisplay, MirrorReportViewer, GrowthTimeline, ProgressMarkers, ReAssessmentTrigger
  System: codexDesignSystem, codexAnimations, useGuideSession, useCodexState, types

tRPC ENDPOINTS (codexRouter.ts):
  portal, dashboardData, assessmentStart/Submit/Status
  journalList/Create/Prompt/Reflect
  guideSend (ESCALATION WIRED), guideConversations/History
  generateMirrorReport, getPortalRouting
  purchaseTier, confirmTierPurchase, settings, weather

SAFETY PIPELINE (guideSend):
  1. interceptUserMessage → crisis detection
  2. Escalation? → override + admin notify + return
  3. Safe? → AI generates with GOVERNANCE_BLOCK
  4. validateAIResponse → boundary check
  5. Violation? → sanitized replacement`;
      return { content: [{ type: "text", text: arch }] };
    });

  server.tool("codex_modules", "List all Living Codex files with line counts and sizes.", {},
    async () => {
      const serverLibs = run("wc -l server/lib/codex*.ts 2>/dev/null").trim();
      const clientFiles = run("wc -l client/src/pages/codex/*.tsx client/src/pages/codex/*.ts 2>/dev/null").trim();
      const journeyFiles = run("wc -l client/src/pages/codex/journey/*.tsx 2>/dev/null").trim();
      const router = run("wc -l server/codexRouter.ts 2>/dev/null").trim();
      return { content: [{ type: "text", text: `# Living Codex File Inventory\n\nServer Libs:\n${serverLibs}\n\nRouter:\n${router}\n\nClient Components:\n${clientFiles}\n\nJourney Components:\n${journeyFiles}` }] };
    });

  server.tool("codex_endpoints", "List all tRPC endpoints in codexRouter with line numbers.", {},
    async () => {
      const endpoints = run("grep -n 'customerProc\\|publicProcedure\\|adminProc' server/codexRouter.ts | head -40").trim();
      const imports = run("head -20 server/codexRouter.ts").trim();
      return { content: [{ type: "text", text: `# Codex Router Endpoints\n\nImports:\n${imports}\n\nEndpoints:\n${endpoints}` }] };
    });

  server.tool("deployment_status", "Check PM2, git, and server health on EC2.", {},
    async () => {
      const gitHead = run("git log -1 --pretty=format:'%h %s' 2>/dev/null").trim();
      const branch = run("git branch --show-current 2>/dev/null").trim();
      const dirty = run("git status --short 2>/dev/null").trim();
      const pm2 = run("pm2 jlist 2>/dev/null || echo 'pm2 not available'").trim();
      let pm2Status = "unavailable";
      try { const list = JSON.parse(pm2); pm2Status = list.map(p => `${p.name}: ${p.pm2_env?.status} (pid:${p.pid}, uptime:${Math.round((Date.now()-p.pm2_env?.pm_uptime)/60000)}m, restarts:${p.pm2_env?.restart_time})`).join("\n"); } catch {}
      return { content: [{ type: "text", text: `# Deployment Status\n\nBranch: ${branch}\nHEAD: ${gitHead}\nDirty: ${dirty || "(clean)"}\n\nPM2:\n${pm2Status}` }] };
    });

  server.tool("db_schema", "Show Drizzle schema table definitions.", { table: z.string().optional() },
    async ({ table }) => {
      const schemaPath = safePath("drizzle/schema.ts");
      if (!fs.existsSync(schemaPath)) return { content: [{ type: "text", text: "Schema file not found" }] };
      if (table) {
        const r = run(`grep -A 20 "export const ${table}" drizzle/schema.ts`).trim();
        return { content: [{ type: "text", text: r || `Table '${table}' not found in schema` }] };
      }
      const tables = run("grep 'export const.*mysqlTable\\|export const.*pgTable\\|export const.*sqliteTable' drizzle/schema.ts").trim();
      return { content: [{ type: "text", text: `# Drizzle Schema Tables\n\n${tables}` }] };
    });

  // ════════════════════════════════════════════════════════════════════
  // TEAM TOOLS — Write, Edit, Tree, Find, Regex, Imports, Shell, Env
  // ════════════════════════════════════════════════════════════════════

  server.tool("write_file", "Create or overwrite a file. Parent dirs created automatically.",
    { path: z.string(), content: z.string() },
    async ({ path: rel, content }) => {
      const abs = safePath(rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
      return { content: [{ type: "text", text: `Wrote ${content.split("\n").length} lines to ${rel} (${(Buffer.byteLength(content)/1024).toFixed(1)}KB)` }] };
    });

  server.tool("edit_file", "Find and replace text in a file. Set replace_all to true for global replace.",
    { path: z.string(), old_text: z.string(), new_text: z.string(), replace_all: z.boolean().default(false) },
    async ({ path: rel, old_text, new_text, replace_all }) => {
      const abs = safePath(rel);
      if (!fs.existsSync(abs)) return { content: [{ type: "text", text: "Not found: " + rel }] };
      let src = fs.readFileSync(abs, "utf-8");
      if (!src.includes(old_text)) return { content: [{ type: "text", text: "old_text not found in " + rel }] };
      if (replace_all) { src = src.split(old_text).join(new_text); } else { src = src.replace(old_text, new_text); }
      fs.writeFileSync(abs, src, "utf-8");
      return { content: [{ type: "text", text: `Edited ${rel} — replaced ${replace_all ? "all occurrences" : "first occurrence"}` }] };
    });

  server.tool("file_tree", "Recursive directory tree with depth limit. Excludes node_modules and .git.",
    { path: z.string().default("."), depth: z.number().default(3) },
    async ({ path: rel, depth }) => {
      const abs = safePath(rel);
      const r = run(`find "${abs}" -maxdepth ${depth} -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | sort | head -200`);
      const cleaned = r.replace(new RegExp(PROJECT_ROOT + "/?", "g"), "");
      return { content: [{ type: "text", text: cleaned || "Empty" }] };
    });

  server.tool("find_files", "Find files by name pattern (glob). Returns paths relative to project root.",
    { pattern: z.string(), path: z.string().default("."), type: z.enum(["file","directory","any"]).default("file") },
    async ({ pattern, path: rel, type }) => {
      const abs = safePath(rel);
      const typeFlag = type === "file" ? "-type f" : type === "directory" ? "-type d" : "";
      const r = run(`find "${abs}" ${typeFlag} -name "${pattern}" -not -path "*/node_modules/*" -not -path "*/.git/*" | sort | head -100`);
      const cleaned = r.replace(new RegExp(PROJECT_ROOT + "/?", "g"), "");
      return { content: [{ type: "text", text: cleaned || "No matches" }] };
    });

  server.tool("regex_search", "Search codebase with regex pattern. Use -E for extended regex. Shows context lines.",
    { pattern: z.string(), path: z.string().default("."), include: z.string().optional(), context: z.number().default(0), max_results: z.number().default(50) },
    async ({ pattern, path: rel, include, context, max_results }) => {
      const abs = safePath(rel);
      let cmd = `grep -rn --color=never -E`;
      if (context > 0) cmd += ` -C ${Math.min(context, 5)}`;
      if (include) cmd += ` --include="${include}"`;
      cmd += ` "${pattern.replace(/"/g, '\\"')}" "${abs}" | head -${max_results}`;
      const r = run(cmd).replace(new RegExp(PROJECT_ROOT + "/", "g"), "");
      return { content: [{ type: "text", text: r || "No results" }] };
    });

  server.tool("file_imports", "Show all imports/exports for a TypeScript/JS file. Useful for understanding dependencies.",
    { path: z.string() },
    async ({ path: rel }) => {
      const abs = safePath(rel);
      if (!fs.existsSync(abs)) return { content: [{ type: "text", text: "Not found: " + rel }] };
      const src = fs.readFileSync(abs, "utf-8");
      const imports = src.split("\n").filter(l => /^\s*(import|export)\s/.test(l));
      const exportLines = src.split("\n").map((l, i) => /^export\s+(function|const|class|type|interface|enum|default)/.test(l) ? `${i+1}: ${l.trim().slice(0,120)}` : null).filter(Boolean);
      return { content: [{ type: "text", text: `# ${rel}\n\nImports:\n${imports.join("\n") || "(none)"}\n\nExported symbols:\n${exportLines.join("\n") || "(none)"}` }] };
    });

  server.tool("run_shell", "Run a read-only shell command in the project root. For diagnostics only — no writes.",
    { command: z.string() },
    async ({ command }) => {
      const blocked = ["rm ", "rm\t", "rmdir", "mv ", "dd ", "> ", ">> ", "mkfs", "chmod", "chown", "kill", "reboot", "shutdown", "systemctl stop", "systemctl disable", "npm publish", "git push", "git reset --hard"];
      const lower = command.toLowerCase();
      if (blocked.some(b => lower.includes(b))) return { content: [{ type: "text", text: "Blocked: destructive command not allowed via MCP" }] };
      const r = run(command, 30000);
      return { content: [{ type: "text", text: r.slice(0, 5000) || "(no output)" }] };
    });

  server.tool("env_info", "Show server environment: Node version, disk, memory, uptime, PM2 processes, ports.",
    {},
    async () => {
      const node = run("node -v").trim();
      const pnpm = run("pnpm -v 2>/dev/null || npm -v").trim();
      const disk = run("df -h / | tail -1").trim();
      const mem = run("free -h 2>/dev/null | head -2 || vm_stat 2>/dev/null | head -5").trim();
      const up = run("uptime").trim();
      const pm2 = run("pm2 list --no-color 2>/dev/null || echo 'pm2 not found'").trim();
      const ports = run("ss -tlnp 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep LISTEN || echo 'no port info'").trim();
      return { content: [{ type: "text", text: `# Environment\nNode: ${node}\nPackage mgr: pnpm ${pnpm}\n\nDisk:\n${disk}\n\nMemory:\n${mem}\n\nUptime: ${up}\n\nPM2:\n${pm2}\n\nListening ports:\n${ports}` }] };
    });
}

// Express + SSE
const app = express();
const transports = {};

// Request logging
app.use((req, res, next) => {
  console.log(`[MCP] ${req.method} ${req.path} ${req.query.sessionId || ""}`);
  next();
});

// CORS — required for browser-based MCP clients like Claude co-work
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Mcp-Session-Id");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Mcp-Session-Id");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

if (TOKEN) {
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    const auth = req.headers.authorization;
    if (auth && auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "Unauthorized" });
    next();
  });
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ═══ Streamable HTTP transport (primary — used by Claude co-work) ═══

function createServer() {
  const server = new McpServer({ name: "jxe-codebase", version: "2.0.0" });
  registerTools(server);
  return server;
}

app.post("/sse", express.json(), async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  if (sid && transports[sid]) {
    console.log("[MCP] Streamable HTTP POST (existing session)", sid);
    await transports[sid].transport.handleRequest(req, res, req.body);
    return;
  }
  console.log("[MCP] Streamable HTTP POST (new session)");
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  const server = createServer();
  await server.connect(transport);
  const newSid = transport.sessionId;
  if (newSid) transports[newSid] = { transport, server };
  transport.onclose = () => { if (newSid) delete transports[newSid]; console.log("[MCP] Streamable session closed", newSid); };
  await transport.handleRequest(req, res, req.body);
});

app.get("/sse", async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  if (sid && transports[sid]) {
    console.log("[MCP] Streamable HTTP GET (SSE stream)", sid);
    await transports[sid].transport.handleRequest(req, res);
    return;
  }
  // Legacy SSE fallback
  console.log("[MCP] Legacy SSE connection opened");
  const server = createServer();
  const basePath = process.env.MCP_BASE_PATH || "/mcp";
  const transport = new SSEServerTransport(`${basePath}/messages`, res);
  transports[transport.sessionId] = { transport, server };
  res.on("close", () => { delete transports[transport.sessionId]; console.log("[MCP] Legacy SSE closed"); });
  await server.connect(transport);
});

app.delete("/sse", async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  if (sid && transports[sid]) {
    console.log("[MCP] Streamable HTTP DELETE", sid);
    await transports[sid].transport.handleRequest(req, res);
    delete transports[sid];
    return;
  }
  res.status(404).json({ error: "Session not found" });
});

// Legacy SSE message endpoint
app.post("/messages", express.json(), async (req, res) => {
  const sid = req.query.sessionId;
  const entry = transports[sid];
  if (!entry) return res.status(400).json({ error: "Unknown session" });
  await entry.transport.handlePostMessage(req, res);
});

app.listen(PORT, "0.0.0.0", () => console.log(`[MCP] Listening on http://0.0.0.0:${PORT} (Streamable HTTP + SSE)`));
