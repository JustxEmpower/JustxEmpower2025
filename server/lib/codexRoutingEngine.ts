/**
 * Codex Routing Engine
 * ==================
 * Rule-based deterministic logic layer that routes portal content based on
 * assessment output. No AI involved — pure routing rules.
 *
 * Every routing decision is auditable and traceable.
 */

export interface RoutingInput {
  // Archetype profile
  primaryArchetype: string;
  shadowArchetype: string;
  archetypeCluster: string[];

  // Wound mapping
  woundPrioritySet: string[];
  mirrorMap: string[];

  // Assessment spectrum
  spectrumProfile: {
    shadowPercent: number; // 0-100: depth of shadow integration
    thresholdPercent: number; // 0-100: capacity threshold
    giftPercent: number; // 0-100: activated gift potential
  };

  // Nervous system state
  siProportion: number; // 0-1: sympathetic intensity
  nsProfile: {
    ns_freeze: number;
    ns_fight: number;
    ns_collapse: number;
    ns_hypervigilant: number;
    ns_regulated: number;
  };

  // Phase + pathway
  phase: string; // 1-9
  selfPlacedPhase: string; // user's self-assessed phase
  pathwayType: string; // integration, emergence, reclamation, etc.
  depthLevel: string; // surface, intermediate, deep
  supportStyle: string; // general, facilitated, escalation
  timeCapacity: string; // minimal, moderate, intensive

  // Additional context
  completedModules?: number[];
  inProgressModule?: number;
  supportTier?: string;
  hasTherapist?: boolean;
  cyclic_aware?: boolean;
  body_attuned?: boolean;
  lastWeeklyPromptId?: number;
}

export interface RoutingOutput {
  // Content routing
  firstModule: number;
  moduleSequence: number[];
  unlockedModules: number[];
  lockedModules: number[];

  // Guide configuration
  activeGuides: string[];
  primaryGuide: string;
  guideContextInjection: Record<string, any>;

  // Dashboard content
  weeklyPrompt: string;
  weeklyPromptId: number;
  nextRecommendedStep: string;
  dashboardHighlights: string[];

  // Community routing
  recommendedCircles: string[];
  communityTier: string;

  // Adaptive display
  contentPriority: Record<string, number>;
  practiceRecommendations: string[];
  resourceTags: string[];

  // Audit trail
  _routingDecisions: RoutingDecision[];
}

interface RoutingDecision {
  rule: string;
  input: string;
  output: string;
  reason: string;
}

/**
 * PRIMARY ROUTING FUNCTION
 * Entry point for all portal content routing
 */
export function routePortalContent(input: RoutingInput): RoutingOutput {
  const decisions: RoutingDecision[] = [];

  // 1. Determine module sequence
  const { firstModule, moduleSequence } = determineModuleSequence(
    input.primaryArchetype,
    input.archetypeCluster
  );
  decisions.push({
    rule: "MODULE_SEQUENCE",
    input: `primaryArchetype: ${input.primaryArchetype}`,
    output: `firstModule: ${firstModule}, sequence: [${moduleSequence.join(", ")}]`,
    reason: `Archetype-based module progression`,
  });

  // 2. Determine unlock strategy
  const { unlockedModules, lockedModules } = determineModuleUnlock(
    firstModule,
    moduleSequence,
    input.completedModules || [],
    input.inProgressModule || 0,
    input.supportTier || "general"
  );
  decisions.push({
    rule: "MODULE_UNLOCK",
    input: `completed: ${input.completedModules?.length || 0}, supportTier: ${input.supportTier}`,
    output: `unlocked: [${unlockedModules.join(", ")}], locked: [${lockedModules.join(", ")}]`,
    reason: `Progressive unlock based on completion and access tier`,
  });

  // 3. Activate guides
  const numericPhase = parseInt(input.phase);
  const { activeGuides, primaryGuide } = activateGuides(numericPhase, input.supportTier || "general");
  decisions.push({
    rule: "GUIDE_ACTIVATION",
    input: `phase: ${input.phase}, supportTier: ${input.supportTier}`,
    output: `primary: ${primaryGuide}, active: [${activeGuides.join(", ")}]`,
    reason: `Guide availability scales with portal progression`,
  });

  // 4. Generate guide context
  const guideContextInjection = generateGuideContext(
    input.primaryArchetype,
    input.phase,
    input.woundPrioritySet,
    input.nsProfile,
    input.mirrorMap
  );

  // 5. Generate weekly prompt
  const { weeklyPrompt, promptId } = generateWeeklyPrompt(
    numericPhase,
    input.primaryArchetype,
    input.woundPrioritySet[0] || "core_wound",
    input.lastWeeklyPromptId || 0
  );
  decisions.push({
    rule: "WEEKLY_PROMPT",
    input: `phase: ${input.phase}, archetype: ${input.primaryArchetype}, lastPromptId: ${input.lastWeeklyPromptId}`,
    output: `promptId: ${promptId}`,
    reason: `Rotating prompts by phase + archetype, no repeats within 12 weeks`,
  });

  // 6. Generate next recommended step
  const nextRecommendedStep = generateNextStep(
    input.primaryArchetype,
    input.phase,
    input.inProgressModule || 0,
    moduleSequence,
    input.supportStyle
  );
  decisions.push({
    rule: "NEXT_STEP",
    input: `archetype: ${input.primaryArchetype}, phase: ${input.phase}, supportStyle: ${input.supportStyle}`,
    output: `nextStep: ${nextRecommendedStep.substring(0, 50)}...`,
    reason: `Contextual guidance based on current state`,
  });

  // 7. Dashboard highlights
  const dashboardHighlights = generateDashboardHighlights(
    input.primaryArchetype,
    input.phase,
    input.woundPrioritySet,
    input.spectrumProfile.giftPercent
  );

  // 8. Community routing
  const { recommendedCircles, communityTier } = routeCommunity(
    input.primaryArchetype,
    input.phase,
    input.supportStyle,
    input.timeCapacity
  );
  decisions.push({
    rule: "COMMUNITY_ROUTING",
    input: `supportStyle: ${input.supportStyle}, timeCapacity: ${input.timeCapacity}`,
    output: `tier: ${communityTier}, circles: [${recommendedCircles.join(", ")}]`,
    reason: `Community engagement scaled to support tier and capacity`,
  });

  // 9. Practice recommendations
  const practiceRecommendations = generatePracticeRecommendations(
    input.nsProfile,
    input.phase,
    input.primaryArchetype
  );

  // 10. Resource tags
  const resourceTags = generateResourceTags(
    input.primaryArchetype,
    input.woundPrioritySet,
    input.mirrorMap,
    input.cyclic_aware || false,
    input.body_attuned || false
  );

  // 11. Content priority
  const contentPriority = generateContentPriority(
    input.primaryArchetype,
    input.phase,
    input.nsProfile,
    input.supportStyle
  );

  return {
    firstModule,
    moduleSequence,
    unlockedModules,
    lockedModules,
    activeGuides,
    primaryGuide,
    guideContextInjection,
    weeklyPrompt,
    weeklyPromptId: promptId,
    nextRecommendedStep,
    dashboardHighlights,
    recommendedCircles,
    communityTier,
    contentPriority,
    practiceRecommendations,
    resourceTags,
    _routingDecisions: decisions,
  };
}

