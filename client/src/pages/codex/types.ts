/**
 * Complete TypeScript type definitions for the AI Guide system
 * and related holographic guide integration.
 */

// ============================================================================
// CODEX PHASES
// ============================================================================

export type CodexPhase =
  | 'The Mirror'
  | 'The Offering'
  | 'The Descent'
  | 'The Wounding'
  | 'The Dissolution'
  | 'The Void'
  | 'The Return'
  | 'The Integration'
  | 'The Radiation';

// ============================================================================
// GUIDE SYSTEM
// ============================================================================

export type GuideType = 'codex' | 'archetype' | 'journal' | 'support' | 'resources' | 'community';
export type SessionMode = 'text' | 'voice' | 'holographic';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  primaryArchetype?: string;
  currentPhase?: CodexPhase;
  tier?: string;
  createdAt?: string;
}

export interface RoutingOutput {
  currentPhase: CodexPhase;
  prompt: string;
  archetypeAlignment: string[];
}

// ============================================================================
// GUIDE MESSAGES & SESSIONS
// ============================================================================

export interface GuideMessage {
  id: string;
  role: 'user' | 'guide';
  content: string;
  timestamp: Date;
  guideType?: GuideType;
  canSave?: boolean;
  metadata?: Record<string, any>;
}

export interface GuideSession {
  id: string;
  userId: string;
  guideType: GuideType;
  mode: SessionMode;
  startTime: Date;
  endTime?: Date;
  messages: GuideMessage[];
  savedInsights: string[];
  durationMinutes?: number;
  transcript?: string;
  summary?: string;
  keyInsights?: string[];
}

// ============================================================================
// INSIGHTS & BOOKMARKS
// ============================================================================

export interface SavedInsight {
  id: string;
  userId: string;
  content: string;
  guideType: GuideType;
  sessionId: string;
  createdAt: Date;
  tags: string[];
  source: string; // quote from guide
  usedInJournal?: boolean;
  journalEntryId?: string;
}

// ============================================================================
// GUIDE DEFINITION
// ============================================================================

export interface GuideDefinition {
  id: GuideType;
  name: string;
  description: string;
  voiceName: string;
  icon: React.ReactNode;
  color: string; // Tailwind gradient class
  unlockedAt: CodexPhase;
  scope: string;
  personality?: string;
  expertise?: string[];
}

// ============================================================================
// API & INTEGRATION
// ============================================================================

export interface HolographicGuideConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface GuideApiRequest {
  userId: string;
  guideType: GuideType;
  sessionId: string;
  userMessage: string;
  context: {
    phase: CodexPhase;
    archetype?: string;
    previousMessages: GuideMessage[];
  };
}

export interface GuideApiResponse {
  guideMessage: string;
  canSave: boolean;
  metadata?: Record<string, any>;
  escalationFlag?: boolean;
  escalationReason?: string;
}

// ============================================================================
// EVENTS & CALLBACKS
// ============================================================================

export interface GuideSessionEvent {
  type: 'session_started' | 'session_ended' | 'message_sent' | 'insight_saved' | 'escalation';
  sessionId: string;
  guideType: GuideType;
  timestamp: Date;
  data?: any;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface AIGuideProps {
  profile: UserProfile;
  routing: RoutingOutput;
  sessions: GuideSession[];
  savedInsights: SavedInsight[];
  geminiApiKey: string;
  onStartSession: (guideType: GuideType, mode: SessionMode) => void | Promise<void>;
  onEndSession: (sessionId: string) => void | Promise<void>;
  onSaveInsight: (insight: SavedInsight) => void | Promise<void>;
  onEscalation?: (flag: any) => void | Promise<void>;
  onNavigate?: (view: string, params?: any) => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export interface GuideSelectorProps {
  activeGuide: GuideType | null;
  currentPhase: CodexPhase;
  onSelectGuide: (guide: GuideType) => void;
}

export interface ModeToggleProps {
  activeMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
}

export interface TextChatProps {
  guide: GuideDefinition;
  messages: GuideMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void | Promise<void>;
  onSaveInsight: (message: GuideMessage) => void | Promise<void>;
}

export interface VoiceSessionProps {
  guide: GuideDefinition;
  isRecording: boolean;
  isListening: boolean;
  transcript: string;
  onToggleRecording: () => void;
  onSaveInsight: (content: string) => void | Promise<void>;
}

export interface HolographicSessionProps {
  guide: GuideDefinition;
  profile?: UserProfile;
  apiKey?: string;
}

export interface SessionHistoryProps {
  sessions: GuideSession[];
  onLoadSession: (session: GuideSession) => void | Promise<void>;
}

export interface SavedInsightsProps {
  insights: SavedInsight[];
  onUseInJournal: (insight: SavedInsight) => void | Promise<void>;
  onDelete: (insightId: string) => void | Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PHASE_ORDER: CodexPhase[] = [
  'The Mirror',
  'The Offering',
  'The Descent',
  'The Wounding',
  'The Dissolution',
  'The Void',
  'The Return',
  'The Integration',
  'The Radiation',
];

export const GUIDE_COLORS = {
  codex: 'from-amber-500 to-orange-600',
  archetype: 'from-rose-500 to-pink-600',
  journal: 'from-violet-500 to-purple-600',
  support: 'from-cyan-500 to-blue-600',
  resources: 'from-emerald-500 to-teal-600',
  community: 'from-fuchsia-500 to-rose-600',
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Awaitable<T> = T | Promise<T>;
export type OptionalAsync<T> = T | undefined | Promise<T | undefined>;

// ============================================================================
// VOICE & AUDIO
// ============================================================================

export interface AudioTranscriptEvent {
  isFinal: boolean;
  transcript: string;
  confidence: number;
}

export interface WaveformData {
  frequency: Float32Array;
  time: Uint8Array;
}

// ============================================================================
// ESCALATION & SAFETY
// ============================================================================

export interface EscalationFlag {
  id: string;
  sessionId: string;
  type: 'safety_concern' | 'trauma_response' | 'mental_health' | 'suicidal_ideation' | 'abuse_disclosure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  message: string;
  recommendedAction: string;
}
