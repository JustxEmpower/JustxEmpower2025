/**
 * GROWTH ENGINE: THRIVE + BLOOM + RESTORE
 * =========================================
 * A unified system for tracking evolution (THRIVE), unlocking growth pathways (BLOOM),
 * and reassessing trajectory (RESTORE). The system KNOWS her — tracking her evolution
 * with precision and reverence.
 *
 * Three integrated engines working in concert:
 * - THRIVE: Progress tracking with streaks, milestones, and growth insights
 * - BLOOM: Adaptive unlock engine that gates content based on readiness
 * - RESTORE: Re-assessment system for periodic recalibration
 */

// ============================================================================
// SECTION 1: THRIVE — PROGRESS TRACKING ENGINE
// ============================================================================

/**
 * Milestone definitions - earned through specific actions and thresholds
 */
export type MilestoneType =
  | 'first_assessment_complete'
  | 'first_journal_entry'
  | 'first_guide_session'
  | 'module_complete'
  | '7_day_streak'
  | '14_day_streak'
  | '30_day_streak'
  | '60_day_streak'
  | '90_day_streak'
  | '10_journals'
  | '25_journals'
  | '50_journals'
  | '100_journals'
  | 'all_guides_tried'
  | 'phase_shift'
  | 'community_first_event'
  | 'mirror_report_viewed'
  | 'gift_expression_rising';

export interface Milestone {
  type: MilestoneType;
  earnedAt: Date;
  value?: any;
  displayName: string;
  narrative: string;
}

/**
 * Phase transitions tracked over time
 */
export interface PhaseChange {
  fromPhase: string;
  toPhase: string;
  timestamp: Date;
  reasonForChange: string;
  mirrorsViewedSincePhase: number;
}

/**
 * Spectrum shifts - tracks how SI, shadow, threshold, gift proportions change
 */
export interface SpectrumShift {
  timestamp: Date;
  shadowBefore: number;
  shadowAfter: number;
  thresholdBefore: number;
  thresholdAfter: number;
  gifBefore: number;
  giftAfter: number;
  dominantArchetypeBefore: string;
  dominantArchetypeAfter: string;
}

/**
 * Complete snapshot of user's progress at a point in time
 */
export interface ProgressSnapshot {
  userId: string;
  timestamp: Date;
  modulesCompleted: number;
  modulesTotal: number;
  journalEntries: number;
  guideSessions: number;
  currentStreak: number;
  longestStreak: number;
  milestonesEarned: Milestone[];
  phaseHistory: PhaseChange[];
  spectrumMovement: SpectrumShift[];
  daysInCurrentPhase: number;
  totalDaysActive: number;
  lastActivityAt: Date;
  completionPercentage: number;
}

/**
 * Streak tracking and updates
 */
export type StreakActivityType =
  | 'journal_entry'
  | 'module_progress'
  | 'guide_session'
  | 'event_attendance'
  | 'reflection_complete';

export interface StreakUpdate {
  userId: string;
  activityType: StreakActivityType;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date;
  streakMaintained: boolean;
  gracePeriodRemaining?: number;
}

/**
 * Growth insights comparing progress across time
 */
export interface GrowthInsight {
  period: '30_days' | '60_days' | '90_days';
  journalGrowth: {
    entryCount: number;
    changePercentage: number;
  };
  moduleProgress: {
    completed: number;
    changePercentage: number;
  };
  spectrumEvolution: {
    shadowChange: number;
    thresholdChange: number;
    giftChange: number;
    narrative: string;
  };
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    consistency: number;
  };
  milestonesEarned: Milestone[];
  overallNarrative: string;
}

/**
 * THRIVE Functions
 */

/**
 * Calculate comprehensive progress snapshot for a user
 */
