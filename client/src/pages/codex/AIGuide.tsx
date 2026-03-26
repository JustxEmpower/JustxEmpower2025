'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Mic,
  Zap,
  Lock,
  ChevronDown,
  Send,
  Bookmark,
  Clock,
  Sparkles,
  X,
  Settings,
  Volume2,
  Eye,
  Search,
  Filter,
  Archive,
  BookOpen,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
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

export type GuideType = 'codex' | 'archetype' | 'journal' | 'support' | 'resources' | 'community';
export type SessionMode = 'text' | 'voice' | 'holographic';

export interface UserProfile {
  id: string;
  name: string;
  primaryArchetype?: string;
  currentPhase?: CodexPhase;
}

export interface RoutingOutput {
  currentPhase: CodexPhase;
  prompt: string;
  archetypeAlignment: string[];
}

export interface GuideMessage {
  id: string;
  role: 'user' | 'guide';
  content: string;
  timestamp: Date;
  guideType?: GuideType;
  canSave?: boolean;
}

export interface GuideSession {
  id: string;
  guideType: GuideType;
  mode: SessionMode;
  startTime: Date;
  endTime?: Date;
  messages: GuideMessage[];
  savedInsights: string[];
  durationMinutes?: number;
}

export interface SavedInsight {
  id: string;
  content: string;
  guideType: GuideType;
  sessionId: string;
  createdAt: Date;
  tags: string[];
  source: string; // quote from guide
}

export interface GuideDefinition {
  id: GuideType;
  name: string;
  description: string;
  voiceName: string;
  icon: React.ReactNode;
  color: string;
  unlockedAt: CodexPhase;
  scope: string;
}

export interface AIGuideProps {
  profile: UserProfile;
  routing: RoutingOutput;
  sessions: GuideSession[];
  savedInsights: SavedInsight[];
  geminiApiKey: string;
  onStartSession: (guideType: GuideType, mode: SessionMode) => void;
  onEndSession: (sessionId: string) => void;
  onSaveInsight: (insight: SavedInsight) => void;
  onEscalation?: (flag: any) => void;
  onNavigate?: (view: string, params?: any) => void;
}

// ============================================================================
// GUIDE DEFINITIONS
// ============================================================================

