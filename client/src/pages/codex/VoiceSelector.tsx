import React, { useState, useMemo } from 'react';
import { KOKORO_VOICE_CATALOG, GUIDE_VOICE_DEFAULTS, getRecommendedVoices, type KokoroVoice } from './KokoroTTSService';

type LanguageFilter = 'All' | 'American' | 'British';
type GenderFilter = 'All' | 'Female' | 'Male';

// ============================================================================
// VoiceSelector Component — warm glassmorphic earth-tone design
// ============================================================================

interface VoiceSelectorProps {
  currentGuide: string;
  currentVoice: string;
  avatarMode?: 'orb' | 'lifelike';
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice: (voiceId: string) => void;
  isPreviewPlaying: boolean;
  onClose: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentGuide,
  currentVoice,
  avatarMode = 'orb',
  onSelectVoice,
  onPreviewVoice,
  isPreviewPlaying,
  onClose,
}) => {
  const [filters, setFilters] = useState<{ language: LanguageFilter; gender: GenderFilter }>({
    language: 'All',
    gender: avatarMode === 'lifelike' ? 'Female' : 'All',
  });

  const recommendedVoices = useMemo(
    () => getRecommendedVoices(currentGuide),
    [currentGuide]
  );

  const filteredVoices = useMemo(() => {
    return KOKORO_VOICE_CATALOG.filter((voice) => {
      const matchesLanguage = filters.language === 'All' || voice.language.includes(filters.language);
      const matchesGender = filters.gender === 'All' || voice.gender.toLowerCase() === filters.gender.toLowerCase();
      return matchesLanguage && matchesGender;
    });
  }, [filters]);

  const renderVoiceCard = (voice: KokoroVoice) => {
    const isSelected = currentVoice === voice.id;
    const isDefault = voice.isDefault && GUIDE_VOICE_DEFAULTS[currentGuide] === voice.id;

    return (
      <div
        key={voice.id}
        style={{
          padding: '16px 18px',
          borderRadius: 16,
          background: isSelected ? 'rgba(184,123,101,0.06)' : 'rgba(255,255,255,0.32)',
          border: `1px solid ${isSelected ? 'rgba(184,123,101,0.4)' : 'rgba(255,255,255,0.55)'}`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'pointer',
          transition: 'all 0.25s',
          boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset',
          position: 'relative' as const,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isSelected ? 'rgba(184,123,101,0.08)' : 'rgba(255,255,255,0.48)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isSelected ? 'rgba(184,123,101,0.06)' : 'rgba(255,255,255,0.32)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Selected checkmark */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderRadius: '50%',
            background: 'rgba(184,123,101,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 9, fontWeight: 600 }}>&#10003;</span>
          </div>
        )}

        {/* Default badge */}
        {isDefault && !isSelected && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            fontSize: '7px', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 20,
            background: 'rgba(184,151,106,0.15)', border: '1px solid rgba(184,151,106,0.25)',
            color: 'var(--cx-gold)',
          }}>
            Guide Match
          </div>
        )}

        {/* Orb + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `radial-gradient(ellipse at 40% 35%, ${voice.orbColor}dd, ${voice.orbColor}88)`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: 5, width: 10, height: 6, borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)', transform: 'rotate(-30deg)',
            }} />
          </div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 300,
            color: 'var(--cx-ink)', fontStyle: 'italic',
          }}>
            {voice.name}
          </span>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
          <span style={{
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '3px 7px', borderRadius: 50,
            background: 'rgba(200,188,174,0.25)', color: 'var(--cx-ink3)',
            border: '1px solid rgba(200,188,174,0.35)',
          }}>
            {voice.language}
          </span>
          <span style={{
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '3px 7px', borderRadius: 50,
            background: 'rgba(200,188,174,0.25)', color: 'var(--cx-ink3)',
            border: '1px solid rgba(200,188,174,0.35)',
          }}>
            {voice.gender}
          </span>
        </div>

        {/* Description */}
        <div style={{
          fontSize: 11, color: 'var(--cx-ink2)', fontStyle: 'italic',
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, marginBottom: 10,
        }}>
          {voice.style}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPreviewVoice(voice.id); }}
            disabled={isPreviewPlaying && currentVoice !== voice.id}
            style={{
              padding: '6px 12px', borderRadius: 50, fontSize: '10.5px',
              background: 'transparent', border: '1px solid rgba(200,188,174,0.4)',
              color: 'var(--cx-ink2)', fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              width: 0, height: 0, borderLeft: '7px solid var(--cx-rose)', borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
            }} />
            {isPreviewPlaying && currentVoice === voice.id ? 'Pause' : 'Preview'}
          </button>

          {isSelected ? (
            <button style={{
              flex: 1, padding: '6px 12px', borderRadius: 50, fontSize: '10.5px',
              background: 'rgba(184,123,101,0.1)', border: '1px solid rgba(184,123,101,0.3)',
              color: 'var(--cx-rose)', fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: 'default', textAlign: 'center',
            }}>
              &#10003; Selected
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectVoice(voice.id); }}
              style={{
                flex: 1, padding: '6px 12px', borderRadius: 50, fontSize: '10.5px',
                background: 'rgba(200,188,174,0.2)', border: '1px solid rgba(200,188,174,0.35)',
                color: 'var(--cx-ink2)', fontFamily: "'DM Sans', system-ui, sans-serif",
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,188,174,0.2)'; }}
            >
              Select
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(34,30,26,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cx-fade-in 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.55)',
          borderRadius: 22,
          boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 20px 60px rgba(0,0,0,0.08)',
          overflow: 'hidden', maxWidth: 660, width: '95%', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px 16px', borderBottom: '1px solid rgba(200,188,174,0.22)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300,
              color: 'var(--cx-ink)', margin: '0 0 3px',
            }}>
              Voice Settings
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--cx-ink3)', fontStyle: 'italic', margin: 0 }}>
              Customize your guide's voice
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 12, color: 'var(--cx-ink3)',
            }}
          >
            &#215;
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{
          padding: '20px 28px 24px', overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {/* Recommended Section */}
          <div>
            <div style={{
              fontSize: 11, color: 'var(--cx-ink2)', marginBottom: 12,
              fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif",
            }}>
              Recommended for {currentGuide.charAt(0).toUpperCase() + currentGuide.slice(1)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {recommendedVoices.slice(0, 4).map(renderVoiceCard)}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,188,174,0.3), transparent)',
          }} />

          {/* All Voices */}
          <div>
            <div style={{
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--cx-ink3)', marginBottom: 12,
            }}>
              All Voices
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '9.5px', color: 'var(--cx-ink3)', letterSpacing: '0.08em' }}>Language:</span>
              {(['All', 'American', 'British'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setFilters(prev => ({ ...prev, language: lang }))}
                  style={{
                    padding: '5px 12px', borderRadius: 50, fontSize: 10, cursor: 'pointer',
                    background: filters.language === lang ? 'rgba(184,123,101,0.12)' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${filters.language === lang ? 'rgba(184,123,101,0.3)' : 'rgba(255,255,255,0.5)'}`,
                    color: filters.language === lang ? 'var(--cx-rose)' : 'var(--cx-ink2)',
                    transition: 'all 0.2s', fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onMouseEnter={e => { if (filters.language !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={e => { if (filters.language !== lang) e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                >
                  {lang}
                </button>
              ))}
              <span style={{ fontSize: '9.5px', color: 'var(--cx-ink3)', letterSpacing: '0.08em', marginLeft: 8 }}>Gender:</span>
              {(avatarMode === 'lifelike' ? ['Female'] as const : ['All', 'Female', 'Male'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setFilters(prev => ({ ...prev, gender }))}
                  style={{
                    padding: '5px 12px', borderRadius: 50, fontSize: 10, cursor: 'pointer',
                    background: filters.gender === gender ? 'rgba(184,123,101,0.12)' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${filters.gender === gender ? 'rgba(184,123,101,0.3)' : 'rgba(255,255,255,0.5)'}`,
                    color: filters.gender === gender ? 'var(--cx-rose)' : 'var(--cx-ink2)',
                    transition: 'all 0.2s', fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onMouseEnter={e => { if (filters.gender !== gender) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={e => { if (filters.gender !== gender) e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                >
                  {gender}
                </button>
              ))}
            </div>

            {/* Voice Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {filteredVoices.map(renderVoiceCard)}
            </div>

            {filteredVoices.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '2rem',
                color: 'var(--cx-ink3)', fontStyle: 'italic',
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                No voices match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// VoiceSettingsButton Component — warm glassmorphic pill
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
  const currentVoiceData = currentVoiceId
    ? KOKORO_VOICE_CATALOG.find(v => v.id === currentVoiceId)
    : null;
  const orbColor = currentVoiceData?.orbColor || '#B87B65';

  return (
    <button
      onClick={onClick}
      title={`Current voice: ${currentVoiceName}`}
      aria-label={`Voice settings: ${currentVoiceName}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.85rem', borderRadius: 50,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(184,123,101,0.15)',
        cursor: 'pointer', transition: 'all 0.2s',
        color: 'rgba(220,205,185,0.7)',
        fontSize: '0.75rem', fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 400,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.borderColor = 'rgba(184,123,101,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.borderColor = 'rgba(184,123,101,0.15)';
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle at 35% 35%, ${orbColor}dd, ${orbColor}88)`,
      }} />
      <span>{currentVoiceName}</span>
    </button>
  );
};

export default VoiceSelector;
