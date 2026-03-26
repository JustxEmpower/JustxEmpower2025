'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Heart, Search, Filter, BarChart3, BookOpen, X, Save, Trash2, ChevronDown } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type MoodState = 'raw' | 'tender' | 'grounded' | 'activated' | 'expansive';

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

export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  mood: MoodState;
  themes: string[];
  phase: CodexPhase;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalSummary {
  month: string;
  year: number;
  topThemes: string[];
  archetypeResonance: Record<string, number>;
  woundMovement: 'deepening' | 'softening' | 'stable';
  growthIndicators: string[];
  summary: string;
}

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

export interface JournalVaultProps {
  profile: UserProfile;
  entries: JournalEntry[];
  summaries: JournalSummary[];
  routing: RoutingOutput;
  onSave: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete: (entryId: string) => void;
  onNavigate?: (phase: CodexPhase) => void;
}

// ============================================================================
// PROMPT LIBRARY - 40 POETIC PROMPTS BY CODEX PHASE
// ============================================================================

const PROMPT_LIBRARY: Record<CodexPhase, string[]> = {
  'The Mirror': [
    `What did you see today that you've been looking away from? Let the seeing be enough.`,
    `What reflection do you find most difficult to hold? Describe it without flinching.`,
    `Which parts of yourself are still hidden, even from your own gaze?`,
    `What truth is knocking at the edges of your awareness?`,
    `Write to the part of you that has been invisible. What would you say?`,
  ],
  'The Offering': [
    `What are you ready to give that you've been holding back?`,
    `Where does generosity live in your body? What does it want to express?`,
    `What becomes possible when you release the need to keep everything?`,
    `Write a love letter to something you're learning to let go of.`,
    `What offering is asking to be made through your hands, your voice, your presence?`,
  ],
  'The Descent': [
    `Where are you being called downward? What does your soul know that your mind resists?`,
    `Describe the terrain of your inner wilderness. What grows there?`,
    `What shadow are you learning to befriend?`,
    `Go deep into the fear. What lies beneath it?`,
    `Write from the place in you that is tired of fighting. What does it need to say?`,
  ],
  'The Wounding': [
    `What wound shaped the way you move through the world?`,
    `Speak directly to your pain. What has it been trying to teach you?`,
    `Where do you carry the hurt that isn't yours to carry?`,
    `What would it mean to stop trying to fix what was broken in you?`,
    `Describe the texture of your scar tissue. What made it resilient?`,
  ],
  'The Dissolution': [
    `What is falling apart that no longer serves you?`,
    `Where are the edges of who you thought you were dissolving?`,
    `Write to the version of yourself you're becoming. What does she know?`,
    `In the space between who you were and who you're becoming, what do you find?`,
    `What is it asking of you to surrender your former shape?`,
  ],
  'The Void': [
    `In the emptiness, what becomes clear?`,
    `Sit with the not-knowing. What is it teaching your bones?`,
    `Write without knowing what you'll say. Let the void speak through you.`,
    `What would it feel like to stop trying to fill the silence?`,
    `In the space where there are no answers, what question matters most?`,
  ],
  'The Return': [
    `What is calling you back? What are you ready to reclaim?`,
    `How has the journey changed the way you move?`,
    `Write to the world you're returning to. What do you bring that wasn't there before?`,
    `What practices are essential now? What does your body crave?`,
    `Where do you feel the first stirrings of renewal?`,
  ],
  'The Integration': [
    `How are the fragments of your experience weaving together?`,
    `What new wholeness is becoming possible?`,
    `Write a letter from your future self, looking back at this integration.`,
    `Where do you feel most coherent? Most whole?`,
    `What wisdom earned through dissolution are you bringing forward?`,
  ],
  'The Radiation': [
    `What light are you ready to shed into the world?`,
    `How is your presence changing the spaces you move through?`,
    `Write to something or someone you're learning to illuminate.`,
    `Where does your authentic power want to flow?`,
    `What becomes possible when you stop dimming your light?`,
  ],
};

// ============================================================================
// MOOD STYLES
// ============================================================================

