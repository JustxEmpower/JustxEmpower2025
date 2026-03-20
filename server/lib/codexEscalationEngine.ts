/**
 * ESCALATION ENGINE — VITALIZE
 * ==============================
 * Real-time content safety, crisis detection, and escalation routing
 * for the Living Codex AI Guide system.
 *
 * IMPORTANT: This module implements pattern-based detection for
 * guiding users toward appropriate professional resources. It is NOT
 * a substitute for clinical assessment. Before production deployment,
 * all detection patterns, response templates, and routing logic
 * MUST be reviewed by a licensed mental health professional.
 *
 * Architecture:
 * 1. Content Classifier — categorizes every user message
 * 2. Crisis Detector — pattern-matches against known risk signals
 * 3. Boundary Enforcer — ensures AI responses stay within scope
 * 4. Escalation Router — determines severity + routes to support
 * 5. Audit Logger — immutable record of all escalation events
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TriggerType =
  | 'crisis_language'
  | 'self_harm'
  | 'harm_to_others'
  | 'clinical_request'
  | 'out_of_scope'
  | 'acute_distress'
  | 'abuse_disclosure'
  | 'psychiatric_emergency'
  | 'medication_inquiry';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type ContentCategory =
  | 'safe'
  | 'educational'
  | 'reflective'
  | 'coaching'
  | 'boundary_adjacent'
  | 'clinical_territory'
  | 'escalation_required';

export type ResponseAction =
  | 'continue'
  | 'gentle_redirect'
  | 'firm_boundary'
  | 'warm_handoff'
  | 'crisis_response'
  | 'session_pause';

export interface EscalationEvent {
  id: string;
  userId: string;
  sessionId: string;
  triggerType: TriggerType;
  severity: SeverityLevel;
  detectedPatterns: string[];
  userMessageExcerpt: string;
  aiResponseDraft?: string;
  action: ResponseAction;
  resourcesOffered: string[];
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface ContentClassification {
  category: ContentCategory;
  confidence: number; // 0-1
  triggers: TriggerType[];
  severity: SeverityLevel;
  action: ResponseAction;
  reasoning: string;
}

export interface EscalationResponse {
  shouldEscalate: boolean;
  action: ResponseAction;
  severity: SeverityLevel;
  triggers: TriggerType[];
  aiResponseOverride?: string;
  resourceBlock?: string;
  logEntry: Omit<EscalationEvent, 'id' | 'timestamp'>;
}

export interface BoundaryCheckResult {
  isWithinBounds: boolean;
  violations: string[];
  suggestedRevision?: string;
  category: ContentCategory;
}

// ============================================================================
// CRISIS DETECTION PATTERNS
// ============================================================================

/**
 * Pattern sets for detecting escalation-worthy content.
 * Each pattern includes the regex, the trigger type, and severity.
 *
 * CLINICAL REVIEW NOTE: These patterns should be validated by a
 * mental health professional before production use. False negatives
 * are more dangerous than false positives in this context.
 */

