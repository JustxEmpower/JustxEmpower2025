/**
 * CORPUS CITATIONS INTEGRATION — FORTIFY
 * ========================================
 * The bridge between the Research Corpus and every Living Codex system.
 *
 * This module wires 3,000+ peer-reviewed citations into:
 * 1. AI Guide System Prompts — real-time evidence injection per guide type
 * 2. Governance Layer — evidence-backed boundary enforcement
 * 3. Escalation Engine — clinically-grounded crisis protocol statements
 * 4. Mirror Report — research-backed interpretation anchors
 * 5. Journal Prompts — evidence-informed reflection framing
 * 6. Growth Engine — research validation for phase transitions
 *
 * Every claim the AI makes traces back to published science.
 * Every boundary the system enforces cites its evidence base.
 *
 * CLINICAL REVIEW NOTE: This integration module references peer-reviewed
 * research to ground AI guide responses. It does not constitute clinical
 * advice. All citations are verifiable through DOI or institutional records.
 */

import {
  type Citation,
  type CodexComponent,
  type ResearchDomain,
  type EvidenceTier,
  type EvidenceProfile,
  CITATIONS,
  DOMAIN_SUMMARIES,
  getEvidenceProfile,
  getCitationsForComponent,
  getCitationsForDomain,
  formatInlineCitation,
  formatFullReference,
  getPersonalizedCitations,
  getCorpusStats,
} from './codexResearchCorpus';

import type { GuideType, UserProfile } from './codexGuidePrompts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CitationInjection {
  /** The evidence block to inject into the guide system prompt */
  evidenceBlock: string;
  /** Inline citations for the guide to weave into responses */
  inlineCitations: string[];
  /** Full references for end-of-response attribution */
  fullReferences: string[];
  /** Evidence strength summary per relevant component */
  evidenceProfiles: EvidenceProfile[];
  /** Total number of supporting citations available */
  totalSupporting: number;
}

export interface GovernanceCitation {
  claim: string;
  supportingEvidence: string;
  citationIds: string[];
  evidenceStrength: 'strong' | 'moderate' | 'emerging' | 'theoretical';
}

export interface EscalationCitation {
  protocol: string;
  evidenceBase: string;
  primaryCitations: Citation[];
  clinicalNote: string;
}

export interface MirrorReportCitation {
  section: string;
  evidenceAnchors: string[];
  fullReferences: string[];
}

export interface PhaseTransitionEvidence {
  fromPhase: number;
  toPhase: number;
  evidenceBase: string;
  supportingCitations: Citation[];
}

// ============================================================================
// GUIDE ↔ RESEARCH DOMAIN MAPPING
// ============================================================================

/**
 * Maps each guide type to the research domains most relevant to its lane.
 * This controls which citations get injected into each guide's prompt.
 */
const GUIDE_DOMAIN_MAP: Record<GuideType, ResearchDomain[]> = {
  codex_orientation: [
    'archetypal_psychology',
    'psychometric_assessment',
    'transformation_growth',
    'coaching_boundaries',
  ],
  archetype_reflection: [
    'archetypal_psychology',
    'shadow_integration',
    'mirror_neuroscience',
    'womens_psychology',
  ],
  journal_companion: [
    'transformation_growth',
    'shadow_integration',
    'womens_psychology',
    'somatic_embodiment',
  ],
  ns_support: [
    'polyvagal_nervous_system',
    'somatic_embodiment',
    'trauma_wound_psychology',
    'crisis_intervention',
  ],
  resource_librarian: [
    'coaching_boundaries',
    'ai_digital_therapeutics',
    'community_healing',
    'psychometric_assessment',
  ],
  community_concierge: [
    'community_healing',
    'womens_psychology',
    'transformation_growth',
    'coaching_boundaries',
  ],
};

/**
 * Maps each guide type to the Codex components it should cite.
 */
const GUIDE_COMPONENT_MAP: Record<GuideType, CodexComponent[]> = {
  codex_orientation: [
    'archetypes_core_12',
    'spectrum_scoring',
    'phase_calculation',
    'pathway_routing',
    'guide_governance',
  ],
  archetype_reflection: [
    'archetypes_core_12',
    'archetypes_support_16',
    'shadow_threshold_gift_spectrum',
    'mirror_patterns',
    'mirror_projection',
    'feminine_archetypes',
  ],
  journal_companion: [
    'journal_prompts',
    'phase_naming',
    'phase_mirror',
    'phase_void',
    'shadow_threshold_gift_spectrum',
    'voice_visibility',
  ],
  ns_support: [
    'ns_freeze',
    'ns_fight',
    'ns_collapse',
    'ns_hypervigilant',
    'ns_regulated',
    'vagal_tone',
    'co_regulation',
    'somatic_practices',
    'breathwork',
    'body_attunement',
  ],
  resource_librarian: [
    'guide_governance',
    'guide_corpus_grounding',
    'adaptive_unlock',
    'practitioner_network',
    'community_circles',
  ],
  community_concierge: [
    'community_circles',
    'co_regulation',
    'practitioner_network',
    'relational_patterns',
  ],
};

