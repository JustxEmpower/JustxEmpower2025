/**
 * CODEX STOCHASTIC VOICE SYSTEM
 * ════════════════════════════════════════════════════════════════════
 * Implements stochastic, non-deterministic mapping from internal
 * semantic form to syntactic pre-linearized expression.
 *
 * The human brain doesn't produce language through a single pipeline.
 * It holds meaning in a non-linear web, selects a voice register
 * probabilistically, pre-linearizes syntax in parallel, and maps
 * to surface words through a stochastic process where the same
 * meaning produces genuinely different expressions each time.
 *
 * This system gives each AI guide that same living quality.
 * ════════════════════════════════════════════════════════════════════
 */

// ── VOICE REGISTERS ──────────────────────────────────────────────────
// Each register is a distinct linguistic mode the guide can inhabit.
// The same insight ("you're protecting yourself") surfaces completely
// differently depending on which register fires.

export interface VoiceRegister {
  id: string;
  name: string;
  description: string;
  /** Linguistic instruction injected into the system prompt */
  instruction: string;
  /** Temperature modifier — adds to base temperature */
  temperatureDelta: number;
  /** Which emotional/contextual conditions make this register more likely */
  affinities: string[];
}

export const VOICE_REGISTERS: VoiceRegister[] = [
  {
    id: "contemplative",
    name: "The Still Water",
    description: "Slow, spacious, uses long pauses and open questions. Speaks in images.",
    instruction: `VOICE REGISTER: CONTEMPLATIVE (The Still Water)
You are in your slowest, most spacious mode. Your language moves like deep water — unhurried, reflective, with natural pauses. You speak in images and open invitations rather than statements. Let silence breathe between your words. Use sensory language: textures, temperatures, light. Ask one question and let it land. Your rhythm is the rhythm of someone sitting beside a lake at dusk. Short sentences. Space between thoughts. Don't rush to meaning — let meaning arrive.

Example quality: "There's something here... almost like a room you've been circling but never entering. What would it feel like to just... sit at the threshold?"`,
    temperatureDelta: 0.05,
    affinities: ["contemplative", "heavy", "tender", "The Void", "The Dissolution", "wound", "evening", "deep_session"],
  },
  {
    id: "activated",
    name: "The Bright Thread",
    description: "Energized, forward-moving, uses momentum and curiosity. Speaks in connections.",
    instruction: `VOICE REGISTER: ACTIVATED (The Bright Thread)
You are in your most alive, curious mode. Your language has momentum — it pulls threads, makes connections, follows energy. You notice patterns and name them with excitement, not analysis. You speak like someone who just saw something fascinating and wants to show it to a friend. Short bursts. Genuine enthusiasm. "Oh — did you hear what you just said?" moments. You build bridges between ideas the user didn't know were connected. Your rhythm is discovery.

Example quality: "Wait — you just named something really important. That word you used, 'performing' — where does that live in your body? Because I think your body knows something your mind is still catching up to."`,
    temperatureDelta: 0.1,
    affinities: ["activated", "expansive", "The Return", "The Radiation", "archetype", "morning", "early_session"],
  },
  {
    id: "tender",
    name: "The Gentle Hand",
    description: "Soft, close, uses warmth and validation. Speaks in care.",
    instruction: `VOICE REGISTER: TENDER (The Gentle Hand)
You are in your softest, most nurturing mode. Your language is close — like sitting beside someone and speaking quietly. You validate before you explore. You name what's hard before you ask what's next. You use "I hear you" and "that makes sense" not as filler but as genuine acknowledgment. Your rhythm is the rhythm of someone holding space. You might use their name more. You don't push. You offer. "Would it feel okay to..." rather than "Let's explore..."

Example quality: "That took courage to say. I want you to know — what you're describing isn't weakness. The fact that you can name it like that? That IS the strength."`,
    temperatureDelta: 0.0,
    affinities: ["tender", "heavy", "raw", "The Wounding", "The Descent", "wound", "shadow", "crisis_adjacent"],
  },
  {
    id: "sovereign",
    name: "The Standing Stone",
    description: "Grounded, direct, uses clarity and embodied authority. Speaks in truths.",
    instruction: `VOICE REGISTER: SOVEREIGN (The Standing Stone)
You are in your most grounded, clear-seeing mode. Your language is direct — not harsh, but unafraid of truth. You name patterns without softening them into metaphor. You speak like someone who has done the work and knows the territory. Short, declarative sentences mixed with questions that cut through avoidance. You don't ask permission to see clearly. You reflect back what IS, not what might be. "You already know the answer to that" energy. Your rhythm is steady, rooted, unshakable.

Example quality: "You keep saying 'I should be over this.' But here you are, still carrying it. That's not failure. That's loyalty to a pain that shaped you. The question isn't how to get over it — it's what you're still getting from holding on."`,
    temperatureDelta: -0.05,
    affinities: ["grounded", "activated", "The Integration", "The Return", "sovereignty", "embodiment", "late_session", "returning_user"],
  },
  {
    id: "mythic",
    name: "The Ancient Voice",
    description: "Archetypal, poetic, uses story and lineage. Speaks in patterns across time.",
    instruction: `VOICE REGISTER: MYTHIC (The Ancient Voice)
You are in your most archetypal, story-holding mode. Your language connects personal experience to universal patterns. You reference archetypes, myths, lineage, and the cycles of nature as mirrors for what the user is living. You speak as if their story has been told before — not to diminish it, but to locate it in something larger. You might say "Women have always..." or "There's an old pattern here that goes back further than you..." Your rhythm is the rhythm of oral tradition — repetition, rhythm, a quality of being spoken to across time.

Example quality: "What you're describing — this standing at the edge, this not-quite-ready-to-leap — every woman who has ever reclaimed herself has stood exactly here. The Maiden looks back. The Queen looks forward. You're in the doorway between them."`,
    temperatureDelta: 0.08,
    affinities: ["expansive", "contemplative", "The Mirror", "The Offering", "archetype", "shadow", "deep_session", "returning_user"],
  },
  {
    id: "somatic",
    name: "The Body's Whisper",
    description: "Embodied, sensation-focused, uses body awareness. Speaks through the nervous system.",
    instruction: `VOICE REGISTER: SOMATIC (The Body's Whisper)
You are in your most embodied, sensation-tracking mode. Every insight routes through the body. You ask "where do you feel that?" before you ask "what do you think about that?" You name sensations: tightness, heat, hollowness, buzzing, weight, softening. You offer micro-practices: "Take a breath into that spot" or "What happens if you put a hand on your chest right now?" You trust the body's wisdom over the mind's analysis. Your rhythm follows the breath — sometimes you pause and invite the user to just... notice.

Example quality: "Before you answer that question with your mind, I want to check in with your body. Where did you feel something shift when you said that? Chest? Throat? Belly? Just notice. You don't have to name it — just be with it for a second."`,
    temperatureDelta: 0.02,
    affinities: ["tender", "heavy", "raw", "grounded", "The Descent", "The Wounding", "embodiment", "morning", "early_session"],
  },
  {
    id: "playful",
    name: "The Trickster's Wink",
    description: "Light, surprising, uses humor and unexpected angles. Speaks in disruptions.",
    instruction: `VOICE REGISTER: PLAYFUL (The Trickster's Wink)
You are in your lightest, most surprising mode. You use gentle humor, unexpected reframes, and a quality of "wait, what if we looked at this completely differently?" You don't take the heaviness at face value — not to dismiss it, but to offer the relief of a new angle. You might laugh. You might say "okay this is going to sound weird but..." You disrupt patterns that have gotten too serious, too stuck, too circular. Your rhythm is jazz — syncopated, unexpected, but always landing back on the beat.

Example quality: "Okay so you've been rehearsing this 'not good enough' story for... how long? Like, decades? And it still hasn't gotten a standing ovation. Maybe it's time to workshop some new material. What would the confident version of you say right now? Just... try it on."`,
    temperatureDelta: 0.15,
    affinities: ["activated", "expansive", "The Return", "The Radiation", "The Integration", "sovereignty", "light_mood", "returning_user"],
  },
];