export async function calculateProgress(userId: string): Promise<ProgressSnapshot> {
  // This would query the database for:
  // - Completed modules
  // - Journal entries
  // - Guide sessions
  // - Milestone history
  // - Phase history
  // - Spectrum snapshots from assessments
  // - Last activity timestamp

  return {
    userId,
    timestamp: new Date(),
    modulesCompleted: 0,
    modulesTotal: 16,
    journalEntries: 0,
    guideSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    milestonesEarned: [],
    phaseHistory: [],
    spectrumMovement: [],
    daysInCurrentPhase: 0,
    totalDaysActive: 0,
    lastActivityAt: new Date(),
    completionPercentage: 0,
  };
}

/**
 * Check which milestones have been newly earned
 * Called when user completes an action
 */
export async function checkMilestones(
  userId: string,
  action: {
    type: StreakActivityType | 'assessment_complete' | 'mirror_report_viewed';
    moduleId?: number;
    data?: Record<string, any>;
  }
): Promise<Milestone[]> {
  const newlyEarned: Milestone[] = [];

  // Milestone trigger mapping:
  const triggers: Record<string, () => Promise<boolean>> = {
    first_assessment_complete: async () => {
      // Check if this is first assessment
      return action.type === 'assessment_complete';
    },
    first_journal_entry: async () => {
      // Check if journal count was 0, now is 1
      return action.type === 'journal_entry';
    },
    first_guide_session: async () => {
      // Check if guide_sessions count was 0, now is 1
      return action.type === 'guide_session';
    },
    module_complete: async () => {
      // Check if a module was just completed
      return action.type === 'module_progress' && action.moduleId !== undefined;
    },
    ['7_day_streak']: async () => false, // Set via updateStreak
    ['14_day_streak']: async () => false,
    ['30_day_streak']: async () => false,
    ['60_day_streak']: async () => false,
    ['90_day_streak']: async () => false,
    ['10_journals']: async () => false, // Set via journal tracking
    ['25_journals']: async () => false,
    ['50_journals']: async () => false,
    ['100_journals']: async () => false,
    all_guides_tried: async () => false, // Set when all 6 guides have been used
    phase_shift: async () => false, // Set by reassessment engine
    community_first_event: async () => false, // Set by community engagement tracking
    mirror_report_viewed: async () => {
      return action.type === 'mirror_report_viewed';
    },
    gift_expression_rising: async () => false, // Set by reassessment comparison
  };

  return newlyEarned;
}

/**
 * Update user's streak - maintains or resets based on activity
 * Rules: 1 qualifying activity per day maintains streak, 24h grace period before reset
 */
export async function updateStreak(
  userId: string,
  activityType: StreakActivityType
): Promise<StreakUpdate> {
  // Query current streak, last activity time
  // Calculate if activity is within 24h + grace period
  // Update streak accordingly
  // Check if streak hits milestone threshold (7, 14, 30, 60, 90 days)

  return {
    userId,
    activityType,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityAt: new Date(),
    streakMaintained: true,
  };
}

/**
 * Generate growth insight by comparing snapshots across time
 */
