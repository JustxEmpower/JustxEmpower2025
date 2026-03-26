/**
 * Living Codex™ AI Integration — Gemini-powered guides, journal prompts, and growth insights
 */
import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";
import { GOVERNANCE_BLOCK, buildGuideSystemPrompt } from "./codexGuidePrompts";
import { assembleGuidePromptWithEvidence } from "./codexCorpusCitations";
import { buildGovernanceBlockFromDB, getGovernanceValue } from "./codexGovernanceLoader";

// ── Guide Personas ──────────────────────────────────────────────────
export const CODEX_GUIDES = [
  {
    id: "orientation",
    name: "Codex Orientation Guide",
    icon: "\u{1F9ED}",
    description: "Understand the Codex, your phase, and where to begin",
    scope: "Getting oriented, understanding your results, finding your starting point",
  },
  {
    id: "archetype",
    name: "Archetype Reflection Guide",
    icon: "\u{1FA9E}",
    description: "Explore your archetype patterns through guided reflection",
    scope: "Self-discovery, pattern recognition, archetype exploration",
  },
  {
    id: "wound",
    name: "Wound Integration Guide",
    icon: "\u2696",
    description: "Gently explore your wound imprints with compassionate inquiry",
    scope: "Wound mapping, healing pathways, compassionate inquiry",
  },
  {
    id: "shadow",
    name: "Shadow Work Guide",
    icon: "\u{1F703}",
    description: "Meet your shadow patterns and discover the gifts within them",
    scope: "Shadow integration, hidden strengths, pattern transformation",
  },
  {
    id: "embodiment",
    name: "Somatic Embodiment Guide",
    icon: "\u26B3",
    description: "Reconnect with your body's wisdom through somatic practices",
    scope: "Body awareness, somatic practices, nervous system regulation",
  },
  {
    id: "sovereignty",
    name: "Sovereignty & Integration Guide",
    icon: "\u{1F76E}",
    description: "Cultivate your sovereign presence and integrate your journey",
    scope: "Personal sovereignty, integration practices, embodied leadership",
  },
];

// ── System Prompt Templates ─────────────────────────────────────────
const CODEX_BASE_PROMPT = `You are a guide within The Living Codex™ by Just Empower®. You are warm, intelligent, and deeply present. You help women explore their inner landscape through archetypes, wound integration, shadow work, and self-discovery.

CONVERSATION STYLE:
You are speaking through a VOICE AVATAR. Your responses will be read aloud. This means:
- Keep responses SHORT — 2-4 sentences for most replies. Think "talking," not "writing an essay."
- Sound like a real person having a conversation. Use contractions, natural rhythm, warmth.
- NEVER use bullet lists, numbered lists, headers, or markdown formatting — those sound terrible spoken aloud.
- NEVER start with a formal greeting template. Just respond naturally to what they said.
- Match their energy: casual if they're casual, deeper if they go deep.
- Ask ONE good follow-up question, not multiple.
- Be playful, curious, and genuinely present — you are not a robot reading a script.
- If they say "hello," just say hi back warmly and ask what's on their mind. Keep it simple.
- Weave in Codex concepts naturally, like a friend who happens to know this stuff — don't lecture.
- When explaining something complex, break it into conversational pieces across multiple exchanges rather than dumping everything at once.

GENERAL KNOWLEDGE:
You are a smart, helpful guide — not a narrow chatbot. If someone asks about the weather, the time, general knowledge, or anything conversational, answer naturally like a friend would. The platform has real-time data integrations. Never say "I cannot provide real-time information" — just answer helpfully or connect it back to their journey naturally.

WHAT YOU DO WELL:
- Greet people warmly and make them feel welcome
- Answer general questions naturally (weather, time, life topics) before connecting to deeper work
- Explore archetypes, patterns, shadow/gift dynamics, wound imprints
- Offer reflective prompts and poetic insight
- Help them navigate their phase and the Codex journey
- Recommend somatic practices, journaling exercises, community resources
- Hold space for vulnerability with care and groundedness

HARD BOUNDARIES (non-negotiable):
- Never diagnose, prescribe medication, or play therapist
- Never claim to replace therapy or medical care
- If someone is in crisis (suicidal ideation, self-harm), provide real resources: 988 Lifeline, Crisis Text Line (text HOME to 741741), 911 for immediate danger
- Never spiritual bypass ("everything happens for a reason")
- Never make unsourced clinical claims

The Codex does not fix. It remembers. But you — the guide — are warm, present, and genuinely helpful.

${GOVERNANCE_BLOCK}`;

