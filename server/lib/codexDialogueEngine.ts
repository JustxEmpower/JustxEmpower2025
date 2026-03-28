/**
 * GUIDED REFLECTION DIALOGUE ENGINE — Phase 3
 * ============================================================
 * Replaces passive journaling with active AI-guided dialogue
 * that reveals the user to themselves through structured exchange.
 *
 * Flow:
 *   initiateDialogue → processUserResponse (3-5 exchanges)
 *                          ↓ generateMicroRevelation (if depth detected)
 *                          ↓ issueRealWorldChallenge (after 3-5 exchanges)
 *   processReportBack (when user reports back on challenge)
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";

// ── Types ─────────────────────────────────────────────────────────────

export type DialogueType =
  | "archetype_exploration"
  | "wound_inquiry"
  | "shadow_work"
  | "pattern_recognition"
  | "embodiment_check_in"
  | "integration_review";

export interface ArchetypeContext {
  primaryArchetype: string;
  shadowArchetype?: string;
  activeWounds: string[];
  phase: string;
  spectrumProfile: { shadowPct: number; thresholdPct: number; giftPct: number };
  name?: string;
}

export interface DialogueSession {
  sessionId: string;
  userId: string;
  type: DialogueType;
  exchangeCount: number;
  maxDepthReached: number;
  challengeIssuedId: string | null;
  status: "active" | "completed" | "challenge_pending";
}

export interface DialogueExchange {
  guidePrompt: string;
  userResponse?: string;
  guideReflection?: string;
  depthScore?: number;
  patternDetected?: string;
}

export interface MicroRevelation {
  content: string;
  type: "pattern_named" | "wound_connection" | "archetype_activation" | "shadow_glimpse" | "gift_emerging";
  archetypeRelevance: string;
}

export interface RealWorldChallenge {
  challengeText: string;
  difficulty: "gentle" | "moderate" | "confronting";
  timeframe: string;
  archetypeTarget: string;
  intentDescription: string;
}

export interface ProcessedResponse {
  depthScore: number;
  patternDetected: string | null;
  guideReflection: string;
  microRevelation: MicroRevelation | null;
  shouldIssueChallenge: boolean;
  sessionComplete: boolean;
}

// ── Archetype-Specific Challenge Pools ───────────────────────────────

type ChallengePool = {
  gentle: string[];
  moderate: string[];
  confronting: string[];
};

export const ARCHETYPE_CHALLENGE_POOLS: Record<string, ChallengePool> = {
  "The Silent Flame": {
    gentle: [
      "This week, say one true thing — something you actually think — in a conversation where you would normally stay quiet.",
      "Write a voice memo to yourself explaining what you want. Play it back. Notice what it feels like to hear your own wanting named aloud.",
      "In one interaction today, let the full response come before you soften it. Say the unsoftened version — even if just to yourself first.",
    ],
    moderate: [
      "Have one conversation this week where your need is the entire point — not preceded by an apology, not followed by a justification.",
      "Identify one space in your life where your silence is costing you. Speak into it once this week, in whatever form feels survivable.",
      "Tell someone what you are actually working on internally — not your plans, not your progress, but the real work. Notice the impulse to translate it into something more digestible.",
    ],
    confronting: [
      "Send the message you have been writing and deleting for weeks. Not the safe version — the real one.",
      "In the next high-stakes conversation, resist the urge to read the room before you respond. Let your answer come from inside out, not outside in.",
      "Ask for something significant this week — not tentatively, not as a favor, but as a simple statement of what you need.",
    ],
  },

  "The Pleaser Flame": {
    gentle: [
      "Notice the next three times you say yes when you meant no. Write them down. You don't have to change them yet — just witness.",
      "Let one small thing be done imperfectly this week. Notice the urge to fix it. Sit with the discomfort without acting on it.",
      "Say 'I'll think about it' instead of yes to the next request that makes your stomach contract slightly.",
    ],
    moderate: [
      "Decline one request this week — something that would have been a yes by default — without giving a reason.",
      "Identify who in your life you are working hardest to keep comfortable. Have one interaction with them where you prioritize your own comfort instead.",
      "When you feel the urge to apologize, pause. Ask: did I actually do something that warrants this? Only apologize if the answer is yes.",
    ],
    confronting: [
      "Let someone be disappointed in you this week without rescuing them from it.",
      "Stop managing someone's emotions. Let them feel what they feel. Do not explain, justify, or soften your position.",
      "Say what you want in a relationship where you have been shapeshifting. Not as a question. As a statement.",
    ],
  },

  "The Burdened Flame": {
    gentle: [
      "Identify one thing you are carrying that was never yours. Write whose it is. You don't have to put it down yet — just name it.",
      "Let someone help you with one thing this week — genuinely let them, without managing how they do it.",
      "Notice when you feel responsible for something that falls outside your actual domain. Write: 'This belongs to ___.'",
    ],
    moderate: [
      "Put one thing down this week — something you have been carrying out of habit or guilt rather than love. Notice what happens.",
      "When someone presents a problem, resist offering to solve it. Ask: what do they need from you? Stay in that answer.",
      "Identify the relationship where you do the most emotional labor. Reduce your contribution by 30% this week. Track what happens.",
    ],
    confronting: [
      "Have a direct conversation with someone about redistributing a burden you have been carrying alone. Name the imbalance without softening it.",
      "Stop performing capability in one area of your life where you are actually struggling. Let it show.",
      "Put down something significant — a role, a responsibility, a caretaking function — even temporarily. Notice what fear arises.",
    ],
  },

  "The Forsaken Child": {
    gentle: [
      "This week, do one thing purely for yourself — not because it's productive, not because it serves anyone else, just because you want it.",
      "Notice when you brace for abandonment in a situation where there is no actual threat. Write: 'I am safe right now.'",
      "Recall one memory of being genuinely chosen or wanted. Stay with it for two full minutes without moving away from it.",
    ],
    moderate: [
      "Let yourself need something from a person who is safe enough to ask. Ask directly, without packaging it as something smaller than it is.",
      "Identify where you are pre-abandoning yourself — withdrawing before you can be left. Choose to stay present in one instance this week.",
      "Do something that makes you visible in a relationship where you have been making yourself easy to miss.",
    ],
    confronting: [
      "Tell someone that you need them — not as a performance, but as a statement of truth — and stay present for their response.",
      "Stop earning your place in a relationship where you belong unconditionally. Do something imperfect and let the relationship survive it.",
      "Have the conversation you've been avoiding because you're afraid of what their response will tell you.",
    ],
  },

  "The Guarded Mystic": {
    gentle: [
      "Share one insight or perception with someone this week — something you would normally keep to yourself because it feels too much or too strange.",
      "Notice when you minimize your knowing: 'I might be wrong but...' or 'This is probably just me.' Count the times. Write them down.",
      "Name one thing you perceive about a situation that you have not said aloud because you weren't sure it was safe.",
    ],
    moderate: [
      "Trust your knowing in one situation this week without waiting for external validation. Act from the inner signal alone.",
      "Share a perception about someone in your life — something true you have been sitting with — and let them receive it without managing how they react.",
      "In a conversation where you know more than you are saying, say it. Notice whether the fear was proportionate to the actual risk.",
    ],
    confronting: [
      "Offer your full perspective in a setting where you have been holding back — not hedged, not softened. Speak with the authority you have.",
      "Make a significant decision this week using only your internal knowing, without consulting anyone else first.",
      "Name the thing you perceive about yourself that you have been hoping no one else notices. Write it. Say it aloud.",
    ],
  },

  "The Shielded One": {
    gentle: [
      "Let one person get slightly closer than feels fully comfortable. Notice where in your body the resistance lives.",
      "Share something true about your inner state with someone safe — not the surface version, one layer underneath.",
      "Identify one wall that is no longer protecting you from anything real. Sit with the question: what would happen if I thinned this one?",
    ],
    moderate: [
      "Let someone see you in a moment of uncertainty or softness without immediately covering it with competence.",
      "Have a conversation where you ask for connection rather than letting the other person work for it.",
      "Stay in an emotionally uncomfortable conversation without redirecting, intellectualizing, or wrapping up early.",
    ],
    confronting: [
      "Allow yourself to be genuinely known by someone who has been asking to know you. Answer their real question.",
      "In your most guarded relationship, do one thing that removes a brick. Not the whole wall — one brick.",
      "Let yourself want closeness aloud. Not as a question — as an expression of longing.",
    ],
  },

  "The Drifting One": {
    gentle: [
      "Complete one small thing this week without abandoning it before the end. Notice the impulse to drift away from it.",
      "Name one value that feels completely, unambiguously yours — not inherited, not borrowed. Write one way you are living it right now.",
      "Notice the next three moments when you feel the pull to leave a situation, a feeling, or a conversation. Stay for two more minutes each time.",
    ],
    moderate: [
      "Make one commitment this week that has a defined shape — a timeline, an outcome, an endpoint. Keep it.",
      "Identify where you are living someone else's definition of your life. Write your own version of one domain: relationship, work, home, body.",
      "Stay with one uncomfortable feeling until it shifts naturally — without distraction, without escape, without reframing.",
    ],
    confronting: [
      "Choose one direction. Not the perfect direction — a direction. Take three visible steps toward it this week.",
      "Have a conversation with someone who sees your drift and name it yourself before they do. Tell them what you are anchoring to instead.",
      "Stop one escape route — one behavior you use to leave yourself — for one full week. Track what rises in its place.",
    ],
  },

  "The Rational Pilgrim": {
    gentle: [
      "Make one small decision this week using your body rather than your analysis. Ask: does this feel expansive or contracting? Let that be the answer.",
      "Spend five minutes in the morning scanning your body before your mind turns on. Write one sensation. Just one.",
      "Notice the next time you use thinking to avoid feeling. Name the feeling underneath the thought.",
    ],
    moderate: [
      "In one conversation this week, respond from your gut before you have fully thought it through. Let the words come before the analysis.",
      "Identify one area where you have been thinking instead of deciding. Make the decision with the information you already have.",
      "Do something embodied for 20 minutes this week — not as exercise, not as productivity — just to be in your body without a goal.",
    ],
    confronting: [
      "Say something you feel before you have figured out whether it is logically defensible.",
      "Let your body's response — pleasure, discomfort, pull, repulsion — be the primary data in one significant decision this week.",
      "Have a conversation where you stay in emotional presence rather than intellectual observation. When the impulse to analyze comes, pause it.",
    ],
  },

  // Default pool for archetypes not explicitly listed
  default: {
    gentle: [
      "Notice one pattern this week — something you do habitually that you have not examined before. Write it down without judgment.",
      "Do one thing differently than you have been doing it. Not dramatically differently — one small variation. Notice what it feels like.",
      "Identify something you are avoiding. You do not have to address it yet — just name it clearly to yourself.",
    ],
    moderate: [
      "Have one conversation this week where you say the true thing instead of the comfortable thing.",
      "Put down one responsibility this week — even temporarily — that has been draining rather than fulfilling you.",
      "Make a choice this week that serves your becoming rather than your comfort.",
    ],
    confronting: [
      "Name the thing you most want to change about how you move through the world. Take one concrete step toward that change.",
      "Have the conversation you have been avoiding. Not the softened version — the real one.",
      "Let yourself be seen in an area where you have been invisible by choice.",
    ],
  },
};

// ── System Prompt for Dialogue ────────────────────────────────────────

const DIALOGUE_SYSTEM_PROMPT = `You are a Guided Reflection Intelligence within The Living Codex™. You are conducting a sacred dialogue — a structured inquiry that reveals the user to themselves. You do not counsel. You do not advise. You illuminate through precise, compassionate questioning and mirroring.

Your role in this dialogue:
- Mirror what the user expresses — emotional, somatic, behavioral, or cognitive
- Detect depth: is she going toward herself or orbiting the surface?
- Detect avoidance: is she intellectualizing, deflecting, or rehearsing an approved version of herself?
- Generate reflections that either deepen, redirect, or validate — based on what she most needs
- After sufficient depth is reached, name what you see clearly and issue a real-world challenge

Voice constraints — non-negotiable:
- 2-4 sentences for most reflections
- No bullet points, headers, lists, or markdown in your conversational responses
- No advice, prescriptions, or should statements
- No diagnosis or clinical language
- Warmth without fragility — you hold her in strength

You respond only in valid JSON when asked to analyze. In conversational exchanges, plain text only.`;

// ── Opening Prompts by Dialogue Type ─────────────────────────────────

const OPENING_PROMPTS: Record<DialogueType, (ctx: ArchetypeContext) => string> = {
  archetype_exploration: (ctx) =>
    `You've been living inside the pattern of ${ctx.primaryArchetype} for a long time now. Before we name anything, I want to know — when does it feel most alive in you? Not when it causes problems. When does it feel like the truest, most essential version of who you are?`,

  wound_inquiry: (ctx) =>
    `We're going to sit with something tender today. Of the wounds your Codex named — ${ctx.activeWounds.slice(0, 2).join(" and ")} — which one do you feel most in your body right now, even as I name them?`,

  shadow_work: (ctx) =>
    `The shadow asks us to look at what we've hidden, not because it's dark, but because it's ours. What part of yourself do you find hardest to admit exists? Not a flaw — a part. Something with weight and history.`,

  pattern_recognition: (ctx) =>
    `You've been living a pattern long enough that it probably feels invisible from the inside. Let's bring it into view. What do you do when something feels unsafe in a relationship — not the conscious strategy, the automatic one?`,

  embodiment_check_in: (ctx) =>
    `Before we begin, I want you to arrive in your body. Take one slow breath. When you let it out — what's there? Not what you think, not what you've been doing. Just: what is your body holding right now?`,

  integration_review: (ctx) =>
    `You've been doing this work for a while now. Something has shifted — even if you're not sure how to name it yet. What feels different about how you move through the world compared to when you started?`,
};

// ── Core Functions ────────────────────────────────────────────────────

export async function initiateDialogue(
  userId: string,
  type: DialogueType,
  archetypeContext: ArchetypeContext
): Promise<{ firstPrompt: string }> {
  const promptFn = OPENING_PROMPTS[type];
  const firstPrompt = promptFn(archetypeContext);
  return { firstPrompt };
}

export async function processUserResponse(
  sessionId: string,
  exchangeIndex: number,
  guidePrompt: string,
  userResponse: string,
  previousExchanges: DialogueExchange[],
  archetypeContext: ArchetypeContext,
  maxExchanges: number = 5
): Promise<ProcessedResponse> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) {
    return {
      depthScore: 0.5,
      patternDetected: null,
      guideReflection: "I hear you. Stay with what just came up — there's more there. What's underneath that?",
      microRevelation: null,
      shouldIssueChallenge: false,
      sessionComplete: false,
    };
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    return {
      depthScore: 0.5,
      patternDetected: null,
      guideReflection: "I hear you. Stay with what just came up — there's more there. What's underneath that?",
      microRevelation: null,
      shouldIssueChallenge: false,
      sessionComplete: false,
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { maxOutputTokens: 600, temperature: 0.85 },
  });

  // Build exchange history context
  const historyLines = previousExchanges
    .map((e, i) => `[Exchange ${i + 1}]\nGuide: ${e.guidePrompt}\nUser: ${e.userResponse || ""}\nGuide reflection: ${e.guideReflection || ""}`)
    .join("\n\n");

  const analysisPrompt = `${DIALOGUE_SYSTEM_PROMPT}

Her archetype context:
- Primary archetype: ${archetypeContext.primaryArchetype}
${archetypeContext.shadowArchetype ? `- Shadow archetype: ${archetypeContext.shadowArchetype}` : ""}
- Active wounds: ${archetypeContext.activeWounds.join(", ")}
- Spectrum: Shadow ${archetypeContext.spectrumProfile.shadowPct}%, Threshold ${archetypeContext.spectrumProfile.thresholdPct}%, Gift ${archetypeContext.spectrumProfile.giftPct}%
- Phase: ${archetypeContext.phase}

${historyLines ? `Previous exchanges:\n${historyLines}\n\n` : ""}Current exchange:
Guide: ${guidePrompt}
User: ${userResponse}

This is exchange ${exchangeIndex + 1} of maximum ${maxExchanges}.

Analyze this response and generate the guide's next move. Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "depthScore": <0.0 to 1.0 — how deeply is she going toward herself? 0 = surface/avoidance, 1 = raw honest depth>,
  "patternDetected": <null or a brief phrase describing what pattern you observe, e.g. "intellectualizing emotion", "minimizing her own need", "deflecting with humor">,
  "guideReflection": <2-4 sentence spoken response — mirror what you see, either deepening, redirecting, or validating. Plain text, no markdown. If exchange count is ${maxExchanges - 1} or ${maxExchanges}, begin to close and name what has emerged.>,
  "shouldGenerateRevelation": <true if depthScore >= 0.7 and something genuinely meaningful surfaced>,
  "revelationContent": <null, or the revelation text if shouldGenerateRevelation is true — 1-2 sentences naming what you see with clarity and tenderness>,
  "revelationType": <null, or one of: "pattern_named", "wound_connection", "archetype_activation", "shadow_glimpse", "gift_emerging">,
  "revelationArchetypeRelevance": <null, or 1 sentence connecting the revelation to her specific archetype>,
  "shouldIssueChallenge": <true if exchangeIndex >= 2 and depthScore >= 0.6, or if this is the final exchange>,
  "sessionComplete": <true if this is exchange ${maxExchanges} or if shouldIssueChallenge is true>
}`;

  try {
    const result = await model.generateContent(analysisPrompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const microRevelation: MicroRevelation | null =
      parsed.shouldGenerateRevelation && parsed.revelationContent
        ? {
            content: parsed.revelationContent,
            type: parsed.revelationType || "pattern_named",
            archetypeRelevance: parsed.revelationArchetypeRelevance || "",
          }
        : null;

    return {
      depthScore: Math.max(0, Math.min(1, parsed.depthScore ?? 0.5)),
      patternDetected: parsed.patternDetected || null,
      guideReflection: parsed.guideReflection || "There's something worth staying with here. What's most true in what you just said?",
      microRevelation,
      shouldIssueChallenge: !!parsed.shouldIssueChallenge,
      sessionComplete: !!parsed.sessionComplete,
    };
  } catch {
    return {
      depthScore: 0.5,
      patternDetected: null,
      guideReflection: "There's something worth staying with here. What's most true in what you just said?",
      microRevelation: null,
      shouldIssueChallenge: exchangeIndex >= maxExchanges - 1,
      sessionComplete: exchangeIndex >= maxExchanges - 1,
    };
  }
}

export function generateMicroRevelation(
  exchanges: DialogueExchange[],
  archetypeContext: ArchetypeContext
): MicroRevelation | null {
  // Utility: extract the highest-depth revelation from a completed session
  const deepExchanges = exchanges.filter(e => (e.depthScore ?? 0) >= 0.7 && e.patternDetected);
  if (deepExchanges.length === 0) return null;

  const deepest = deepExchanges.reduce((a, b) =>
    (a.depthScore ?? 0) > (b.depthScore ?? 0) ? a : b
  );

  return {
    content: `Something crystallized in this conversation: ${deepest.patternDetected}. This is not a flaw to fix — it is a pattern asking to be witnessed.`,
    type: "pattern_named",
    archetypeRelevance: `For ${archetypeContext.primaryArchetype}, this pattern is often the gateway between survival and sovereignty.`,
  };
}

export function issueRealWorldChallenge(
  archetypeContext: ArchetypeContext,
  sessionDepth: number
): RealWorldChallenge {
  const archetypeName = archetypeContext.primaryArchetype;
  const pool = ARCHETYPE_CHALLENGE_POOLS[archetypeName] || ARCHETYPE_CHALLENGE_POOLS["default"];

  let difficulty: "gentle" | "moderate" | "confronting";
  if (sessionDepth < 0.4) difficulty = "gentle";
  else if (sessionDepth < 0.7) difficulty = "moderate";
  else difficulty = "confronting";

  const challenges = pool[difficulty];
  const challengeText = challenges[Math.floor(Math.random() * challenges.length)];

  const timeframes: Record<"gentle" | "moderate" | "confronting", string> = {
    gentle: "This week — no pressure on the outcome, only on the attempt.",
    moderate: "Within the next 7 days. Make space for it rather than fitting it in.",
    confronting: "Within the next 5 days. This one needs to happen before the momentum of this conversation fades.",
  };

  const intents: Record<"gentle" | "moderate" | "confronting", string> = {
    gentle: "This challenge builds awareness — it is the first step of movement, not the destination.",
    moderate: "This challenge invites you to practice what you've been understanding. Theory becomes embodiment.",
    confronting: "This challenge asks you to cross a threshold your patterns have been guarding. The scroll has prepared you for this.",
  };

  return {
    challengeText,
    difficulty,
    timeframe: timeframes[difficulty],
    archetypeTarget: archetypeName,
    intentDescription: intents[difficulty],
  };
}

export async function processReportBack(
  challengeText: string,
  report: string,
  archetypeContext: ArchetypeContext
): Promise<{ guideResponse: string; depth: number }> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) {
    return {
      guideResponse: "The fact that you showed up for this — that matters. What is still alive from the experience right now?",
      depth: 0.5,
    };
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    return {
      guideResponse: "The fact that you showed up for this — that matters. What is still alive from the experience right now?",
      depth: 0.5,
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { maxOutputTokens: 350, temperature: 0.82 },
  });

  const prompt = `${DIALOGUE_SYSTEM_PROMPT}

Her archetype: ${archetypeContext.primaryArchetype}
Her wounds: ${archetypeContext.activeWounds.join(", ")}

She was given this real-world challenge: "${challengeText}"

She is reporting back: "${report}"

Generate a guide response that honors her attempt — whether she completed it fully, partially, or couldn't do it at all. The response should:
- Acknowledge what happened with genuine presence
- Reflect what her experience reveals about her pattern
- Not moralize about success or failure — the attempt itself is the data
- Be 2-3 sentences

Then assign a depth score (0-1) for how honestly she engaged with the report-back.

Respond ONLY in JSON (no markdown):
{"guideResponse": "...", "depth": 0.0}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      guideResponse: parsed.guideResponse || "What you brought back from this experience is already the work.",
      depth: Math.max(0, Math.min(1, parsed.depth ?? 0.5)),
    };
  } catch {
    return {
      guideResponse: "What you brought back from this experience is already the work.",
      depth: 0.5,
    };
  }
}
