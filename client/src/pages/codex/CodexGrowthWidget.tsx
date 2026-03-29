/**
 * CODEX GROWTH WIDGET — Premium Interactive Dashboard
 * ====================================================
 * Streak flame, companion state (Tamagotchi), milestone celebrations.
 * State-of-the-art interactions: breathing animations, particle effects,
 * animated counters, and tactile hover responses.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Sparkles, Heart, Trophy, Star, Sprout, TreePine, Sun, Moon, X, Zap } from 'lucide-react';

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

// ── Animated Counter ────────────────────────────────────────────────

function useAnimCounter(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return val;
}

// ── Streak Flame ────────────────────────────────────────────────────

function StreakFlame({ streak }: { streak: StreakData }) {
  const [hover, setHover] = useState(false);
  const intensity = Math.min(streak.currentStreak / 30, 1);
  const flameSize = 28 + intensity * 16;
  const flameColor = streak.currentStreak >= 30 ? '#B8976A'
    : streak.currentStreak >= 14 ? '#FF8C00'
    : streak.currentStreak >= 7 ? '#FF6347'
    : '#C44B4B';

  const animatedStreak = useAnimCounter(streak.currentStreak);
  const animatedTotal = useAnimCounter(streak.totalActiveDays);

  return (
    <div
      className="cx-card cx-entrance"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover
          ? `0 1px 0 rgba(255,255,255,0.5) inset, 0 16px 48px rgba(0,0,0,0.06), 0 0 20px ${flameColor}10`
          : undefined,
      }}
    >
      {/* Ambient glow */}
      {streak.currentStreak > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: (80 + intensity * 40) * (hover ? 1.15 : 1),
          height: (80 + intensity * 40) * (hover ? 1.15 : 1),
          borderRadius: '50%',
          background: `radial-gradient(circle, ${flameColor}${hover ? '20' : '12'} 0%, transparent 70%)`,
          transition: 'all 600ms ease',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        <div
          className={streak.currentStreak > 0 ? 'cx-companion-breathe' : ''}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: streak.currentStreak > 0
              ? `radial-gradient(circle at 50% 60%, ${flameColor}20 0%, transparent 70%)`
              : 'rgba(200,188,174,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Flame
            size={flameSize}
            style={{
              color: streak.currentStreak > 0 ? flameColor : 'var(--cx-clay)',
              filter: streak.currentStreak > 0 ? `drop-shadow(0 0 ${4 + intensity * 8}px ${flameColor}60)` : 'none',
              transition: 'filter 400ms ease',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{
              fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em',
              color: streak.currentStreak > 0 ? 'var(--cx-ink)' : 'var(--cx-clay)',
              transition: 'color 300ms',
            }}>
              {animatedStreak}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--cx-ink3)', fontWeight: 500 }}>
              day{streak.currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--cx-ink3)', marginTop: 2 }}>
            Best: {streak.longestStreak} days
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--cx-ink3)', letterSpacing: '0.06em' }}>
            TOTAL DAYS
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--cx-ink)' }}>
            {animatedTotal}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Companion State (Tamagotchi) ────────────────────────────────────

const MOOD_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; message: string }> = {
  radiant: { icon: <Sun size={20} />, label: 'Radiant', color: '#B8976A', message: 'Your inner garden is thriving. She glows with your dedication.' },
  content: { icon: <Sparkles size={20} />, label: 'Content', color: '#4ACD8D', message: 'Steady presence. Your companion feels your commitment.' },
  calm: { icon: <Heart size={20} />, label: 'Calm', color: '#A78BFA', message: 'Resting peacefully. Regular visits keep her connected.' },
  restless: { icon: <Moon size={20} />, label: 'Restless', color: '#E06060', message: 'She misses your presence. A journal entry or guide session would help.' },
  dormant: { icon: <Moon size={20} />, label: 'Dormant', color: '#666', message: 'Your companion has gone quiet. Return to rekindle the connection.' },
};

const GARDEN_ICONS = [Sprout, Sprout, TreePine, TreePine, TreePine];