export async function generateGrowthInsight(
  snapshots: ProgressSnapshot[]
): Promise<GrowthInsight> {
  // Sort snapshots by timestamp
  const sorted = snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const current = sorted[sorted.length - 1];
  const thirtyDaysAgo = sorted.find(
    (s) => new Date().getTime() - s.timestamp.getTime() <= 30 * 24 * 60 * 60 * 1000
  );
  const sixtyDaysAgo = sorted.find(
    (s) => new Date().getTime() - s.timestamp.getTime() <= 60 * 24 * 60 * 60 * 1000
  );
  const ninetyDaysAgo = sorted.find(
    (s) => new Date().getTime() - s.timestamp.getTime() <= 90 * 24 * 60 * 60 * 1000
  );

  // Determine which comparison to use
  const period: '30_days' | '60_days' | '90_days' = ninetyDaysAgo ? '90_days' : sixtyDaysAgo ? '60_days' : '30_days';
  const comparison = ninetyDaysAgo || sixtyDaysAgo || thirtyDaysAgo || sorted[0];

  const journalGrowth = {
    entryCount: current.journalEntries - comparison.journalEntries,
    changePercentage:
      comparison.journalEntries > 0
        ? ((current.journalEntries - comparison.journalEntries) / comparison.journalEntries) * 100
        : 100,
  };

  const moduleProgress = {
    completed: current.modulesCompleted - comparison.modulesCompleted,
    changePercentage:
      comparison.modulesCompleted > 0
        ? ((current.modulesCompleted - comparison.modulesCompleted) / comparison.modulesCompleted) * 100
        : 100,
  };

  // Spectrum evolution from latest shift
  const latestShift = current.spectrumMovement[current.spectrumMovement.length - 1];
  const spectrumEvolution = latestShift
    ? {
        shadowChange: latestShift.shadowAfter - latestShift.shadowBefore,
        thresholdChange: latestShift.thresholdAfter - latestShift.thresholdBefore,
        giftChange: latestShift.giftAfter - latestShift.gifBefore,
        narrative: generateSpectrumNarrative(latestShift),
      }
    : {
        shadowChange: 0,
        thresholdChange: 0,
        giftChange: 0,
        narrative: 'Your spectrum remains steady and true.',
      };

  return {
    period,
    journalGrowth,
    moduleProgress,
    spectrumEvolution,
    streakInfo: {
      currentStreak: current.currentStreak,
      longestStreak: current.longestStreak,
      consistency: (current.currentStreak / current.longestStreak) * 100 || 0,
    },
    milestonesEarned: current.milestonesEarned.filter(
      (m) => new Date().getTime() - m.earnedAt.getTime() <= (period === '30_days' ? 30 : period === '60_days' ? 60 : 90) * 24 * 60 * 60 * 1000
    ),
    overallNarrative: generateOverallNarrative(current, comparison, period),
  };
}

/**
 * Helper: Generate narrative for spectrum evolution
 */
function generateSpectrumNarrative(shift: SpectrumShift): string {
  const shadowDirection = shift.shadowAfter < shift.shadowBefore ? 'softened' : 'deepened';
  const thresholdDirection = shift.thresholdAfter > shift.thresholdBefore ? 'strengthened' : 'released';
  const giftDirection = shift.giftAfter > shift.gifBefore ? 'blossomed' : 'quieted';

  return `Your shadow expression has ${shadowDirection} from ${Math.round(shift.shadowBefore)}% to ${Math.round(shift.shadowAfter)}%. The ${shift.dominantArchetypeBefore} is becoming the ${shift.dominantArchetypeAfter}.`;
}

/**
 * Helper: Generate overall growth narrative
 */
function generateOverallNarrative(
  current: ProgressSnapshot,
  previous: ProgressSnapshot,
  period: string
): string {
  const journalChange = current.journalEntries - previous.journalEntries;
  const moduleChange = current.modulesCompleted - previous.modulesCompleted;

  return `Over the past ${period.replace('_', ' ')}, you've grown in both depth and breadth. ${journalChange} new journal entries reveal your inner landscape, while ${moduleChange} module${moduleChange !== 1 ? 's' : ''} deepen your understanding.`;
}

// ============================================================================
// SECTION 2: BLOOM — ADAPTIVE UNLOCK ENGINE
// ============================================================================

/**
 * Unlock conditions - the rules that gate content access
 */
export type UnlockConditionType =
  | 'module_complete'
  | 'phase_reached'
  | 'wound_flagged'
  | 'support_tier'
  | 'facilitator_approved'
  | 'cyclic_aware'
  | 'days_active'
  | 'journal_count';

export interface UnlockCondition {
  type: UnlockConditionType;
  value: any;
  operator?: 'equals' | 'gte' | 'lte' | 'gt' | 'lt' | 'includes' | 'any';
}

export interface UnlockRule {
  moduleId: number;
  moduleName: string;
  conditions: UnlockCondition[];
  operator: 'AND' | 'OR';
  description: string;
}

export interface UnlockResult {
  newlyUnlocked: number[];
  stillLocked: number[];
  lockReasons: Record<number, string[]>;
}