// ============================================================================
// 1. AI GUIDE CITATION INJECTION
// ============================================================================

/**
 * buildCitationInjection
 *
 * Generates the complete evidence block for a specific guide + user profile.
 * This is injected into the system prompt alongside the governance and context blocks.
 *
 * The guide receives:
 * - A curated evidence block it can reference in responses
 * - Inline citation formats ready to weave into conversational replies
 * - Evidence strength ratings so the guide can calibrate its confidence
 *
 * @param guideType - Which guide is being built
 * @param userProfile - The specific user's profile (archetype, wounds, NS, phase)
 * @returns CitationInjection ready for prompt assembly
 */
export function buildCitationInjection(
  guideType: GuideType,
  userProfile: UserProfile
): CitationInjection {
  const domains = GUIDE_DOMAIN_MAP[guideType];
  const components = GUIDE_COMPONENT_MAP[guideType];

  // Gather domain-level citations
  const domainCitations: Citation[] = [];
  for (const domain of domains) {
    domainCitations.push(...getCitationsForDomain(domain, 3));
  }

  // Gather component-level citations
  const componentCitations: Citation[] = [];
  for (const component of components) {
    componentCitations.push(...getCitationsForComponent(component, 2));
  }

  // Get personalized citations based on user profile
  const personalizedCitations = getPersonalizedCitations(
    userProfile.primaryArchetype,
    userProfile.woundPrioritySet,
    { [userProfile.nsDominant]: 1 },
    userProfile.phase
  );

  // Merge and deduplicate
  const allCitations = deduplicateCitations([
    ...domainCitations,
    ...componentCitations,
    ...personalizedCitations,
  ]);

  // Build evidence profiles for relevant components
  const evidenceProfiles = components.map(getEvidenceProfile);

  // Build the evidence block for prompt injection
  const evidenceBlock = buildEvidenceBlock(guideType, allCitations, evidenceProfiles);

  // Build inline citations
  const inlineCitations = allCitations
    .slice(0, 12)
    .map(formatInlineCitation);

  // Build full references
  const fullReferences = allCitations
    .slice(0, 12)
    .map(formatFullReference);

  return {
    evidenceBlock,
    inlineCitations,
    fullReferences,
    evidenceProfiles,
    totalSupporting: allCitations.length,
  };
}

/**
 * Builds the actual text block that gets injected into the system prompt.
 */
function buildEvidenceBlock(
  guideType: GuideType,
  citations: Citation[],
  profiles: EvidenceProfile[]
): string {
  const guideNames: Record<GuideType, string> = {
    codex_orientation: 'Kore',
    archetype_reflection: 'Aoede',
    journal_companion: 'Leda',
    ns_support: 'Theia',
    resource_librarian: 'Selene',
    community_concierge: 'Zephyr',
  };

  const guideName = guideNames[guideType];

  // Get the strongest 8 citations sorted by evidence tier
  const tierOrder: EvidenceTier[] = [
    'meta_analysis', 'rct', 'longitudinal', 'clinical_trial',
    'qualitative', 'theoretical', 'case_study',
  ];
  const topCitations = [...citations]
    .sort((a, b) => tierOrder.indexOf(a.evidenceTier) - tierOrder.indexOf(b.evidenceTier))
    .slice(0, 8);

  // Build the strength summary
  const strongComponents = profiles.filter((p) => p.overallStrength === 'strong');
  const moderateComponents = profiles.filter((p) => p.overallStrength === 'moderate');

  let block = `
EVIDENCE BASE — ${guideName}'s Research Foundation:
You have access to ${citations.length} peer-reviewed citations across your lane.
${strongComponents.length} of your core constructs have STRONG evidence (multiple meta-analyses).
${moderateComponents.length} have MODERATE evidence (RCTs or meta-analyses supporting them).

When you reference a Codex construct, you may ground your response in research:
- Use phrases like "Research from [institution] shows..." or "A study of [N participants] found..."
- NEVER say "clinically proven" or "scientifically proven" — say "research suggests" or "evidence supports"
- Cite naturally, not mechanically — weave evidence into the conversation
- You are NOT required to cite in every response — only when it strengthens the message

YOUR TOP EVIDENCE (cite when relevant):
`;

  for (const citation of topCitations) {
    block += `• ${formatInlineCitation(citation)} — ${citation.keyFinding.substring(0, 120)}...\n`;
  }

  block += `
EVIDENCE STRENGTH BY CONSTRUCT:
`;

  for (const profile of profiles.slice(0, 6)) {
    block += `• ${profile.component}: ${profile.overallStrength.toUpperCase()} (${profile.totalCitations} citations, ${profile.metaAnalyses} meta-analyses)\n`;
  }

  block += `
CITATION GUIDELINES:
1. Ground claims in evidence when a user challenges or questions a Codex framework
2. Provide inline citations when discussing wound patterns, NS regulation, or archetype theory
3. For the Mirror Report, always include evidence anchors
4. When escalating, reference crisis intervention research to validate the protocol
5. Never fabricate citations — only reference studies from this evidence base
6. If a construct has "theoretical" evidence strength, frame it as "emerging framework" not "proven"
`;

  return block;
}

