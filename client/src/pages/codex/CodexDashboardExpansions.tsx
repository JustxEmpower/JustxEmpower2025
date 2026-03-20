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
  '#1A0A0A',
  '#0A0A1A',
  '#0A1A1A',
  '#1A0A2A',
  '#050510',
  '#1A0D05',
  '#0A1A0A',
  '#1A1505',
  '#1A1A05',
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
    backgroundColor: 'var(--cx-moonlight)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '2rem',
    letterSpacing: '0.05em',
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
    background: 'linear-gradient(to right, rgba(212, 175, 55, 0.3), transparent)',
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
    let borderColor = 'rgba(212, 175, 55, 0.4)';
    let boxShadow = 'inset 0 0 0 1px rgba(212, 175, 55, 0.4)';
    let color = 'var(--cx-cream)';

    if (isCurrent) {
      borderColor = 'var(--cx-gold)';
      boxShadow = `0 0 1rem var(--cx-gold), inset 0 0 0 1px var(--cx-gold)`;
      color = 'var(--cx-gold)';
    } else if (isCompleted) {
      borderColor = 'var(--cx-gold)';
      boxShadow = 'inset 0 0 0 1px var(--cx-gold)';
    } else if (isFuture) {
      color = 'rgba(212, 175, 55, 0.5)';
      borderColor = 'rgba(212, 175, 55, 0.2)';
      boxShadow = 'inset 0 0 0 1px rgba(212, 175, 55, 0.2)';
    }

    return {
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      backgroundColor,
      border: `2px solid ${borderColor}`,
      boxShadow,
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
    color: 'var(--cx-cream-dark)',
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
    color: 'var(--cx-cream-dark)',
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
    backgroundColor: 'var(--cx-moonlight)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
  };

  const cardStyle: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
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
    color: 'var(--cx-cream-dark)',
    opacity: 0.7,
  };

  const interpretationStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-cream)',
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
          color: 'var(--cx-cream-dark)',
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
    backgroundColor: 'var(--cx-moonlight)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
  };

  const promptStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontStyle: 'italic',
    fontFamily: 'Cormorant Garamond, serif',
    color: 'var(--cx-gold)',
    lineHeight: 1.8,
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderLeft: '3px solid var(--cx-gold)',
  };

  const practiceHeaderStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '1rem',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };

  const practiceListStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const practiceItemStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'var(--cx-cream)',
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
    backgroundColor: 'var(--cx-gold)',
    color: 'var(--cx-moonlight)',
    border: 'none',
    borderRadius: '0.25rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.05em',
  };

  const archetypeStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--cx-cream-dark)',
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
    backgroundColor: 'var(--cx-moonlight)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
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
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '0.25rem',
    color: 'var(--cx-cream)',
    fontSize: '0.9rem',
    marginRight: '0.75rem',
    marginBottom: '0.75rem',
  };

  const connectionLineStyle: React.CSSProperties = {
    height: '2px',
    background: 'linear-gradient(to right, rgba(212, 175, 55, 0.3), transparent)',
    margin: '1.5rem 0',
  };

  const archDescStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-cream)',
    lineHeight: 1.6,
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderLeft: '2px solid var(--cx-gold)',
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
    backgroundColor: 'var(--cx-moonlight)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    marginBottom: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream)',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
  };

  const tierBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--cx-gold)',
    color: 'var(--cx-moonlight)',
    borderRadius: '0.25rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    letterSpacing: '0.05em',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '0.25rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const circleCardHoverStyle: React.CSSProperties = {
    ...circleCardStyle,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
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
    backgroundColor: 'var(--cx-gold)',
    color: 'var(--cx-moonlight)',
    border: 'none',
    borderRadius: '0.25rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.05em',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--cx-cream)',
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
            color: 'var(--cx-cream-dark)',
            fontStyle: 'italic',
          }}
        >
          Community circles will appear as you progress through your journey.
        </p>
      )}
    </div>
  );
};