/**
 * Complete unlock rule set for all 16 modules
 */
export function getUnlockRules(): UnlockRule[] {
  return [
    // S1-S4: Unlocked by routing engine at assessment
    {
      moduleId: 1,
      moduleName: 'S1: The Shadow',
      conditions: [{ type: 'module_complete', value: 0, operator: 'gte' }],
      operator: 'AND',
      description: 'Available immediately after assessment.',
    },
    {
      moduleId: 2,
      moduleName: 'S2: The Naming',
      conditions: [{ type: 'module_complete', value: 0, operator: 'gte' }],
      operator: 'AND',
      description: 'Available immediately after assessment.',
    },
    {
      moduleId: 3,
      moduleName: 'S3: The Mirror',
      conditions: [{ type: 'module_complete', value: 0, operator: 'gte' }],
      operator: 'AND',
      description: 'Available immediately after assessment.',
    },
    {
      moduleId: 4,
      moduleName: 'S4: The Threshold',
      conditions: [{ type: 'module_complete', value: 0, operator: 'gte' }],
      operator: 'AND',
      description: 'Available immediately after assessment.',
    },

    // S5-S9: Unlock after completing 2 modules
    {
      moduleId: 5,
      moduleName: 'S5: The Void',
      conditions: [{ type: 'module_complete', value: 2, operator: 'gte' }],
      operator: 'AND',
      description: 'Unlocks after completing 2 initial modules.',
    },
    {
      moduleId: 6,
      moduleName: 'S6: The Descent',
      conditions: [{ type: 'module_complete', value: 2, operator: 'gte' }],
      operator: 'AND',
      description: 'Unlocks after completing 2 initial modules.',
    },
    {
      moduleId: 7,
      moduleName: 'S7: The Alchemy',
      conditions: [{ type: 'module_complete', value: 2, operator: 'gte' }],
      operator: 'AND',
      description: 'Unlocks after completing 2 initial modules.',
    },
    {
      moduleId: 8,
      moduleName: 'S8: The Emergence',
      conditions: [{ type: 'module_complete', value: 2, operator: 'gte' }],
      operator: 'AND',
      description: 'Unlocks after completing 2 initial modules.',
    },
    {
      moduleId: 9,
      moduleName: 'S9: The Integration',
      conditions: [{ type: 'module_complete', value: 2, operator: 'gte' }],
      operator: 'AND',
      description: 'Unlocks after completing 2 initial modules.',
    },

    // S10-S12: Unlock after completing 4 modules + phase >= 'The Void'
    {
      moduleId: 10,
      moduleName: 'S10: The Masculine Mirror',
      conditions: [
        { type: 'module_complete', value: 4, operator: 'gte' },
        { type: 'phase_reached', value: 'The Void', operator: 'gte' },
      ],
      operator: 'AND',
      description: 'Requires 4 completed modules and phase progression to The Void or beyond.',
    },
    {
      moduleId: 11,
      moduleName: 'S11: The Feminine Reclamation',
      conditions: [
        { type: 'module_complete', value: 4, operator: 'gte' },
        { type: 'phase_reached', value: 'The Void', operator: 'gte' },
      ],
      operator: 'AND',
      description: 'Requires 4 completed modules and phase progression to The Void or beyond.',
    },
    {
      moduleId: 12,
      moduleName: 'S12: The Sacred Duality',
      conditions: [
        { type: 'module_complete', value: 4, operator: 'gte' },
        { type: 'phase_reached', value: 'The Void', operator: 'gte' },
      ],
      operator: 'AND',
      description: 'Requires 4 completed modules and phase progression to The Void or beyond.',
    },

    // S13: Masculine Mirror - requires support tier or facilitator approval
    {
      moduleId: 13,
      moduleName: 'S13: The Masculine Wound',
      conditions: [
        {
          type: 'support_tier',
          value: ['facilitated', 'escalation'],
          operator: 'includes',
        },
        { type: 'facilitator_approved', value: true },
      ],
      operator: 'OR',
      description: 'Requires facilitated support tier or explicit facilitator approval.',
    },

    // S14: Abuse Bond - requires facilitated support or facilitator approval
    {
      moduleId: 14,
      moduleName: 'S14: The Abuse Bond',
      conditions: [
        {
          type: 'support_tier',
          value: ['facilitated', 'escalation'],
          operator: 'includes',
        },
        { type: 'facilitator_approved', value: true },
      ],
      operator: 'OR',
      description: 'Requires facilitated support tier or explicit facilitator approval.',
    },

    // S15: Escape Loops - same as S14
    {
      moduleId: 15,
      moduleName: 'S15: The Escape Loops',
      conditions: [
        {
          type: 'support_tier',
          value: ['facilitated', 'escalation'],
          operator: 'includes',
        },
        { type: 'facilitator_approved', value: true },
      ],
      operator: 'OR',
      description: 'Requires facilitated support tier or explicit facilitator approval.',
    },

    // S16: Womb Mapping - requires cyclic awareness or body attunement
    {
      moduleId: 16,
      moduleName: 'S16: The Womb Mapping',
      conditions: [
        { type: 'cyclic_aware', value: true },
        { type: 'wound_flagged', value: 'body_attuned' },
      ],
      operator: 'OR',
      description: 'Unlocks for those with cyclic awareness or body attunement designation.',
    },
  ];
}

