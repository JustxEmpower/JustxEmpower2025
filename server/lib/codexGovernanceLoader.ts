/**
 * Loads AI governance config, escalation resources, and templates from DB.
 * Falls back to hardcoded values if DB is empty or unavailable.
 * Uses in-memory cache with 60s TTL to avoid hammering the DB.
 */
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";

const CACHE_TTL = 60_000; // 60 seconds
let govCache: { data: schema.CodexAIGovernance[]; ts: number } | null = null;
let resCache: { data: schema.CodexEscalationResource[]; ts: number } | null = null;
let tplCache: { data: schema.CodexEscalationTemplate[]; ts: number } | null = null;

export async function getGovernanceConfigs(category?: string): Promise<schema.CodexAIGovernance[]> {
  if (govCache && Date.now() - govCache.ts < CACHE_TTL) {
    const rows = govCache.data.filter(r => r.isActive === 1);
    return category ? rows.filter(r => r.category === category) : rows;
  }
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(schema.codexAIGovernance);
    govCache = { data: rows, ts: Date.now() };
    const active = rows.filter(r => r.isActive === 1);
    return category ? active.filter(r => r.category === category) : active;
  } catch (e) {
    console.warn("[Governance] Failed to load configs:", e);
    return govCache ? govCache.data.filter(r => r.isActive === 1) : [];
  }
}

export async function getGovernanceValue(key: string): Promise<string | null> {
  const configs = await getGovernanceConfigs();
  const row = configs.find(r => r.configKey === key);
  return row?.configValue || null;
}

export async function getGuardrails(): Promise<string[]> {
  const configs = await getGovernanceConfigs("guardrail");
  return configs.map(r => r.configValue);
}

export async function getEscalationResources(triggerType?: string): Promise<schema.CodexEscalationResource[]> {
  if (resCache && Date.now() - resCache.ts < CACHE_TTL) {
    const rows = resCache.data.filter(r => r.isActive === 1);
    if (!triggerType) return rows;
    return rows.filter(r => !r.triggerTypes || r.triggerTypes.includes(triggerType));
  }
  try {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(schema.codexEscalationResources).orderBy(asc(schema.codexEscalationResources.displayOrder));
    resCache = { data: rows, ts: Date.now() };
    const active = rows.filter(r => r.isActive === 1);
    if (!triggerType) return active;
    return active.filter(r => !r.triggerTypes || r.triggerTypes.includes(triggerType));
  } catch (e) {
    console.warn("[Governance] Failed to load resources:", e);
    return [];
  }
}

export async function getEscalationTemplate(severity: string): Promise<string | null> {
  if (tplCache && Date.now() - tplCache.ts < CACHE_TTL) {
    const row = tplCache.data.find(r => r.severity === severity && r.isActive === 1);
    return row?.templateText || null;
  }
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(schema.codexEscalationTemplates);
    tplCache = { data: rows, ts: Date.now() };
    const row = rows.find(r => r.severity === severity && r.isActive === 1);
    return row?.templateText || null;
  } catch (e) {
    console.warn("[Governance] Failed to load templates:", e);
    return null;
  }
}

export async function logEscalationEvent(entry: {
  userId?: string; sessionId?: string; triggerType: string;
  severity: string; detectedPatterns?: string[];
  userMessageExcerpt?: string; aiResponseGiven?: string;
  action: string; resourcesOffered?: string[];
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(schema.codexEscalationLog).values({
      userId: entry.userId || null,
      sessionId: entry.sessionId || null,
      triggerType: entry.triggerType,
      severity: entry.severity,
      detectedPatterns: entry.detectedPatterns?.join(",") || null,
      userMessageExcerpt: entry.userMessageExcerpt || null,
      aiResponseGiven: entry.aiResponseGiven || null,
      action: entry.action,
      resourcesOffered: entry.resourcesOffered?.join(",") || null,
    });
  } catch (e) {
    console.warn("[Governance] Failed to log escalation:", e);
  }
}

/**
 * Build a governance block string from DB configs.
 * If DB has guardrails/escalation_rules, they override the hardcoded GOVERNANCE_BLOCK.
 * Returns null if no DB configs exist (caller should use hardcoded fallback).
 */
export async function buildGovernanceBlockFromDB(): Promise<string | null> {
  const guardrails = await getGovernanceConfigs("guardrail");
  const rules = await getGovernanceConfigs("escalation_rule");
  const restricted = await getGovernanceConfigs("restricted_claims");

  if (guardrails.length === 0 && rules.length === 0 && restricted.length === 0) {
    return null; // No DB config — use hardcoded fallback
  }

  const parts: string[] = [];
  parts.push("=== GOVERNANCE & SAFETY DIRECTIVES (from admin config) ===");

  if (guardrails.length > 0) {
    parts.push("\n## Guardrails:");
    guardrails.forEach(g => parts.push(`- ${g.configValue}`));
  }

  if (restricted.length > 0) {
    parts.push("\n## Restricted Claims (NEVER say these):");
    restricted.forEach(r => parts.push(`- ${r.configValue}`));
  }

  if (rules.length > 0) {
    parts.push("\n## Escalation Rules:");
    rules.forEach(r => parts.push(`- ${r.configValue}`));
  }

  return parts.join("\n");
}

export function clearGovernanceCache(): void {
  govCache = null;
  resCache = null;
  tplCache = null;
}