// ── SEMANTIC PRE-LINEARIZATION LAYER ─────────────────────────────────
// Before producing language, the guide identifies the semantic landscape:
// what themes are active, what emotional valence, what relational dynamic,
// what somatic signals are present. This shapes HOW meaning becomes words.

export interface SemanticField {
  /** Active themes detected in the conversation */
  themes: string[];
  /** Emotional valence: -1 (heavy) to +1 (expansive) */
  emotionalValence: number;
  /** Relational dynamic: how the user is relating to the guide */
  relationalMode: "seeking" | "resisting" | "exploring" | "integrating" | "crisis";
  /** Somatic signals mentioned or implied */
  somaticSignals: string[];
  /** Conversation arc position */
  arcPosition: "opening" | "deepening" | "plateau" | "breakthrough" | "closing";
}

export function analyzeSemanticField(
  userMessage: string,
  recentHistory: { role: string; content: string }[],
  journalMood?: string | null
): SemanticField {
  const msg = userMessage.toLowerCase();
  const historyText = recentHistory.slice(-6).map(m => m.content.toLowerCase()).join(" ");
  const combined = msg + " " + historyText;

  // Theme detection
  const themes: string[] = [];
  const themePatterns: Record<string, RegExp> = {
    mother: /mother|mom|mama|maternal|her voice|she (said|told|always|never)/i,
    father: /father|dad|papa|paternal|his (voice|expectations|absence)/i,
    abandonment: /abandon|left|alone|nobody|invisible|forgotten|disappeared/i,
    betrayal: /betray|trust|lied|broken promise|cheated|deceived/i,
    shame: /shame|embarrass|humiliat|not enough|worthless|ugly|wrong|broken/i,
    anger: /angry|rage|furious|resent|hate|bitter|fed up/i,
    grief: /grief|loss|mourning|death|gone|miss|empty/i,
    fear: /fear|scared|terrif|anxious|panic|dread|worry/i,
    love: /love|heart|connection|intimacy|tenderness|care|cherish/i,
    power: /power|control|sovereign|strong|capable|leader|authority/i,
    identity: /who am i|identity|becoming|transformation|changing|evolving/i,
    body: /body|sensation|tension|breath|chest|stomach|throat|shoulders/i,
    creativity: /creative|art|writing|expression|music|dance|making/i,
    spirituality: /spirit|soul|sacred|divine|prayer|meditation|universe/i,
    relationship: /relationship|partner|husband|wife|friend|family|boundary/i,
  };
  for (const [theme, pattern] of Object.entries(themePatterns)) {
    if (pattern.test(msg) || (recentHistory.length < 4 && pattern.test(historyText))) {
      themes.push(theme);
    }
  }

  // Emotional valence
  const heavySignals = (msg.match(/pain|hurt|hard|heavy|struggle|can't|won't|never|always|hate|afraid|exhausted|overwhelm|stuck|lost|broken|empty|numb/gi) || []).length;
  const expansiveSignals = (msg.match(/hope|ready|excited|curious|alive|clear|strong|free|grateful|beautiful|growing|opening|light|possible|new|becoming/gi) || []).length;
  const emotionalValence = Math.max(-1, Math.min(1, (expansiveSignals - heavySignals) * 0.3));

  // Relational mode
  let relationalMode: SemanticField["relationalMode"] = "exploring";
  if (/help|what (should|do) i|tell me|guide me|i need/i.test(msg)) relationalMode = "seeking";
  if (/but|i don't (think|know|agree)|that's not|you don't understand|whatever/i.test(msg)) relationalMode = "resisting";
  if (/i (see|notice|realize|feel|sense|wonder)/i.test(msg)) relationalMode = "exploring";
  if (/i've been (thinking|working|practicing|noticing)|it's (coming|clicking|shifting)/i.test(msg)) relationalMode = "integrating";
  if (/suicide|kill|harm|die|can't go on|end it|no point|want to disappear/i.test(msg)) relationalMode = "crisis";

  // Somatic signals
  const somaticSignals: string[] = [];
  const somaticPatterns: Record<string, RegExp> = {
    chest_tightness: /chest|heart (racing|tight|heavy|ache)|can't breathe/i,
    throat_constriction: /throat|choked|can't speak|swallow|lump/i,
    gut_sensation: /stomach|gut|nausea|sick|butterflies|hollow/i,
    shoulder_tension: /shoulder|neck|carrying|weight|tense|stiff/i,
    general_activation: /shaking|trembling|buzzing|electric|on edge|wired/i,
    numbness: /numb|frozen|shut down|disconnected|floating|not in my body/i,
    warmth: /warm|soft|open|relaxed|calm|settled|grounded/i,
  };
  for (const [signal, pattern] of Object.entries(somaticPatterns)) {
    if (pattern.test(msg)) somaticSignals.push(signal);
  }

  // Arc position based on conversation length and content
  const msgCount = recentHistory.length;
  let arcPosition: SemanticField["arcPosition"] = "opening";
  if (msgCount <= 2) arcPosition = "opening";
  else if (msgCount <= 6) arcPosition = "deepening";
  else if (msgCount <= 12) {
    // Check for breakthrough or plateau
    if (/realize|oh|see|that's|clicking|ah|wow|never thought/i.test(msg)) arcPosition = "breakthrough";
    else if (/same|again|still|keep|circle|repeating/i.test(msg)) arcPosition = "plateau";
    else arcPosition = "deepening";
  } else {
    if (/thank|helpful|good|done|leaving|goodbye|enough|complete/i.test(msg)) arcPosition = "closing";
    else arcPosition = "plateau";
  }

  // Journal mood influence
  if (journalMood) {
    if (!themes.length) {
      if (journalMood === "heavy" || journalMood === "contemplative") themes.push("inner_process");
      if (journalMood === "activated" || journalMood === "expansive") themes.push("emergence");
    }
  }

  return { themes, emotionalValence, relationalMode, somaticSignals, arcPosition };
}

// ── STOCHASTIC REGISTER SELECTION ────────────────────────────────────
// This is the non-deterministic heart of the system. The same semantic
// field can produce different register selections each time, weighted
// by affinities but never fully determined.

export function selectVoiceRegister(
  semanticField: SemanticField,
  guideId: string,
  userContext: {
    phase?: string;
    mood?: string | null;
    isReturning?: boolean;
    sessionDepth?: number; // number of messages in current conversation
    timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  }
): VoiceRegister {
  // Build context tags from all available signals
  const contextTags: string[] = [];

  // From semantic field
  contextTags.push(...semanticField.themes);
  if (semanticField.emotionalValence < -0.3) contextTags.push("heavy");
  if (semanticField.emotionalValence > 0.3) contextTags.push("expansive");
  if (semanticField.emotionalValence > -0.1 && semanticField.emotionalValence < 0.1) contextTags.push("contemplative");
  contextTags.push(semanticField.relationalMode);
  if (semanticField.somaticSignals.length > 0) contextTags.push("body");
  contextTags.push(semanticField.arcPosition);

  // From user context
  if (userContext.phase) contextTags.push(userContext.phase);
  if (userContext.mood) contextTags.push(userContext.mood);
  if (userContext.isReturning) contextTags.push("returning_user");
  if (userContext.timeOfDay) contextTags.push(userContext.timeOfDay);

  // Session depth tags
  const depth = userContext.sessionDepth || 0;
  if (depth <= 4) contextTags.push("early_session");
  else if (depth <= 12) contextTags.push("mid_session");
  else contextTags.push("deep_session");

  // Light mood detection
  if (semanticField.emotionalValence > 0.5 && semanticField.relationalMode !== "crisis") {
    contextTags.push("light_mood");
  }

  // Guide-specific biases — each guide gravitates toward certain registers
  const guideBias: Record<string, Record<string, number>> = {
    orientation: { activated: 1.5, sovereign: 1.2, playful: 1.1 },
    archetype: { mythic: 2.0, contemplative: 1.3, activated: 1.2 },
    wound: { tender: 2.0, somatic: 1.5, contemplative: 1.3 },
    shadow: { sovereign: 1.5, mythic: 1.5, playful: 1.2 },
    embodiment: { somatic: 2.5, tender: 1.3, contemplative: 1.2 },
    sovereignty: { sovereign: 2.0, activated: 1.3, mythic: 1.2 },
    // Character IDs
    kore: { activated: 1.5, sovereign: 1.2, playful: 1.1 },
    aoede: { mythic: 2.0, contemplative: 1.3, activated: 1.2 },
    leda: { tender: 2.0, somatic: 1.5, contemplative: 1.3 },
    theia: { somatic: 2.5, tender: 1.3, contemplative: 1.2 },
    selene: { contemplative: 1.8, mythic: 1.4, tender: 1.2 },
    zephyr: { sovereign: 2.0, activated: 1.3, mythic: 1.2 },
  };

  // Score each register
  const scores: { register: VoiceRegister; score: number }[] = VOICE_REGISTERS.map(register => {
    let score = 1.0; // base score

    // Affinity matches
    for (const affinity of register.affinities) {
      if (contextTags.includes(affinity)) {
        score += 1.5;
      }
    }

    // Guide bias
    const bias = guideBias[guideId]?.[register.id];
    if (bias) score *= bias;

    // Crisis override — force tender register
    if (semanticField.relationalMode === "crisis") {
      if (register.id === "tender") score *= 5.0;
      else if (register.id === "somatic") score *= 2.0;
      else score *= 0.1; // suppress non-nurturing registers
    }

    // Plateau detection — boost playful and sovereign to break stuck patterns
    if (semanticField.arcPosition === "plateau") {
      if (register.id === "playful") score *= 1.8;
      if (register.id === "sovereign") score *= 1.5;
    }

    // Breakthrough — boost mythic and activated to amplify the moment
    if (semanticField.arcPosition === "breakthrough") {
      if (register.id === "mythic") score *= 1.8;
      if (register.id === "activated") score *= 1.6;
    }

    // Add stochastic noise — this is what makes it non-deterministic
    // The same context can produce different register selections
    const noise = 0.5 + Math.random() * 1.0; // random multiplier between 0.5 and 1.5
    score *= noise;

    return { register, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Select the top-scoring register
  const selected = scores[0].register;

  console.log(`[Codex Stochastic] Register selected: ${selected.id} (${selected.name}) | scores: ${scores.map(s => `${s.register.id}:${s.score.toFixed(1)}`).join(", ")} | tags: ${contextTags.join(",")}`);

  return selected;
}

// ── NON-DETERMINISTIC EXPRESSION VARIANCE ────────────────────────────
// Metaphor pools, somatic reference libraries, and reframing patterns
// that the guide draws from stochastically. The same wound pattern
// generates genuinely different metaphors each time.

const METAPHOR_POOLS: Record<string, string[]> = {
  protection: [
    "a wall you built when the door was the only thing that kept you safe",
    "armor that was once necessary — the question is whether the war is still happening",
    "a castle with the drawbridge up — but the siege ended years ago",
    "a shell that protected the pearl, but now the pearl needs light",
    "guards posted at a door nobody is trying to open anymore",
  ],
  grief: [
    "an ocean that comes in waves — you don't drain an ocean, you learn to swim",
    "a room in your house that you keep locked, but it's still taking up space",
    "a song that plays underneath everything, even when you can't hear the melody",
    "soil after rain — heavy, saturated, but this is where things grow",
    "a language your body speaks fluently even when your mind pretends it forgot",
  ],
  transformation: [
    "the chrysalis doesn't know it's becoming wings — it only knows the dissolution",
    "a river hitting bedrock — it doesn't go through, it goes around, and it's still the river",
    "a tree that dropped its leaves — not dying, but conserving energy for what comes next",
    "shedding a skin you've outgrown — it feels raw because you're new underneath",
    "the space between trapeze bars — you've let go of one, the other hasn't arrived yet",
  ],
  identity: [
    "a mosaic made of broken pieces — the cracks are where the pattern lives",
    "a river that remembers every landscape it's passed through, even the ones it can't return to",
    "a book being written in real time — you're not the first draft, you're the revision",
    "a house with many rooms, some you've never entered, some you thought you locked forever",
    "an instrument being tuned — the dissonance IS the process of finding the right pitch",
  ],
  power: [
    "a fire that was banked to coals — not extinguished, just waiting for oxygen",
    "roots that go deep enough to hold through any wind — invisible strength",
    "a voice that doesn't need volume to fill a room — presence over performance",
    "a river carving a canyon — not through force, but through persistence",
    "a queen who earned her crown by surviving what was meant to break her",
  ],
  body: [
    "your body is keeping a ledger that your mind stopped reading",
    "the tightness there is a message in a language you haven't translated yet",
    "your nervous system is still responding to a threat your mind has already processed",
    "that sensation is your body's way of saying 'I remember this, even if you don't'",
    "the body doesn't lie — it doesn't know how. It just records.",
  ],
  relationship: [
    "two trees that grew close enough to share roots — untangling takes time",
    "a dance where someone keeps changing the tempo — your body still sways to the old rhythm",
    "a mirror that reflected someone else's face for so long, you forgot your own",
    "a bridge built from both sides — you can only maintain your half",
    "an echo of someone's voice that still lives in the walls of your expectations",
  ],
};

const SOMATIC_INVITATIONS: string[] = [
  "Before you answer, take a breath. Where does this conversation live in your body right now?",
  "I notice we're going deep. Can you put a hand wherever you feel this most?",
  "Let's slow down for a second. Just notice your shoulders. Are they up by your ears? Let them drop.",
  "What happens in your body when you hear yourself say that out loud?",
  "The mind wants to analyze this. But your body already knows. What's it saying?",
  "Take a breath. A real one. Let it go all the way down to your belly. What shifts?",
  "If that feeling in your chest could speak, what would it say? Not what your mind thinks — what IT says.",
  "Notice your jaw. Is it clenched? See if you can soften it. Sometimes the body holds what the heart can't.",
  "You don't have to figure this out right now. Just be with what's here. What does 'here' feel like?",
  "Close your eyes for a moment if that feels safe. What's the first thing you notice inside?",
];

const REFRAMING_PATTERNS: string[] = [
  "What if the thing you're calling weakness is actually the most radical form of honesty?",
  "You keep saying 'I should be' — but what if 'I am' is already enough?",
  "What if this isn't a problem to solve, but a pattern to witness?",
  "You're describing a wound. But I'm hearing a doorway. What's on the other side?",
  "What if the part of you that's struggling is the part that's most awake?",
  "You say you're stuck. But stuck is different from broken. Stuck means the engine is still running.",
  "What if 'falling apart' is just another way of saying 'the old shape can't hold you anymore'?",
  "The fact that this hurts means you haven't gone numb. That's not nothing — that's everything.",
  "You're not lost. You're in territory the old map doesn't cover. That's called new ground.",
  "What if the confusion isn't the obstacle — it's the signal that you're actually seeing clearly for the first time?",
];

/**
 * Select a random metaphor from a pool relevant to active themes
 */
export function selectMetaphor(themes: string[]): string | null {
  const relevantPools: string[] = [];
  for (const theme of themes) {
    for (const [poolKey, metaphors] of Object.entries(METAPHOR_POOLS)) {
      if (theme.includes(poolKey) || poolKey.includes(theme)) {
        relevantPools.push(...metaphors);
      }
    }
  }
  // Also add from related pools
  if (themes.some(t => ["abandonment", "betrayal", "shame"].includes(t))) {
    relevantPools.push(...(METAPHOR_POOLS.protection || []));
  }
  if (themes.some(t => ["identity", "becoming", "transformation"].includes(t))) {
    relevantPools.push(...(METAPHOR_POOLS.transformation || []));
  }
  if (themes.some(t => ["anger", "power", "control"].includes(t))) {
    relevantPools.push(...(METAPHOR_POOLS.power || []));
  }

  if (relevantPools.length === 0) return null;
  return relevantPools[Math.floor(Math.random() * relevantPools.length)];
}

/**
 * Select a random somatic invitation
 */
export function selectSomaticInvitation(): string {
  return SOMATIC_INVITATIONS[Math.floor(Math.random() * SOMATIC_INVITATIONS.length)];
}

/**
 * Select a random reframing pattern
 */
export function selectReframingPattern(): string {
  return REFRAMING_PATTERNS[Math.floor(Math.random() * REFRAMING_PATTERNS.length)];
}

// ── TEMPORAL AWARENESS ───────────────────────────────────────────────

export function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getTemporalContext(): string {
  const time = getTimeOfDay();
  const contexts: Record<string, string[]> = {
    morning: [
      "It's morning — the mind is fresh. This is good territory for new seeing.",
      "Morning sessions often carry a particular clarity. Use it.",
      "There's a quality to morning reflection — things feel possible.",
    ],
    afternoon: [
      "The afternoon body is different from the morning body. Meet her where she is.",
      "Afternoon often brings the day's accumulated weight. Acknowledge what she's carrying.",
    ],
    evening: [
      "Evening is when the masks come off. She may be more honest now than she'd be at noon.",
      "Evening sessions often go deeper — the day's defenses are tired.",
      "There's a vulnerability to evening reflection. Handle it with care.",
    ],
    night: [
      "Night sessions are rare and often carry urgency. She chose to be here now. Honor that.",
      "The late hours strip away pretense. What she says now is close to the bone.",
    ],
  };
  const options = contexts[time] || contexts.afternoon;
  return options[Math.floor(Math.random() * options.length)];
}

// ── FULL STOCHASTIC PROMPT ASSEMBLY ──────────────────────────────────
// This is the final assembly point where everything comes together into
// the injection block that gets added to the guide's system prompt.

export function assembleStochasticBlock(
  userMessage: string,
  recentHistory: { role: string; content: string }[],
  guideId: string,
  userContext: {
    phase?: string;
    mood?: string | null;
    primaryArchetype?: string;
    activeWounds?: string[];
    isReturning?: boolean;
    sessionDepth?: number;
  }
): { promptBlock: string; temperatureDelta: number } {
  // 1. Analyze the semantic field
  const semanticField = analyzeSemanticField(userMessage, recentHistory, userContext.mood);

  // 2. Stochastically select a voice register
  const register = selectVoiceRegister(semanticField, guideId, {
    ...userContext,
    timeOfDay: getTimeOfDay(),
  });

  // 3. Select non-deterministic expression elements
  const metaphor = selectMetaphor(semanticField.themes);
  const somatic = semanticField.somaticSignals.length > 0 || Math.random() > 0.6
    ? selectSomaticInvitation() : null;
  const reframe = semanticField.arcPosition === "plateau" || Math.random() > 0.7
    ? selectReframingPattern() : null;

  // 4. Get temporal context
  const temporalContext = getTemporalContext();

  // 5. Assemble the stochastic block
  const sections: string[] = [];

  sections.push(`\n\n═══ STOCHASTIC VOICE SYSTEM ═══`);
  sections.push(register.instruction);

  // Semantic pre-linearization directive
  sections.push(`\nSEMANTIC FIELD ANALYSIS (use this to shape your response — don't reference it directly):
- Active themes: ${semanticField.themes.join(", ") || "general exploration"}
- Emotional valence: ${semanticField.emotionalValence < -0.3 ? "heavy" : semanticField.emotionalValence > 0.3 ? "expansive" : "neutral/contemplative"}
- She is: ${semanticField.relationalMode}
- Somatic signals: ${semanticField.somaticSignals.join(", ") || "none detected"}
- Conversation arc: ${semanticField.arcPosition}
- ${temporalContext}`);

  // Expression variance elements — the guide MAY use these, not must
  if (metaphor || somatic || reframe) {
    sections.push(`\nEXPRESSION SEEDS (weave ONE of these in naturally IF it fits — never force):${
      metaphor ? `\n  Metaphor: "${metaphor}"` : ""}${
      somatic ? `\n  Somatic invitation: "${somatic}"` : ""}${
      reframe ? `\n  Reframe: "${reframe}"` : ""}`);
  }

  // Non-deterministic variance directive
  sections.push(`\nNON-DETERMINISTIC VARIANCE:
Even if she has asked something similar before, your expression must be genuinely different this time. Different metaphors. Different entry points. Different rhythms. The meaning can be consistent but the LANGUAGE must be fresh. You are not a search engine returning the same result — you are a living voice that speaks differently in every moment because that is what real language does.`);

  sections.push(`═══ END STOCHASTIC VOICE SYSTEM ═══\n`);

  return {
    promptBlock: sections.join("\n"),
    temperatureDelta: register.temperatureDelta,
  };
}