/**
 * Evaluate which modules should be unlocked for a user
 */
export async function evaluateUnlocks(
  userId: string,
  currentProgress: ProgressSnapshot,
  routingOutput?: Record<string, any>
): Promise<UnlockResult> {
  const rules = getUnlockRules();
  const result: UnlockResult = {
    newlyUnlocked: [],
    stillLocked: [],
    lockReasons: {},
  };

  for (const rule of rules) {
    const conditionsMet = evaluateConditions(
      rule.conditions,
      rule.operator,
      currentProgress,
      userId,
      routingOutput
    );

    if (conditionsMet) {
      result.newlyUnlocked.push(rule.moduleId);
    } else {
      result.stillLocked.push(rule.moduleId);
      result.lockReasons[rule.moduleId] = getUnlockBlockReasons(
        rule.conditions,
        currentProgress,
        userId,
        routingOutput
      );
    }
  }

  return result;
}

/**
 * Helper: Evaluate if conditions are met
 */
function evaluateConditions(
  conditions: UnlockCondition[],
  operator: 'AND' | 'OR',
  progress: ProgressSnapshot,
  userId: string,
  routingOutput?: Record<string, any>
): boolean {
  if (operator === 'AND') {
    return conditions.every((c) => evaluateSingleCondition(c, progress, userId, routingOutput));
  } else {
    return conditions.some((c) => evaluateSingleCondition(c, progress, userId, routingOutput));
  }
}

/**
 * Helper: Evaluate a single condition
 */
function evaluateSingleCondition(
  condition: UnlockCondition,
  progress: ProgressSnapshot,
  userId: string,
  routingOutput?: Record<string, any>
): boolean {
  const op = condition.operator || 'equals';

  switch (condition.type) {
    case 'module_complete':
      return compare(progress.modulesCompleted, condition.value, op);

    case 'phase_reached':
      // Would compare against phase hierarchy
      // For now: simple string comparison
      return true; // Placeholder

    case 'support_tier':
      // Would check user's support tier from database
      return true; // Placeholder

    case 'facilitator_approved':
      // Would check facilitator approval flag
      return true; // Placeholder

    case 'cyclic_aware':
      // Would check assessment result for cyclic awareness
      return true; // Placeholder

    case 'wound_flagged':
      // Would check if specific wound tag is present
      return true; // Placeholder

    case 'days_active':
      return compare(progress.totalDaysActive, condition.value, op);

    case 'journal_count':
      return compare(progress.journalEntries, condition.value, op);

    default:
      return false;
  }
}