interface DetectionPattern {
  pattern: RegExp;
  triggerType: TriggerType;
  severity: SeverityLevel;
  label: string;
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  // === CRITICAL — Immediate crisis response ===
  {
    pattern: /\b(want(?:ing)?\s+to\s+die|don'?t\s+want\s+to\s+(?:be\s+here|live|exist)|end(?:ing)?\s+(?:my|it\s+all|everything)|sui[cs]id(?:e|al)|kill(?:ing)?\s+myself)\b/i,
    triggerType: 'self_harm',
    severity: 'critical',
    label: 'suicidal_ideation',
  },
  {
    pattern: /\b(plan(?:ning)?\s+to\s+(?:hurt|harm|kill)|method\s+to\s+(?:end|die)|pills?\s+to\s+(?:overdose|end)|jump(?:ing)?\s+(?:off|from)|cut(?:ting)?\s+(?:my|to)\s+(?:wrists?|veins?))\b/i,
    triggerType: 'self_harm',
    severity: 'critical',
    label: 'active_plan',
  },
  {
    pattern: /\b(going\s+to\s+(?:hurt|kill|harm)\s+(?:him|her|them|someone|my)|murder|homicid)/i,
    triggerType: 'harm_to_others',
    severity: 'critical',
    label: 'threat_to_others',
  },
  {
    pattern: /\b(psychotic|hallucin(?:ating|ation)|voices?\s+(?:telling|in\s+my\s+head)|seeing\s+things\s+(?:that\s+aren'?t|no\s+one\s+else))\b/i,
    triggerType: 'psychiatric_emergency',
    severity: 'critical',
    label: 'psychotic_symptoms',
  },

  // === HIGH — Warm handoff to human support ===
  {
    pattern: /\b(self[- ]?harm(?:ing)?|cut(?:ting)?\s+myself|burn(?:ing)?\s+myself|hurt(?:ing)?\s+myself\s+on\s+purpose|biting\s+myself|hitting\s+myself)\b/i,
    triggerType: 'self_harm',
    severity: 'high',
    label: 'self_harm_behavior',
  },
  {
    pattern: /\b(being\s+(?:abused|molested|assaulted|trafficked|raped)|(?:he|she|they)\s+(?:hit|hits|beat|beats|rape[sd]?|molest|assault)\s+me|domestic\s+violen(?:ce|t))\b/i,
    triggerType: 'abuse_disclosure',
    severity: 'high',
    label: 'abuse_disclosure',
  },
  {
    pattern: /\b(panic\s+attack\s+(?:right\s+now|happening)|can'?t\s+(?:breathe|stop\s+(?:shaking|crying))|having\s+a\s+(?:breakdown|meltdown|episode)|completely?\s+(?:falling|fell)\s+apart)\b/i,
    triggerType: 'acute_distress',
    severity: 'high',
    label: 'acute_distress_episode',
  },
  {
    pattern: /\b(eating\s+disorder|anorexi[ac]|bulimi[ac]|purging|starving\s+myself|binge(?:ing)?\s+and\s+(?:purging|throwing\s+up))\b/i,
    triggerType: 'clinical_request',
    severity: 'high',
    label: 'eating_disorder',
  },
  {
    pattern: /\b(child(?:ren)?\s+(?:is|are|being)\s+(?:abused|hurt|molested|neglected)|(?:my\s+)?(?:kid|child|daughter|son)\s+(?:is|in)\s+danger)\b/i,
    triggerType: 'abuse_disclosure',
    severity: 'critical',
    label: 'child_safety',
  },

  // === MEDIUM — Firm boundary with resource direction ===
  {
    pattern: /\b(diagnos(?:e|is)|what\s+(?:disorder|condition|illness)\s+do\s+I\s+have|am\s+I\s+(?:bipolar|borderline|narcissis|schizophren|depressed|anxious\s+disorder)|do\s+I\s+have\s+(?:PTSD|OCD|ADHD|BPD|DID))\b/i,
    triggerType: 'clinical_request',
    severity: 'medium',
    label: 'diagnosis_seeking',
  },
  {
    pattern: /\b((?:should\s+I|can\s+you)\s+(?:prescribe|recommend)\s+(?:medication|meds|drugs|antidepressant|SSRI|benzo)|what\s+(?:medication|meds|pill)\s+(?:should|can|do)\s+I\s+(?:take|use))\b/i,
    triggerType: 'medication_inquiry',
    severity: 'medium',
    label: 'medication_advice',
  },
  {
    pattern: /\b(replace\s+(?:my\s+)?therap(?:y|ist)|instead\s+of\s+(?:therapy|counseling|my\s+therapist)|don'?t\s+need\s+(?:a\s+)?therap(?:y|ist)\s+(?:anymore|now))\b/i,
    triggerType: 'clinical_request',
    severity: 'medium',
    label: 'therapy_replacement',
  },
  {
    pattern: /\b(trauma\s+(?:flooding|overwhelm)|flashback(?:s)?\s+(?:right\s+now|happening)|dissociat(?:ing|ion|ed)\s+(?:right\s+now|can'?t\s+stop))\b/i,
    triggerType: 'acute_distress',
    severity: 'high',
    label: 'trauma_response',
  },

  // === LOW — Gentle redirect, continue conversation ===
  {
    pattern: /\b(feeling\s+(?:really|so|very)\s+(?:hopeless|worthless|empty|numb)|nothing\s+(?:matters|will\s+(?:change|help|get\s+better))|(?:I'?m|I\s+am)\s+(?:a\s+)?(?:broken|unfixable|beyond\s+help))\b/i,
    triggerType: 'acute_distress',
    severity: 'low',
    label: 'despair_language',
  },
  {
    pattern: /\b((?:is|are)\s+(?:this|these|my)\s+(?:symptoms?|signs?)\s+of\s+(?:a\s+)?(?:mental|psychological|psychiatric)|what\s+(?:mental|psychological)\s+(?:illness|condition|disorder))\b/i,
    triggerType: 'clinical_request',
    severity: 'low',
    label: 'clinical_curiosity',
  },
];

// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================

/**
 * Pre-written, clinically-informed response templates by severity.
 * Each template acknowledges the person, holds appropriate space,
 * and routes to the right level of support.
 */

const CRISIS_RESPONSE_TEMPLATES: Record<SeverityLevel, string[]> = {
  critical: [
    `I hear you, and what you're sharing matters deeply. Your safety is the most important thing right now.

I'm not equipped to provide the support you need in this moment, but there are people who are — right now, 24/7:

• **988 Suicide & Crisis Lifeline**: Call or text **988**
• **Crisis Text Line**: Text **HELLO** to **741741**
• **Emergency Services**: Call **911**

You don't have to carry this alone. Please reach out to one of these resources now. I'm pausing our conversation here so you can focus on connecting with someone who can truly help.`,

    `Thank you for trusting me with something so heavy. That takes real courage. What you're describing needs more support than I can offer — and you deserve that support.

Please reach out now:
• **988 Suicide & Crisis Lifeline**: Call or text **988** (available 24/7)
• **Crisis Text Line**: Text **HELLO** to **741741**
• If you're in immediate danger, please call **911**

I'm here when you're ready to return, but right now, connecting with a trained crisis counselor is the most important next step.`,
  ],

  high: [
    `I want to pause here and honor what you've just shared. This is beyond what I'm designed to support within the Codex, and I don't want to give you anything less than what you truly need.

I'd encourage you to connect with a professional who can hold this with you:
• **988 Suicide & Crisis Lifeline**: Call or text **988**
• **Crisis Text Line**: Text **HELLO** to **741741**
• **RAINN** (if related to sexual assault): **1-800-656-4673**

If you already have a therapist or counselor, this would be a meaningful thing to bring to your next session. Your facilitator has also been notified and will check in with you.`,

    `What you're describing is real, and it matters. This is territory where you deserve specialized, human support — and the Codex is not a replacement for that.

I'm flagging this for your facilitator so they can follow up with care. In the meantime:
• **988 Suicide & Crisis Lifeline**: Call or text **988**
• **Crisis Text Line**: Text **HELLO** to **741741**

You are not alone in this, even when it feels that way.`,
  ],

  medium: [
    `I appreciate you asking, and I want to be transparent: that question moves into clinical territory that's outside my scope. The Living Codex is a reflective and educational framework — it's not designed to provide diagnoses, prescribe treatments, or replace professional care.

What I *can* do is continue exploring your patterns, archetypes, and growth within the Codex. For the clinical side, I'd encourage you to connect with a licensed professional who can give you the thorough, personalized assessment you deserve.

Would you like to continue exploring within the Codex framework?`,

    `That's an important question, and I want to honor it by being honest about my boundaries. Providing clinical assessments, diagnoses, or medication guidance isn't within my scope — and you deserve accurate, professional support for those questions.

Within the Codex, I can help you explore your patterns, reflect on your journey, and work with your archetype and wound mapping. For clinical questions, a licensed therapist or psychiatrist would be the right resource.

Shall we continue with your Codex exploration?`,
  ],

  low: [
    `I hear that weight in your words, and I want to hold space for it. Within the Codex, we can continue to sit with these feelings and explore what they're reflecting. If at any point you feel you'd benefit from talking to someone trained in supporting deeper emotional processing, your facilitator is available, and professional support is always an option.

How would you like to continue?`,
  ],
};

// ============================================================================
// RESOURCE BLOCKS
// ============================================================================

const CRISIS_RESOURCES = {
  suicide_crisis: {
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or text 988',
    availability: '24/7',
    url: 'https://988lifeline.org',
  },
  crisis_text: {
    name: 'Crisis Text Line',
    contact: 'Text HELLO to 741741',
    availability: '24/7',
    url: 'https://www.crisistextline.org',
  },
  domestic_violence: {
    name: 'National Domestic Violence Hotline',
    contact: '1-800-799-7233',
    availability: '24/7',
    url: 'https://www.thehotline.org',
  },
  sexual_assault: {
    name: 'RAINN National Sexual Assault Hotline',
    contact: '1-800-656-4673',
    availability: '24/7',
    url: 'https://www.rainn.org',
  },
  eating_disorder: {
    name: 'National Alliance for Eating Disorders Helpline',
    contact: '1-866-662-1235',
    availability: 'Mon-Fri 9am-7pm ET',
    url: 'https://www.allianceforeatingdisorders.com',
  },
  child_abuse: {
    name: 'Childhelp National Child Abuse Hotline',
    contact: '1-800-422-4453',
    availability: '24/7',
    url: 'https://www.childhelp.org',
  },
  emergency: {
    name: 'Emergency Services',
    contact: '911',
    availability: '24/7',
    url: '',
  },
};

type ResourceKey = keyof typeof CRISIS_RESOURCES;

const TRIGGER_TO_RESOURCES: Record<TriggerType, ResourceKey[]> = {
  crisis_language: ['suicide_crisis', 'crisis_text'],
  self_harm: ['suicide_crisis', 'crisis_text'],
  harm_to_others: ['emergency', 'crisis_text'],
  clinical_request: [],
  out_of_scope: [],
  acute_distress: ['suicide_crisis', 'crisis_text'],
  abuse_disclosure: ['domestic_violence', 'sexual_assault', 'child_abuse'],
  psychiatric_emergency: ['suicide_crisis', 'emergency'],
  medication_inquiry: [],
};

// ============================================================================
// CONTENT CLASSIFIER
// ============================================================================

/**
 * Classifies a user message into a content category and determines
 * whether any escalation triggers are present.
 */
export function classifyContent(userMessage: string): ContentClassification {
  const normalizedMessage = userMessage.toLowerCase().trim();
  const matchedPatterns: { pattern: DetectionPattern; match: RegExpMatchArray }[] = [];

  // Run all detection patterns
  for (const dp of DETECTION_PATTERNS) {
    const match = normalizedMessage.match(dp.pattern);
    if (match) {
      matchedPatterns.push({ pattern: dp, match });
    }
  }

  // No triggers — classify as safe
  if (matchedPatterns.length === 0) {
    return {
      category: 'safe',
      confidence: 0.85,
      triggers: [],
      severity: 'low',
      action: 'continue',
      reasoning: 'No escalation patterns detected in user message.',
    };
  }

  // Determine highest severity among matched patterns
  const severityOrder: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
  let maxSeverityIndex = 0;
  const triggers: TriggerType[] = [];
  const detectedLabels: string[] = [];

  for (const mp of matchedPatterns) {
    const idx = severityOrder.indexOf(mp.pattern.severity);
    if (idx > maxSeverityIndex) {
      maxSeverityIndex = idx;
    }
    if (!triggers.includes(mp.pattern.triggerType)) {
      triggers.push(mp.pattern.triggerType);
    }
    detectedLabels.push(mp.pattern.label);
  }

  const severity = severityOrder[maxSeverityIndex];

  // Map severity to action and category
  const actionMap: Record<SeverityLevel, ResponseAction> = {
    critical: 'crisis_response',
    high: 'warm_handoff',
    medium: 'firm_boundary',
    low: 'gentle_redirect',
  };

  const categoryMap: Record<SeverityLevel, ContentCategory> = {
    critical: 'escalation_required',
    high: 'escalation_required',
    medium: 'clinical_territory',
    low: 'boundary_adjacent',
  };

  return {
    category: categoryMap[severity],
    confidence: Math.min(0.6 + matchedPatterns.length * 0.1, 0.95),
    triggers,
    severity,
    action: actionMap[severity],
    reasoning: `Detected patterns: ${detectedLabels.join(', ')}. Highest severity: ${severity}.`,
  };
}

// ============================================================================
// ESCALATION ROUTER
// ============================================================================

/**
 * Given a classified message, produces the full escalation response
 * including AI response override, resource block, and log entry.
 */
export function routeEscalation(
  userId: string,
  sessionId: string,
  userMessage: string,
  classification: ContentClassification
): EscalationResponse {
  // Safe content — no escalation
  if (classification.category === 'safe') {
    return {
      shouldEscalate: false,
      action: 'continue',
      severity: 'low',
      triggers: [],
      logEntry: {
        userId,
        sessionId,
        triggerType: 'out_of_scope',
        severity: 'low',
        detectedPatterns: [],
        userMessageExcerpt: '',
        action: 'continue',
        resourcesOffered: [],
      },
    };
  }

  // Build resource block
  const resourceKeys = new Set<ResourceKey>();
  for (const trigger of classification.triggers) {
    const keys = TRIGGER_TO_RESOURCES[trigger] || [];
    for (const k of keys) resourceKeys.add(k);
  }

  const resources = Array.from(resourceKeys).map((key) => CRISIS_RESOURCES[key]);
  const resourceBlock = resources.length > 0
    ? resources
        .map((r) => `• **${r.name}**: ${r.contact} (${r.availability})`)
        .join('\n')
    : '';

  // Select response template
  const templates = CRISIS_RESPONSE_TEMPLATES[classification.severity];
  const templateIndex = Math.floor(Math.random() * templates.length);
  const aiResponseOverride = templates[templateIndex];

  // Excerpt for logging (truncate to protect privacy while maintaining context)
  const excerpt =
    userMessage.length > 300
      ? userMessage.slice(0, 300) + '...'
      : userMessage;

  return {
    shouldEscalate: true,
    action: classification.action,
    severity: classification.severity,
    triggers: classification.triggers,
    aiResponseOverride,
    resourceBlock,
    logEntry: {
      userId,
      sessionId,
      triggerType: classification.triggers[0] || 'out_of_scope',
      severity: classification.severity,
      detectedPatterns: classification.triggers,
      userMessageExcerpt: excerpt,
      aiResponseDraft: aiResponseOverride,
      action: classification.action,
      resourcesOffered: resources.map((r) => r.name),
    },
  };
}

// ============================================================================
// BOUNDARY ENFORCER — AI RESPONSE VALIDATION
// ============================================================================

/**
 * Validates an AI-generated response BEFORE it reaches the user.
 * Catches any boundary violations the AI model might produce
 * despite the governance prompt injection.
 */

const BOUNDARY_VIOLATIONS: Array<{
  pattern: RegExp;
  violation: string;
  category: ContentCategory;
}> = [
  {
    pattern: /\b(?:you\s+(?:have|suffer\s+from|are\s+diagnosed\s+with)|your\s+diagnosis\s+(?:is|of)|diagnosed\s+you\s+with)\b/i,
    violation: 'AI attempted to provide a diagnosis',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:you\s+should\s+(?:take|start|stop|increase|decrease)\s+(?:your\s+)?(?:medication|meds|dosage|prescription|antidepressant|SSRI))\b/i,
    violation: 'AI attempted to provide medication guidance',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:clinically\s+proven|scientifically\s+proven|medically\s+established)\b/i,
    violation: 'AI made unsourced clinical claim',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:this\s+(?:is|replaces|substitutes)\s+(?:for\s+)?therapy|you\s+don'?t\s+need\s+(?:a\s+)?therap(?:y|ist)|better\s+than\s+therapy)\b/i,
    violation: 'AI implied platform replaces therapy',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:your\s+wound\s+imprint\s+(?:is|means)\s+(?:you\s+have|a\s+form\s+of|equivalent\s+to))\b/i,
    violation: 'AI equated wound imprint with clinical diagnosis',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:(?:your|the)\s+hormonal\s+(?:pattern|cycle|data)\s+(?:indicates|shows|means|confirms)\s+(?:a\s+)?(?:condition|disorder|disease|syndrome))\b/i,
    violation: 'AI made clinical claim from hormonal patterns',
    category: 'clinical_territory',
  },
  {
    pattern: /\b(?:I\s+(?:can|am\s+able\s+to)\s+(?:diagnose|prescribe|treat|cure))\b/i,
    violation: 'AI claimed clinical capabilities',
    category: 'clinical_territory',
  },
];

export function checkResponseBoundaries(aiResponse: string): BoundaryCheckResult {
  const violations: string[] = [];
  let worstCategory: ContentCategory = 'safe';

  for (const rule of BOUNDARY_VIOLATIONS) {
    if (rule.pattern.test(aiResponse)) {
      violations.push(rule.violation);
      if (rule.category === 'clinical_territory') {
        worstCategory = 'clinical_territory';
      }
    }
  }

  if (violations.length === 0) {
    return {
      isWithinBounds: true,
      violations: [],
      category: 'safe',
    };
  }

  return {
    isWithinBounds: false,
    violations,
    category: worstCategory,
    suggestedRevision:
      'The response contained content outside the platform\'s scope. ' +
      'The guide should acknowledge the question, state its boundary clearly, ' +
      'and redirect to appropriate professional resources or continue within the Codex framework.',
  };
}

// ============================================================================
// MESSAGE INTERCEPTOR — FULL PIPELINE
// ============================================================================

/**
 * The main entry point. Call this on EVERY user message before
 * the AI guide processes it, and again on every AI response
 * before delivering it to the user.
 *
 * Usage:
 *   const result = interceptUserMessage(userId, sessionId, message);
 *   if (result.shouldEscalate) {
 *     // Use result.aiResponseOverride instead of AI generation
 *     // Log result.logEntry to escalation_logs table
 *     // Notify facilitator if severity >= 'high'
 *   }
 */
export function interceptUserMessage(
  userId: string,
  sessionId: string,
  userMessage: string
): EscalationResponse {
  const classification = classifyContent(userMessage);
  return routeEscalation(userId, sessionId, userMessage, classification);
}

/**
 * Validate AI response before delivery.
 * If boundaries are violated, returns a sanitized alternative.
 */
export function validateAIResponse(
  aiResponse: string,
  guideType: string
): { approved: boolean; response: string; violations: string[] } {
  const check = checkResponseBoundaries(aiResponse);

  if (check.isWithinBounds) {
    return { approved: true, response: aiResponse, violations: [] };
  }

  // Generate a safe fallback that maintains conversational flow
  const safeResponse =
    `I want to be thoughtful here. That touches on something outside what I'm ` +
    `designed to offer within the Codex. My role as your ${guideType.replace(/_/g, ' ')} ` +
    `is to support your exploration of patterns, archetypes, and growth — but for ` +
    `clinical questions, a licensed professional would give you the depth and accuracy ` +
    `you deserve. Would you like to continue exploring within the Codex framework?`;

  return {
    approved: false,
    response: safeResponse,
    violations: check.violations,
  };
}

// ============================================================================
// FACILITATOR NOTIFICATION BUILDER
// ============================================================================

export interface FacilitatorAlert {
  alertLevel: 'info' | 'urgent' | 'critical';
  userId: string;
  sessionId: string;
  summary: string;
  detectedTriggers: TriggerType[];
  recommendedAction: string;
  timestamp: string;
}

/**
 * Constructs a facilitator notification from an escalation event.
 * For severity >= 'high', this should trigger an immediate push notification.
 */
export function buildFacilitatorAlert(
  escalation: EscalationEvent
): FacilitatorAlert {
  const alertLevelMap: Record<SeverityLevel, FacilitatorAlert['alertLevel']> = {
    critical: 'critical',
    high: 'urgent',
    medium: 'info',
    low: 'info',
  };

  const actionMap: Record<SeverityLevel, string> = {
    critical:
      'IMMEDIATE: Review escalation log. Verify user safety. Contact user within 1 hour if no crisis service confirmation received.',
    high:
      'URGENT: Review escalation log within 4 hours. Follow up with user at next available session. Document any additional context.',
    medium:
      'REVIEW: User asked about clinical topics. No immediate action needed. Address at next check-in if pattern continues.',
    low:
      'MONITOR: User expressed distress within normal range. Continue standard support cadence.',
  };

  return {
    alertLevel: alertLevelMap[escalation.severity],
    userId: escalation.userId,
    sessionId: escalation.sessionId,
    summary: `Escalation detected: ${escalation.triggerType} (${escalation.severity}). ` +
      `Patterns: ${escalation.detectedPatterns.join(', ')}. ` +
      `Action taken: ${escalation.action}.`,
    detectedTriggers: escalation.detectedPatterns as TriggerType[],
    recommendedAction: actionMap[escalation.severity],
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// SESSION SAFETY STATE
// ============================================================================

/**
 * Tracks the escalation history within a single guide session
 * to detect escalating patterns across multiple messages.
 */
export class SessionSafetyState {
  private escalationCount = 0;
  private severityHistory: SeverityLevel[] = [];
  private triggerHistory: TriggerType[] = [];
  private sessionPaused = false;

  get isPaused(): boolean {
    return this.sessionPaused;
  }

  get totalEscalations(): number {
    return this.escalationCount;
  }

  recordEscalation(severity: SeverityLevel, triggers: TriggerType[]): void {
    this.escalationCount++;
    this.severityHistory.push(severity);
    this.triggerHistory.push(...triggers);

    // Auto-pause after critical event or 3+ escalations
    if (severity === 'critical' || this.escalationCount >= 3) {
      this.sessionPaused = true;
    }
  }

  /**
   * Checks if escalation pattern is intensifying across the session.
   * Returns true if user appears to be in an escalating crisis.
   */
  isEscalating(): boolean {
    if (this.severityHistory.length < 2) return false;

    const severityValues: Record<SeverityLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    const recent = this.severityHistory.slice(-3);
    for (let i = 1; i < recent.length; i++) {
      if (severityValues[recent[i]] > severityValues[recent[i - 1]]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns a summary for the facilitator alert.
   */
  getSummary(): string {
    return (
      `Session escalation count: ${this.escalationCount}. ` +
      `Severity trend: [${this.severityHistory.join(' → ')}]. ` +
      `Unique triggers: ${[...new Set(this.triggerHistory)].join(', ')}. ` +
      `Session paused: ${this.sessionPaused}.`
    );
  }
}

// ============================================================================
// EXPORTS — PUBLIC API SUMMARY
// ============================================================================
// classifyContent(message)         → ContentClassification
// routeEscalation(...)             → EscalationResponse
// interceptUserMessage(...)        → EscalationResponse (main entry point)
// checkResponseBoundaries(resp)    → BoundaryCheckResult
// validateAIResponse(resp, guide)  → { approved, response, violations }
// buildFacilitatorAlert(event)     → FacilitatorAlert
// SessionSafetyState               → Class for per-session tracking
