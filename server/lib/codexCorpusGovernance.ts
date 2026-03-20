/**
 * CORPUS GOVERNANCE ENGINE — TRANSCEND
 * ======================================
 * Document validation, brand voice enforcement, restricted claims checking,
 * content tier categorization, and corpus update protocol for the Living Codex.
 *
 * This module governs what content enters and exits the AI knowledge corpus.
 * Every document ingested, every AI response generated, and every content update
 * passes through these governance filters.
 *
 * Architecture:
 * 1. Document Validator — schema enforcement for corpus ingestion
 * 2. Brand Voice Filter — ensures all content matches Living Codex voice
 * 3. Restricted Claims Checker — catches prohibited language patterns
 * 4. Tier Categorizer — classifies content access levels
 * 5. Update Protocol — versioned, auditable content lifecycle
 * 6. Corpus Integrity Monitor — consistency checks across the corpus
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ContentTier =
  | 'public'          // Landing page, general info
  | 'onboarded'       // Post-assessment content
  | 'phase_gated'     // Unlocked by phase progression
  | 'facilitator'     // Facilitator-only materials
  | 'admin'           // Admin/internal documentation
  | 'sensitive';      // Sections 13-15 (requires facilitator approval)

export type DocumentType =
  | 'codex_module'        // Core 16-section content
  | 'archetype_portrait'  // Archetype descriptions and lore
  | 'wound_mapping'       // Wound imprint educational content
  | 'mirror_reflection'   // Mirror pattern content
  | 'journal_prompt'      // Phase-specific journal prompts
  | 'practice_guide'      // NS regulation and somatic practices
  | 'community_guide'     // Circle and event content
  | 'facilitator_manual'  // Practitioner training materials
  | 'governance_policy'   // Platform rules and boundaries
  | 'assessment_rubric'   // Scoring and routing documentation
  | 'brand_asset';        // Voice guides, templates, style docs

export type DocumentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'retired'
  | 'archived';

export type VoiceProfile =
  | 'sacred_feminine'    // Warm, poetic, invitational — default Codex voice
  | 'clinical_adjacent'  // Clear, boundaried, precise — for governance docs
  | 'educational'        // Informative, accessible — for framework explanations
  | 'facilitative'       // Supportive, guiding — for practitioner materials
  | 'conversational';    // Natural, warm — for guide interactions

export interface CorpusDocument {
  id: string;
  title: string;
  type: DocumentType;
  tier: ContentTier;
  status: DocumentStatus;
  voiceProfile: VoiceProfile;
  version: number;
  content: string;
  metadata: DocumentMetadata;
  validationResult?: ValidationResult;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  retiredAt?: string;
  createdBy: string;
  approvedBy?: string;
}

export interface DocumentMetadata {
  // Codex context
  archetypes?: string[];      // Related archetypes
  woundImprints?: string[];   // Related WIs
  mirrorPatterns?: string[];  // Related MPs
  phases?: number[];          // Applicable phases (1-9)
  sections?: number[];        // Applicable sections (1-16)

  // Access control
  requiresFacilitatorApproval: boolean;
  sensitiveContent: boolean;
  minimumPhase?: number;

  // Corpus management
  tags: string[];
  sourceFile?: string;
  lastReviewedAt?: string;
  reviewedBy?: string;
  supersedes?: string;        // ID of document this replaces
  wordCount: number;
  readingLevel?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  brandVoiceScore: number;      // 0-100
  restrictedClaimsFound: string[];
  tierAssignment: ContentTier;
  timestamp: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'blocking';
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// DOCUMENT VALIDATOR
// ============================================================================

/**
 * Validates a corpus document against the Living Codex schema
 * before it can be ingested into the AI knowledge base.
 */

const REQUIRED_FIELDS: (keyof CorpusDocument)[] = [
  'title', 'type', 'tier', 'content', 'metadata', 'createdBy',
];