/**
 * Helper: Generic comparison function
 */
function compare(
  actual: number,
  target: number | string | any,
  operator: string
): boolean {
  const targetNum = typeof target === 'number' ? target : 0;

  switch (operator) {
    case 'equals':
      return actual === targetNum;
    case 'gte':
      return actual >= targetNum;
    case 'lte':
      return actual <= targetNum;
    case 'gt':
      return actual > targetNum;
    case 'lt':
      return actual < targetNum;
    default:
      return false;
  }
}

/**
 * Helper: Get human-readable unlock block reasons
 */
function getUnlockBlockReasons(
  conditions: UnlockCondition[],
  progress: ProgressSnapshot,
  userId: string,
  routingOutput?: Record<string, any>
): string[] {
  const reasons: string[] = [];

  for (const condition of conditions) {
    if (!evaluateSingleCondition(condition, progress, userId, routingOutput)) {
      switch (condition.type) {
        case 'module_complete':
          reasons.push(
            `Complete ${condition.value - progress.modulesCompleted} more module${condition.value - progress.modulesCompleted !== 1 ? 's' : ''}`
          );
          break;
        case 'phase_reached':
          reasons.push(`Progress to the phase: ${condition.value}`);
          break;
        case 'support_tier':
          reasons.push('Enroll in facilitated support to access this content');
          break;
        case 'facilitator_approved':
          reasons.push('Request facilitator approval to access this module');
          break;
        case 'cyclic_aware':
          reasons.push('This module is for those with cyclic awareness');
          break;
        case 'wound_flagged':
          reasons.push(`This module requires the ${condition.value} designation`);
          break;
      }
    }
  }

  return reasons;
}

/**
 * Generate poetic notification when a module unlocks
 */
export function generateUnlockNotification(module: UnlockRule): string {
  const notifications: Record<number, string> = {
    1: 'Your shadow awaits recognition. The first step begins.',
    2: 'It is time to name what lives within you.',
    3: 'The mirror reveals what was hidden. Look steadily.',
    4: 'The threshold stands before you. You are ready to cross.',
    5: 'The void opens. Step into the emptiness with courage.',
    6: 'Your descent deepens. Trust the downward spiral.',
    7: 'Alchemy waits. Base metal becomes gold through fire.',
    8: 'You are emerging. The light grows softer as you rise.',
    9: 'Integration calls. Gather what you have learned into wholeness.',
    10: 'The masculine mirror reflects back. See him clearly.',
    11: 'Your feminine power reclaims its throne.',
    12: 'Sacred duality reveals its dance. Opposites unite.',
    13: 'The masculine wound can finally be witnessed and healed.',
    14: 'The abuse bond unfolds for understanding and liberation.',
    15: 'The loops that bound you are ready to be seen and broken.',
    16: 'Your womb wisdom awakens. Map your sacred cycle.',
  };

  return notifications[module.moduleId] || `${module.moduleName} is now available to you.`;
}

// ============================================================================
// SECTION 3: RESTORE — RE-ASSESSMENT SYSTEM
// ============================================================================

export type ReassessmentType = 'full' | 'abbreviated';
export type AssessmentDomain = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ReassessmentConfig {
  type: ReassessmentType;
  domains: AssessmentDomain[];
  reasonForReassessment: string;
  previousAssessmentId: string;
  initiatedAt: Date;
  completedAt?: Date;
}

export interface ReassessmentEligibility {
  eligible: boolean;
  daysUntilEligible: number;
  reason: string;
  suggestedType: ReassessmentType;
}

export interface PhaseShift {
  previousPhase: string;
  newPhase: string;
  direction: 'forward' | 'deepening' | 'same';
  magnitude: number; // How many phase steps changed
  flaggedForMirror: boolean; // If magnitude > 2
}

export interface ReassessmentReport {
  userId: string;
  previousAssessmentId: string;
  newAssessmentId: string;
  timestamp: Date;
  whatChanged: Record<string, any>;
  whatHeld: Record<string, any>;
  phaseShift: PhaseShift;
  spectrumShift: SpectrumShift;
  growthNarrative: string;
  updatedRecommendations: string[];
  mirrorReportAddendum?: string;
}