const MOOD_STYLES: Record<MoodState, { bg: string; border: string; dot: string; label: string }> = {
  raw: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', label: 'Raw' },
  tender: { bg: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500', label: 'Tender' },
  grounded: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-600', label: 'Grounded' },
  activated: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', label: 'Activated' },
  expansive: { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', label: 'Expansive' },
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * NewEntry - Phase-relevant prompt with rich text editor and mood selector
 */
function NewEntry({
  profile,
  routing,
  onSave,
}: {
  profile: UserProfile;
  routing: RoutingOutput;
  onSave: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodState>('tender');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = useCallback(() => {
    if (content.trim()) {
      const themes = extractThemes(content);
      onSave({
        content,
        mood,
        themes,
        phase: routing.currentPhase,
        date: new Date(),
        wordCount: content.split(/\s+/).length,
      });
      setContent('');
      setMood('tender');
      setIsOpen(false);
    }
  }, [content, mood, routing.currentPhase, onSave]);

  return (
    <div className="space-y-4">
      <div
        className="backdrop-blur-md bg-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              {routing.currentPhase}
            </h3>
            <p className="text-xs text-slate-600 italic">{routing.prompt}</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Prompt Display */}
          <div className="backdrop-blur-md bg-slate-900/10 border border-white/20 rounded-xl p-4">
            <p className="text-sm text-slate-700 italic leading-relaxed">{routing.prompt}</p>
          </div>

          {/* Text Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reflection here. There are no rules—only authenticity."
            className="w-full min-h-[200px] p-4 rounded-xl border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-300/50 focus:border-transparent resize-none text-slate-700 placeholder-slate-500 shadow-sm"
          />

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              How does this feel?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(MOOD_STYLES) as MoodState[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mood === m
                      ? `${MOOD_STYLES[m].bg} ${MOOD_STYLES[m].border} scale-105`
                      : 'border-transparent bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${MOOD_STYLES[m].dot}`} />
                  <span className="text-xs font-medium text-slate-700">{MOOD_STYLES[m].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-medium rounded-lg hover:shadow-lg hover:from-rose-500 hover:to-pink-500 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Entry
            </button>
            <button
              onClick={() => {
                setContent('');
                setMood('tender');
                setIsOpen(false);
              }}
              className="flex-1 px-4 py-2 bg-white/30 backdrop-blur-sm text-slate-700 font-medium rounded-lg border border-white/40 hover:bg-white/50 transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * EntryBrowser - Chronological list with search and filtering
 */
function EntryBrowser({
  entries,
  onDelete,
}: {
  entries: JournalEntry[];
  onDelete: (entryId: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodState | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');

  const filteredEntries = useMemo(() => {
    let result = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.content.toLowerCase().includes(term) ||
          e.themes.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Mood filter
    if (moodFilter !== 'all') {
      result = result.filter((e) => e.mood === moodFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => new Date(e.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((e) => new Date(e.date) >= monthAgo);
    }

    return result;
  }, [entries, searchTerm, moodFilter, dateFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search entries, themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-300/50 text-slate-700 placeholder-slate-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value as MoodState | 'all')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-300/50 text-slate-700 text-sm"
            >
              <option value="all">All Moods</option>
              {(Object.keys(MOOD_STYLES) as MoodState[]).map((mood) => (
                <option key={mood} value={mood}>
                  {MOOD_STYLES[mood].label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'week' | 'month')}
            className="flex-1 px-4 py-2 rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-300/50 text-slate-700 text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No entries found. Begin your reflection.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`backdrop-blur-md bg-white/40 border ${MOOD_STYLES[entry.mood].border} rounded-xl p-4 hover:shadow-md transition-all group`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${MOOD_STYLES[entry.mood].dot}`} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{MOOD_STYLES[entry.mood].label}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100/50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {entry.content.split('\n')[0].slice(0, 150)}
                {entry.content.length > 150 ? '...' : ''}
              </p>

              {entry.themes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.themes.slice(0, 3).map((theme, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/60 text-slate-600">
                      #{theme}
                    </span>
                  ))}
                  {entry.themes.length > 3 && (
                    <span className="text-xs px-2 py-1 text-slate-500">+{entry.themes.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * ThemeClusters - AI-surfaced patterns as tag cloud
 */
function ThemeClusters({
  entries,
  onThemeClick,
}: {
  entries: JournalEntry[];
  onThemeClick: (theme: string) => void;
}) {
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      entry.themes.forEach((theme) => {
        counts[theme] = (counts[theme] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
  }, [entries]);

  const maxCount = Math.max(...themeCounts.map(([, count]) => count), 1);

  const THEME_CATEGORIES = {
    'Recurring Archetypes': ['Maiden', 'Hero', 'Sage', 'Creator', 'Shadow', 'Wise', 'Lover', 'Rebel'],
    'Wound Patterns': ['Betrayal', 'Abandonment', 'Powerlessness', 'Shame', 'Loss', 'Fragmentation'],
    'Growth Signals': ['Integration', 'Emergence', 'Embodiment', 'Clarity', 'Wholeness', 'Radiance'],
    'Somatic Themes': ['Heart', 'Breath', 'Ground', 'Flow', 'Tension', 'Release'],
    'Relational Patterns': ['Boundary', 'Intimacy', 'Witness', 'Connection', 'Separation'],
  };

  return (
    <div className="space-y-6">
      {Object.entries(THEME_CATEGORIES).map(([category, _]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {themeCounts.map(([theme, count]) => {
              const scale = (count / maxCount) * 1.5 + 0.8;
              return (
                <button
                  key={theme}
                  onClick={() => onThemeClick(theme)}
                  className="px-3 py-1.5 rounded-full backdrop-blur-md bg-white/40 border border-white/60 hover:bg-white/60 hover:border-rose-300 transition-all hover:shadow-md"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'left center',
                  }}
                >
                  <span className="text-sm font-medium text-slate-700">{theme}</span>
                  <span className="text-xs text-slate-500 ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * MonthlySummary - Beautiful AI-generated insight card
 */
function MonthlySummary({ summaries }: { summaries: JournalSummary[] }) {
  const latest = summaries[0];

  if (!latest) {
    return (
      <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-2xl p-8 text-center">
        <p className="text-slate-500 text-sm">Write entries to generate monthly insights.</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/60 to-rose-50/40 border border-white/60 rounded-2xl p-8 shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-1">
          {latest.month} {latest.year}
        </h3>
        <p className="text-sm text-slate-500">Monthly Reflection</p>
      </div>

      <p className="text-slate-700 leading-relaxed mb-6">{latest.summary}</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="backdrop-blur-sm bg-white/50 rounded-lg p-3">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-1">
            Wound Movement
          </p>
          <p className="text-sm font-semibold text-slate-800 capitalize">{latest.woundMovement}</p>
        </div>

        <div className="backdrop-blur-sm bg-white/50 rounded-lg p-3">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-1">Top Themes</p>
          <p className="text-sm font-semibold text-slate-800">
            {latest.topThemes.slice(0, 2).join(', ')}
          </p>
        </div>

        <div className="backdrop-blur-sm bg-white/50 rounded-lg p-3">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-1">
            Growth Signals
          </p>
          <p className="text-sm font-semibold text-slate-800">{latest.growthIndicators.length}</p>
        </div>
      </div>

      {latest.growthIndicators.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Growth Indicators
          </p>
          <div className="space-y-1">
            {latest.growthIndicators.map((indicator, i) => (
              <p key={i} className="text-sm text-slate-700 flex items-start">
                <span className="mr-2">&#x2726;</span>
                {indicator}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * PromptLibrary - Browse 40+ prompts by phase, archetype, theme
 */
function PromptLibrary({
  routing,
  onNavigate,
}: {
  routing: RoutingOutput;
  onNavigate?: (phase: CodexPhase) => void;
}) {
  const [selectedPhase, setSelectedPhase] = useState<CodexPhase>(routing.currentPhase);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const phases: CodexPhase[] = [
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

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Phase Selector */}
      <div className="grid grid-cols-3 gap-2">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
              selectedPhase === phase
                ? 'border-rose-300 bg-rose-50/80 text-slate-800'
                : 'border-white/40 bg-white/30 text-slate-600 hover:border-white/60'
            }`}
          >
            {phase.replace('The ', '')}
          </button>
        ))}
      </div>

      {/* Prompts for Selected Phase */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {PROMPT_LIBRARY[selectedPhase].map((prompt, i) => (
          <div
            key={i}
            className="backdrop-blur-md bg-white/40 border border-white/40 rounded-lg p-4 hover:border-rose-200 hover:bg-white/50 transition-all group"
          >
            <p className="text-sm text-slate-700 italic leading-relaxed mb-3">{prompt}</p>
            <button
              onClick={() => handleCopyPrompt(prompt)}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium"
            >
              {copiedPrompt === prompt ? '✓ Copied' : 'Copy Prompt'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Theme extraction helper
 */
function extractThemes(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1)))).slice(0, 10);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JournalVault({
  profile,
  entries,
  summaries,
  routing,
  onSave,
  onDelete,
  onNavigate,
}: JournalVaultProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'browse' | 'themes' | 'summary' | 'prompts'>(
    'write'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-rose-500" />
              Journal Vault
            </h1>
            <p className="text-slate-600">A private sanctum for your reflection and becoming</p>
          </div>
          {profile.primaryArchetype && (
            <div className="text-right">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Your Archetype</p>
              <p className="text-lg font-semibold text-slate-800">{profile.primaryArchetype}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl p-1">
          {(
            [
              { id: 'write', label: 'Write', icon: Heart },
              { id: 'browse', label: 'Entries', icon: BookOpen },
              { id: 'themes', label: 'Themes', icon: Filter },
              { id: 'summary', label: 'Summary', icon: BarChart3 },
              { id: 'prompts', label: 'Prompts', icon: BookOpen },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-rose-400/80 to-pink-400/80 text-white shadow-md'
                  : 'text-slate-700 hover:bg-white/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'write' && (
          <div>
            <NewEntry profile={profile} routing={routing} onSave={onSave} />
          </div>
        )}

        {activeTab === 'browse' && (
          <div>
            <EntryBrowser entries={entries} onDelete={onDelete} />
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-2xl p-8">
            <ThemeClusters
              entries={entries}
              onThemeClick={(theme) => {
                console.log('Theme selected:', theme);
              }}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <MonthlySummary summaries={summaries} />
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-2xl p-8">
            <PromptLibrary routing={routing} onNavigate={onNavigate} />
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalVault;