const VALID_ARCHETYPES = [
  // Tier 1 — Core 12
  'Silent Flame', 'Iron Lotus', 'Velvet Storm', 'Bone Whisperer',
  'Mirror Throne', 'Wild Root', 'Night Bloom', 'Echo Vessel',
  'Gilt Wound', 'Storm Cradle', 'Ash Dancer', 'Void Mother',
  // Tier 2 — Support 16
  'Ember Shield', 'Crystal Tongue', 'Woven Mask', 'Hollow Lantern',
  'Thorn Grace', 'Feral Hymn', 'Glass Anchor', 'Smoke Altar',
  'Sun Wound', 'Frost Keeper', 'Silk Blade', 'Ruin Bloom',
  'Tide Walker', 'Bone Flower', 'Moth Oracle', 'Root Witch',
  // Tier 3 — Expansion 3
  'Phoenix Seed', 'Obsidian Mirror', 'Dawn Shepherd',
];

const VALID_WOUND_IMPRINTS = Array.from({ length: 27 }, (_, i) =>
  `WI-${String(i + 1).padStart(2, '0')}`
);

const VALID_MIRROR_PATTERNS = Array.from({ length: 31 }, (_, i) =>
  `MP-${String(i + 1).padStart(2, '0')}`
);

export function validateDocument(doc: Partial<CorpusDocument>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required field checks
  for (const field of REQUIRED_FIELDS) {
    if (!doc[field]) {
      errors.push({
        code: 'MISSING_REQUIRED',
        message: `Required field "${field}" is missing.`,
        field,
        severity: 'blocking',
      });
    }
  }

  // Content length checks
  if (doc.content) {
    if (doc.content.length < 50) {
      errors.push({
        code: 'CONTENT_TOO_SHORT',
        message: 'Content must be at least 50 characters.',
        field: 'content',
        severity: 'error',
      });
    }
    if (doc.content.length > 500_000) {
      errors.push({
        code: 'CONTENT_TOO_LONG',
        message: 'Content exceeds 500,000 character limit.',
        field: 'content',
        severity: 'blocking',
      });
    }
  }

  // Metadata validation
  if (doc.metadata) {
    // Validate archetype references
    if (doc.metadata.archetypes) {
      for (const arch of doc.metadata.archetypes) {
        if (!VALID_ARCHETYPES.includes(arch)) {
          errors.push({
            code: 'INVALID_ARCHETYPE',
            message: `Unknown archetype reference: "${arch}".`,
            field: 'metadata.archetypes',
            severity: 'error',
          });
        }
      }
    }

    // Validate wound imprint references
    if (doc.metadata.woundImprints) {
      for (const wi of doc.metadata.woundImprints) {
        if (!VALID_WOUND_IMPRINTS.includes(wi)) {
          errors.push({
            code: 'INVALID_WOUND_IMPRINT',
            message: `Unknown wound imprint reference: "${wi}".`,
            field: 'metadata.woundImprints',
            severity: 'error',
          });
        }
      }
    }

    // Validate mirror pattern references
    if (doc.metadata.mirrorPatterns) {
      for (const mp of doc.metadata.mirrorPatterns) {
        if (!VALID_MIRROR_PATTERNS.includes(mp)) {
          errors.push({
            code: 'INVALID_MIRROR_PATTERN',
            message: `Unknown mirror pattern reference: "${mp}".`,
            field: 'metadata.mirrorPatterns',
            severity: 'error',
          });
        }
      }
    }

    // Phase range validation
    if (doc.metadata.phases) {
      for (const phase of doc.metadata.phases) {
        if (phase < 1 || phase > 9) {
          errors.push({
            code: 'INVALID_PHASE',
            message: `Phase ${phase} is out of range (1-9).`,
            field: 'metadata.phases',
            severity: 'error',
          });
        }
      }
    }

    // Section range validation
    if (doc.metadata.sections) {
      for (const section of doc.metadata.sections) {
        if (section < 1 || section > 16) {
          errors.push({
            code: 'INVALID_SECTION',
            message: `Section ${section} is out of range (1-16).`,
            field: 'metadata.sections',
            severity: 'error',
          });
        }
      }
    }

    // Sensitive content flag enforcement
    if (doc.metadata.sections) {
      const sensitiveSection = doc.metadata.sections.some((s) => [13, 14, 15].includes(s));
      if (sensitiveSection && !doc.metadata.sensitiveContent) {
        warnings.push({
          code: 'SENSITIVE_SECTION_UNFLAGGED',
          message: 'Document references sections 13-15 but sensitiveContent is not flagged.',
          suggestion: 'Set metadata.sensitiveContent = true for sections 13-15.',
        });
      }
      if (sensitiveSection && !doc.metadata.requiresFacilitatorApproval) {
        warnings.push({
          code: 'SENSITIVE_SECTION_NO_APPROVAL',
          message: 'Sections 13-15 require facilitator approval for user access.',
          suggestion: 'Set metadata.requiresFacilitatorApproval = true.',
        });
      }
    }

    // Word count validation
    if (doc.content && doc.metadata.wordCount) {
      const actualCount = doc.content.split(/\s+/).filter(Boolean).length;
      const drift = Math.abs(actualCount - doc.metadata.wordCount);
      if (drift > actualCount * 0.1) {
        warnings.push({
          code: 'WORD_COUNT_DRIFT',
          message: `Reported word count (${doc.metadata.wordCount}) differs from actual (${actualCount}) by ${drift} words.`,
          suggestion: 'Update metadata.wordCount to reflect actual content.',
        });
      }
    }
  }

  // Run restricted claims check on content
  const restrictedClaims = doc.content ? checkRestrictedClaims(doc.content) : [];

  // Run brand voice scoring
  const brandVoiceScore = doc.content && doc.voiceProfile
    ? scoreBrandVoice(doc.content, doc.voiceProfile)
    : 0;

  if (brandVoiceScore < 40) {
    warnings.push({
      code: 'LOW_BRAND_VOICE',
      message: `Brand voice score is ${brandVoiceScore}/100. Content may not align with the Living Codex voice.`,
      suggestion: 'Review content against the voice profile guidelines.',
    });
  }

  // Auto-assign tier based on content analysis
  const tierAssignment = doc.tier || categorizeTier(doc as Partial<CorpusDocument>);

  const hasBlockingErrors = errors.some((e) => e.severity === 'blocking');

  return {
    isValid: !hasBlockingErrors && restrictedClaims.length === 0,
    errors,
    warnings,
    brandVoiceScore,
    restrictedClaimsFound: restrictedClaims,
    tierAssignment,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// RESTRICTED CLAIMS CHECKER
// ============================================================================

/**
 * Scans content for language that violates the Living Codex governance
 * boundaries. These are non-negotiable — any match blocks publication.
 */

interface RestrictedPattern {
  pattern: RegExp;
  claim: string;
  category: 'diagnosis' | 'clinical' | 'treatment' | 'replacement' | 'unsourced';
}

const RESTRICTED_PATTERNS: RestrictedPattern[] = [
  // Diagnosis claims
  {
    pattern: /\b(?:this\s+(?:is|constitutes|serves\s+as)\s+(?:a\s+)?diagnosis)\b/i,
    claim: 'Content constitutes a diagnosis',
    category: 'diagnosis',
  },
  {
    pattern: /\b(?:you\s+(?:have|suffer\s+from|are\s+(?:diagnosed|afflicted)\s+with)\s+(?:a\s+)?(?:disorder|condition|illness|syndrome|disease))\b/i,
    claim: 'Assigns clinical diagnosis to user',
    category: 'diagnosis',
  },
  {
    pattern: /\b(?:wound\s+imprint\s+(?:is|means|equals|equates\s+to)\s+(?:a\s+)?(?:diagnosis|disorder|clinical\s+condition))\b/i,
    claim: 'Equates wound imprint with clinical diagnosis',
    category: 'diagnosis',
  },
  {
    pattern: /\b(?:archetype\s+(?:indicates|confirms|proves)\s+(?:a\s+)?(?:mental|psychological|psychiatric)\s+(?:condition|disorder|illness))\b/i,
    claim: 'Equates archetype with clinical condition',
    category: 'diagnosis',
  },

  // Clinical advice claims
  {
    pattern: /\b(?:this\s+(?:is|constitutes)\s+(?:medical|clinical)\s+advice)\b/i,
    claim: 'Content claims to be clinical advice',
    category: 'clinical',
  },
  {
    pattern: /\b(?:prescrib(?:e|es|ing)\s+(?:a\s+)?(?:treatment|protocol|regimen|medication|therapy\s+plan))\b/i,
    claim: 'Content prescribes treatment',
    category: 'treatment',
  },
  {
    pattern: /\b(?:(?:take|start|stop|adjust)\s+(?:your\s+)?(?:medication|meds|dosage|prescription))\b/i,
    claim: 'Content provides medication guidance',
    category: 'treatment',
  },

  // Therapy replacement
  {
    pattern: /\b(?:(?:replaces?|substitute\s+for|instead\s+of|better\s+than)\s+(?:therapy|counseling|psychiatric\s+care|clinical\s+treatment))\b/i,
    claim: 'Content implies platform replaces therapy',
    category: 'replacement',
  },
  {
    pattern: /\b(?:you\s+(?:don'?t|do\s+not)\s+need\s+(?:a\s+)?(?:therapist|counselor|psychiatrist|doctor))\b/i,
    claim: 'Content discourages professional care',
    category: 'replacement',
  },

  // Unsourced clinical claims
  {
    pattern: /\b(?:clinically\s+proven|scientifically\s+proven|medically\s+proven|evidence[- ]based)\b/i,
    claim: 'Unsourced clinical/scientific claim',
    category: 'unsourced',
  },
  {
    pattern: /\b(?:hormonal\s+(?:pattern|cycle|data)\s+(?:means|indicates|confirms|proves)\s+(?:a\s+)?(?:clinical|medical|diagnostic))\b/i,
    claim: 'Clinical claim from hormonal patterns',
    category: 'unsourced',
  },
  {
    pattern: /\b(?:(?:cure|heal|fix|resolve)s?\s+(?:your\s+)?(?:depression|anxiety|PTSD|trauma|disorder|mental\s+(?:health|illness)))\b/i,
    claim: 'Claims to cure clinical conditions',
    category: 'treatment',
  },
];

export function checkRestrictedClaims(content: string): string[] {
  const found: string[] = [];

  for (const rp of RESTRICTED_PATTERNS) {
    if (rp.pattern.test(content)) {
      found.push(`[${rp.category.toUpperCase()}] ${rp.claim}`);
    }
  }

  return found;
}

// ============================================================================
// BRAND VOICE FILTER
// ============================================================================

/**
 * Scores content alignment with the specified Living Codex voice profile.
 * Returns 0-100 where:
 *   90-100 = Exemplary alignment
 *   70-89  = Good alignment
 *   40-69  = Needs revision
 *   0-39   = Misaligned, do not publish
 */

interface VoiceMarker {
  pattern: RegExp;
  weight: number; // positive = aligned, negative = misaligned
  profile: VoiceProfile[];
}

const VOICE_MARKERS: VoiceMarker[] = [
  // === Sacred Feminine voice markers (positive) ===
  {
    pattern: /\b(?:sacred|invitation|honoring|holding\s+space|inner\s+flame|emergence|unfolding|softening|reclamation)\b/i,
    weight: 3,
    profile: ['sacred_feminine'],
  },
  {
    pattern: /\b(?:your\s+(?:body|soul|spirit|flame|light|shadow)\s+(?:knows?|remembers?|holds?|speaks?))\b/i,
    weight: 4,
    profile: ['sacred_feminine'],
  },
  {
    pattern: /\b(?:may\s+you|i\s+invite\s+you|consider\s+(?:how|what|whether)|you\s+might\s+(?:explore|notice|sense))\b/i,
    weight: 2,
    profile: ['sacred_feminine', 'facilitative'],
  },

  // === Anti-patterns (negative for sacred feminine) ===
  {
    pattern: /\b(?:you\s+(?:must|should|need\s+to|have\s+to)|failure|incorrect|wrong\s+(?:answer|choice|way))\b/i,
    weight: -3,
    profile: ['sacred_feminine', 'facilitative'],
  },
  {
    pattern: /\b(?:obviously|clearly\s+you|as\s+I\s+(?:said|already\s+(?:told|explained)))\b/i,
    weight: -4,
    profile: ['sacred_feminine', 'facilitative', 'educational', 'conversational'],
  },
  {
    pattern: /\b(?:stupid|dumb|lazy|pathetic|weak|broken\s+(?:person|woman|human))\b/i,
    weight: -10,
    profile: ['sacred_feminine', 'facilitative', 'educational', 'conversational', 'clinical_adjacent'],
  },

  // === Educational voice markers ===
  {
    pattern: /\b(?:framework|model|pattern|system|within\s+the\s+codex|the\s+living\s+codex\s+(?:describes|maps|identifies))\b/i,
    weight: 2,
    profile: ['educational'],
  },
  {
    pattern: /\b(?:research\s+suggests|studies\s+indicate|in\s+the\s+(?:field|literature)\s+of)\b/i,
    weight: 2,
    profile: ['educational', 'clinical_adjacent'],
  },

  // === Clinical-adjacent markers ===
  {
    pattern: /\b(?:boundary|scope|outside\s+(?:my|this)\s+(?:scope|lane|capacity)|refer\s+to\s+(?:a\s+)?professional)\b/i,
    weight: 3,
    profile: ['clinical_adjacent'],
  },

  // === Conversational markers ===
  {
    pattern: /\b(?:how\s+(?:are\s+you|does\s+that)\s+feel|what\s+comes\s+up\s+(?:for|when)|tell\s+me\s+more\s+about)\b/i,
    weight: 2,
    profile: ['conversational', 'facilitative'],
  },

  // === Universal anti-patterns ===
  {
    pattern: /\b(?:as\s+an\s+AI|I'?m\s+(?:just\s+)?(?:a\s+)?(?:language\s+model|AI|bot|chatbot|machine))\b/i,
    weight: -5,
    profile: ['sacred_feminine', 'facilitative', 'educational', 'conversational', 'clinical_adjacent'],
  },
  {
    pattern: /(?:!!+|\?\?+|ALL\s+CAPS\s+[A-Z]{4,}|lol|lmao|omg)/,
    weight: -3,
    profile: ['sacred_feminine', 'clinical_adjacent', 'facilitative'],
  },
];

export function scoreBrandVoice(content: string, profile: VoiceProfile): number {
  let score = 50; // baseline
  let maxPossible = 50;

  for (const marker of VOICE_MARKERS) {
    if (!marker.profile.includes(profile)) continue;

    maxPossible += Math.abs(marker.weight) * 2;
    const matches = content.match(new RegExp(marker.pattern.source, 'gi'));
    const matchCount = matches ? Math.min(matches.length, 5) : 0; // cap influence

    if (matchCount > 0) {
      score += marker.weight * Math.min(matchCount, 3);
    }
  }

  // Normalize to 0-100
  const normalized = Math.round((score / maxPossible) * 100);
  return Math.max(0, Math.min(100, normalized));
}

// ============================================================================
// CONTENT TIER CATEGORIZER
// ============================================================================

/**
 * Determines the access tier for a document based on its content,
 * type, and metadata. This is used during ingestion and also
 * as a verification layer for manually assigned tiers.
 */
export function categorizeTier(doc: Partial<CorpusDocument>): ContentTier {
  // Sensitive sections always get sensitive tier
  if (doc.metadata?.sensitiveContent) return 'sensitive';
  if (doc.metadata?.sections?.some((s) => [13, 14, 15].includes(s))) return 'sensitive';

  // Facilitator/admin content
  if (doc.type === 'facilitator_manual') return 'facilitator';
  if (doc.type === 'governance_policy') return 'admin';
  if (doc.type === 'assessment_rubric') return 'admin';

  // Phase-gated content
  if (doc.metadata?.minimumPhase && doc.metadata.minimumPhase > 1) return 'phase_gated';
  if (doc.metadata?.phases && doc.metadata.phases.some((p) => p > 3)) return 'phase_gated';

  // Public content (brand assets, general info)
  if (doc.type === 'brand_asset') return 'public';

  // Default — post-assessment content
  return 'onboarded';
}

// ============================================================================
// CORPUS UPDATE PROTOCOL
// ============================================================================

export interface UpdateRequest {
  documentId: string;
  updatedContent: string;
  updatedMetadata?: Partial<DocumentMetadata>;
  changeDescription: string;
  requestedBy: string;
  urgency: 'routine' | 'priority' | 'hotfix';
}

export interface UpdateResult {
  approved: boolean;
  newVersion: number;
  validationResult: ValidationResult;
  requiresReview: boolean;
  reviewReason?: string;
  effectiveAt?: string;
}

/**
 * Processes a corpus document update through the governance pipeline.
 * All updates are validated, version-bumped, and queued for review
 * if they touch sensitive areas.
 */
export function processUpdate(
  existingDoc: CorpusDocument,
  update: UpdateRequest
): UpdateResult {
  const newVersion = existingDoc.version + 1;

  // Build updated document for validation
  const updatedDoc: Partial<CorpusDocument> = {
    ...existingDoc,
    content: update.updatedContent,
    metadata: {
      ...existingDoc.metadata,
      ...update.updatedMetadata,
      wordCount: update.updatedContent.split(/\s+/).filter(Boolean).length,
    },
    version: newVersion,
    updatedAt: new Date().toISOString(),
  };

  // Validate the updated document
  const validation = validateDocument(updatedDoc);

  // Determine if human review is required
  let requiresReview = false;
  let reviewReason: string | undefined;

  // Sensitive content always requires review
  if (updatedDoc.metadata?.sensitiveContent || updatedDoc.tier === 'sensitive') {
    requiresReview = true;
    reviewReason = 'Document contains sensitive content (sections 13-15).';
  }

  // Restricted claims found — block until review
  if (validation.restrictedClaimsFound.length > 0) {
    requiresReview = true;
    reviewReason = `Restricted claims detected: ${validation.restrictedClaimsFound.join('; ')}`;
  }

  // Low brand voice score
  if (validation.brandVoiceScore < 50) {
    requiresReview = true;
    reviewReason = `Brand voice score (${validation.brandVoiceScore}) below threshold.`;
  }

  // Large content changes (>30% difference)
  const lengthDiff = Math.abs(update.updatedContent.length - existingDoc.content.length);
  if (lengthDiff > existingDoc.content.length * 0.3) {
    requiresReview = true;
    reviewReason = (reviewReason ? reviewReason + ' ' : '') +
      'Significant content change (>30% length difference).';
  }

  // Governance or assessment rubric changes always require review
  if (['governance_policy', 'assessment_rubric'].includes(existingDoc.type)) {
    requiresReview = true;
    reviewReason = (reviewReason ? reviewReason + ' ' : '') +
      `${existingDoc.type} updates always require admin review.`;
  }

  return {
    approved: validation.isValid && !requiresReview,
    newVersion,
    validationResult: validation,
    requiresReview,
    reviewReason,
    effectiveAt: requiresReview ? undefined : new Date().toISOString(),
  };
}

// ============================================================================
// CORPUS INTEGRITY MONITOR
// ============================================================================

export interface IntegrityReport {
  totalDocuments: number;
  byStatus: Record<DocumentStatus, number>;
  byTier: Record<ContentTier, number>;
  byType: Record<string, number>;
  issues: IntegrityIssue[];
  overallHealth: 'healthy' | 'warnings' | 'critical';
  generatedAt: string;
}

export interface IntegrityIssue {
  severity: 'info' | 'warning' | 'critical';
  documentId?: string;
  message: string;
  recommendation: string;
}

/**
 * Scans the full corpus for integrity issues:
 * - Orphaned archetype references
 * - Missing phase coverage
 * - Stale content (not reviewed in 90+ days)
 * - Broken internal references
 * - Tier mismatches
 */
export function auditCorpusIntegrity(documents: CorpusDocument[]): IntegrityReport {
  const issues: IntegrityIssue[] = [];
  const byStatus: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const byType: Record<string, number> = {};

  const publishedDocs = documents.filter((d) => d.status === 'published');
  const archetypesCovered = new Set<string>();
  const phasesCovered = new Set<number>();
  const sectionsCovered = new Set<number>();

  for (const doc of documents) {
    // Count by status, tier, type
    byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
    byTier[doc.tier] = (byTier[doc.tier] || 0) + 1;
    byType[doc.type] = (byType[doc.type] || 0) + 1;

    // Track coverage
    if (doc.status === 'published') {
      doc.metadata.archetypes?.forEach((a) => archetypesCovered.add(a));
      doc.metadata.phases?.forEach((p) => phasesCovered.add(p));
      doc.metadata.sections?.forEach((s) => sectionsCovered.add(s));
    }

    // Stale content check (90 days)
    if (doc.metadata.lastReviewedAt) {
      const daysSinceReview = Math.floor(
        (Date.now() - new Date(doc.metadata.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceReview > 90 && doc.status === 'published') {
        issues.push({
          severity: 'warning',
          documentId: doc.id,
          message: `Document "${doc.title}" has not been reviewed in ${daysSinceReview} days.`,
          recommendation: 'Schedule content review to ensure accuracy and voice alignment.',
        });
      }
    }

    // Tier mismatch detection
    const expectedTier = categorizeTier(doc);
    if (doc.tier !== expectedTier && doc.status === 'published') {
      issues.push({
        severity: 'warning',
        documentId: doc.id,
        message: `Document "${doc.title}" has tier "${doc.tier}" but content analysis suggests "${expectedTier}".`,
        recommendation: 'Verify tier assignment is intentional or update to match content.',
      });
    }
  }

  // Check archetype coverage (all 31 should have at least one published doc)
  for (const arch of VALID_ARCHETYPES) {
    if (!archetypesCovered.has(arch)) {
      issues.push({
        severity: 'warning',
        message: `Archetype "${arch}" has no published corpus documents.`,
        recommendation: 'Create portrait or module content for this archetype.',
      });
    }
  }

  // Check phase coverage (all 9 phases should be covered)
  for (let p = 1; p <= 9; p++) {
    if (!phasesCovered.has(p)) {
      issues.push({
        severity: 'critical',
        message: `Phase ${p} has no published corpus content.`,
        recommendation: 'Phase coverage gaps can leave users without routing targets. Create content immediately.',
      });
    }
  }

  // Check section coverage (all 16 sections)
  for (let s = 1; s <= 16; s++) {
    if (!sectionsCovered.has(s)) {
      issues.push({
        severity: 'warning',
        message: `Section ${s} has no published corpus content.`,
        recommendation: 'Ensure all 16 codex sections have at least one published document.',
      });
    }
  }

  // No published governance policy
  const hasGovernance = publishedDocs.some((d) => d.type === 'governance_policy');
  if (!hasGovernance) {
    issues.push({
      severity: 'critical',
      message: 'No published governance policy document in the corpus.',
      recommendation: 'A governance policy is required for AI guide boundary enforcement.',
    });
  }

  // Determine overall health
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const overallHealth: IntegrityReport['overallHealth'] =
    criticalCount > 0 ? 'critical' : warningCount > 3 ? 'warnings' : 'healthy';

  return {
    totalDocuments: documents.length,
    byStatus: byStatus as Record<DocumentStatus, number>,
    byTier: byTier as Record<ContentTier, number>,
    byType,
    issues,
    overallHealth,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// CONTENT SANITIZER — PRE-PUBLICATION
// ============================================================================

/**
 * Final pass before content enters the corpus. Strips any
 * remaining governance violations and normalizes formatting.
 */
export function sanitizeForPublication(content: string): {
  sanitized: string;
  changesApplied: string[];
} {
  let sanitized = content;
  const changesApplied: string[] = [];

  // Remove any leftover "as an AI" language
  const aiSelfRef = /\b(?:as\s+an?\s+(?:AI|artificial\s+intelligence|language\s+model|chatbot))\b/gi;
  if (aiSelfRef.test(sanitized)) {
    sanitized = sanitized.replace(aiSelfRef, '');
    changesApplied.push('Removed AI self-reference language');
  }

  // Normalize smart quotes to straight quotes for consistency
  sanitized = sanitized.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  if (sanitized !== content) {
    changesApplied.push('Normalized quotation marks');
  }

  // Ensure no trailing whitespace on lines
  const trimmed = sanitized.replace(/[ \t]+$/gm, '');
  if (trimmed !== sanitized) {
    sanitized = trimmed;
    changesApplied.push('Removed trailing whitespace');
  }

  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return { sanitized, changesApplied };
}

// ============================================================================
// EXPORTS — PUBLIC API SUMMARY
// ============================================================================
// validateDocument(doc)             → ValidationResult
// checkRestrictedClaims(content)    → string[]
// scoreBrandVoice(content, profile) → number (0-100)
// categorizeTier(doc)               → ContentTier
// processUpdate(existing, update)   → UpdateResult
// auditCorpusIntegrity(docs)        → IntegrityReport
// sanitizeForPublication(content)   → { sanitized, changesApplied }
// VALID_ARCHETYPES                  → string[] (all 31)
// VALID_WOUND_IMPRINTS              → string[] (WI-01 through WI-27)
// VALID_MIRROR_PATTERNS             → string[] (MP-01 through MP-31)
