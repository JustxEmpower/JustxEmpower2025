import React, { useState } from 'react';

// Phase journey constants
const PHASE_NAMES = [
  'Threshold',
  'Descent',
  'Naming',
  'Mirror',
  'Void',
  'Ember',
  'Integration',
  'Embodiment',
  'Offering',
];

const PHASE_GLYPHS = [
  '⟡',
  '↓',
  '◈',
  '⟐',
  '∅',
  '◆',
  '∆',
  '●',
  '✦',
];

const PHASE_AMBIENTS = [
  'rgba(184,123,101,0.06)',
  'rgba(125,142,127,0.06)',
  'rgba(184,151,106,0.06)',
  'rgba(139,123,168,0.06)',
  'rgba(200,188,174,0.06)',
  'rgba(184,123,101,0.08)',
  'rgba(125,142,127,0.08)',
  'rgba(184,151,106,0.08)',
  'rgba(139,123,168,0.08)',
];

// ============================================================================
// PhaseJourneyMap Component
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
}) => {
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--cx-radius-lg)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(40px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 300,
    color: 'var(--cx-ink)',
    marginBottom: '2rem',
    letterSpacing: '0.02em',
  };

  const pathContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '2rem',
  };

  const lineStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '5%',
    right: '5%',
    height: '2px',
    background: 'linear-gradient(to right, rgba(184,151,106,0.3), transparent)',
    zIndex: 0,
    pointerEvents: 'none',
  };

  const phaseNodeStyle = (phaseIndex: number): React.CSSProperties => {
    const isCompleted = completedPhases.includes(phaseIndex);
    const isCurrent = currentPhase === phaseIndex;
    const isFuture = phaseIndex > currentPhase;

    return {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
    };
  };

  const phaseCircleStyle = (phaseIndex: number): React.CSSProperties => {
    const isCompleted = completedPhases.includes(phaseIndex);
    const isCurrent = currentPhase === phaseIndex;
    const isFuture = phaseIndex > currentPhase;

    let backgroundColor = PHASE_AMBIENTS[phaseIndex];
    let borderColor = 'rgba(184,151,106,0.18)';
    let shadow = '0 0 0 1px rgba(184,151,106,0.18) inset';
    let color = 'var(--cx-ink)';
    let backdropFilter = 'blur(20px)';

    if (isCurrent) {
      backgroundColor = 'rgba(184,151,106,0.10)';
      borderColor = 'rgba(184,151,106,0.35)';
      shadow = `0 0 12px rgba(184,151,106,0.25), 0 0 0 1px rgba(184,151,106,0.35) inset`;
      color = 'var(--cx-gold)';
    } else if (isCompleted) {
      backgroundColor = 'rgba(184,151,106,0.08)';
      borderColor = 'rgba(184,151,106,0.28)';
      shadow = '0 0 0 1px rgba(184,151,106,0.28) inset';
    } else if (isFuture) {
      color = 'var(--cx-clay)';
      backgroundColor = 'rgba(255,255,255,0.06)';
      borderColor = 'rgba(184,151,106,0.08)';
      shadow = '0 0 0 1px rgba(184,151,106,0.08) inset';
    }

    return {
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      background: backgroundColor,
      border: `1.5px solid ${borderColor}`,
      boxShadow: shadow,
      backdropFilter,
      WebkitBackdropFilter: backdropFilter,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      color,
      fontWeight: 600,
      transition: 'all 0.3s ease',
    };
  };

  const phaseNameStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--cx-ink2)',
    textAlign: 'center',
    maxWidth: '4rem',
    fontFamily: 'Cormorant Garamond, serif',
    letterSpacing: '0.03em',
    marginTop: '0.5rem',
  };

  const currentPhaseNameStyle: React.CSSProperties = {
    ...phaseNameStyle,
    color: 'var(--cx-gold)',
    fontWeight: 600,
  };

  const archetypeStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--cx-ink3)',
    marginTop: '1.5rem',
    fontStyle: 'italic',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle} className="cx-fade-in">
      <h3 style={headerStyle}>Your Journey Through the Nine Phases</h3>
      <div style={pathContainerStyle}>
        <div style={lineStyle} />
        {PHASE_NAMES.map((phaseName, index) => (
          <div key={index} style={phaseNodeStyle(index)}>
            <div style={phaseCircleStyle(index)}>
              {completedPhases.includes(index) ? '✓' : PHASE_GLYPHS[index]}
            </div>
            <div
              style={
                currentPhase === index
                  ? currentPhaseNameStyle
                  : phaseNameStyle
              }
            >
              {index + 1}. {phaseName}
            </div>
          </div>
        ))}
      </div>
      <div style={archetypeStyle}>
        Current path: {primaryArchetype}
      </div>
    </div>
  );
};