function CompanionCard({ companion }: { companion: CompanionData }) {
  const [hover, setHover] = useState(false);
  const moodConfig = MOOD_CONFIG[companion.mood] || MOOD_CONFIG.calm;
  const GardenIcon = GARDEN_ICONS[Math.min(companion.gardenLevel - 1, 4)];

  return (
    <div
      className="cx-card cx-entrance cx-delay-1"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '1.25rem',
        transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span className="cx-label">Inner Garden</span>
        <span style={{
          fontSize: '0.625rem', color: moodConfig.color, fontWeight: 500, letterSpacing: '0.06em',
          padding: '2px 8px', borderRadius: '50px',
          background: `${moodConfig.color}12`,
          border: `1px solid ${moodConfig.color}25`,
          transition: 'all 300ms ease',
        }}>
          {moodConfig.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          className="cx-companion-breathe"
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `radial-gradient(circle, ${moodConfig.color}15 0%, transparent 70%)`,
            border: `1px solid ${moodConfig.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            transition: 'box-shadow 400ms ease',
            boxShadow: hover ? `0 0 16px ${moodConfig.color}20` : 'none',
          }}
        >
          <div style={{ color: moodConfig.color }}>{moodConfig.icon}</div>
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--cx-surface)', border: '1px solid var(--cx-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GardenIcon size={10} style={{ color: '#4ACD8D' }} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.625rem', color: 'var(--cx-ink3)' }}>Energy</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--cx-ink2)' }}>{companion.energy}%</span>
            </div>
            <div className="cx-progress-track">
              <div
                className="cx-progress"
                style={{
                  width: `${companion.energy}%`,
                  background: `linear-gradient(90deg, ${moodConfig.color}80, ${moodConfig.color})`,
                  height: 3,
                }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--cx-ink3)', lineHeight: 1.4, margin: 0 }}>
            {moodConfig.message}
          </p>
        </div>
      </div>

      {/* Garden level indicator */}
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: level <= companion.gardenLevel ? '#4ACD8D' : 'rgba(200,188,174,0.2)',
              transition: 'background 600ms ease, box-shadow 300ms ease',
              boxShadow: level <= companion.gardenLevel && hover ? '0 0 6px rgba(74,205,141,0.3)' : 'none',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '0.5625rem', color: 'var(--cx-ink3)', marginTop: 4, textAlign: 'center' }}>
        Garden Level {companion.gardenLevel}/5
      </div>
    </div>
  );
}

// ── Milestone Celebration Modal ─────────────────────────────────────

function MilestoneCelebration({ milestone, onDismiss }: { milestone: MilestoneData; onDismiss: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        animation: 'cx-fade-in 300ms ease both',
      }}
      onClick={onDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(184,151,106,0.25)',
          borderRadius: 20, padding: '2.5rem 2rem',
          maxWidth: 380, textAlign: 'center',
          animation: 'cx-scale-in 400ms cubic-bezier(0.4, 0, 0.2, 1) both',
          position: 'relative',
          boxShadow: '0 0 60px rgba(184,151,106,0.12), 0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', top: 12, right: 12, background: 'none',
            border: 'none', color: 'var(--cx-ink3)', cursor: 'pointer', padding: 4,
          }}
        >
          <X size={16} />
        </button>

        <div className="cx-companion-breathe" style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,151,106,0.12) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <Trophy size={28} style={{ color: '#B8976A', filter: 'drop-shadow(0 0 8px rgba(184,151,106,0.4))' }} />
        </div>

        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600,
          color: 'var(--cx-gold)', marginBottom: '0.75rem',
        }}>
          {milestone.displayName}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--cx-ink2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {milestone.narrative}
        </p>
        <button onClick={onDismiss} className="cx-btn-primary" style={{ width: '100%', padding: '0.625rem 1.5rem' }}>
          <Star size={14} />
          <span>Honor This Milestone</span>
        </button>
      </div>
    </div>
  );
}

// ── Activity Stats Row ──────────────────────────────────────────────

function ActivityStats({ stats }: { stats: { journalEntries: number; guideSessions: number } }) {
  const animJournals = useAnimCounter(stats.journalEntries);
  const animSessions = useAnimCounter(stats.guideSessions);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      {[
        { value: animJournals, label: "JOURNAL ENTRIES", delay: 2 },
        { value: animSessions, label: "GUIDE SESSIONS", delay: 3 },
      ].map(s => (
        <div
          key={s.label}
          className={`cx-card cx-entrance cx-delay-${s.delay}`}
          style={{
            padding: '1rem', textAlign: 'center',
            cursor: 'default',
            transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div style={{
            fontSize: '1.25rem', fontWeight: 700, color: 'var(--cx-ink)', letterSpacing: '-0.02em',
            transition: 'transform 300ms ease',
          }}>
            {s.value}
          </div>
          <div style={{ fontSize: '0.625rem', color: 'var(--cx-ink3)', letterSpacing: '0.08em', marginTop: 2 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Milestones List ─────────────────────────────────────────────────

function MilestonesList({ milestones }: { milestones: MilestoneData[] }) {
  if (milestones.length === 0) {
    return (
      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        <div className="cx-companion-breathe" style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(184,151,106,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.75rem',
        }}>
          <Trophy size={18} style={{ color: 'var(--cx-gold)', opacity: 0.4 }} />
        </div>
        <p style={{ color: 'var(--cx-ink3)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
          Your first milestone awaits. Keep showing up.
        </p>
      </div>
    );
  }

  return (
    <div className="cx-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {milestones.slice(0, 5).map(m => (
        <div
          key={m.id}
          className="cx-fade-up"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.75rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.4)',
            transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.borderColor = 'rgba(184,151,106,0.2)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          }}
        >
          <Trophy size={14} style={{ color: 'var(--cx-gold)', flexShrink: 0, opacity: 0.7 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cx-ink)' }}>
              {m.displayName}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--cx-ink3)', marginTop: 1 }}>
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

  useEffect(() => {
    if (uncelebrated.length > 0 && !celebratingMilestone) {
      const timer = setTimeout(() => setCelebratingMilestone(uncelebrated[0]), 1200);
      return () => clearTimeout(timer);
    }
  }, [uncelebrated]);

  const handleDismissCelebration = () => {
    if (celebratingMilestone && onCelebrate) onCelebrate(celebratingMilestone.id);
    setCelebratingMilestone(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <StreakFlame streak={streak} />
      {companion && <CompanionCard companion={companion} />}
      <ActivityStats stats={stats} />

      <div className="cx-widget cx-entrance cx-delay-4">
        <div className="cx-widget-header">
          <h3>Milestones</h3>
          <span style={{
            fontSize: '0.6875rem', color: 'var(--cx-ink3)',
            padding: '1px 6px', borderRadius: '50px',
            background: milestones.length > 0 ? 'rgba(184,151,106,0.08)' : 'transparent',
          }}>
            {milestones.length} earned
          </span>
        </div>
        <div className="cx-widget-body" style={{ padding: '0.75rem' }}>
          <MilestonesList milestones={milestones} />
        </div>
      </div>

      {celebratingMilestone && (
        <MilestoneCelebration milestone={celebratingMilestone} onDismiss={handleDismissCelebration} />
      )}
    </div>
  );
}