const GUIDE_DEFINITIONS: Record<GuideType, GuideDefinition> = {
  codex: {
    id: 'codex',
    name: 'Codex Guide',
    description: 'Navigate the pathways and phases of the Living Codex',
    voiceName: 'Codex',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    unlockedAt: 'The Mirror',
    scope: 'Codex navigation & phase guidance',
  },
  archetype: {
    id: 'archetype',
    name: 'Archetype Companion',
    description: 'Explore your archetypal patterns and shadows',
    voiceName: 'Archetype',
    icon: <Eye className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-600',
    unlockedAt: 'The Mirror',
    scope: 'Archetypal wisdom & integration',
  },
  journal: {
    id: 'journal',
    name: 'Journal Facilitator',
    description: 'Deepen your journal practice with reflective prompts',
    voiceName: 'Journal',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'from-violet-500 to-purple-600',
    unlockedAt: 'The Offering',
    scope: 'Journal prompts & reflective practice',
  },
  support: {
    id: 'support',
    name: 'Nervous System Support',
    description: 'Trauma-informed somatic guidance and grounding',
    voiceName: 'Support',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-cyan-500 to-blue-600',
    unlockedAt: 'The Descent',
    scope: 'Somatic support & nervous system care',
  },
  resources: {
    id: 'resources',
    name: 'Resource Navigator',
    description: 'Find practices, tools, and learning materials',
    voiceName: 'Navigator',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    unlockedAt: 'The Wounding',
    scope: 'Resource discovery & recommendations',
  },
  community: {
    id: 'community',
    name: 'Community Connector',
    description: 'Explore circles, calls, and collective wisdom',
    voiceName: 'Community',
    icon: <Volume2 className="w-5 h-5" />,
    color: 'from-fuchsia-500 to-rose-600',
    unlockedAt: 'The Integration',
    scope: 'Community exploration & connection',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const PHASE_ORDER: CodexPhase[] = [
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

const isGuideUnlocked = (guide: GuideDefinition, currentPhase: CodexPhase): boolean => {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const unlockedIndex = PHASE_ORDER.indexOf(guide.unlockedAt);
  return currentIndex >= unlockedIndex;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// GUIDE SELECTOR
// ─────────────────────────────────────────────────────────────────────────

interface GuideSelectorProps {
  activeGuide: GuideType | null;
  currentPhase: CodexPhase;
  onSelectGuide: (guide: GuideType) => void;
}

const GuideSelector: React.FC<GuideSelectorProps> = ({ activeGuide, currentPhase, onSelectGuide }) => {
  const guides = Object.values(GUIDE_DEFINITIONS);
  const isLocked = (guide: GuideDefinition) => !isGuideUnlocked(guide, currentPhase);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
    >
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Choose Your Guide
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {guides.map((guide, index) => {
          const locked = isLocked(guide);
          const isActive = activeGuide === guide.id;

          return (
            <motion.button
              key={guide.id}
              onClick={() => !locked && onSelectGuide(guide.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              disabled={locked}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 group
                ${
                  isActive
                    ? `border-amber-400/60 bg-gradient-to-br ${guide.color} shadow-lg shadow-amber-500/20`
                    : locked
                      ? 'border-slate-700/40 bg-slate-800/30 cursor-not-allowed opacity-50'
                      : 'border-slate-600/40 bg-slate-800/20 hover:border-slate-500/60 hover:bg-slate-800/40'
                }
              `}
            >
              {/* Lock Badge */}
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
              )}

              {/* Active Glow */}
              {isActive && (
                <motion.div
                  layoutId="guide-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/20 to-transparent"
                  transition={{ type: 'spring', bounce: 0.2 }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-700/50'}`}>
                  {guide.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white leading-tight">{guide.name.split(' ')[0]}</p>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">{guide.scope}</p>
                </div>
              </div>

              {/* Unlock Info */}
              {locked && (
                <div className="absolute bottom-2 left-2 right-2 text-xs text-slate-300 text-center">
                  At {guide.unlockedAt}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MODE TOGGLE
// ─────────────────────────────────────────────────────────────────────────

interface ModeToggleProps {
  activeMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ activeMode, onModeChange }) => {
  const modes: { id: SessionMode; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: 'Text', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
    { id: 'holographic', label: 'Holographic', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <motion.div className="flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/30 w-fit mx-auto">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2
            ${
              activeMode === mode.id
                ? 'text-white bg-gradient-to-r from-amber-500/40 to-orange-600/40'
                : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          {mode.icon}
          {mode.label}

          {activeMode === mode.id && (
            <motion.div
              layoutId="mode-active"
              className="absolute inset-0 rounded-md border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-orange-600/10 pointer-events-none"
              transition={{ type: 'spring', bounce: 0.2 }}
            />
          )}
        </button>
      ))}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// TEXT CHAT INTERFACE
// ─────────────────────────────────────────────────────────────────────────

interface TextChatProps {
  guide: GuideDefinition;
  messages: GuideMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onSaveInsight: (message: GuideMessage) => void;
}

const TextChat: React.FC<TextChatProps> = ({ guide, messages, isLoading, onSendMessage, onSaveInsight }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-gradient-to-b from-slate-900/30 to-slate-800/20 rounded-2xl border border-slate-700/30 overflow-hidden"
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Sparkles className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400">Begin your conversation with {guide.name}...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Guide Avatar */}
              {msg.role === 'guide' && (
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white`}
                >
                  {guide.name.charAt(0)}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-amber-500/30 text-white border border-amber-400/30'
                    : 'bg-slate-700/40 text-slate-100 border border-slate-600/30'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Save Insight Button */}
                {msg.role === 'guide' && msg.canSave && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSaveInsight(msg)}
                    className="mt-2 text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    Save Insight
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0`}
            />
            <div className="flex gap-1 items-center px-4 py-3 rounded-2xl bg-slate-700/40">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                  className="w-2 h-2 rounded-full bg-slate-400"
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/30 p-4 bg-slate-900/30">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${guide.name}...`}
            rows={2}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/30 focus:ring-1 focus:ring-amber-400/20 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// VOICE SESSION
// ─────────────────────────────────────────────────────────────────────────

interface VoiceSessionProps {
  guide: GuideDefinition;
  isRecording: boolean;
  isListening: boolean;
  transcript: string;
  onToggleRecording: () => void;
  onSaveInsight: (content: string) => void;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({
  guide,
  isRecording,
  isListening,
  transcript,
  onToggleRecording,
  onSaveInsight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple waveform animation
  useEffect(() => {
    if (!isRecording && !isListening) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 20;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * (isListening ? 0.8 : 0.6);
        const x = (canvas.width / bars) * i + 5;
        const y = canvas.height / 2 - height / 2;
        ctx.fillRect(x, y, canvas.width / bars - 10, height);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, isListening]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-gradient-to-b from-slate-900/30 to-slate-800/20 rounded-2xl border border-slate-700/30 overflow-hidden p-6"
    >
      {/* Status */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/30">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`w-2 h-2 rounded-full ${isListening ? 'bg-cyan-400' : isRecording ? 'bg-amber-400' : 'bg-slate-500'}`}
          />
          <span className="text-sm text-slate-300">
            {isListening ? 'Listening...' : isRecording ? 'Recording...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Waveform */}
      <div className="flex-1 mb-6 rounded-lg overflow-hidden border border-slate-700/30 bg-slate-900/50">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={400}
          height={200}
        />
      </div>

      {/* Record Button */}
      <div className="flex justify-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleRecording}
          className={`relative w-16 h-16 rounded-full font-bold text-white transition-all
            ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30'
            }
          `}
        >
          <Mic className="w-6 h-6 mx-auto" />
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full border-2 border-red-400 opacity-0"
            />
          )}
        </motion.button>
      </div>

      {/* Transcript */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 mb-4 text-sm text-slate-100 max-h-24 overflow-y-auto"
        >
          <p className="text-xs text-slate-400 mb-2">Transcript:</p>
          <p>{transcript}</p>
        </motion.div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-400 text-center">
        {isRecording ? 'Click to stop recording' : 'Hold to speak with the guide'}
      </p>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// HOLOGRAPHIC SESSION
// ─────────────────────────────────────────────────────────────────────────

interface HolographicSessionProps {
  guide: GuideDefinition;
}

const HolographicSession: React.FC<HolographicSessionProps> = ({ guide }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-black rounded-2xl border border-slate-700/30 overflow-hidden p-6"
    >
      {/* Holographic Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20 }}
          className={`w-32 h-32 rounded-full bg-gradient-to-br ${guide.color} opacity-20 mb-6`}
        />
        <p className="text-slate-300 mb-2">Summoning {guide.name}...</p>
        <p className="text-xs text-slate-500">Holographic mode integration coming soon</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <button className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600/50 rounded-lg transition-colors">
          Fullscreen
        </button>
        <button className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600/50 rounded-lg transition-colors">
          Settings
        </button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SESSION HISTORY
// ─────────────────────────────────────────────────────────────────────────

interface SessionHistoryProps {
  sessions: GuideSession[];
  onLoadSession: (session: GuideSession) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, onLoadSession }) => {
  const [expanded, setExpanded] = useState(false);
  const recentSessions = sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl border border-slate-700/50 text-center"
      >
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No sessions yet. Start your first guide session above.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl border border-slate-700/50"
    >
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Session History</h3>

      <div className="space-y-2">
        {recentSessions.map((session, idx) => {
          const guide = GUIDE_DEFINITIONS[session.guideType];
          const endTime = session.endTime || new Date();
          const duration = Math.round(
            (endTime.getTime() - session.startTime.getTime()) / 60000
          );

          return (
            <motion.button
              key={session.id}
              onClick={() => onLoadSession(session)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="w-full p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                    {guide.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {session.startTime.toLocaleDateString()} · {formatDuration(duration)}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-700/40 text-slate-300 flex-shrink-0">
                  {session.messages.length} messages
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {sessions.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 text-xs text-slate-400 hover:text-slate-300 py-2 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? 'Show Less' : `View All ${sessions.length} Sessions`}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// SAVED INSIGHTS
// ─────────────────────────────────────────────────────────────────────────

interface SavedInsightsProps {
  insights: SavedInsight[];
  onUseInJournal: (insight: SavedInsight) => void;
  onDelete: (insightId: string) => void;
}

const SavedInsights: React.FC<SavedInsightsProps> = ({ insights, onUseInJournal, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGuide, setFilterGuide] = useState<GuideType | 'all'>('all');

  const filteredInsights = insights.filter((insight) => {
    const matchesSearch = insight.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterGuide === 'all' || insight.guideType === filterGuide;
    return matchesSearch && matchesFilter;
  });

  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl border border-slate-700/50 text-center"
      >
        <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No saved insights yet. Save messages from your guide sessions.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl border border-slate-700/50"
    >
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Saved Insights</h3>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/30"
          />
        </div>
        <select
          value={filterGuide}
          onChange={(e) => setFilterGuide(e.target.value as GuideType | 'all')}
          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/30"
        >
          <option value="all">All Guides</option>
          {Object.values(GUIDE_DEFINITIONS).map((guide) => (
            <option key={guide.id} value={guide.id}>
              {guide.name}
            </option>
          ))}
        </select>
      </div>

      {/* Insights List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredInsights.map((insight, idx) => {
          const guide = GUIDE_DEFINITIONS[insight.guideType];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 group"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 bg-gradient-to-br ${guide.color}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-100 line-clamp-2">{insight.content}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {guide.name} · {insight.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => onUseInJournal(insight)}
                    className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                    title="Use in Journal"
                  >
                    <Archive className="w-4 h-4 text-slate-400 hover:text-amber-300" />
                  </button>
                  <button
                    onClick={() => onDelete(insight.id)}
                    className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AIGuide: React.FC<AIGuideProps> = ({
  profile,
  routing,
  sessions = [],
  savedInsights = [],
  geminiApiKey,
  onStartSession,
  onEndSession,
  onSaveInsight,
  onEscalation,
  onNavigate,
}) => {
  const [activeGuide, setActiveGuide] = useState<GuideType | null>(null);
  const [activeMode, setActiveMode] = useState<SessionMode>('text');
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentGuide = activeGuide ? GUIDE_DEFINITIONS[activeGuide] : null;

  // Handle guide selection
  const handleSelectGuide = useCallback((guide: GuideType) => {
    setActiveGuide(guide);
    setMessages([]);
    setIsRecording(false);
    setTranscript('');
    setCurrentSessionId(null);

    // Start a new session
    const sessionId = `session-${Date.now()}`;
    setCurrentSessionId(sessionId);
    onStartSession(guide, activeMode);
  }, [activeMode, onStartSession]);

  // Handle mode change
  const handleModeChange = useCallback((mode: SessionMode) => {
    setActiveMode(mode);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeGuide) return;

      // Add user message
      const userMessage: GuideMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        guideType: activeGuide,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate guide response (in real implementation, call Gemini API)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const guideMessage: GuideMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'guide',
          content: `Thank you for sharing. This resonates deeply with the ${routing.currentPhase} phase. Continue exploring this wisdom...`,
          timestamp: new Date(),
          guideType: activeGuide,
          canSave: true,
        };

        setMessages((prev) => [...prev, guideMessage]);
      } catch (error) {
        console.error('Error getting guide response:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeGuide, routing]
  );

  // Handle saving insight
  const handleSaveInsight = useCallback(
    (message: GuideMessage) => {
      if (!currentSessionId) return;

      const insight: SavedInsight = {
        id: `insight-${Date.now()}`,
        content: message.content,
        guideType: message.guideType || activeGuide!,
        sessionId: currentSessionId,
        createdAt: new Date(),
        tags: [],
        source: message.content.substring(0, 50) + '...',
      };

      onSaveInsight(insight);
    },
    [activeGuide, currentSessionId, onSaveInsight]
  );

  // Handle voice recording toggle
  const handleToggleRecording = useCallback(() => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Process transcript when done
      if (transcript) {
        handleSendMessage(transcript);
        setTranscript('');
      }
    }
  }, [isRecording, transcript, handleSendMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            AI Guide
          </h1>
          <p className="text-slate-400">Sacred consultation at your pace</p>
        </div>

        {/* Guide Selector */}
        <GuideSelector
          activeGuide={activeGuide}
          currentPhase={routing.currentPhase}
          onSelectGuide={handleSelectGuide}
        />

        {/* Session Area */}
        {activeGuide && currentGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <ModeToggle activeMode={activeMode} onModeChange={handleModeChange} />
            </div>

            {/* Session Content */}
            <div className="min-h-96">
              <AnimatePresence mode="wait">
                {activeMode === 'text' && (
                  <TextChat
                    key="text-chat"
                    guide={currentGuide}
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onSaveInsight={handleSaveInsight}
                  />
                )}

                {activeMode === 'voice' && (
                  <VoiceSession
                    key="voice-session"
                    guide={currentGuide}
                    isRecording={isRecording}
                    isListening={isLoading}
                    transcript={transcript}
                    onToggleRecording={handleToggleRecording}
                    onSaveInsight={(content) => {
                      // Handle voice insight saving
                    }}
                  />
                )}

                {activeMode === 'holographic' && (
                  <HolographicSession key="holographic-session" guide={currentGuide} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* History & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SessionHistory sessions={sessions} onLoadSession={() => {}} />
          <SavedInsights
            insights={savedInsights}
            onUseInJournal={(insight) => onNavigate?.('journal', { content: insight.content })}
            onDelete={() => {}}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AIGuide;