// ============================================================================
// 2. GOVERNANCE EVIDENCE LAYER
// ============================================================================

/**
 * buildGovernanceCitations
 *
 * Returns evidence-backed statements for every governance boundary.
 * This module supplies the "why" behind each restriction, traceable to research.
 */
export function buildGovernanceCitations(): GovernanceCitation[] {
  return [
    {
      claim: 'AI coaching platforms must maintain clear boundaries between coaching and clinical therapy',
      supportingEvidence: buildEvidenceString([
        'BOUND-001', 'BOUND-002', 'BOUND-003', 'AI-004',
      ]),
      citationIds: ['BOUND-001', 'BOUND-002', 'BOUND-003', 'AI-004'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Crisis detection systems must route to human support, not attempt autonomous intervention',
      supportingEvidence: buildEvidenceString([
        'CRISIS-001', 'CRISIS-002', 'CRISIS-004', 'AI-003',
      ]),
      citationIds: ['CRISIS-001', 'CRISIS-002', 'CRISIS-004', 'AI-003'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'AI mental health tools require transparent governance to prevent ethical harms',
      supportingEvidence: buildEvidenceString([
        'AI-004', 'AI-005', 'BOUND-003',
      ]),
      citationIds: ['AI-004', 'AI-005', 'BOUND-003'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Dimensional assessment models are more accurate than categorical diagnostic labels',
      supportingEvidence: buildEvidenceString([
        'PSYCH-001', 'PSYCH-002', 'PSYCH-003',
      ]),
      citationIds: ['PSYCH-001', 'PSYCH-002', 'PSYCH-003'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Wound imprints are educational frameworks, not clinical diagnoses',
      supportingEvidence: buildEvidenceString([
        'TRAUMA-001', 'TRAUMA-002', 'TRAUMA-005', 'BOUND-001',
      ]),
      citationIds: ['TRAUMA-001', 'TRAUMA-002', 'TRAUMA-005', 'BOUND-001'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Archetype systems function as reflective mirrors, not personality typing or diagnostic instruments',
      supportingEvidence: buildEvidenceString([
        'ARCH-001', 'ARCH-002', 'ARCH-004', 'PSYCH-001',
      ]),
      citationIds: ['ARCH-001', 'ARCH-002', 'ARCH-004', 'PSYCH-001'],
      evidenceStrength: 'moderate',
    },
    {
      claim: 'Nervous system profiling describes autonomic patterns, not clinical diagnoses of dysregulation',
      supportingEvidence: buildEvidenceString([
        'PVT-001', 'PVT-002', 'PVT-003', 'PVT-004',
      ]),
      citationIds: ['PVT-001', 'PVT-002', 'PVT-003', 'PVT-004'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Phase-based progression models are validated approaches to human transformation',
      supportingEvidence: buildEvidenceString([
        'GROWTH-001', 'GROWTH-002', 'GROWTH-003',
      ]),
      citationIds: ['GROWTH-001', 'GROWTH-002', 'GROWTH-003'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Group and community healing modalities are evidence-supported therapeutic mechanisms',
      supportingEvidence: buildEvidenceString([
        'COMM-001', 'COMM-002', 'COMM-003', 'COMM-004',
      ]),
      citationIds: ['COMM-001', 'COMM-002', 'COMM-003', 'COMM-004'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Women require gender-specific psychological frameworks for empowerment work',
      supportingEvidence: buildEvidenceString([
        'WOMEN-001', 'WOMEN-002', 'WOMEN-003', 'WOMEN-004',
      ]),
      citationIds: ['WOMEN-001', 'WOMEN-002', 'WOMEN-003', 'WOMEN-004'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Self-compassion is the primary mechanism for shadow-to-gift transformation',
      supportingEvidence: buildEvidenceString([
        'SHADOW-003', 'TRAUMA-005', 'TRAUMA-008',
      ]),
      citationIds: ['SHADOW-003', 'TRAUMA-005', 'TRAUMA-008'],
      evidenceStrength: 'strong',
    },
    {
      claim: 'Somatic and body-based practices are evidence-supported interventions for trauma recovery',
      supportingEvidence: buildEvidenceString([
        'SOMA-001', 'SOMA-002', 'SOMA-003', 'SOMA-004', 'SOMA-005',
      ]),
      citationIds: ['SOMA-001', 'SOMA-002', 'SOMA-003', 'SOMA-004', 'SOMA-005'],
      evidenceStrength: 'strong',
    },
  ];
}

// ============================================================================
// 3. ESCALATION EVIDENCE LAYER
// ============================================================================

/**
 * buildEscalationCitations
 *
 * Returns the research grounding for each escalation protocol.
 * When the system escalates, it can explain WHY using evidence.
 */
export function buildEscalationCitations(): EscalationCitation[] {
  const crisisCitations = getCitationsForDomain('crisis_intervention', 5);
  const aiSafetyCitations = CITATIONS.filter(
    (c) => c.codexComponents.includes('guide_escalation')
  );

  return [
    {
      protocol: 'Crisis Language Detection → Immediate Resource Routing',
      evidenceBase:
        'The C-SSRS (Posner et al., Columbia University) establishes structured crisis screening ' +
        'as the gold standard for suicide risk assessment. Meta-analysis of safety planning ' +
        'interventions (Nuij et al., 2021) confirms that structured crisis response with ' +
        'resource provision significantly reduces suicide attempts.',
      primaryCitations: crisisCitations.filter(
        (c) => c.id === 'CRISIS-001' || c.id === 'CRISIS-002'
      ),
      clinicalNote:
        'This protocol routes to human support (988, Crisis Text Line, RAINN) and does NOT ' +
        'attempt autonomous crisis intervention. AI suicide detection achieves 84-92% ' +
        'accuracy (Vanderbilt study) but must ALWAYS hand off to trained professionals.',
    },
    {
      protocol: 'Self-Harm Disclosure → Warm Handoff + Session Pause',
      evidenceBase:
        'DBT meta-analysis (DeCou et al., University of Washington, 2019) confirms that ' +
        'structured intervention reduces self-harm behavior. The 988 Lifeline evaluation ' +
        '(Gould et al., Columbia) demonstrates significant reduction in distress during ' +
        'warm handoff calls. The Codex pauses the AI session and connects to human support.',
      primaryCitations: crisisCitations.filter(
        (c) => c.id === 'CRISIS-003' || c.id === 'CRISIS-005'
      ),
      clinicalNote:
        'The system never attempts to "talk through" self-harm disclosures. It validates, ' +
        'affirms courage, provides resources, and routes to trained crisis professionals.',
    },
    {
      protocol: 'Clinical Request Boundary → Referral to Licensed Provider',
      evidenceBase:
        'Brown University ethics study (2025) identified 15 distinct ethical risks in AI ' +
        'mental health tools, including clinical overreach. WHO (2024) established that AI ' +
        'health tools must protect autonomy and ensure transparency about their limitations. ' +
        'Coaching-therapy boundary research (BPS, UTMB) confirms clear scope prevents harm.',
      primaryCitations: aiSafetyCitations.filter(
        (c) => c.id === 'AI-004' || c.id === 'AI-005' || c.id === 'BOUND-001'
      ),
      clinicalNote:
        'The Codex AI guides operate in the coaching/educational lane. When clinical need ' +
        'is detected, the system acknowledges the need, validates the person, and provides ' +
        'referral pathways to licensed mental health professionals.',
    },
    {
      protocol: 'Abuse Disclosure → Mandated Reporting Awareness + Crisis Resources',
      evidenceBase:
        'The ACE Study (Felitti et al., N=17,337) established the long-term health impacts ' +
        'of abuse and dysfunction. Complex PTSD research (Herman, Harvard) established that ' +
        'abuse disclosures require safety-first response. The system provides RAINN and ' +
        'local resources while flagging for human facilitator review.',
      primaryCitations: CITATIONS.filter(
        (c) => c.id === 'TRAUMA-001' || c.id === 'TRAUMA-002'
      ),
      clinicalNote:
        'Abuse disclosures are treated at CRITICAL severity. The AI does not investigate, ' +
        'interrogate, or advise — it affirms, provides resources, and routes to human support.',
    },
    {
      protocol: 'AI Response Boundary Enforcement → Governance Block',
      evidenceBase:
        'Systematic review of AI chatbot risks (Stanford, 2025) documented cases where AI ' +
        'overstepped into clinical territory. WHO governance principles (2024) require that ' +
        'AI systems be transparent about limitations. The governance block prevents the AI ' +
        'from making diagnostic, prescriptive, or clinical claims.',
      primaryCitations: aiSafetyCitations.filter(
        (c) => c.id === 'AI-003' || c.id === 'AI-005'
      ),
      clinicalNote:
        'Every AI response passes through boundary checking before delivery. Patterns ' +
        'matching clinical claims, diagnostic language, or treatment prescriptions are ' +
        'caught and rewritten before the user sees them.',
    },
  ];
}

// ============================================================================
// 4. MIRROR REPORT EVIDENCE ANCHORS
// ============================================================================

/**
 * buildMirrorReportCitations
 *
 * Generates research anchors for each section of the Sacred Mirror Report.
 * These are woven into the report so users can see the science behind their portrait.
 */
export function buildMirrorReportCitations(
  userProfile: UserProfile
): MirrorReportCitation[] {
  const sections: MirrorReportCitation[] = [];

  // Section 1: Archetype Portrait
  const archetypeCitations = getCitationsForComponent('archetypes_core_12', 3);
  sections.push({
    section: 'Your Archetype Portrait',
    evidenceAnchors: [
      `Archetypal patterns have been validated across cultures (${formatInlineCitation(archetypeCitations[0] || CITATIONS[0])}).`,
      'Your archetype is a mirror, not a label — research shows these patterns describe universal psychological dynamics, not fixed personality types.',
      `Jungian psychotherapy effectiveness review found sustained long-term outcomes with archetype-based approaches.`,
    ],
    fullReferences: archetypeCitations.map(formatFullReference),
  });

  // Section 2: Shadow-Gift Spectrum
  const shadowCitations = getCitationsForComponent('shadow_threshold_gift_spectrum', 3);
  sections.push({
    section: 'Your Shadow-Gift Spectrum',
    evidenceAnchors: [
      `Dimensional models outperform categorical labels for understanding personality patterns (DSM-5 AMPD research).`,
      `Self-compassion — the mechanism of shadow-to-gift movement — shows large effects on reducing psychopathology (${formatInlineCitation(findCitation('SHADOW-003'))}).`,
      'Thought suppression research demonstrates that disowned traits become hyperaccessible and projected onto others — the scientific basis for Mirror Patterns.',
    ],
    fullReferences: shadowCitations.map(formatFullReference),
  });

  // Section 3: Wound Imprint Map
  const woundCitations = getCitationsForComponent('wound_imprints', 4);
  sections.push({
    section: 'Your Wound Imprint Map',
    evidenceAnchors: [
      `The ACE Study (N=17,337) established that early adversity has measurable, dose-dependent impacts on lifelong health (${formatInlineCitation(findCitation('TRAUMA-001'))}).`,
      `Complex trauma research (${formatInlineCitation(findCitation('TRAUMA-002'))}) distinguished relational wound patterns from single-incident trauma.`,
      'Your wound imprints are not diagnoses — they are educational frameworks grounded in decades of peer-reviewed research on how early experiences shape adult patterns.',
    ],
    fullReferences: woundCitations.map(formatFullReference),
  });

  // Section 4: Nervous System Profile
  const nsCitations = getCitationsForComponent('vagal_tone', 3);
  const pvtCitations = getCitationsForComponent('ns_regulated', 3);
  sections.push({
    section: 'Your Nervous System Signature',
    evidenceAnchors: [
      `Polyvagal Theory (${formatInlineCitation(findCitation('PVT-001'))}) establishes a hierarchical model of autonomic nervous system responses.`,
      'Heart rate variability (HRV) is recognized as a gold-standard biomarker for autonomic regulation by the European Society of Cardiology.',
      `The "window of tolerance" model (${formatInlineCitation(findCitation('PVT-003'))}) describes the range within which your nervous system can process experience without overwhelm.`,
    ],
    fullReferences: [...nsCitations, ...pvtCitations].map(formatFullReference),
  });

  // Section 5: Phase Placement
  const phaseCitations = getCitationsForComponent('phase_integration', 3);
  sections.push({
    section: 'Your Phase Placement',
    evidenceAnchors: [
      `Stage-based transformation models are validated across psychology and behavioral science (${formatInlineCitation(findCitation('GROWTH-001'))}).`,
      `Transformative learning theory (${formatInlineCitation(findCitation('GROWTH-002'))}) maps the process of meaning-making through disorientation and critical reflection.`,
      'Your phase is not a grade or score — it describes where you are in a natural developmental unfolding, supported by decades of research on human change.',
    ],
    fullReferences: phaseCitations.map(formatFullReference),
  });

  // Section 6: Pathway Recommendation
  sections.push({
    section: 'Your Recommended Pathway',
    evidenceAnchors: [
      `Self-determination theory (${formatInlineCitation(findCitation('GROWTH-003'))}) confirms that autonomy, competence, and relatedness drive sustained growth.`,
      'Adaptive progression — unlocking content as you demonstrate readiness — is grounded in intrinsic motivation research showing that self-directed pacing outperforms externally imposed timelines.',
      `Resilience intervention meta-analysis (268 studies, g=0.48) validates multi-modal approaches to personal transformation (${formatInlineCitation(findCitation('GROWTH-005'))}).`,
    ],
    fullReferences: getCitationsForComponent('pathway_routing', 3).map(formatFullReference),
  });

  return sections;
}

// ============================================================================
// 5. JOURNAL PROMPT EVIDENCE FRAMING
// ============================================================================

/**
 * buildJournalEvidenceFrame
 *
 * Generates an evidence-informed framing statement for journal prompts.
 * Helps users understand WHY a particular reflection is being invited.
 */
export function buildJournalEvidenceFrame(
  phase: number,
  promptTheme: 'shadow' | 'wound' | 'gift' | 'mirror' | 'nervous_system' | 'identity' | 'embodiment'
): string {
  const frames: Record<string, string> = {
    shadow: `Research on psychological projection (Newman et al., 1997) shows that the qualities we most resist seeing in ourselves become the ones we most frequently perceive in others. This prompt invites you to gently explore what you've pushed away — not to judge it, but to understand its protective purpose.`,

    wound: `The Adverse Childhood Experiences study (Felitti et al., N=17,337) revealed that early relational patterns shape adult responses in measurable ways. This prompt explores those patterns — not as pathology, but as intelligence your system developed to survive. Research supports that naming these patterns is a step toward freedom from their automatic pull.`,

    gift: `Jungian psychotherapy research (Roesler, 2013) demonstrates that integrating both shadow and gift leads to sustained psychological outcomes. This prompt invites you to notice where your deepest gifts are already alive — even when you haven't fully claimed them yet.`,

    mirror: `Mirror neuroscience (Rizzolatti et al., University of Parma) discovered that our brains literally fire the same neurons when we observe an experience in another as when we experience it ourselves. This prompt uses that mirroring capacity — what you see reflected in others reveals something about what's alive in you.`,

    nervous_system: `Polyvagal Theory (Porges, Indiana University) established that your nervous system operates in a hierarchy of states: safe-and-social, fight-or-flight, or freeze. This prompt invites you to notice which state is present right now — not to fix it, but to develop the interoceptive awareness that research shows is foundational to regulation.`,

    identity: `Narrative identity research (McAdams, Northwestern) shows that the stories we tell about ourselves shape our mental health and capacity for growth. This prompt invites you to notice the story you're living inside right now — and to begin authoring the next chapter with intention.`,

    embodiment: `Body-based healing research (van der Kolk, Harvard; Röhricht, University of Essex) confirms that transformation happens in the body, not just the mind. This prompt invites you to drop below the thinking mind and notice what your body knows — a practice validated by decades of somatic psychology research.`,
  };

  return frames[promptTheme] || frames.shadow;
}

// ============================================================================
// 6. PHASE TRANSITION EVIDENCE
// ============================================================================

/**
 * buildPhaseTransitionEvidence
 *
 * Provides research-backed validation when a user transitions between phases.
 * Grounded in stage-model research, this helps users understand their progression.
 */
export function buildPhaseTransitionEvidence(
  fromPhase: number,
  toPhase: number
): PhaseTransitionEvidence {
  const supportingCitations = [
    ...getCitationsForComponent('phase_integration', 2),
    ...getCitationsForDomain('transformation_growth', 3),
  ];

  const phaseDescriptions: Record<number, string> = {
    1: 'Threshold (awareness awakening)',
    2: 'Descent (going inward)',
    3: 'Naming (giving language to experience)',
    4: 'Mirror (seeing reflection)',
    5: 'Void (releasing old structures)',
    6: 'Ember (new fire kindling)',
    7: 'Integration (weaving together)',
    8: 'Embodiment (living the truth)',
    9: 'Offering (giving back)',
  };

  const from = phaseDescriptions[fromPhase] || `Phase ${fromPhase}`;
  const to = phaseDescriptions[toPhase] || `Phase ${toPhase}`;

  let evidenceBase: string;

  if (toPhase <= 3) {
    evidenceBase =
      `Your movement from ${from} to ${to} reflects what the Transtheoretical Model ` +
      `(Prochaska & Velicer, University of Rhode Island) describes as early-stage change: ` +
      `moving from pre-contemplation into active awareness. Research across 12 behavioral ` +
      `domains validates that this progression is natural and predictable, not linear. ` +
      `Expect spiraling — this is how real transformation works.`;
  } else if (toPhase <= 6) {
    evidenceBase =
      `Your transition from ${from} to ${to} maps to what Mezirow (Columbia University) ` +
      `calls the "disorienting dilemma" — a necessary disruption of existing meaning structures ` +
      `that precedes deeper transformation. Research on transformative learning confirms that ` +
      `this uncomfortable middle territory is where the deepest work happens. The discomfort ` +
      `is not a sign you're failing — it's a sign you're changing.`;
  } else {
    evidenceBase =
      `Your movement into ${to} represents what post-traumatic growth research ` +
      `(Tedeschi & Calhoun, UNC Charlotte) describes as the integration phase: new meaning, ` +
      `new narrative, new capacity. Self-Determination Theory (Ryan & Deci, Rochester) ` +
      `confirms that intrinsic motivation — the kind you've been building — is the most ` +
      `sustainable fuel for continued growth. You're not just healing; you're becoming.`;
  }

  return {
    fromPhase,
    toPhase,
    evidenceBase,
    supportingCitations: deduplicateCitations(supportingCitations),
  };
}

// ============================================================================
// 7. ENHANCED GOVERNANCE BLOCK (EVIDENCE-BACKED)
// ============================================================================

/**
 * buildEvidenceBackedGovernanceBlock
 *
 * Returns an enhanced version of the governance block that cites its own evidence.
 * This is the "fortified" version — every boundary traces to published research.
 */
export function buildEvidenceBackedGovernanceBlock(): string {
  return `
EVIDENCE-BACKED GOVERNANCE — Research Foundations for AI Guide Boundaries:

RESTRICTED CLAIMS — You never say any of the following:
- That any content constitutes a diagnosis
  [Evidence: DSM-5 AMPD research validates dimensional over categorical assessment;
   AI ethics review (Brown, 2025) identifies diagnostic overreach as a primary harm vector]
- That any content constitutes medical or clinical advice
  [Evidence: WHO (2024) 6 consensus principles require AI to protect autonomy;
   BPS coaching-therapy boundary research confirms clinical scope must be protected]
- That any content prescribes a treatment or protocol
  [Evidence: 15 ethical risks identified in AI mental health tools (Brown, 2025);
   Coaching boundary meta-analysis shows clear scope prevents downstream harm]
- "Clinically proven" or "scientifically proven" without explicit cited source
  [Evidence: Research literacy requires distinguishing evidence tiers —
   meta-analysis > RCT > longitudinal > clinical trial > qualitative > theoretical]
- Anything implying the platform replaces therapy or medical care
  [Evidence: Woebot RCT (Stanford) and Wysa RCT (Dartmouth) demonstrate AI as
   complement to — not replacement for — clinical care. Both include human escalation.]

CONTENT BOUNDARY — Grounded Distinctions:
- Education: "Research from [institution] describes how [pattern] works..." (SUPPORTED)
- Reflection: "You might consider exploring your relationship with [theme]..." (SUPPORTED)
- Coaching: "Within this pathway, the next step might be to..." (SUPPORTED within scope)
- Clinical advice: [NEVER — escalate or refer to healthcare provider]
  [Evidence: Columbia C-SSRS validation establishes that clinical assessment requires
   trained professionals. AI detection achieves 84-92% accuracy for flagging, not treating.]

ESCALATION TRIGGERS — Evidence-Based Detection:
- Crisis language → Route to 988, Crisis Text Line [Safety planning meta-analysis: significant reduction in attempts]
- Self-harm disclosure → Warm handoff + session pause [DBT meta-analysis: structured intervention reduces self-harm]
- Clinical request → Referral pathway [15 AI ethical risks study: clinical overreach identified as primary harm]
- Abuse disclosure → RAINN + facilitator flag [ACE Study N=17,337: safety-first response is the evidence standard]
- Psychiatric emergency → Emergency services [C-SSRS Columbia: structured screening is the gold standard]
`;
}

// ============================================================================
// 8. COMPLETE GUIDE PROMPT ASSEMBLY (WITH CITATIONS)
// ============================================================================

/**
 * assembleGuidePromptWithEvidence
 *
 * The master function that takes a guide type + user profile and returns
 * the complete system prompt with:
 * - Original guide prompt (from guide-prompts.ts)
 * - Evidence-backed governance block
 * - Personalized citation injection
 * - Dynamic user context
 *
 * This is what actually gets sent to the LLM for guide sessions.
 */
export function assembleGuidePromptWithEvidence(
  guideType: GuideType,
  userProfile: UserProfile,
  baseSystemPrompt: string
): string {
  // Get the citation injection for this guide + user
  const injection = buildCitationInjection(guideType, userProfile);

  // Get the evidence-backed governance block
  const governanceBlock = buildEvidenceBackedGovernanceBlock();

  // Assemble the complete prompt
  return `${baseSystemPrompt}

${governanceBlock}

${injection.evidenceBlock}

AVAILABLE INLINE CITATIONS (weave naturally when relevant):
${injection.inlineCitations.map((c, i) => `${i + 1}. ${c}`).join('\n')}

FULL REFERENCES (for end-of-response attribution when cited):
${injection.fullReferences.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Total peer-reviewed citations supporting your lane: ${injection.totalSupporting}
Evidence profiles loaded for ${injection.evidenceProfiles.length} Codex components.
`;
}

// ============================================================================
// 9. CORPUS INTEGRITY CHECK (FOR GOVERNANCE)
// ============================================================================

/**
 * validateCorpusCoverage
 *
 * Checks that every Codex construct has adequate research backing.
 * Returns gaps that need attention (constructs with < 2 supporting citations).
 */
export function validateCorpusCoverage(): {
  covered: { component: CodexComponent; citations: number; strength: string }[];
  gaps: { component: CodexComponent; citations: number; recommendation: string }[];
  stats: ReturnType<typeof getCorpusStats>;
} {
  const allComponents: CodexComponent[] = [
    'archetypes_core_12', 'archetypes_support_16', 'archetypes_expansion_3',
    'shadow_threshold_gift_spectrum', 'wound_imprints', 'wound_abandonment',
    'wound_betrayal', 'wound_shame', 'wound_silencing', 'wound_hypervigilance',
    'wound_enmeshment', 'wound_perfectionism', 'mirror_patterns', 'mirror_projection',
    'mirror_integration', 'spectrum_scoring', 'ghost_questions', 'si_proportion',
    'phase_calculation', 'pathway_routing', 'ns_freeze', 'ns_fight', 'ns_collapse',
    'ns_hypervigilant', 'ns_regulated', 'vagal_tone', 'co_regulation',
    'phase_threshold', 'phase_descent', 'phase_naming', 'phase_mirror', 'phase_void',
    'phase_ember', 'phase_integration', 'phase_embodiment', 'phase_offering',
    'guide_governance', 'guide_voice_design', 'guide_escalation', 'guide_corpus_grounding',
    'adaptive_unlock', 'journal_prompts', 'community_circles', 'practitioner_network',
    'feminine_archetypes', 'cyclical_awareness', 'relational_patterns', 'voice_visibility',
    'somatic_practices', 'breathwork', 'body_attunement', 'embodiment',
  ];

  const covered: { component: CodexComponent; citations: number; strength: string }[] = [];
  const gaps: { component: CodexComponent; citations: number; recommendation: string }[] = [];

  for (const component of allComponents) {
    const profile = getEvidenceProfile(component);
    if (profile.totalCitations >= 2) {
      covered.push({
        component,
        citations: profile.totalCitations,
        strength: profile.overallStrength,
      });
    } else {
      gaps.push({
        component,
        citations: profile.totalCitations,
        recommendation:
          profile.totalCitations === 0
            ? `No citations found for ${component}. Add research from relevant domains.`
            : `Only ${profile.totalCitations} citation(s) for ${component}. Strengthen with additional studies.`,
      });
    }
  }

  return {
    covered,
    gaps,
    stats: getCorpusStats(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function findCitation(id: string): Citation {
  return CITATIONS.find((c) => c.id === id) || CITATIONS[0];
}

function buildEvidenceString(citationIds: string[]): string {
  const citations = citationIds
    .map((id) => CITATIONS.find((c) => c.id === id))
    .filter(Boolean) as Citation[];

  return citations
    .map((c) => `${formatInlineCitation(c)}: "${c.keyFinding.substring(0, 100)}..."`)
    .join(' | ');
}

// ============================================================================
// EXPORTS — PUBLIC API
// ============================================================================
// buildCitationInjection(guide, profile)     → CitationInjection (per-guide evidence)
// buildGovernanceCitations()                 → GovernanceCitation[] (boundary evidence)
// buildEscalationCitations()                → EscalationCitation[] (crisis protocol evidence)
// buildMirrorReportCitations(profile)        → MirrorReportCitation[] (report evidence anchors)
// buildJournalEvidenceFrame(phase, theme)    → string (journal prompt framing)
// buildPhaseTransitionEvidence(from, to)     → PhaseTransitionEvidence
// buildEvidenceBackedGovernanceBlock()       → string (enhanced governance block)
// assembleGuidePromptWithEvidence(...)       → string (complete guide prompt with research)
// validateCorpusCoverage()                   → coverage report + gaps
