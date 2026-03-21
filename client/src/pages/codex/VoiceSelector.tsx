import React, { useState, useMemo } from 'react';
import { KOKORO_VOICE_CATALOG, GUIDE_VOICE_DEFAULTS, getRecommendedVoices, type KokoroVoice } from './KokoroTTSService';

type LanguageFilter = 'All' | 'American' | 'British';
type GenderFilter = 'All' | 'Female' | 'Male';

interface FilterState {
  language: LanguageFilter;
  gender: GenderFilter;
}

// ============================================================================
// VoiceSelector Component
// ============================================================================

interface VoiceSelectorProps {
  currentGuide: string;
  currentVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice: (voiceId: string) => void;
  isPreviewPlaying: boolean;
  onClose: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentGuide,
  currentVoice,
  onSelectVoice,
  onPreviewVoice,
  isPreviewPlaying,
  onClose,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    language: 'All',
    gender: 'All',
  });

  // Get recommended voices for current guide
  const recommendedVoices = useMemo(
    () => getRecommendedVoices(currentGuide),
    [currentGuide]
  );

  // Filter all voices based on language and gender
  const filteredVoices = useMemo(() => {
    return KOKORO_VOICE_CATALOG.filter((voice) => {
      const matchesLanguage =
        filters.language === 'All' ||
        voice.language.includes(filters.language);
      const matchesGender =
        filters.gender === 'All' ||
        voice.gender.toLowerCase() === filters.gender.toLowerCase();

      return matchesLanguage && matchesGender;
    });
  }, [filters]);

  // Container styles
  const panelContainerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(212, 175, 55, 0.15)',
    animation: 'fadeIn 0.3s ease-out',
    willChange: 'scroll-position',
    contain: 'layout style',
  };

  // Header styles
  const headerStyle: React.CSSProperties = {
    padding: '2rem',
    borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
    zIndex: 10,
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream, #F5F1E6)',
    margin: 0,
    letterSpacing: '0.05em',
  };

  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: 'rgba(212, 175, 55, 0.7)',
    marginTop: '0.25rem',
    fontStyle: 'italic',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(212, 175, 55, 0.6)',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  };

  const closeButtonHoverStyle: React.CSSProperties = {
    ...closeButtonStyle,
    color: 'var(--cx-gold, #D4AF37)',
  };

  // Content styles
  const contentStyle: React.CSSProperties = {
    padding: '2rem',
  };

  // Section header styles
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream, #F5F1E6)',
    marginTop: '2rem',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
    letterSpacing: '0.03em',
  };

  const firstSectionHeaderStyle: React.CSSProperties = {
    ...sectionHeaderStyle,
    marginTop: 0,
  };

  // Filter bar styles
  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
  };

  const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'rgba(212, 175, 55, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
  };

  const filterTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.2)'}`,
    borderRadius: '0.25rem',
    color: isActive ? 'var(--cx-gold, #D4AF37)' : 'rgba(212, 175, 55, 0.6)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
  });

  // Voice card grid
  const voiceGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  };

  // Voice card styles
  const voiceCardStyle = (isSelected: boolean, isDefault: boolean): React.CSSProperties => {
    const borderColor = isDefault
      ? 'rgba(212, 175, 55, 0.6)'
      : isSelected
        ? 'rgba(212, 175, 55, 0.4)'
        : 'rgba(212, 175, 55, 0.15)';
    const boxShadow = isDefault
      ? '0 0 20px rgba(212, 175, 55, 0.25)'
      : isSelected
        ? '0 0 12px rgba(212, 175, 55, 0.2)'
        : 'none';

    return {
      padding: '1.5rem',
      backgroundColor: 'rgba(30, 30, 30, 0.8)',
      border: `2px solid ${borderColor}`,
      borderRadius: '0.5rem',
      position: 'relative',
      transition: 'all 0.3s ease',
      animation: 'fadeUp 0.5s ease-out',
      cursor: 'pointer',
      boxShadow,
      overflow: 'hidden',
    };
  };

  const voiceCardHoverStyle = (isSelected: boolean, isDefault: boolean): React.CSSProperties => {
    const borderColor = isDefault
      ? 'rgba(212, 175, 55, 0.8)'
      : 'rgba(212, 175, 55, 0.5)';

    return {
      ...voiceCardStyle(isSelected, isDefault),
      borderColor,
      backgroundColor: 'rgba(40, 40, 40, 0.9)',
      boxShadow: `0 0 16px rgba(212, 175, 55, ${isDefault ? 0.35 : 0.25})`,
    };
  };

  // Voice name styles
  const voiceNameStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontFamily: 'Cormorant Garamond, serif',
    fontWeight: 600,
    color: 'var(--cx-cream, #F5F1E6)',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  // Badge styles
  const badgeStyle = (type: 'language' | 'gender' | 'default'): React.CSSProperties => {
    const backgroundColor =
      type === 'language'
        ? 'rgba(212, 175, 55, 0.15)'
        : type === 'gender'
          ? 'rgba(135, 206, 250, 0.15)'
          : 'rgba(212, 175, 55, 0.2)';
    const color =
      type === 'language'
        ? 'rgba(212, 175, 55, 0.8)'
        : type === 'gender'
          ? 'rgba(135, 206, 250, 0.8)'
          : 'var(--cx-gold, #D4AF37)';

    return {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      backgroundColor,
      color,
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
    };
  };

  const badgeContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  };

  // Style description
  const styleDescriptionStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'rgba(212, 175, 55, 0.7)',
    marginBottom: '1rem',
    fontStyle: 'italic',
    lineHeight: '1.4',
    minHeight: '2.8em',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  // Button container
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'space-between',
  };

  // Button styles
  const buttonStyle = (variant: 'preview' | 'select'): React.CSSProperties => ({
    flex: variant === 'preview' ? 0.5 : 1,
    padding: '0.65rem 1rem',
    borderRadius: '0.25rem',
    border:
      variant === 'preview'
        ? '1px solid rgba(212, 175, 55, 0.3)'
        : '1px solid rgba(212, 175, 55, 0.5)',
    backgroundColor:
      variant === 'preview'
        ? 'transparent'
        : 'rgba(212, 175, 55, 0.1)',
    color: 'var(--cx-gold, #D4AF37)',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.02em',
  });

  const buttonHoverStyle = (variant: 'preview' | 'select'): React.CSSProperties => ({
    ...buttonStyle(variant),
    backgroundColor:
      variant === 'preview'
        ? 'rgba(212, 175, 55, 0.1)'
        : 'rgba(212, 175, 55, 0.2)',
    borderColor: 'rgba(212, 175, 55, 0.7)',
  });

  // Checkmark style
  const checkmarkStyle: React.CSSProperties = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    color: 'var(--cx-gold, #D4AF37)',
  };

  // Default badge (corner)
  const defaultBadgeCornerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'var(--cx-gold, #D4AF37)',
    color: 'rgba(10, 10, 10, 0.9)',
    padding: '0.25rem 0.75rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // Orb component for each voice
  const VoiceOrb: React.FC<{ color: string; glow: string; size?: number; isSpeaking?: boolean }> = ({
    color,
    glow,
    size = 40,
    isSpeaking = false,
  }) => {
    const orbStyle: React.CSSProperties = {
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88 50%, ${color}44 80%, transparent)`,
      boxShadow: `0 0 ${isSpeaking ? 20 : 10}px ${glow}88, 0 0 ${isSpeaking ? 40 : 20}px ${glow}44, inset 0 0 ${isSpeaking ? 12 : 6}px ${color}cc`,
      transition: 'box-shadow 0.3s ease, transform 0.3s ease',
      transform: isSpeaking ? 'scale(1.1)' : 'scale(1)',
      flexShrink: 0,
      animation: isSpeaking ? 'orbPulse 1.5s ease-in-out infinite' : 'none',
    };

    return <div style={orbStyle} />;
  };

  // Render a voice card — no React state for hover, use CSS :hover for perf
  const renderVoiceCard = (voice: KokoroVoice) => {
    const isSelected = currentVoice === voice.id;
    const isDefault = voice.isDefault && GUIDE_VOICE_DEFAULTS[currentGuide] === voice.id;

    return (
      <div
        key={voice.id}
        className="voice-card"
        style={voiceCardStyle(isSelected, isDefault)}
      >
        {isDefault && <div style={defaultBadgeCornerStyle}>Guide Match</div>}
        {isSelected && <span style={checkmarkStyle}>✓</span>}

        {/* Orb + Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <VoiceOrb
            color={voice.orbColor}
            glow={voice.orbGlow}
            size={38}
            isSpeaking={isPreviewPlaying && currentVoice === voice.id}
          />
          <div>
            <div style={{ ...voiceNameStyle, marginBottom: 0 }}>
              {voice.name}
              {voice.gender === 'female' && <span>♀</span>}
              {voice.gender === 'male' && <span>♂</span>}
            </div>
          </div>
        </div>

        <div style={badgeContainerStyle}>
          <span style={badgeStyle('language')}>{voice.language}</span>
          <span style={badgeStyle('gender')}>{voice.gender}</span>
        </div>

        <div style={styleDescriptionStyle}>{voice.style}</div>

        <div style={buttonContainerStyle}>
          <button
            className="voice-btn voice-btn-preview"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewVoice(voice.id);
            }}
            style={buttonStyle('preview')}
            disabled={isPreviewPlaying && currentVoice !== voice.id}
          >
            {isPreviewPlaying && currentVoice === voice.id ? '⏸ Pause' : '▶ Preview'}
          </button>
          <button
            className="voice-btn voice-btn-select"
            onClick={(e) => {
              e.stopPropagation();
              onSelectVoice(voice.id);
            }}
            style={buttonStyle('select')}
          >
            {isSelected ? '✓ Selected' : 'Select'}
          </button>
        </div>
      </div>
    );
  };

  // Handle filter changes
  const handleLanguageFilter = (lang: LanguageFilter) => {
    setFilters((prev) => ({ ...prev, language: lang }));
  };

  const handleGenderFilter = (gender: GenderFilter) => {
    setFilters((prev) => ({ ...prev, gender }));
  };

  return (
    <div style={panelContainerStyle} onClick={onClose}>
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={headerTitleStyle}>Voice Settings</h2>
            <p style={headerSubtitleStyle}>Customize your guide's voice</p>
          </div>
          <button
            style={closeButtonStyle}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, closeButtonHoverStyle)
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, closeButtonStyle)
            }
            onClick={onClose}
            aria-label="Close voice selector"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Recommended Voices */}
          <h3 style={firstSectionHeaderStyle}>
            Recommended for {currentGuide}
          </h3>
          <div style={voiceGridStyle}>
            {recommendedVoices.slice(0, 8).map(renderVoiceCard)}
          </div>

          {/* All Voices with Filters */}
          <h3 style={sectionHeaderStyle}>All Voices</h3>

          {/* Filter Bar */}
          <div style={filterBarStyle}>
            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>Language:</span>
              {(['All', 'American', 'British'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageFilter(lang)}
                  style={filterTabStyle(filters.language === lang)}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>Gender:</span>
              {(['All', 'Female', 'Male'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleGenderFilter(gender)}
                  style={filterTabStyle(filters.gender === gender)}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Grid */}
          <div style={voiceGridStyle}>
            {filteredVoices.map(renderVoiceCard)}
          </div>

          {filteredVoices.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(212, 175, 55, 0.5)',
              }}
            >
              No voices match the selected filters.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes orbPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.15);
            filter: brightness(1.3);
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }

        .voice-card {
          contain: content;
          transition: all 0.2s ease;
        }
        .voice-card:hover {
          border-color: rgba(212, 175, 55, 0.5) !important;
          background-color: rgba(40, 40, 40, 0.9) !important;
          box-shadow: 0 0 16px rgba(212, 175, 55, 0.25) !important;
        }
        .voice-btn {
          transition: all 0.15s ease;
        }
        .voice-btn:hover {
          background-color: rgba(212, 175, 55, 0.15) !important;
          border-color: rgba(212, 175, 55, 0.7) !important;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// VoiceSettingsButton Component
// ============================================================================

interface VoiceSettingsButtonProps {
  onClick: () => void;
  currentVoiceName: string;
  currentVoiceId?: string;
}

export const VoiceSettingsButton: React.FC<VoiceSettingsButtonProps> = ({
  onClick,
  currentVoiceName,
  currentVoiceId,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Find the current voice's orb colors
  const currentVoiceData = currentVoiceId
    ? KOKORO_VOICE_CATALOG.find(v => v.id === currentVoiceId)
    : null;
  const orbColor = currentVoiceData?.orbColor || '#D4AF37';
  const orbGlow = currentVoiceData?.orbGlow || '#FFD700';

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: isHovered ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
    border: `1px solid rgba(212, 175, 55, ${isHovered ? 0.5 : 0.3})`,
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'var(--cx-gold, #D4AF37)',
    fontSize: '0.9rem',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    letterSpacing: '0.02em',
  };

  const miniOrbStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%, ${orbColor}dd, ${orbColor}88 60%, transparent)`,
    boxShadow: `0 0 6px ${orbGlow}88, 0 0 12px ${orbGlow}44`,
    flexShrink: 0,
  };

  return (
    <button
      onClick={onClick}
      style={buttonContainerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Current voice: ${currentVoiceName}`}
      aria-label={`Voice settings: ${currentVoiceName}`}
    >
      <div style={miniOrbStyle} />
      <span style={{ fontSize: '0.85rem' }}>{currentVoiceName}</span>
    </button>
  );
};

export default VoiceSelector;