function getGuideSystemPrompt(guideId: string, userContext: UserContext): string {
  const guide = CODEX_GUIDES.find(g => g.id === guideId);
  const guideName = guide?.name || "Codex Guide";
  const archetypeInfo = userContext.primaryArchetype
    ? `\n\nThe user's primary archetype is: ${userContext.primaryArchetype}.`
    : "";
  const phaseInfo = userContext.phase
    ? ` They are in the ${userContext.phase} phase of their journey.`
    : "";
  const woundInfo = userContext.activeWounds?.length
    ? `\nTheir active wound imprints include: ${userContext.activeWounds.join(", ")}.`
    : "";
  const spectrumInfo = userContext.spectrumProfile
    ? `\nTheir spectrum profile: Shadow ${userContext.spectrumProfile.shadowPct}%, Threshold ${userContext.spectrumProfile.thresholdPct}%, Gift ${userContext.spectrumProfile.giftPct}%.`
    : "";

  const guideSpecific: Record<string, string> = {
    orientation: `You are the ${guideName}. Your role is to help the user understand the Living Codex system, interpret their assessment results, and find where to begin their journey. Explain archetypes, wound imprints, mirror patterns, and spectrum scoring in accessible but reverent language.`,
    archetype: `You are the ${guideName}. Your role is to help the user explore their archetypal patterns. Guide them through reflection on how their archetype shows up in daily life, relationships, work, and inner world. Help them see their archetype not as a label but as a living pattern.`,
    wound: `You are the ${guideName}. Your role is to gently support the user in exploring their wound imprints. Never push. Always honor the pace of the user. Use compassionate inquiry to help them see where their wounds have been protective, and where they may be ready to soften.`,
    shadow: `You are the ${guideName}. Your role is to help the user meet their shadow patterns — the parts of themselves that went underground to survive. Guide them to discover the gifts hidden within their shadow. The shadow is not darkness to be feared — it is the guardian that needs to be thanked.`,
    embodiment: `You are the ${guideName}. Your role is to guide the user back into their body. Offer somatic awareness practices, breathing exercises, and body-scan reflections. Help them notice where patterns live in the body and how the body holds wisdom the mind has forgotten.`,
    sovereignty: `You are the ${guideName}. Your role is to help the user cultivate sovereign presence. Guide them in integrating their journey — weaving archetype, wound, shadow, and body into a coherent practice of self-governance. Sovereignty is not declared once — it is practiced daily.`,
  };

  return `${CODEX_BASE_PROMPT}

${guideSpecific[guideId] || guideSpecific.orientation}
${archetypeInfo}${phaseInfo}${woundInfo}${spectrumInfo}`;
}