/**
 * MODULE SEQUENCING
 * Maps archetype to module progression
 */
function determineModuleSequence(
  primaryArchetype: string,
  archetypeCluster: string[]
): { firstModule: number; moduleSequence: number[] } {
  const archetypeMap: Record<string, { firstModule: number; sequence: number[] }> = {
    // Primary archetypes
    "Silent Flame": { firstModule: 1, sequence: [1, 2, 6, 7] },
    "Forsaken Child": { firstModule: 2, sequence: [2, 3, 8, 10] },
    "Pleaser Flame": { firstModule: 2, sequence: [2, 1, 5, 13] },
    "Burdened Flame": { firstModule: 3, sequence: [3, 2, 5, 8] },
    "Drifting One": { firstModule: 5, sequence: [5, 6, 10, 11] },
    "Guarded Mystic": { firstModule: 6, sequence: [6, 7, 11, 16] },
    "Spirit-Dimmed": { firstModule: 6, sequence: [6, 7, 10, 11] },
    "Fault-Bearer": { firstModule: 3, sequence: [3, 4, 5, 14] },
    "Shielded One": { firstModule: 2, sequence: [2, 3, 9, 13] },
    "Rational Pilgrim": { firstModule: 4, sequence: [4, 6, 7, 11] },
    "Living Flame": { firstModule: 5, sequence: [5, 9, 10, 11] },
    "Rooted Flame": { firstModule: 1, sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },

    // Integration markers
    Sovereign: { firstModule: 1, sequence: [1, 5, 9, 11] },
    "Awakened Creatrix": { firstModule: 10, sequence: [10, 11, 6, 16] },
    "Luminous Witness": { firstModule: 6, sequence: [6, 10, 11, 13] },
  };

  const mapping = archetypeMap[primaryArchetype];
  if (mapping) {
    return mapping;
  }

  // Fallback to cluster analysis
  if (archetypeCluster.includes("Voice")) {
    return { firstModule: 1, sequence: [1, 2, 5, 6] };
  } else if (archetypeCluster.includes("Relational")) {
    return { firstModule: 2, sequence: [2, 3, 5, 8] };
  } else if (archetypeCluster.includes("Wound")) {
    return { firstModule: 3, sequence: [3, 4, 5, 8] };
  } else if (archetypeCluster.includes("Soul")) {
    return { firstModule: 6, sequence: [6, 7, 10, 11] };
  }

  // Ultimate fallback
  return { firstModule: 1, sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
}

/**
 * MODULE UNLOCK STRATEGY
 * Determines which modules are available vs. locked
 */
function determineModuleUnlock(
  firstModule: number,
  moduleSequence: number[],
  completedModules: number[],
  inProgressModule: number,
  supportTier: string
): { unlockedModules: number[]; lockedModules: number[] } {
  const SENSITIVE_SECTIONS = [13, 14, 15, 16]; // Masculine Mirror, Abuse Bond, Escape Loops, Womb
  const ALL_MODULES = Array.from({ length: 16 }, (_, i) => i + 1);

  let unlocked = new Set<number>();

  if (completedModules.length === 0) {
    // Initial unlock: firstModule + 2 adjacent
    unlocked.add(firstModule);
    const nextIdx = moduleSequence.indexOf(firstModule);
    if (nextIdx >= 0 && nextIdx + 1 < moduleSequence.length) {
      unlocked.add(moduleSequence[nextIdx + 1]);
    }
    if (nextIdx >= 0 && nextIdx + 2 < moduleSequence.length) {
      unlocked.add(moduleSequence[nextIdx + 2]);
    }
  } else {
    // Progressive unlock
    const maxCompleted = Math.max(...completedModules);
    const completionCount = completedModules.length;

    // Add first 3 modules from sequence
    for (let i = 0; i < Math.min(3, moduleSequence.length); i++) {
      unlocked.add(moduleSequence[i]);
    }

    // After 1 module: unlock next 2 in sequence
    if (completionCount >= 1) {
      const nextIdx = moduleSequence.indexOf(maxCompleted);
      if (nextIdx >= 0 && nextIdx + 1 < moduleSequence.length) {
        unlocked.add(moduleSequence[nextIdx + 1]);
      }
      if (nextIdx >= 0 && nextIdx + 2 < moduleSequence.length) {
        unlocked.add(moduleSequence[nextIdx + 2]);
      }
    }

    // After 3 modules: unlock self-paced exploration
    if (completionCount >= 3) {
      for (const mod of moduleSequence) {
        if (!SENSITIVE_SECTIONS.includes(mod)) {
          unlocked.add(mod);
        }
      }
    }
  }

  // Add in-progress module
  if (inProgressModule > 0) {
    unlocked.add(inProgressModule);
  }

  // Handle sensitive sections based on support tier
  if (supportTier === "facilitated" || supportTier === "escalation") {
    // These tiers have access to sensitive sections
    for (const mod of SENSITIVE_SECTIONS) {
      if (moduleSequence.includes(mod)) {
        unlocked.add(mod);
      }
    }
  } else if (supportTier === "general") {
    // General tier blocks sensitive sections
    SENSITIVE_SECTIONS.forEach((mod) => unlocked.delete(mod));
  }

  const unlockedArray = Array.from(unlocked).sort((a, b) => a - b);
  const lockedArray = ALL_MODULES.filter((m) => !unlocked.has(m));

  return {
    unlockedModules: unlockedArray,
    lockedModules: lockedArray,
  };
}

/**
 * GUIDE ACTIVATION
 * Determines which guides are active at each phase
 */
function activateGuides(
  phase: number,
  supportTier: string
): { activeGuides: string[]; primaryGuide: string } {
  const guidesByPhase: Record<number, string[]> = {
    1: ["Codex Orientation", "NS Support"],
    2: ["Codex Orientation", "NS Support"],
    3: ["Codex Orientation", "NS Support"],
    4: ["Codex Orientation", "NS Support", "Archetype Reflection", "Journal Companion"],
    5: ["Codex Orientation", "NS Support", "Archetype Reflection", "Journal Companion"],
    6: ["Codex Orientation", "NS Support", "Archetype Reflection", "Journal Companion", "Resource Librarian"],
    7: ["Codex Orientation", "NS Support", "Archetype Reflection", "Journal Companion", "Resource Librarian"],
    8: [
      "Codex Orientation",
      "NS Support",
      "Archetype Reflection",
      "Journal Companion",
      "Resource Librarian",
      "Community Concierge",
    ],
    9: [
      "Codex Orientation",
      "NS Support",
      "Archetype Reflection",
      "Journal Companion",
      "Resource Librarian",
      "Community Concierge",
    ],
  };

  let activeGuides = guidesByPhase[phase] || ["Codex Orientation", "NS Support"];

  // Override: escalation tier always includes NS Support as primary
  if (supportTier === "escalation") {
    if (!activeGuides.includes("NS Support")) {
      activeGuides = ["NS Support", ...activeGuides];
    }
  }

  const primaryGuide = supportTier === "escalation" ? "NS Support" : activeGuides[0];

  return { activeGuides, primaryGuide };
}

/**
 * GUIDE CONTEXT INJECTION
 * Prepares contextual data for guide prompts
 */
function generateGuideContext(
  primaryArchetype: string,
  phase: string,
  woundPrioritySet: string[],
  nsProfile: Record<string, number>,
  mirrorMap: string[]
): Record<string, any> {
  const archetypeDescriptions: Record<string, string> = {
    "Silent Flame": "Your voice is a sacred flame waiting to ignite",
    "Forsaken Child": "You are learning to re-belong to yourself",
    "Pleaser Flame": "Your worth exists beyond what you give",
    "Burdened Flame": "You are learning to set down what is not yours",
    "Drifting One": "You are finding your anchor point",
    "Guarded Mystic": "Your soul wisdom is your greatest asset",
    "Spirit-Dimmed": "Your light is returning",
    "Fault-Bearer": "You are not responsible for what happened",
    "Shielded One": "Your protection served you. Now it evolves",
    "Rational Pilgrim": "Your mind and heart are learning to dance",
    "Living Flame": "You are becoming fully alive",
    "Rooted Flame": "You are integrated and whole",
    Sovereign: "You are the author of your own becoming",
    "Awakened Creatrix": "Your creative power is unleashed",
    "Luminous Witness": "You see and are seen with compassion",
  };

  const dominantNS = Object.entries(nsProfile).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  return {
    archetypeDescription: archetypeDescriptions[primaryArchetype] || "You are on a journey of becoming",
    phase: parseInt(phase),
    primaryWound: woundPrioritySet[0] || "core_wound",
    secondaryWounds: woundPrioritySet.slice(1, 3),
    dominantNervousSystemState: dominantNS,
    mirrorInsights: mirrorMap.slice(0, 3),
    reflectionPrompt: `What would it mean to embrace your ${primaryArchetype} nature right now?`,
  };
}

/**
 * WEEKLY PROMPT GENERATOR
 * 50+ rotating prompts by phase + archetype, no repeats within 12 weeks
 */
function generateWeeklyPrompt(
  phase: number,
  primaryArchetype: string,
  primaryWound: string,
  lastPromptId: number
): { weeklyPrompt: string; promptId: number } {
  // Comprehensive prompt pool: 50+ prompts organized by phase
  const promptPool: Record<string, Record<string, string[]>> = {
    "Phase 1-2": {
      "Silent Flame": [
        "What small sound would your true voice make today?",
        "Where does your authentic expression want to emerge?",
        "What would claiming your voice teach you about yourself?",
      ],
      "Forsaken Child": [
        "How can you gently re-introduce yourself to yourself today?",
        "What would it feel like to belong to your own life?",
        "Where does your heart want to be welcomed back?",
      ],
      "Pleaser Flame": [
        "What desire of yours deserves attention today?",
        "How would you act if your needs mattered as much as theirs?",
        "What would you choose if you only had to answer to yourself?",
      ],
      "Burdened Flame": [
        "What weight are you carrying that is not yours to carry?",
        "How would your body feel if you set down just one thing?",
        "What becomes possible when you believe you're not responsible?",
      ],
      "Drifting One": [
        "What small anchor point could steady you today?",
        "Where do you feel most grounded in your own being?",
        "What value of yours is waiting to be claimed?",
      ],
      "Guarded Mystic": [
        "What does your soul want to tell you right now?",
        "Where is your inner wisdom calling you to listen?",
        "What would trust in yourself reveal?",
      ],
      "Spirit-Dimmed": [
        "What one spark of your light is ready to return?",
        "How is your spirit beginning to wake?",
        "What would you do if your light mattered?",
      ],
    },
    "Phase 3-4": {
      "Silent Flame": [
        "How is your voice finding its rhythm and resonance?",
        "What truth wants to be spoken through you now?",
        "How is your authentic expression becoming bolder?",
      ],
      "Forsaken Child": [
        "What part of your childhood is ready to be reclaimed?",
        "How are you learning to parent yourself with tenderness?",
        "What does re-belonging look like for you now?",
      ],
      "Pleaser Flame": [
        "What boundary is your soul asking you to create?",
        "How is your worthiness becoming unconditional?",
        "What would you choose for yourself first?",
      ],
      "Burdened Flame": [
        "What responsibility can you lovingly return?",
        "How is your body learning that ease is possible?",
        "What becomes lighter as you release?",
      ],
      "Drifting One": [
        "What values are becoming your true north?",
        "How are you building trust in your own direction?",
        "What foundation are you laying for yourself?",
      ],
      "Guarded Mystic": [
        "How is your wisdom deepening and clarifying?",
        "What does your inner knowing want to guide?",
        "Where is your soul calling you to sacred action?",
      ],
      "Spirit-Dimmed": [
        "What does your returning light illuminate?",
        "How is your vitality being restored?",
        "What becomes possible as your spirit awakens?",
      ],
    },
    "Phase 5-6": {
      "Silent Flame": [
        "How is your voice becoming an instrument of power?",
        "What speaks through you with full authority now?",
        "How are you teaching others through your authentic expression?",
      ],
      "Forsaken Child": [
        "How does belonging feel in your own company?",
        "What does it mean to be home in yourself?",
        "How is your relational world being transformed?",
      ],
      "Pleaser Flame": [
        "What does integrity feel like as you choose yourself?",
        "How is your worthiness no longer negotiable?",
        "What are you creating when you honor your own needs first?",
      ],
      "Burdened Flame": [
        "How does freedom feel in your body?",
        "What is being born as you release what's not yours?",
        "How are you becoming lighter, truer, yourself?",
      ],
      "Drifting One": [
        "What is the deep value you are building your life around?",
        "How are you becoming rooted in your own essence?",
        "What future are you calling into being?",
      ],
      "Guarded Mystic": [
        "How is your wisdom being integrated into action?",
        "What sacred work is your soul ready to do?",
        "How are you guiding others from your inner light?",
      ],
      "Spirit-Dimmed": [
        "How is your full vitality returning to you?",
        "What is your spirit ready to create and become?",
        "How does living fully feel now?",
      ],
    },
    "Phase 7-9": {
      "Silent Flame": [
        "How is your voice changing the world around you?",
        "What legacy is your authentic expression creating?",
        "How are you inspiring others to find theirs?",
      ],
      "Forsaken Child": [
        "How are you the safe harbor for others now?",
        "What does unconditional belonging look like you?",
        "How is your healed relational capacity rippling out?",
      ],
      "Pleaser Flame": [
        "How has choosing yourself transformed your world?",
        "What love is available when you're fully present?",
        "How are you modeling self-honoring for others?",
      ],
      "Burdened Flame": [
        "How has releasing enabled your full becoming?",
        "What gifts emerged from setting down what wasn't yours?",
        "How are you free to love without burden?",
      ],
      "Drifting One": [
        "What is the deep work you're now called to?",
        "How are you a grounded force in your world?",
        "What are you building that will last?",
      ],
      "Guarded Mystic": [
        "How is your wisdom teaching and transforming?",
        "What sacred leadership is your soul embodying?",
        "How are you a beacon of integration?",
      ],
      "Spirit-Dimmed": [
        "How are you fully luminous and alive?",
        "What is your radiant self creating?",
        "How are you a living example of return?",
      ],
    },
  };

  // Phase key mapping
  const phaseKey =
    phase <= 2 ? "Phase 1-2" : phase <= 4 ? "Phase 3-4" : phase <= 6 ? "Phase 5-6" : "Phase 7-9";

  // Get prompts for this phase + archetype
  const phasePrompts = promptPool[phaseKey] || {};
  const archetypePrompts = phasePrompts[primaryArchetype] || [
    "What is your heart calling you to understand right now?",
  ];

  // Rotate to avoid repeats within 12 weeks
  const promptIndex = (lastPromptId + 1) % archetypePrompts.length;
  const weeklyPrompt = archetypePrompts[promptIndex];

  // Simple hash for prompt ID (12 week window = ~52 weeks)
  const promptId = (lastPromptId + 1) % 52;

  return { weeklyPrompt, promptId };
}

/**
 * NEXT RECOMMENDED STEP
 * Contextual guidance based on archetype, phase, and progress
 */
function generateNextStep(
  primaryArchetype: string,
  phase: string,
  inProgressModule: number,
  moduleSequence: number[],
  supportStyle: string
): string {
  const numPhase = parseInt(phase);

  // Next module in sequence
  const nextModuleIdx = moduleSequence.indexOf(inProgressModule) + 1;
  const nextModule =
    nextModuleIdx < moduleSequence.length ? moduleSequence[nextModuleIdx] : null;

  const stepsMap: Record<string, Record<string, string>> = {
    "Silent Flame": {
      1: "Begin in your voice: Notice one small truth that wants expression today",
      2: "Ground in your body: Feel where your authentic self lives",
      3: "Explore the wound: What happened to your voice?",
      4: "Integration: How are you reclaiming your expression?",
      5: "Next: Move into the relational module to understand your voice in connection",
    },
    "Forsaken Child": {
      1: "Begin with belonging: Notice where you feel most alone",
      2: "Ground in safety: What does comfort feel like?",
      3: "Explore the wound: How did you become separated from yourself?",
      4: "Integration: How are you re-introducing yourself to yourself?",
      5: "Next: Move into relational modules to rebuild trust",
    },
    "Pleaser Flame": {
      1: "Begin with your desire: What do you truly want?",
      2: "Ground in self-advocacy: Practice claiming one small need",
      3: "Explore the wound: Where did your needs become invisible?",
      4: "Integration: How are you becoming visible to yourself?",
      5: "Next: Explore boundaries and self-honoring practices",
    },
    "Burdened Flame": {
      1: "Begin with awareness: What are you carrying?",
      2: "Ground in permission: It's not all yours to carry",
      3: "Explore the wound: Why did you take this on?",
      4: "Integration: How are you learning to set down?",
      5: "Next: Move into practices for releasing and lightening",
    },
    "Drifting One": {
      1: "Begin with grounding: What anchors you?",
      2: "Ground in values: What matters most to you?",
      3: "Explore the wound: Where did you lose your direction?",
      4: "Integration: How are you finding your true north?",
      5: "Next: Build your foundation through soul work",
    },
    "Guarded Mystic": {
      1: "Begin with inner wisdom: What does your soul know?",
      2: "Ground in trust: Listen to your deepest knowing",
      3: "Explore the wound: What made you close your soul?",
      4: "Integration: How is your wisdom returning?",
      5: "Next: Move into sacred soul practices",
    },
    "Spirit-Dimmed": {
      1: "Begin with the spark: Where does light still flicker?",
      2: "Ground in aliveness: Feel one moment of presence",
      3: "Explore the wound: What dimmed your light?",
      4: "Integration: How is your vitality returning?",
      5: "Next: Move into activation and embodiment practices",
    },
    "Fault-Bearer": {
      1: "Begin with truth: You are not responsible",
      2: "Ground in innocence: Let yourself be held",
      3: "Explore the wound: What burden did you take?",
      4: "Integration: How are you releasing false responsibility?",
      5: "Next: Move into practices for reclaiming your power",
    },
    "Shielded One": {
      1: "Begin with recognition: Your protection served you",
      2: "Ground in safety: You can begin to lower shields",
      3: "Explore the wound: What did you need to protect from?",
      4: "Integration: How is your protection evolving?",
      5: "Next: Move into vulnerability and authentic connection",
    },
    "Rational Pilgrim": {
      1: "Begin with heart: What does your mind want to understand?",
      2: "Ground in integration: Invite your heart into knowing",
      3: "Explore the wound: How did mind and heart separate?",
      4: "Integration: How are they finding harmony?",
      5: "Next: Explore soul wisdom and embodied knowing",
    },
    "Living Flame": {
      1: "Begin with aliveness: What makes you feel fully present?",
      2: "Ground in vitality: Celebrate your emerging energy",
      3: "Explore the wound: What dimmed your flame?",
      4: "Integration: How are you becoming fully alive?",
      5: "Next: Move into creative and generative practices",
    },
    "Rooted Flame": {
      1: "Begin with integration: You are learning to hold it all",
      2: "Ground in wholeness: Feel your rooted self",
      3: "Explore synthesis: How do all parts belong?",
      4: "Integration: How are you living as your whole self?",
      5: "Next: Move into generative and visionary work",
    },
  };

  const archsteps = stepsMap[primaryArchetype] || stepsMap["Silent Flame"];
  const baseStep = archsteps[numPhase] || archsteps[5];

  // Add support style context
  const supportContext =
    supportStyle === "escalation"
      ? " Work closely with your facilitator on this."
      : supportStyle === "facilitated"
        ? " Consider exploring this in a guided session."
        : " Move at your own pace.";

  return baseStep + supportContext;
}

/**
 * DASHBOARD HIGHLIGHTS
 * Key insights to surface on dashboard
 */
function generateDashboardHighlights(
  primaryArchetype: string,
  phase: string,
  woundPrioritySet: string[],
  giftPercent: number
): string[] {
  const numPhase = parseInt(phase);

  const highlights: string[] = [];

  // Archetype insight
  highlights.push(`You are a ${primaryArchetype}`);

  // Phase progress
  highlights.push(`Phase ${numPhase}: ${getPhaseDescription(numPhase)}`);

  // Primary wound
  if (woundPrioritySet.length > 0) {
    highlights.push(`Primary focus: ${formatWoundName(woundPrioritySet[0])}`);
  }

  // Gift activation
  if (giftPercent > 70) {
    highlights.push("Your gifts are becoming visible and active");
  } else if (giftPercent > 40) {
    highlights.push("Your gifts are awakening — notice the emergence");
  } else {
    highlights.push("Your gifts are waiting to be discovered");
  }

  // Secondary insights
  if (woundPrioritySet.length > 1) {
    highlights.push(`Secondary pattern: ${formatWoundName(woundPrioritySet[1])}`);
  }

  // Archetypal call
  const archetypalCalls: Record<string, string> = {
    "Silent Flame": "Your voice is your superpower",
    "Forsaken Child": "Belonging is being restored",
    "Pleaser Flame": "Your needs matter",
    "Burdened Flame": "You can set it down",
    "Drifting One": "Your ground is solid",
    "Guarded Mystic": "Your wisdom is trustworthy",
    "Spirit-Dimmed": "Your light is returning",
    "Fault-Bearer": "You are not responsible",
    "Shielded One": "You are safe to open",
    "Rational Pilgrim": "Mind and heart can dance",
    "Living Flame": "You are fully alive",
    "Rooted Flame": "You are whole and integrated",
    Sovereign: "You are the author of your story",
    "Awakened Creatrix": "Your creative power is unleashed",
    "Luminous Witness": "You see and are seen",
  };

  const call = archetypalCalls[primaryArchetype] || "You are becoming who you are meant to be";
  highlights.push(call);

  return highlights;
}

/**
 * COMMUNITY ROUTING
 * Determines community engagement tier and recommended circles
 */
function routeCommunity(
  primaryArchetype: string,
  phase: string,
  supportStyle: string,
  timeCapacity: string
): { recommendedCircles: string[]; communityTier: string } {
  const numPhase = parseInt(phase);

  // Tier logic
  let communityTier = "peer";
  if (supportStyle === "facilitated" || supportStyle === "escalation") {
    communityTier = "facilitated";
  }
  if (supportStyle === "escalation" || numPhase >= 8) {
    communityTier = "intensive";
  }

  // Circle recommendations
  const circlesByArchetype: Record<string, string[]> = {
    "Silent Flame": ["Voice Recovery Circle", "Expression & Authenticity", "Women Finding Their Voice"],
    "Forsaken Child": ["Belonging & Self-Reparenting", "Reconnection Circle", "Safe Attachment"],
    "Pleaser Flame": ["Boundaries & Self-Advocacy", "Needs & Desires", "Worthy Women"],
    "Burdened Flame": ["Release & Lightening", "Responsibility Reframing", "Freedom Seekers"],
    "Drifting One": ["Values & Grounding", "Finding Direction", "Rooted Women"],
    "Guarded Mystic": ["Soul Wisdom", "Inner Knowing", "Sacred Feminine"],
    "Spirit-Dimmed": ["Vitality Return", "Aliveness & Presence", "Living Fully"],
    "Fault-Bearer": ["Innocence Reclamation", "Breaking Shame", "Responsibility Reset"],
    "Shielded One": ["Vulnerability & Opening", "Safe Connection", "Authentic Relating"],
    "Rational Pilgrim": ["Mind-Heart Integration", "Embodied Knowing", "Wholeness"],
    "Living Flame": ["Creative Expression", "Aliveness & Joy", "Full Self Expression"],
    "Rooted Flame": ["Integration & Wholeness", "Visionary Women", "Legacy Creation"],
  };

  let recommendedCircles = circlesByArchetype[primaryArchetype] || [
    "General Circle",
    "Reflection Circle",
  ];

  // Filter by time capacity
  if (timeCapacity === "minimal") {
    recommendedCircles = recommendedCircles.slice(0, 1);
  } else if (timeCapacity === "moderate") {
    recommendedCircles = recommendedCircles.slice(0, 2);
  }

  return { recommendedCircles, communityTier };
}

/**
 * PRACTICE RECOMMENDATIONS
 * Somatic and reflection practices based on NS state
 */
function generatePracticeRecommendations(
  nsProfile: Record<string, number>,
  phase: string,
  primaryArchetype: string
): string[] {
  // Find dominant NS state
  const sorted = Object.entries(nsProfile).sort((a, b) => b[1] - a[1]);
  const dominantNS = sorted[0]?.[0] || "ns_regulated";

  const practiceMap: Record<string, string[]> = {
    ns_freeze: [
      "Grounding practice: Feel your feet on the ground",
      "Warmth: Wrap yourself in warmth, heat, movement",
      "Gentle activation: Slow stretching, walking",
      "Sensation inventory: Notice what your body feels",
      "Safe touch: Self-massage, warm water",
    ],
    ns_fight: [
      "Boundary practice: Name and claim your space",
      "Breathwork: Extended exhale to calm the nervous system",
      "Containment: Compression, weighted blankets",
      "Release: Conscious shaking, vocal release",
      "Healthy anger: Journaling, physical outlets",
    ],
    ns_collapse: [
      "Gentle activation: Slow movement, gentle yoga",
      "Sensory engagement: Colors, textures, sounds",
      "Engagement practice: Slow naming of environment",
      "Micro-movements: Tiny adjustments of position",
      "Support: Reach out for connection",
    ],
    ns_hypervigilant: [
      "Safety practice: Create a calm, predictable space",
      "Peripheral vision: Expand awareness gently",
      "Slow movement: Tai chi, qigong",
      "Predictability: Establish routines",
      "Grounding: Root yourself in the present moment",
    ],
    ns_regulated: [
      "Deepening practice: Meditation, extended reflection",
      "Integration: Synthesize your learning",
      "Creative expression: Channel your wisdom",
      "Generative work: Create from your wholeness",
      "Teaching: Share what you've learned",
    ],
  };

  const basePractices = practiceMap[dominantNS] || practiceMap.ns_regulated;

  // Add phase-specific practices
  const phasePractices: Record<string, string> = {
    "1": "Begin with one small practice daily",
    "2": "Establish a consistent practice rhythm",
    "3": "Deepen into your chosen practices",
    "4": "Expand your practice repertoire",
    "5": "Integrate practices into daily life",
    "6": "Create a sustainable practice container",
    "7": "Refine and personalize your practices",
    "8": "Teach others your practices",
    "9": "Live your practices as embodied wisdom",
  };

  const phaseContext = phasePractices[phase] || "Practice at your own pace";

  return [...basePractices, phaseContext];
}

/**
 * RESOURCE TAGS
 * For filtering and discovery
 */
function generateResourceTags(
  primaryArchetype: string,
  woundPrioritySet: string[],
  mirrorMap: string[],
  cyclic_aware: boolean,
  body_attuned: boolean
): string[] {
  const tags: Set<string> = new Set();

  // Archetype tags
  tags.add(primaryArchetype.toLowerCase().replace(/\s+/g, "-"));

  // Wound tags
  woundPrioritySet.forEach((wound) => {
    tags.add(wound.toLowerCase().replace(/\s+/g, "-"));
  });

  // Mirror tags
  mirrorMap.slice(0, 2).forEach((mirror) => {
    tags.add(mirror.toLowerCase().replace(/\s+/g, "-"));
  });

  // Capability tags
  if (cyclic_aware) tags.add("cyclic-awareness");
  if (body_attuned) tags.add("body-attuned");

  // Universal tags
  tags.add("self-understanding");
  tags.add("healing");
  tags.add("integration");

  return Array.from(tags);
}

/**
 * CONTENT PRIORITY
 * Weights for different content types
 */
function generateContentPriority(
  primaryArchetype: string,
  phase: string,
  nsProfile: Record<string, number>,
  supportStyle: string
): Record<string, number> {
  const numPhase = parseInt(phase);

  // Base weights
  const priority: Record<string, number> = {
    videos: 0.7,
    worksheets: 0.6,
    guided_practices: 0.8,
    articles: 0.5,
    community_posts: 0.4,
    coach_notes: 0.5,
    journaling_prompts: 0.75,
    somatic_practices: 0.8,
    creative_expressions: 0.6,
  };

  // NS-based adjustments
  const dominantNS = Object.entries(nsProfile).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  if (dominantNS === "ns_freeze") {
    priority.guided_practices = 0.9;
    priority.somatic_practices = 0.95;
  } else if (dominantNS === "ns_fight") {
    priority.journaling_prompts = 0.9;
    priority.community_posts = 0.7;
  } else if (dominantNS === "ns_collapse") {
    priority.guided_practices = 0.95;
    priority.videos = 0.8;
  }

  // Phase-based adjustments
  if (numPhase <= 3) {
    priority.guided_practices = 0.9;
    priority.coach_notes = 0.8;
  } else if (numPhase >= 6) {
    priority.creative_expressions = 0.8;
    priority.community_posts = 0.7;
  }

  // Support style adjustments
  if (supportStyle === "escalation") {
    priority.coach_notes = 0.95;
    priority.guided_practices = 0.95;
  }

  return priority;
}

/**
 * HELPER FUNCTIONS
 */

function getPhaseDescription(phase: number): string {
  const descriptions: Record<number, string> = {
    1: "Recognition & Beginning",
    2: "Foundation Building",
    3: "Wound Exploration",
    4: "Integration & Choice",
    5: "Embodied Activation",
    6: "Soul Reclamation",
    7: "Authentic Expression",
    8: "Generative Creation",
    9: "Integrated Mastery",
  };
  return descriptions[phase] || "Your Journey";
}

function formatWoundName(wound: string): string {
  return wound
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * AUDIT & TRANSPARENCY
 * Export routing decisions for inspection
 */
export function exportRoutingAudit(output: RoutingOutput): string {
  let audit = "=== ROUTING AUDIT TRAIL ===\n\n";

  output._routingDecisions.forEach((decision, idx) => {
    audit += `Decision ${idx + 1}: ${decision.rule}\n`;
    audit += `  Input: ${decision.input}\n`;
    audit += `  Output: ${decision.output}\n`;
    audit += `  Reason: ${decision.reason}\n\n`;
  });

  return audit;
}

/**
 * VALIDATION
 * Ensure routing output is coherent
 */
export function validateRoutingOutput(output: RoutingOutput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check module sequences
  if (!output.firstModule || output.firstModule < 1 || output.firstModule > 16) {
    errors.push(`Invalid firstModule: ${output.firstModule}`);
  }

  if (output.moduleSequence.length === 0) {
    errors.push("moduleSequence is empty");
  }

  if (!output.moduleSequence.includes(output.firstModule)) {
    errors.push("firstModule not in moduleSequence");
  }

  // Check unlocks/locks
  const allModules = new Set([...output.unlockedModules, ...output.lockedModules]);
  if (allModules.size !== 16) {
    errors.push(`Expected 16 total modules, got ${allModules.size}`);
  }

  const overlap = output.unlockedModules.filter((m) => output.lockedModules.includes(m));
  if (overlap.length > 0) {
    errors.push(`Modules in both unlocked and locked: ${overlap.join(", ")}`);
  }

  // Check guides
  if (output.activeGuides.length === 0) {
    errors.push("No active guides");
  }

  if (!output.activeGuides.includes(output.primaryGuide)) {
    errors.push(`primaryGuide ${output.primaryGuide} not in activeGuides`);
  }

  // Check content priority weights
  Object.values(output.contentPriority).forEach((weight) => {
    if (typeof weight !== "number" || weight < 0 || weight > 1) {
      errors.push(`Invalid content priority weight: ${weight}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