/**
 * Check if user is eligible for reassessment
 * Rules: 90 days since last assessment, OR user request (no minimum if requested)
 */
export async function checkReassessmentEligibility(
  userId: string,
  userRequested: boolean = false
): Promise<ReassessmentEligibility> {
  // Query for last assessment date
  const daysAgo = 0; // Placeholder - would calculate from database
  const lastAssessmentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  if (userRequested) {
    return {
      eligible: true,
      daysUntilEligible: 0,
      reason: 'User-requested reassessment available anytime.',
      suggestedType: 'abbreviated',
    };
  }

  const daysSinceLastAssessment = (new Date().getTime() - lastAssessmentDate.getTime()) / (24 * 60 * 60 * 1000);

  if (daysSinceLastAssessment >= 90) {
    return {
      eligible: true,
      daysUntilEligible: 0,
      reason: '90 days have passed since your last assessment.',
      suggestedType: 'full',
    };
  }

  return {
    eligible: false,
    daysUntilEligible: Math.ceil(90 - daysSinceLastAssessment),
    reason: `You can reassess after ${Math.ceil(90 - daysSinceLastAssessment)} more days.`,
    suggestedType: 'abbreviated',
  };
}

/**
 * Create abbreviated assessment config from previous result
 * Abbreviated: 4 domains only (1, 2, 5, 8) + carry forward the rest
 */
export function createAbbreviatedAssessment(previousAssessmentId: string): ReassessmentConfig {
  return {
    type: 'abbreviated',
    domains: [1, 2, 5, 8],
    reasonForReassessment: 'Periodic check-in to track spectrum and phase evolution',
    previousAssessmentId,
    initiatedAt: new Date(),
  };
}

/**
 * Merge abbreviated reassessment results with previous assessment
 * Combines new + carried-forward, recalculates phase/spectrum
 */
export async function mergeReassessmentResults(
  previous: Record<string, any>,
  abbreviated: Record<string, any>
): Promise<Record<string, any>> {
  // Merge response data
  const merged: Record<string, any> = {
    ...previous,
    // Override with new domain responses
    domainResponses: {
      ...previous.domainResponses,
      [1]: abbreviated.domainResponses?.[1] || previous.domainResponses[1],
      [2]: abbreviated.domainResponses?.[2] || previous.domainResponses[2],
      [5]: abbreviated.domainResponses?.[5] || previous.domainResponses[5],
      [8]: abbreviated.domainResponses?.[8] || previous.domainResponses[8],
      // Keep previous for 3, 4, 6, 7
      [3]: previous.domainResponses[3],
      [4]: previous.domainResponses[4],
      [6]: previous.domainResponses[6],
      [7]: previous.domainResponses[7],
    },
    updatedAt: new Date(),
    fromReassessment: true,
  };

  // Recalculate phase, spectrum, SI, archetype ranking
  // This would call the appropriate scoring and routing engines
  // For now, structure is in place

  return merged;
}

/**
 * Calculate phase shift from previous to new assessment
 */
export function calculatePhaseShift(
  previousPhase: string,
  newPhase: string
): PhaseShift {
  // Phase hierarchy: The Shadow -> The Naming -> The Mirror -> The Threshold ->
  //                  The Void -> The Descent -> The Alchemy -> The Emergence -> The Integration

  const phases = [
    'The Shadow',
    'The Naming',
    'The Mirror',
    'The Threshold',
    'The Void',
    'The Descent',
    'The Alchemy',
    'The Emergence',
    'The Integration',
  ];

  const prevIndex = phases.indexOf(previousPhase);
  const newIndex = phases.indexOf(newPhase);
  const magnitude = Math.abs(newIndex - prevIndex);

  let direction: 'forward' | 'deepening' | 'same' = 'same';
  if (newIndex > prevIndex) direction = 'forward';
  else if (newIndex < prevIndex) direction = 'deepening';

  return {
    previousPhase,
    newPhase,
    direction,
    magnitude,
    flaggedForMirror: magnitude > 2,
  };
}

