/**
 * CODEX GROWTH WIDGET — Doc 02 Implementation
 * ==============================================
 * Streak flame, companion state (Tamagotchi), milestone celebrations.
 * Designed to sit on the dashboard as an engagement tracker.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Sparkles, Heart, Trophy, Star, Sprout, TreePine, Sun, Moon, X } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

interface CompanionData {
  mood: string;
  energy: number;
  gardenLevel: number;
  totalInteractions: number;
  daysWithoutInteraction: number;
}

interface MilestoneData {
  id: string;
  milestoneType: string;
  displayName: string;
  narrative: string | null;
  celebrated: number;
  earnedAt: string;
}

interface GrowthWidgetProps {
  streak: StreakData;
  companion: CompanionData | null;
  milestones: MilestoneData[];
  uncelebrated: MilestoneData[];
  stats: { journalEntries: number; guideSessions: number };
  onCelebrate?: (milestoneId: string) => void;
}

// ── Streak Flame ────────────────────────────────────────────────────

function StreakFlame({ streak }: { streak: StreakData }) {
  const intensity = Math.min(streak.currentStreak / 30, 1);
  const flameSize = 28 + intensity * 16;
  const flameColor = streak.currentStreak >= 30
    ? '#FFD700'
    : streak.currentStreak >= 14
    ? '#FF8C00'
    : streak.currentStreak >= 7
    ? '#FF6347'
    : '#C44B4B';

  return (
    <div className="cx-card cx-entrance" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      {/* Glow effect behind flame */}
      {streak.currentStreak > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80 + intensity * 40,
          height: 80 + intensity * 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${flameColor}15 0%, transparent 70%)`,
          animation: 'cx-slow-pulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: streak.currentStreak > 0
            ? `radial-gradient(circle at 50% 60%, ${flameColor}20 0%, transparent 70%)`
            : 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <Flame
            size={flameSize}
            style={{
              color: streak.currentStreak > 0 ? flameColor : 'rgba(255,255,255,0.15)',
              filter: streak.currentStreak > 0 ? `drop-shadow(0 0 ${4 + intensity * 8}px ${flameColor}60)` : 'none',
              animation: streak.currentStreak > 0 ? 'cx-float 3s ease-in-out infinite' : 'none',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: streak.currentStreak > 0 ? 'var(--cx-cream)' : 'rgba(255,255,255,0.3)',
            }}>
              {streak.currentStreak}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              day{streak.currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Best: {streak.longestStreak} days
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            TOTAL DAYS
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cx-cream)' }}>
            {streak.totalActiveDays}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Companion State (Tamagotchi) ────────────────────────────────────

const MOOD_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; message: string }> = {
  radiant: {
    icon: <Sun size={20} />,
    label: 'Radiant',
    color: '#FFD700',
    message: 'Your inner garden is thriving. She glows with your dedication.',
  },
  content: {
    icon: <Sparkles size={20} />,
    label: 'Content',
    color: '#4ACD8D',
    message: 'Steady presence. Your companion feels your commitment.',
  },
  calm: {
    icon: <Heart size={20} />,
    label: 'Calm',
    color: '#A78BFA',
    message: 'Resting peacefully. Regular visits keep her connected.',
  },
  restless: {
    icon: <Moon size={20} />,
    label: 'Restless',
    color: '#E06060',
    message: 'She misses your presence. A journal entry or guide session would help.',
  },
  dormant: {
    icon: <Moon size={20} />,
    label: 'Dormant',
    color: '#666',
    message: 'Your companion has gone quiet. Return to rekindle the connection.',
  },
};

const GARDEN_ICONS = [Sprout, Sprout, TreePine, TreePine, TreePine];

function CompanionCard({ companion }: { companion: CompanionData }) {
  const moodConfig = MOOD_CONFIG[companion.mood] || MOOD_CONFIG.calm;
  const GardenIcon = GARDEN_ICONS[Math.min(companion.gardenLevel - 1, 4)];
  const energyPct = companion.energy;

  return (
    <div className="cx-card cx-entrance cx-delay-1" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span className="cx-label">Inner Garden</span>
        <span style={{ fontSize: '0.625rem', color: moodConfig.color, fontWeight: 600, letterSpacing: '0.06em' }}>
          {moodConfig.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Companion visual */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${moodConfig.color}15 0%, transparent 70%)`,
          border: `1px solid ${moodConfig.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ color: moodConfig.color, animation: 'cx-float 4s ease-in-out infinite' }}>
            {moodConfig.icon}
          </div>
          {/* Garden level indicator */}
          <div style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--cx-surface)',
            border: '1px solid var(--cx-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GardenIcon size={10} style={{ color: '#4ACD8D' }} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {/* Energy bar */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)' }}>Energy</span>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>{energyPct}%</span>
            </div>
            <div className="cx-progress-track">
              <div
                className="cx-progress"
                style={{
                  width: `${energyPct}%`,
                  background: `linear-gradient(90deg, ${moodConfig.color}80, ${moodConfig.color})`,
                  height: 3,
                }}
              />
            </div>
          </div>

          {/* Mood message */}
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, margin: 0 }}>
            {moodConfig.message}
          </p>
        </div>
      </div>

      {/* Garden level */}
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: level <= companion.gardenLevel
                ? '#4ACD8D'
                : 'rgba(255,255,255,0.06)',
              transition: 'background 600ms ease',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'center' }}>
        Garden Level {companion.gardenLevel}/5
      </div>
    </div>
  );
}

// ── Milestone Celebration Modal ─────────────────────────────────────

function MilestoneCelebration({
  milestone,
  onDismiss,
}: {
  milestone: MilestoneData;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'cx-fade-in 300ms ease both',
      }}
      onClick={onDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(28, 25, 48, 0.95)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 20,
          padding: '2.5rem 2rem',
          maxWidth: 380,
          textAlign: 'center',
          animation: 'cx-scale-in 400ms cubic-bezier(0.4, 0, 0.2, 1) both',
          position: 'relative',
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.08)',
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          animation: 'cx-float 3s ease-in-out infinite',
        }}>
          <Trophy size={28} style={{ color: '#FFD700', filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.4))' }} />
        </div>

        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#FFD700',
          marginBottom: '0.75rem',
          letterSpacing: '-0.01em',
        }}>
          {milestone.displayName}
        </h3>

        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}>
          {milestone.narrative}
        </p>

        <button
          onClick={onDismiss}
          className="cx-btn-primary"
          style={{ width: '100%', padding: '0.625rem 1.5rem' }}
        >
          <Star size={14} />
          <span>Honor This Milestone</span>
        </button>
      </div>
    </div>
  );
}

// ── Activity Stats Row ──────────────────────────────────────────────

function ActivityStats({ stats }: { stats: { journalEntries: number; guideSessions: number } }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      <div className="cx-card cx-entrance cx-delay-2" style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cx-cream)', letterSpacing: '-0.02em' }}>
          {stats.journalEntries}
        </div>
        <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginTop: 2 }}>
          JOURNAL ENTRIES
        </div>
      </div>
      <div className="cx-card cx-entrance cx-delay-3" style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cx-cream)', letterSpacing: '-0.02em' }}>
          {stats.guideSessions}
        </div>
        <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginTop: 2 }}>
          GUIDE SESSIONS
        </div>
      </div>
    </div>
  );
}

// ── Milestones List ─────────────────────────────────────────────────

function MilestonesList({ milestones }: { milestones: MilestoneData[] }) {
  if (milestones.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.8125rem' }}>
        Your first milestone awaits. Keep showing up.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {milestones.slice(0, 5).map(m => (
        <div
          key={m.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <Trophy size={14} style={{ color: '#FFD700', flexShrink: 0, opacity: 0.7 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cx-cream)' }}>
              {m.displayName}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
              {new Date(m.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Growth Widget ──────────────────────────────────────────────

export default function CodexGrowthWidget({
  streak,
  companion,
  milestones,
  uncelebrated,
  stats,
  onCelebrate,
}: GrowthWidgetProps) {
  const [celebratingMilestone, setCelebratingMilestone] = useState<MilestoneData | null>(null);

  // Auto-show first uncelebrated milestone
  useEffect(() => {
    if (uncelebrated.length > 0 && !celebratingMilestone) {
      const timer = setTimeout(() => {
        setCelebratingMilestone(uncelebrated[0]);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [uncelebrated]);

  const handleDismissCelebration = () => {
    if (celebratingMilestone && onCelebrate) {
      onCelebrate(celebratingMilestone.id);
    }
    setCelebratingMilestone(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Streak Flame */}
      <StreakFlame streak={streak} />

      {/* Companion / Tamagotchi */}
      {companion && <CompanionCard companion={companion} />}

      {/* Activity Stats */}
      <ActivityStats stats={stats} />

      {/* Milestones */}
      <div className="cx-widget cx-entrance cx-delay-4">
        <div className="cx-widget-header">
          <h3>Milestones</h3>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
            {milestones.length} earned
          </span>
        </div>
        <div className="cx-widget-body" style={{ padding: '0.75rem' }}>
          <MilestonesList milestones={milestones} />
        </div>
      </div>

      {/* Celebration Modal */}
      {celebratingMilestone && (
        <MilestoneCelebration
          milestone={celebratingMilestone}
          onDismiss={handleDismissCelebration}
        />
      )}
    </div>
  );
}