// ============================================================================
// ContradictionExplorer Component
// ============================================================================
interface ContradictionExplorerProps {
  contradictions: Array<{
    pattern: string;
    interpretation: string;
    index: number;
  }>;
}

export const ContradictionExplorer: React.FC<ContradictionExplorerProps> = ({
  contradictions,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--cx-radius-lg)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(40px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 300,
    color: 'var(--cx-ink)',
    marginBottom: '1.5rem',
    letterSpacing: '0.02em',
  };

  const cardStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.20)',
    borderRadius: 'var(--cx-radius)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
    background: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(184,123,101,0.18)',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  };

  const patternNameStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-gold)',
    letterSpacing: '0.03em',
  };

  const percentageStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--cx-ink3)',
    opacity: 0.7,
  };

  const interpretationStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-ink2)',
    lineHeight: 1.6,
    marginTop: '0.75rem',
  };

  if (contradictions.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle} className="cx-fade-in">
      <h3 style={headerStyle}>Patterns to Explore</h3>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--cx-ink2)',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}
      >
        These areas show interesting contrasts in your responses. Rather than
        contradictions, they may be invitations to deeper understanding.
      </p>
      {contradictions.map((contradiction, idx) => (
        <div
          key={idx}
          style={
            expandedIndex === idx ? cardHoverStyle : cardStyle
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = cardHoverStyle.backgroundColor as string;
            e.currentTarget.style.borderColor = cardHoverStyle.borderColor as string;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = cardStyle.backgroundColor as string;
            e.currentTarget.style.borderColor = cardStyle.borderColor as string;
          }}
          onClick={() =>
            setExpandedIndex(expandedIndex === idx ? null : idx)
          }
        >
          <div style={cardHeaderStyle}>
            <span style={patternNameStyle}>{contradiction.pattern}</span>
            <span style={percentageStyle}>
              {Math.round(contradiction.index * 100)}%
            </span>
          </div>
          {expandedIndex === idx && (
            <div style={interpretationStyle}>
              {contradiction.interpretation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// WeeklyPracticeCard Component
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
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--cx-radius-lg)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(40px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 300,
    color: 'var(--cx-ink)',
    marginBottom: '1.5rem',
    letterSpacing: '0.02em',
  };

  const promptStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontStyle: 'italic',
    fontFamily: 'Cormorant Garamond, serif',
    color: 'var(--cx-gold)',
    lineHeight: 1.8,
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'rgba(184,151,106,0.04)',
    borderLeft: '2px solid rgba(184,151,106,0.25)',
    borderRadius: '0 var(--cx-radius) var(--cx-radius) 0',
    backdropFilter: 'blur(20px)',
  };

  const practiceHeaderStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-ink)',
    marginBottom: '1rem',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const practiceListStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const practiceItemStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--cx-ink2)',
    marginBottom: '0.75rem',
    paddingLeft: '1.5rem',
    position: 'relative',
    lineHeight: 1.6,
  };

  const bulletStyle: React.CSSProperties = {
    position: 'absolute',
    left: '0',
    color: 'var(--cx-gold)',
    fontWeight: 600,
  };

  const ctaButtonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: 'rgba(184,151,106,0.10)',
    color: 'var(--cx-gold)',
    border: '1px solid rgba(184,151,106,0.22)',
    borderRadius: '50px',
    fontFamily: 'var(--cx-sans)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.03em',
    backdropFilter: 'blur(20px)',
  };

  const archetypeStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--cx-ink3)',
    marginTop: '1.5rem',
    fontStyle: 'italic',
  };

  return (
    <div style={containerStyle} className="cx-fade-in">
      <h3 style={headerStyle}>This Week's Practice</h3>
      <div style={promptStyle}>{weeklyPrompt}</div>

      {practiceRecommendations.length > 0 && (
        <div>
          <h4 style={practiceHeaderStyle}>Gentle Recommendations</h4>
          <ul style={practiceListStyle}>
            {practiceRecommendations.map((rec, idx) => (
              <li key={idx} style={practiceItemStyle}>
                <span style={bulletStyle}>•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        style={ctaButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {nextRecommendedStep}
      </button>

      <div style={archetypeStyle}>
        Tailored for: {primaryArchetype}
      </div>
    </div>
  );
};

// ============================================================================
// PatternConnectionsPanel Component
// ============================================================================
interface PatternConnectionsPanelProps {
  themes: string[];
  primaryArchetype: string;
  activeWounds: string[];
  mirrorPatterns: string[];
}

export const PatternConnectionsPanel: React.FC<
  PatternConnectionsPanelProps
> = ({
  themes,
  primaryArchetype,
  activeWounds,
  mirrorPatterns,
}) => {
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--cx-radius-lg)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(40px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 300,
    color: 'var(--cx-ink)',
    marginBottom: '1.5rem',
    letterSpacing: '0.02em',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-gold)',
    marginBottom: '1rem',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: 'rgba(184,151,106,0.08)',
    border: '1px solid rgba(184,151,106,0.2)',
    borderRadius: 'var(--cx-radius)',
    color: 'var(--cx-ink)',
    fontSize: '0.9rem',
    marginRight: '0.75rem',
    marginBottom: '0.75rem',
  };

  const connectionLineStyle: React.CSSProperties = {
    height: '2px',
    background: 'linear-gradient(to right, rgba(184,151,106,0.3), transparent)',
    margin: '1.5rem 0',
  };

  const archDescStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-ink2)',
    lineHeight: 1.6,
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.08)',
    borderLeft: '2px solid rgba(184,151,106,0.20)',
  };

  return (
    <div style={containerStyle} className="cx-fade-in">
      <h3 style={headerStyle}>Pattern Connections</h3>

      {themes.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Detected Themes</h4>
          <div>
            {themes.map((theme, idx) => (
              <span key={idx} style={tagStyle}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={connectionLineStyle} />

      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>Archetype: {primaryArchetype}</h4>
        <div style={archDescStyle}>
          Your responses align with patterns characteristic of this archetype.
          The themes above suggest where this archetype activates most strongly
          in your experience.
        </div>
      </div>

      {activeWounds.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Wound Patterns to Notice</h4>
          <div>
            {activeWounds.map((wound, idx) => (
              <span key={idx} style={tagStyle}>
                {wound}
              </span>
            ))}
          </div>
        </div>
      )}

      {mirrorPatterns.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>Mirror Patterns</h4>
          <div>
            {mirrorPatterns.map((pattern, idx) => (
              <span key={idx} style={tagStyle}>
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CommunityCircleCard Component
// ============================================================================
interface CommunityCircleCardProps {
  recommendedCircles: string[];
  communityTier: string;
  primaryArchetype: string;
}

export const CommunityCircleCard: React.FC<CommunityCircleCardProps> = ({
  recommendedCircles,
  communityTier,
  primaryArchetype,
}) => {
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 'var(--cx-radius-lg)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(40px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 300,
    color: 'var(--cx-ink)',
    marginBottom: '1.5rem',
    letterSpacing: '0.02em',
  };

  const tierBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.4rem 1rem',
    background: 'rgba(184,151,106,0.10)',
    color: 'var(--cx-gold)',
    border: '1px solid rgba(184,151,106,0.22)',
    borderRadius: '50px',
    fontFamily: 'var(--cx-sans)',
    fontWeight: 500,
    fontSize: '0.75rem',
    marginBottom: '1.5rem',
    letterSpacing: '0.06em',
    backdropFilter: 'blur(20px)',
  };

  const circlesGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      recommendedCircles.length > 1 ? 'repeat(auto-fit, minmax(150px, 1fr))' : '1fr',
    gap: '1rem',
    marginBottom: '2rem',
  };

  const circleCardStyle: React.CSSProperties = {
    padding: '1.25rem',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.20)',
    borderRadius: 'var(--cx-radius)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const circleCardHoverStyle: React.CSSProperties = {
    ...circleCardStyle,
    background: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(184,123,101,0.18)',
    transform: 'translateY(-4px)',
  };

  const circleNameStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-gold)',
    letterSpacing: '0.03em',
  };

  const ctaButtonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: 'rgba(184,151,106,0.10)',
    color: 'var(--cx-gold)',
    border: '1px solid rgba(184,151,106,0.22)',
    borderRadius: '50px',
    fontFamily: 'var(--cx-sans)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.03em',
    backdropFilter: 'blur(20px)',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-ink2)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  };

  return (
    <div style={containerStyle} className="cx-fade-in">
      <h3 style={headerStyle}>Your Community</h3>
      <div style={tierBadgeStyle}>{communityTier}</div>

      <p style={descriptionStyle}>
        Connect with others on a similar path. Your archetype ({primaryArchetype}
        ) resonates with these circles.
      </p>

      {recommendedCircles.length > 0 ? (
        <div>
          <div style={circlesGridStyle}>
            {recommendedCircles.map((circle, idx) => (
              <div
                key={idx}
                style={circleCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = circleCardHoverStyle.backgroundColor as string;
                  e.currentTarget.style.borderColor = circleCardHoverStyle.borderColor as string;
                  e.currentTarget.style.transform = circleCardHoverStyle.transform as string;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = circleCardStyle.backgroundColor as string;
                  e.currentTarget.style.borderColor = circleCardStyle.borderColor as string;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={circleNameStyle}>{circle}</div>
              </div>
            ))}
          </div>

          <button
            style={ctaButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Find Your Circle
          </button>
        </div>
      ) : (
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--cx-ink3)',
            fontStyle: 'italic',
          }}
        >
          Community circles will appear as you progress through your journey.
        </p>
      )}
    </div>
  );
};