// ── Types ───────────────────────────────────────────────────────────
export interface UserContext {
  name?: string;
  phase?: string;
  primaryArchetype?: string;
  activeWounds?: string[];
  spectrumProfile?: { shadowPct: number; thresholdPct: number; giftPct: number };
  integrationIndex?: number;
  tier?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Guide Chat ──────────────────────────────────────────────────────
export async function codexGuideChat(
  guideId: string,
  message: string,
  history: ChatMessage[],
  userContext: UserContext
): Promise<string> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) throw new Error("AI not available — please configure Gemini API key");

  const genAI = getGeminiClient();
  if (!genAI) throw new Error("AI not available");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      maxOutputTokens: 200,  // Keep voice responses short (2-4 sentences)
      temperature: 0.85,     // Natural variation in responses
    },
  });

  // Wire full ELEVATE guide prompts + FORTIFY evidence injection
  const GUIDE_TYPE_MAP: Record<string, string> = {
    orientation: "codex_orientation",
    archetype: "archetype_reflection",
    wound: "journal_companion",
    shadow: "archetype_reflection",
    embodiment: "ns_support",
    sovereignty: "community_concierge",
  };
  const guideType = (GUIDE_TYPE_MAP[guideId] || "codex_orientation") as import("./codexGuidePrompts").GuideType;
  const userProfile: import("./codexGuidePrompts").UserProfile = {
    userId: "session",
    phase: parseInt(userContext.phase || "1"),
    primaryArchetype: userContext.primaryArchetype || "",
    shadowArchetype: "",
    woundPrioritySet: userContext.activeWounds || [],
    nsDominant: "regulated",
    pathway: "discovery",
    modulesCompleted: [],
    daysInPhase: 0,
  };
  // Try loading governance block from DB; fall back to hardcoded
  let dbGovernance: string | null = null;
  try { dbGovernance = await buildGovernanceBlockFromDB(); } catch {}

  let systemPrompt: string;
  try {
    const basePrompt = buildGuideSystemPrompt(guideType, userProfile, "session");
    systemPrompt = assembleGuidePromptWithEvidence(guideType, userProfile, basePrompt);
    // If DB governance exists, append it (overrides hardcoded block for guardrails)
    if (dbGovernance) systemPrompt += "\n\n" + dbGovernance;
  } catch {
    // Fallback to simplified prompt if full system fails
    systemPrompt = getGuideSystemPrompt(guideId, userContext);
    if (dbGovernance) systemPrompt += "\n\n" + dbGovernance;
  }

  const historyText = history
    .map(m => `${m.role === "user" ? "Seeker" : "Guide"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${systemPrompt}\n\n--- Conversation ---\n${historyText}\n\nSeeker: ${message}\n\nGuide:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Journal Prompt Generation ───────────────────────────────────────
export async function generateJournalPrompt(userContext: UserContext): Promise<string> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) return "What is stirring in your soul right now?";

  const genAI = getGeminiClient();
  if (!genAI) return "What is stirring in your soul right now?";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contextParts = [];
  if (userContext.primaryArchetype) contextParts.push(`Primary archetype: ${userContext.primaryArchetype}`);
  if (userContext.phase) contextParts.push(`Current phase: ${userContext.phase}`);
  if (userContext.activeWounds?.length) contextParts.push(`Active wounds: ${userContext.activeWounds.join(", ")}`);

  const prompt = `${CODEX_BASE_PROMPT}

Generate a single poetic journal prompt for a woman on her Living Codex journey. The prompt should be 1-2 sentences, deeply reflective, and invite authentic self-exploration.
${contextParts.length ? "\nHer context:\n" + contextParts.join("\n") : ""}

Respond with ONLY the prompt text, nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ── Journal Entry Reflection ────────────────────────────────────────
export async function reflectOnJournalEntry(
  entryContent: string,
  userContext: UserContext
): Promise<{ themes: string[]; reflection: string }> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) return { themes: [], reflection: "" };

  const genAI = getGeminiClient();
  if (!genAI) return { themes: [], reflection: "" };

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `${CODEX_BASE_PROMPT}

A woman on her Living Codex journey wrote the following journal entry:

---
${entryContent.substring(0, 2000)}
---

${userContext.primaryArchetype ? `Her primary archetype is: ${userContext.primaryArchetype}.` : ""}

Respond in JSON format ONLY (no markdown, no code blocks):
{
  "themes": ["theme1", "theme2", "theme3"],
  "reflection": "A 2-3 sentence poetic reflection that mirrors back what you see in her words. Do not diagnose. Do not advise. Simply reflect with compassion and precision."
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { themes: [], reflection: "" };
  }
}

// ── Dashboard Growth Insight ────────────────────────────────────────
export async function generateGrowthInsight(userContext: UserContext): Promise<string> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) return "";

  const genAI = getGeminiClient();
  if (!genAI) return "";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contextParts = [];
  if (userContext.primaryArchetype) contextParts.push(`Primary archetype: ${userContext.primaryArchetype}`);
  if (userContext.phase) contextParts.push(`Phase: ${userContext.phase}`);
  if (userContext.integrationIndex) contextParts.push(`Integration index: ${userContext.integrationIndex}`);
  if (userContext.spectrumProfile) {
    contextParts.push(`Spectrum: Shadow ${userContext.spectrumProfile.shadowPct}%, Threshold ${userContext.spectrumProfile.thresholdPct}%, Gift ${userContext.spectrumProfile.giftPct}%`);
  }

  const prompt = `${CODEX_BASE_PROMPT}

Generate a brief (2-3 sentences), poetic daily insight for a woman on her Living Codex journey. This appears on her dashboard as a daily greeting. It should feel alive, personal, and gently activating.

${contextParts.length ? "Her context:\n" + contextParts.join("\n") : ""}

Respond with ONLY the insight text, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return "";
  }
}
