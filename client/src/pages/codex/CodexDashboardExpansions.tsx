import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight, Users, BookOpen, Compass } from 'lucide-react';
import NinePhaseIcons from './NinePhaseIcons';

// ============================================================================
// PhaseJourneyMap — delegates to animated NinePhaseIcons
// ============================================================================
interface PhaseJourneyMapProps {
  currentPhase: number;
  completedPhases: number[];
  primaryArchetype: string;
}

export const PhaseJourneyMap: React.FC<PhaseJourneyMapProps> = ({
  currentPhase,
  completedPhases,
  primaryArchetype,
}) => (
  <NinePhaseIcons
    currentPhase={currentPhase}
    completedPhases={completedPhases}
    pathway={primaryArchetype}
  />
);

// ============================================================================
// ContradictionExplorer — Premium expandable pattern cards
// ============================================================================
interface ContradictionExplorerProps {
  contradictions: Array<{ pattern: string; interpretation: string; index: number }>;
}

export const ContradictionExplorer: React.FC<ContradictionExplorerProps> = ({ contradictions }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (contradictions.length === 0) return null;

  return (
    <div className="cx-widget cx-fade-in">
      <div className="cx-widget-header">
        <h3>Patterns to Explore</h3>
        <span style={{ fontSize: '0.6875rem', color: 'var(--cx-ink3)' }}>
          {contradictions.length} found
        </span>
      </div>
      <div className="cx-widget-body">
        <p style={{ fontSize: '0.8rem', color: 'var(--cx-ink3)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Interesting contrasts in your responses — invitations to deeper understanding.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {contradictions.map((c, idx) => {
            const isExpanded = expandedIndex === idx;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  padding: '0.875rem 1rem',
                  background: isExpanded ? 'rgba(184,151,106,0.06)' : isHovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  border: `1px solid ${isExpanded ? 'rgba(184,151,106,0.2)' : isHovered ? 'rgba(184,123,101,0.15)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 'var(--cx-radius)',
                  cursor: 'pointer',
                  transition: 'all 350ms cubic-bezier(0.4,0,0.2,1)',
                  transform: isHovered && !isExpanded ? 'translateX(3px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.875rem', fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
                    color: isExpanded ? 'var(--cx-gold)' : 'var(--cx-ink)',
                    transition: 'color 300ms',
                  }}>
                    {c.pattern}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--cx-ink3)', opacity: 0.7 }}>
                      {Math.round(c.index * 100)}%
                    </span>
                    {isExpanded
                      ? <ChevronDown size={14} style={{ color: 'var(--cx-gold)', transition: 'transform 300ms' }} />
                      : <ChevronRight size={14} style={{ color: 'var(--cx-ink3)', transition: 'transform 300ms' }} />
                    }
                  </div>
                </div>
                <div style={{
                  maxHeight: isExpanded ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 400ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease',
                  opacity: isExpanded ? 1 : 0,
                }}>
                  <p style={{
                    fontSize: '0.8rem', color: 'var(--cx-ink2)', lineHeight: 1.6,
                    marginTop: '0.75rem', paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(200,188,174,0.15)',
                  }}>
                    {c.interpretation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// WeeklyPracticeCard — Premium with hover interactions
// ============================================================================
interface WeeklyPracticeCardProps {
  weeklyPrompt: string;
  practiceRecommendations: string[];
  nextRecommendedStep: string;
  primaryArchetype: string;
}

export const WeeklyPracticeCard: React.FC<WeeklyPracticeCardProps> = ({
  weeklyPrompt,
  practiceRecommendations,
  nextRecommendedStep,
  primaryArchetype,
}) => {
  const [hoveredRec, setHoveredRec] = useState<number | null>(null);

  const archetypeName = primaryArchetype
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="cx-widget cx-fade-in">
      <div className="cx-widget-header">
        <h3>This Week's Practice</h3>
        <BookOpen size={14} style={{ color: 'var(--cx-ink3)', opacity: 0.5 }} />
      </div>
      <div className="cx-widget-body">
        {/* Weekly prompt */}
        <div style={{
          padding: '1.25rem',
          background: 'rgba(184,151,106,0.04)',
          borderLeft: '2px solid rgba(184,151,106,0.25)',
          borderRadius: '0 var(--cx-radius) var(--cx-radius) 0',
          marginBottom: '1.25rem',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem',
            fontStyle: 'italic', color: 'var(--cx-gold)', lineHeight: 1.7,
          }}>
            {weeklyPrompt}
          </p>
        </div>

        {/* Recommendations */}
        {practiceRecommendations.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="cx-label" style={{ marginBottom: '0.75rem' }}>Gentle Recommendations</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {practiceRecommendations.map((rec, idx) => (
                <li
                  key={idx}
                  onMouseEnter={() => setHoveredRec(idx)}
                  onMouseLeave={() => setHoveredRec(null)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.85rem', color: 'var(--cx-ink2)', lineHeight: 1.5,
                    borderRadius: 'var(--cx-radius)',
                    background: hoveredRec === idx ? 'rgba(255,255,255,0.25)' : 'transparent',
                    border: `1px solid ${hoveredRec === idx ? 'rgba(184,151,106,0.12)' : 'transparent'}`,
                    transition: 'all 300ms ease',
                    transform: hoveredRec === idx ? 'translateX(4px)' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  }}
                >
                  <span style={{ color: 'var(--cx-gold)', fontWeight: 600, flexShrink: 0, marginTop: 1 }}>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <button
          className="cx-btn-primary"
          style={{ gap: '6px', marginBottom: '0.75rem' }}
        >
          {nextRecommendedStep}
          <ArrowRight size={12} />
        </button>

        {/* Archetype tag */}
        <p style={{ fontSize: '0.75rem', color: 'var(--cx-ink3)', fontStyle: 'italic' }}>
          Tailored for: {archetypeName}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// PatternConnectionsPanel
// ============================================================================
interface PatternConnectionsPanelProps {
  themes: string[];
  primaryArchetype: string;
  activeWounds: string[];
  mirrorPatterns: string[];
}

export const PatternConnectionsPanel: React.FC<PatternConnectionsPanelProps> = ({
  themes, primaryArchetype, activeWounds, mirrorPatterns,
}) => {
  return (
    <div className="cx-widget cx-fade-in">
      <div className="cx-widget-header">
        <h3>Pattern Connections</h3>
      </div>
      <div className="cx-widget-body">
        {themes.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="cx-label" style={{ marginBottom: '0.625rem' }}>Detected Themes</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {themes.map((theme, idx) => (
                <span key={idx} style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--cx-radius)',
                  background: 'rgba(184,151,106,0.06)', border: '1px solid rgba(184,151,106,0.15)',
                  fontSize: '0.8rem', color: 'var(--cx-ink)',
                  transition: 'all 300ms ease', cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(184,151,106,0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(184,151,106,0.06)';
                  e.currentTarget.style.transform = 'none';
                }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="cx-divider" />

        <div style={{ marginBottom: '1.25rem' }}>
          <p className="cx-label" style={{ marginBottom: '0.5rem' }}>Archetype: {primaryArchetype}</p>
          <div style={{
            fontSize: '0.8rem', color: 'var(--cx-ink2)', lineHeight: 1.6, padding: '0.75rem',
            background: 'rgba(255,255,255,0.08)', borderLeft: '2px solid rgba(184,151,106,0.2)', borderRadius: '0 8px 8px 0',
          }}>
            Your responses align with patterns characteristic of this archetype.
          </div>
        </div>

        {activeWounds.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p className="cx-label" style={{ marginBottom: '0.625rem' }}>Wound Patterns</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {activeWounds.map((wound, idx) => (
                <span key={idx} style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--cx-radius)',
                  background: 'rgba(184,123,101,0.06)', border: '1px solid rgba(184,123,101,0.15)',
                  fontSize: '0.8rem', color: 'var(--cx-ink)',
                }}>
                  {wound}
                </span>
              ))}
            </div>
          </div>
        )}

        {mirrorPatterns.length > 0 && (
          <div>
            <p className="cx-label" style={{ marginBottom: '0.625rem' }}>Mirror Patterns</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {mirrorPatterns.map((p, idx) => (
                <span key={idx} style={{
                  padding: '0.375rem 0.75rem', borderRadius: 'var(--cx-radius)',
                  background: 'rgba(125,142,127,0.06)', border: '1px solid rgba(125,142,127,0.15)',
                  fontSize: '0.8rem', color: 'var(--cx-ink)',
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CommunityCircleCard — Premium with interactive hover
// ============================================================================
interface CommunityCircleCardProps {
  recommendedCircles: string[];
  communityTier: string;
  primaryArchetype: string;
  onNavigate?: (view: string) => void;
}

export const CommunityCircleCard: React.FC<CommunityCircleCardProps> = ({
  recommendedCircles,
  communityTier,
  primaryArchetype,
  onNavigate,
}) => {
  const [hoveredCircle, setHoveredCircle] = useState<number | null>(null);
  const archetypeName = primaryArchetype
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="cx-widget cx-fade-in">
      <div className="cx-widget-header">
        <h3>Your Community</h3>
        <Users size={14} style={{ color: 'var(--cx-ink3)', opacity: 0.5 }} />
      </div>
      <div className="cx-widget-body">
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '50px',
          fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em',
          background: 'rgba(184,151,106,0.08)', border: '1px solid rgba(184,151,106,0.18)',
          color: 'var(--cx-gold)', marginBottom: '0.875rem', textTransform: 'capitalize',
        }}>
          {communityTier}
        </span>

        <p style={{ fontSize: '0.85rem', color: 'var(--cx-ink2)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Connect with others on a similar path. Your archetype ({archetypeName}) resonates with these circles.
        </p>

        {recommendedCircles.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {recommendedCircles.map((circle, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCircle(idx)}
                  onMouseLeave={() => setHoveredCircle(null)}
                  style={{
                    padding: '0.875rem 1rem',
                    background: hoveredCircle === idx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                    border: `1px solid ${hoveredCircle === idx ? 'rgba(184,151,106,0.18)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 'var(--cx-radius)',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'all 350ms cubic-bezier(0.4,0,0.2,1)',
                    transform: hoveredCircle === idx ? 'translateY(-2px)' : 'none',
                    boxShadow: hoveredCircle === idx ? '0 6px 20px rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem',
                    fontWeight: 600, color: 'var(--cx-gold)',
                  }}>
                    {circle}
                  </span>
                </div>
              ))}
            </div>
            <button className="cx-btn-primary" style={{ gap: '6px' }} onClick={() => onNavigate?.("community")}>
              <Compass size={13} /> Find Your Circle
            </button>
          </>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--cx-ink3)', fontStyle: 'italic' }}>
            Community circles will appear as you progress through your journey.
          </p>
        )}
      </div>
    </div>
  );
};