/**
 * Generate comprehensive reassessment report
 */
export async function generateReassessmentReport(
  userId: string,
  previousAssessmentId: string,
  newAssessmentId: string,
  previousResult: Record<string, any>,
  newResult: Record<string, any>,
  phaseShift: PhaseShift,
  spectrumShift: SpectrumShift
): Promise<ReassessmentReport> {
  const whatChanged: Record<string, any> = {};
  const whatHeld: Record<string, any> = {};

  // Compare results domain by domain
  for (let i = 1; i <= 8; i++) {
    const domain = i as AssessmentDomain;
    const prev = previousResult.domainResponses?.[domain];
    const curr = newResult.domainResponses?.[domain];

    if (prev !== curr) {
      whatChanged[`Domain${domain}`] = {
        from: prev,
        to: curr,
      };
    } else {
      whatHeld[`Domain${domain}`] = curr;
    }
  }

  const growthNarrative = generateReassessmentNarrative(phaseShift, spectrumShift);
  const updatedRecommendations = generateUpdatedRecommendations(newResult, phaseShift);
  const mirrorAddendum = phaseShift.flaggedForMirror
    ? generateMirrorAddendum(phaseShift, spectrumShift)
    : undefined;

  return {
    userId,
    previousAssessmentId,
    newAssessmentId,
    timestamp: new Date(),
    whatChanged,
    whatHeld,
    phaseShift,
    spectrumShift,
    growthNarrative,
    updatedRecommendations,
    mirrorReportAddendum: mirrorAddendum,
  };
}

/**
 * Helper: Generate narrative for reassessment
 */
function generateReassessmentNarrative(phaseShift: PhaseShift, spectrumShift: SpectrumShift): string {
  if (phaseShift.direction === 'forward') {
    return `You have moved forward from ${phaseShift.previousPhase} to ${phaseShift.newPhase}. Your journey deepens with each step.`;
  } else if (phaseShift.direction === 'deepening') {
    return `You are spiraling deeper within ${phaseShift.newPhase}. The work of this phase holds important lessons.`;
  } else {
    return `You remain in ${phaseShift.previousPhase}, and this is exactly where you need to be. Trust the timing.`;
  }
}

/**
 * Helper: Generate updated module recommendations
 */
function generateUpdatedRecommendations(
  result: Record<string, any>,
  phaseShift: PhaseShift
): string[] {
  const recommendations: string[] = [];

  // Would analyze result data and phase to suggest which modules are most relevant
  recommendations.push(`Continue with modules aligned to ${phaseShift.newPhase}`);
  recommendations.push('Integrate previous learning before moving forward');

  return recommendations;
}

/**
 * Helper: Generate mirror report addendum for significant phase shifts
 */
function generateMirrorAddendum(phaseShift: PhaseShift, spectrumShift: SpectrumShift): string {
  return `REASSESSMENT ADDENDUM: A significant shift has occurred. Your phase movement from ${phaseShift.previousPhase} to ${phaseShift.newPhase} marks a substantial evolution. Review your full Mirror Report for updated archetype interactions and shadow-threshold-gift realignment.`;
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================

/**
 * Combined export of all growth engine functions and types
 * This module provides comprehensive tracking, adaptive unlocking, and
 * periodic reassessment for continuous evolution within LivingCodex
 */

export {
  // THRIVE exports
  calculateProgress,
  checkMilestones,
  updateStreak,
  generateGrowthInsight,
  // BLOOM exports
  getUnlockRules,
  evaluateUnlocks,
  generateUnlockNotification,
  // RESTORE exports
  checkReassessmentEligibility,
  createAbbreviatedAssessment,
  mergeReassessmentResults,
  calculatePhaseShift,
  generateReassessmentReport,
};
