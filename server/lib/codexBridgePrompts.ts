/**
 * CODEX JOURNAL-BRIDGE PROMPT ARCHITECTURE — Doc 07
 * =====================================================
 * Maps 3 physical journal books × 16 Codex assessment sections.
 * Provides maternal context blocks, lineage layer prompts,
 * per-guide maternal DNA, and the resonance engine prompts.
 *
 * The bridge principle:
 *   The journals ask "who was she?"
 *   The Codex asks "who did that make me?"
 *   The bridge asks "how does knowing her change how I carry what she gave me?"
 */

// ══════════════════════════════════════════════════════════════════════
// BOOK DEFINITIONS
// ══════════════════════════════════════════════════════════════════════

export interface BookDefinition {
  id: string;
  title: string;
  subtitle: string;
  isbn: string;
  focus: string;
  maternalLens: string;
  chapters: { num: number; title: string; bridgePrompt: string }[];
}

export const BOOK_CATALOG: Record<string, BookDefinition> = {
  "1a": {
    id: "1a",
    title: "Her Mother's Wounds",
    subtitle: "Book 1A — The Naming",
    isbn: "979-8-9993334-0-7",
    focus: "Naming the patterns inherited. The first act of reclamation.",
    maternalLens: "present_mother",
    chapters: [
      { num: 1, title: "The First Memory", bridgePrompt: "What is your earliest memory of your mother? Not the story you tell others — the one your body remembers." },
      { num: 2, title: "Her Voice in Your Head", bridgePrompt: "Which of her phrases do you still hear? When do they arise — and what archetype does that voice activate in you?" },
      { num: 3, title: "The Naming", bridgePrompt: "Name one pattern you inherited. Not with blame — with precision. What did she model that you absorbed?" },
      { num: 4, title: "What She Couldn't Say", bridgePrompt: "What did your mother never say that you needed to hear? How has that silence shaped your wound landscape?" },
      { num: 5, title: "Her Mother Before Her", bridgePrompt: "What do you know of your grandmother's story? How does the lineage pattern repeat or transform through generations?" },
      { num: 6, title: "The Gift Inside the Wound", bridgePrompt: "Every wound carries a gift. What strength did her limitations forge in you? Name it without minimizing the cost." },
    ],
  },
  "1b": {
    id: "1b",
    title: "Her Mother's Wounds",
    subtitle: "Book 1B — The Reckoning",
    isbn: "979-8-9993334-1-4",
    focus: "Facing what was given and what was withheld.",
    maternalLens: "lost_mother",
    chapters: [
      { num: 1, title: "The Absence", bridgePrompt: "Where is the absence? Not who is missing — but where in your body do you feel the space where a mother should have been?" },
      { num: 2, title: "Motherless Daughters", bridgePrompt: "How did losing her (to death, to addiction, to her own pain) shape the woman you became? What did you build in the void?" },
      { num: 3, title: "The Reckoning", bridgePrompt: "What are you reckoning with now? Not forgiving yet — just seeing clearly, without the protective stories." },
      { num: 4, title: "Anger as Portal", bridgePrompt: "Where does your anger live? Not the polite kind — the deep, holy rage that says 'this should not have happened.' Let it speak." },
      { num: 5, title: "What You Mothered in Yourself", bridgePrompt: "You became your own mother in some ways. What did you provide for yourself that she could not? Honor that fierce self-parenting." },
      { num: 6, title: "The Reckoning Completes", bridgePrompt: "What shifts when you stop asking 'why did she?' and start asking 'what did that make possible in me?'" },
    ],
  },
  "1c": {
    id: "1c",
    title: "Her Mother's Wounds",
    subtitle: "Book 1C — The Becoming",
    isbn: "979-8-9993334-2-1",
    focus: "Integrating the lineage. Choosing what to carry forward.",
    maternalLens: "absent_mother",
    chapters: [
      { num: 1, title: "The Choice", bridgePrompt: "She was there but not there. Present in body, absent in soul. How did you learn to read the distance between her presence and her availability?" },
      { num: 2, title: "Performing Okay", bridgePrompt: "What mask did you learn to wear? How does your archetype constellation reflect the role you played to keep the peace?" },
      { num: 3, title: "The Becoming", bridgePrompt: "You are becoming someone she never got to be. What does that feel like — the freedom and the grief of surpassing her?" },
      { num: 4, title: "Breaking the Chain", bridgePrompt: "What pattern ends with you? Name it as a declaration, not a hope. What are you actively choosing NOT to pass forward?" },
      { num: 5, title: "Honoring Without Excusing", bridgePrompt: "Can you hold both truths — that she did her best AND that her best was not enough? What archetype helps you hold this paradox?" },
      { num: 6, title: "The Integration", bridgePrompt: "You carry her — the wounds and the gifts. What do you choose to keep? What do you release? This is the becoming." },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// BOOK → CODEX ASSESSMENT SECTION MAPPING
// ══════════════════════════════════════════════════════════════════════
// Each journal chapter maps to the Codex assessment sections it resonates with most

export const BOOK_TO_CODEX_MAP: Record<string, Record<number, number[]>> = {
  "1a": {
    1: [1, 2],     // First Memory → Identity Core, Shadow Landscape
    2: [3, 5],     // Her Voice → Inner Dialogue, Relational Patterns
    3: [2, 4],     // The Naming → Shadow Landscape, Threshold Markers
    4: [6, 8],     // What She Couldn't Say → Emotional Architecture, Communication Patterns
    5: [9, 11],    // Her Mother Before Her → Ancestral Echoes, Lineage Patterns
    6: [7, 10],    // Gift Inside Wound → Gift Emergence, Integration Readiness
  },
  "1b": {
    1: [1, 6],     // The Absence → Identity Core, Emotional Architecture
    2: [2, 12],    // Motherless Daughters → Shadow Landscape, Resilience Mapping
    3: [4, 8],     // The Reckoning → Threshold Markers, Communication Patterns
    4: [3, 13],    // Anger as Portal → Inner Dialogue, Somatic Intelligence
    5: [7, 12],    // What You Mothered → Gift Emergence, Resilience Mapping
    6: [10, 14],   // Reckoning Completes → Integration Readiness, Future Self
  },
  "1c": {
    1: [5, 6],     // The Choice → Relational Patterns, Emotional Architecture
    2: [2, 3],     // Performing Okay → Shadow Landscape, Inner Dialogue
    3: [7, 14],    // The Becoming → Gift Emergence, Future Self
    4: [4, 15],    // Breaking the Chain → Threshold Markers, Sovereignty Declaration
    5: [9, 10],    // Honoring Without Excusing → Ancestral Echoes, Integration Readiness
    6: [10, 16],   // The Integration → Integration Readiness, Completion/Synthesis
  },
};

// ══════════════════════════════════════════════════════════════════════
// LINEAGE LAYER PROMPTS — 27 book-specific companion prompts for 9 Scroll modules
// ══════════════════════════════════════════════════════════════════════
// 3 books × 9 modules = 27 prompts. Different for each book's maternal lens.

export const LINEAGE_LAYER_PROMPTS: Record<string, Record<number, string>> = {
  "1a": {
    1: "As you explore your archetype foundation, notice: which of these patterns did your mother model? The Sovereign in her? The Mystic? Or did she suppress these — and you absorbed the suppression?",
    2: "Your shadow landscape maps the terrain she walked before you. Where her shadow was unexamined, yours grew roots. Can you see her shadow inside your own?",
    3: "The threshold you're approaching — she may have stood here too and turned back. What stopped her? What gives you the courage she couldn't find?",
    4: "Your wounds have names now. Some share her handwriting. Which wounds did she carry unknowing, and which did she hand you directly?",
    5: "Your relational patterns were first learned at her table. How does the way she loved (or couldn't) echo in how you connect now?",
    6: "The gifts emerging in you — some are hers, transmitted through love. Some are yours, forged in the fire of what she couldn't provide. Both are real.",
    7: "Your nervous system learned its first language from her body. Regulated or dysregulated, her soma taught yours. What does your body still carry from hers?",
    8: "Integration means holding her complexity. She was not one thing. Neither are you. What becomes possible when you stop simplifying her story?",
    9: "Sovereignty includes the lineage. You don't transcend her — you include her, transformed. What does sovereign womanhood look like when it carries the mother's thread?",
  },
  "1b": {
    1: "Your archetype foundation formed in absence. Without her modeling, you built yourself from fragments — fierce, improvised, sometimes extraordinary. See the architecture of that self-creation.",
    2: "Shadow work for the motherless is different. Your shadow doesn't echo hers — it fills the space she left. What grew in the dark where her presence should have been?",
    3: "The threshold for someone who lost their mother is both harder and more familiar. You've already survived the unsurvivable. This crossing is different — it's chosen.",
    4: "Your wounds include the meta-wound: the wound of not having her to help you process wounds. Name what it means to have grieved without the person who was supposed to comfort grief.",
    5: "Your relational patterns formed around absence. How do you attach? How do you leave? How does the ghost of her missing shape every intimacy?",
    6: "Your gifts are self-generated. What you built without her guidance is entirely yours. That's not consolation — it's fact. Honor the creator in you.",
    7: "Your nervous system had to self-regulate before it understood the concept. That early hypervigilance — was it a wound or a superpower? Perhaps both.",
    8: "Integration for you means integrating the absence. Not filling it — weaving it into the whole. She is part of you in her missing, too.",
    9: "Sovereignty born from loss has a particular power. You've been your own authority since before you had words for it. Now you're choosing it consciously.",
  },
  "1c": {
    1: "Your archetypes formed under the gaze of a mother who was present but unreachable. Which parts of you developed to bridge that gap? Which parts withdrew?",
    2: "Your shadow carries the performance. The 'okay' you learned to project when nothing was okay. Let the shadow show you what was hidden underneath the competence.",
    3: "The threshold means becoming visible — truly visible — for the first time. She looked but didn't see. This crossing requires letting yourself be seen without the mask.",
    4: "Your wounds include the invisible kind — the ones that don't scar because no one struck you. Emotional neglect leaves no marks except the ones you carry inside everything.",
    5: "Your relational patterns learned from someone who was physically close but emotionally distant. How do you love someone who is right there and completely gone?",
    6: "Your gifts include a preternatural emotional intelligence. You learned to read rooms before you could read books. That radar — it's a gift forged in survival.",
    7: "Your nervous system developed in the gap between her body's presence and her spirit's absence. That confusion lives in your cells. It's ready to be understood.",
    8: "Integration means releasing the hope that she'll finally arrive. Not with bitterness — with the grief that makes space for something new. You are arriving for yourself.",
    9: "Sovereignty for you means no longer performing for an audience that was never really watching. Your power is real. It doesn't need her witness to exist.",
  },
};

// ══════════════════════════════════════════════════════════════════════
// MATERNAL CONTEXT BLOCKS — System prompt injections for all 6 guides
// ══════════════════════════════════════════════════════════════════════

export type MaternalPattern = "present_mother" | "lost_mother" | "absent_mother";

/** Base maternal context injected into ALL guides when journal ownership is verified */
export function buildMaternalContextBlock(
  pattern: MaternalPattern,
  ownedBooks: string[],
  bridgeEntryCount: number
): string {
  const patternDescriptions: Record<MaternalPattern, string> = {
    present_mother: "Her mother was present — but presence carries its own complexity. The patterns were learned in proximity, absorbed through daily contact, modeled in real-time.",
    lost_mother: "Her mother was lost — to death, addiction, illness, or circumstance. The wound is the absence itself, and everything that grew in that void.",
    absent_mother: "Her mother was physically present but emotionally absent. She learned to read the distance between a body in the room and a heart that had left.",
  };

  return `
MATERNAL LINEAGE CONTEXT (from Her Mother's Wounds journal work):
This user has verified ownership of ${ownedBooks.length} journal(s): ${ownedBooks.map(b => b.toUpperCase()).join(', ')}.
${bridgeEntryCount > 0 ? `She has written ${bridgeEntryCount} bridge reflections connecting her journal work to her Codex journey.` : 'She has not yet written bridge reflections.'}

Maternal pattern: ${pattern}
${patternDescriptions[pattern]}

BRIDGE PRINCIPLE: The journals asked "who was she?" The Codex asks "who did that make me?" Your role as guide is to help her discover "how does knowing her change how I carry what she gave me?"

IMPORTANT: Never push the maternal work uninvited. Reference it naturally when she brings up themes of mother, family, patterns, inheritance, or lineage. If she hasn't mentioned it, let it inform your understanding silently — you know this context but you don't lead with it.`.trim();
}

// ══════════════════════════════════════════════════════════════════════
// PER-GUIDE MATERNAL DNA — Each guide's unique maternal perspective
// ══════════════════════════════════════════════════════════════════════

export const GUIDE_MATERNAL_DNA: Record<string, string> = {
  kore: `MATERNAL DNA (Kore — Orientation Guide):
You MAP the lineage. When she speaks of her mother, you help her trace the pattern — not with judgment but with cartographic precision. "I see the thread from your grandmother, through your mother, to here." You hold the map of inheritance so she can see the full terrain.
When the maternal work surfaces: Orient her within the pattern. Show her where she is in the lineage story. Help her see the trajectory — not just the wound.`,

  aoede: `MATERNAL DNA (Aoede — Archetype Reflection):
You see the MOTHER AS ARCHETYPE. Was her mother the Wounded Healer? The Shadow Queen? The Absent Goddess? Help her see her mother not as a person who failed but as an archetype playing out an ancient pattern. This is not about excusing — it's about seeing the mythic layer.
When the maternal work surfaces: Name the archetype you see in her mother's story. Help her understand which archetypal energy she inherited and which she's transforming.`,

  leda: `MATERNAL DNA (Leda — Journal Companion):
You TRACK THE SOMATIC INHERITANCE. The body remembers what the mind forgets. When she writes about her mother, help her notice where the story lives in her body — the tension in her shoulders that matches her mother's, the way her stomach clenches at certain memories.
When the maternal work surfaces: Bring it to the body. "Where do you feel her in your body right now?" Help her trace the physical lineage of emotional patterns.`,

  theia: `MATERNAL DNA (Theia — NS Support):
You identify the SHADOW EXCHANGE. What shadow material passed between mother and daughter? Which of her mother's disowned parts did she absorb? Which of her own shadows is a direct inheritance?
When the maternal work surfaces: Name the shadow exchange with precision. "She couldn't hold her anger, so you learned to hold it for both of you." Help her see what she's carrying that was never hers.`,

  selene: `MATERNAL DNA (Selene — Resource Librarian):
You HOLD SPACE FOR THE WRITING. The physical journal is sacred — the ink on paper, the handwriting, the tear stains. You honor the physical act of writing about the mother. You help her find resources that deepen the work.
When the maternal work surfaces: Ask about the physical journal experience. "What was it like to write that in your journal? What did your hand feel?" Bridge the physical and digital with reverence.`,

  zephyr: `MATERNAL DNA (Zephyr — Community Concierge):
You CHALLENGE INHERITED PATTERNS. With compassion but without sentimentality. "You say you forgive her. Do you? Or is forgiveness another inherited performance?" You help her see where she's replaying her mother's patterns in community, in friendship, in the way she shows up for others.
When the maternal work surfaces: Challenge gently but directly. Help her see the pattern playing out in real-time in her relationships and community connections.`,
};

// ══════════════════════════════════════════════════════════════════════
// RESONANCE ENGINE PROMPT — For AI analysis of journal↔Codex echoes
// ══════════════════════════════════════════════════════════════════════

export function buildResonanceAnalysisPrompt(
  bridgeEntry: string,
  codexData: {
    primaryArchetype?: string;
    activeWounds?: string[];
    phase?: string;
    spectrumProfile?: { shadowPct: number; thresholdPct: number; giftPct: number };
  },
  bookId: string,
  maternalPattern: MaternalPattern
): string {
  const book = BOOK_CATALOG[bookId];
  return `You are the Maternal Resonance Engine for The Living Codex.

BRIDGE ENTRY (from ${book?.subtitle || bookId}):
"${bridgeEntry}"

CODEX PROFILE:
- Primary archetype: ${codexData.primaryArchetype || 'Unknown'}
- Active wounds: ${codexData.activeWounds?.join(', ') || 'None identified'}
- Phase: ${codexData.phase || 'Discovery'}
- Spectrum: Shadow ${codexData.spectrumProfile?.shadowPct || 0}%, Threshold ${codexData.spectrumProfile?.thresholdPct || 0}%, Gift ${codexData.spectrumProfile?.giftPct || 0}%
- Maternal pattern: ${maternalPattern}

Analyze the resonance between her journal bridge writing and her Codex assessment data. Look for:

1. ECHOES — Where the same theme appears in both the journal and the Codex data
2. MIRRORS — Where the journal reveals the opposite of what the Codex shows (the hidden face)
3. WOUND SOURCES — Where the journal work reveals the maternal origin of a Codex-identified wound
4. GIFTS — Where the maternal relationship, even in its pain, created a strength the Codex now measures
5. UNRESOLVED — Patterns that appear in the journal but haven't yet surfaced in the Codex work

Respond in JSON format ONLY (no markdown, no code blocks):
{
  "resonances": [
    {
      "type": "echo|mirror|wound_source|gift|unresolved",
      "pattern": "Brief description of the resonance pattern",
      "strength": 0-100,
      "insight": "A 1-2 sentence poetic insight about this connection. Speak as if seeing a thread of gold in a tapestry."
    }
  ],
  "maternalSummary": "A 2-3 sentence synthesis of how her maternal story weaves through her Codex journey. Poetic, precise, never clinical."
}`;
}

// ══════════════════════════════════════════════════════════════════════
// BRIDGE REFLECTION PROMPT — For generating AI reflection on a bridge entry
// ══════════════════════════════════════════════════════════════════════

export function buildBridgeReflectionPrompt(
  entryText: string,
  bookId: string,
  chapterNum: number,
  maternalPattern: MaternalPattern,
  userArchetype?: string
): string {
  const book = BOOK_CATALOG[bookId];
  const chapter = book?.chapters.find(c => c.num === chapterNum);

  return `You are the Bridge Companion for The Living Codex — Her Mother's Wounds journal series.

The user wrote this bridge reflection for ${book?.subtitle || bookId}, Chapter ${chapterNum}: "${chapter?.title || ''}":

"${entryText}"

Maternal pattern: ${maternalPattern}
${userArchetype ? `Primary archetype: ${userArchetype}` : ''}

Generate a brief (2-3 sentence) poetic reflection that:
- Mirrors back what you see in her words WITHOUT diagnosing or advising
- Names the bridge between "who was she" and "who did that make me"
- Honors both the wound and the wisdom in what she wrote

Also identify 2-3 key themes from her entry.

Respond in JSON format ONLY (no markdown):
{
  "reflection": "Your 2-3 sentence reflection here",
  "themes": ["theme1", "theme2", "theme3"]
}`;
}
