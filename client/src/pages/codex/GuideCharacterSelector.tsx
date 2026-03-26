import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GUIDE_CHARACTERS, type GuideCharacter } from './GuideCharacters';

// ============================================================================
// Video-game-style character selector
// Each guide is shown living & breathing with their idle video playing.
// Selecting one sets both the avatar and the voice.
//
// Only guides with Simli face IDs are shown as selectable.
// Others will appear as "Coming Soon" once their 24hr Simli conversion completes.
// ============================================================================

// Guides with completed Simli avatar faces — add IDs here as they become ready
const SIMLI_READY_GUIDE_IDS = new Set(['kore', 'leda', 'zephyr']);

interface GuideCharacterSelectorProps {
  /** Currently selected guide ID (kore, aoede, etc.) */
  currentGuideId?: string | null;
  /** Called when user confirms their selection */
  onSelect: (guideId: string, voiceId: string) => void;
  /** Called when user closes without selecting */
  onClose: () => void;
  /** Whether this is the first-time setup (no close button) */
  isFirstTime?: boolean;
}

// ── Individual Character Card with live video ──
const CharacterCard: React.FC<{
  character: GuideCharacter;
  isSelected: boolean;
  isHighlighted: boolean;
  onHover: () => void;
  onClick: () => void;
}> = ({ character, isSelected, isHighlighted, onHover, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = character.idleVideoUrl;
    video.load();

    const onCanPlay = () => setVideoLoaded(true);
    const onError = () => setVideoError(true);
    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('error', onError);

    // Auto-play when loaded
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('error', onError);
      video.pause();
      video.src = '';
    };
  }, [character.idleVideoUrl]);

  const active = isSelected || isHighlighted;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 16,
        overflow: 'hidden',
        border: active
          ? `3px solid ${character.primaryColor}`
          : '3px solid rgba(255,255,255,0.08)',
        background: `linear-gradient(180deg, ${character.secondaryColor} 0%, #0A0A0A 100%)`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: active ? 'scale(1.04)' : 'scale(1)',
        boxShadow: active
          ? `0 0 40px ${character.primaryColor}60, 0 0 80px ${character.primaryColor}20, inset 0 0 30px ${character.primaryColor}10`
          : '0 4px 20px rgba(0,0,0,0.4)',
        outline: 'none',
        padding: 0,
        display: 'block',
      }}
    >
      {/* Live idle video */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoLoaded && !videoError ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />

      {/* Portrait fallback if video fails */}
      {videoError && (
        <img
          src={character.portraitUrl}
          alt={character.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Loading shimmer */}
      {!videoLoaded && !videoError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${character.secondaryColor}, ${character.primaryColor}20, ${character.secondaryColor})`,
            backgroundSize: '200% 200%',
            animation: 'shimmer 2s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `2px solid ${character.primaryColor}40`,
              borderTopColor: character.primaryColor,
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* Dark gradient overlay at bottom for text legibility */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Selected indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: character.primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 12px ${character.primaryColor}`,
            zIndex: 3,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Character info */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          zIndex: 2,
          textAlign: 'left',
        }}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            fontWeight: 600,
            color: active ? character.primaryColor : 'rgba(255,255,255,0.85)',
            margin: 0,
            transition: 'color 0.3s ease',
            letterSpacing: '0.03em',
          }}
        >
          {character.name}
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.65rem',
            color: active ? `${character.primaryColor}cc` : 'rgba(255,255,255,0.35)',
            margin: '3px 0 0',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
          }}
        >
          {character.title}
        </p>
      </div>

      {/* Active glow border pulse */}
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: -1,
            borderRadius: 16,
            border: `2px solid ${character.primaryColor}40`,
            animation: 'glow-pulse 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
};

// ── Main Selector Component ──
export const GuideCharacterSelector: React.FC<GuideCharacterSelectorProps> = ({
  currentGuideId,
  onSelect,
  onClose,
  isFirstTime = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentGuideId || '');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeCharacter = GUIDE_CHARACTERS.find(
    g => g.id === (hoveredId || selectedId)
  );

  const handleConfirm = useCallback(() => {
    if (!selectedId) return;
    const char = GUIDE_CHARACTERS.find(g => g.id === selectedId);
    if (char) {
      onSelect(char.id, char.defaultVoiceId);
    }
  }, [selectedId, onSelect]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'auto',
      }}
    >
      {/* Animations */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes char-title-glow { 0%,100% { text-shadow: 0 0 20px var(--glow-color, #C9A96E)40; } 50% { text-shadow: 0 0 40px var(--glow-color, #C9A96E)80, 0 0 60px var(--glow-color, #C9A96E)30; } }
      `}</style>

      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          animation: 'fade-up 0.6s ease-out',
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.5)',
            marginBottom: '0.5rem',
          }}
        >
          {isFirstTime ? 'Choose Your Guide' : 'Change Your Guide'}
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 300,
            color: '#C9A96E',
            margin: 0,
            letterSpacing: '0.05em',
          }}
        >
          Select Your Avatar
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '0.5rem',
            maxWidth: '32rem',
          }}
        >
          Each guide carries a different energy. Choose the one that resonates with you.
          Your guide's voice and presence will accompany you through all sessions.
        </p>
      </div>

      {/* Character Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          maxWidth: '1000px',
          width: '100%',
          marginBottom: '1.5rem',
          animation: 'fade-up 0.8s ease-out 0.15s both',
        }}
      >
        {GUIDE_CHARACTERS.map((char) => {
          const isReady = SIMLI_READY_GUIDE_IDS.has(char.id);
          return (
            <div key={char.id} style={{ position: 'relative' }}>
              <CharacterCard
                character={char}
                isSelected={selectedId === char.id}
                isHighlighted={hoveredId === char.id}
                onHover={() => { if (isReady) setHoveredId(char.id); }}
                onClick={() => { if (isReady) setSelectedId(char.id); }}
              />
              {/* Coming Soon overlay for guides without Simli faces yet */}
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5,
                    cursor: 'not-allowed',
                  }}
                >
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                  }}>
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Character Detail Panel */}
      {activeCharacter && (
        <div
          style={{
            textAlign: 'center',
            maxWidth: '32rem',
            marginBottom: '1.5rem',
            animation: 'fade-up 0.4s ease-out',
            minHeight: '4rem',
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.4rem',
              fontWeight: 500,
              color: activeCharacter.primaryColor,
              margin: '0 0 0.35rem',
              animation: 'char-title-glow 3s ease-in-out infinite',
              // @ts-ignore
              '--glow-color': activeCharacter.primaryColor,
            } as React.CSSProperties}
          >
            {activeCharacter.name}
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              margin: '0 0 0.5rem',
            }}
          >
            {activeCharacter.description}
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.08em',
            }}
          >
            Voice: {activeCharacter.voiceLabel}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          animation: 'fade-up 0.8s ease-out 0.3s both',
        }}
      >
        {!isFirstTime && (
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedId}
          style={{
            padding: '0.75rem 2.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: selectedId
              ? `linear-gradient(135deg, ${activeCharacter?.primaryColor || '#C9A96E'}, ${activeCharacter?.emissiveColor || '#C9A96E'})`
              : 'rgba(255,255,255,0.1)',
            color: selectedId ? '#000' : 'rgba(255,255,255,0.3)',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.05rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: selectedId ? 'pointer' : 'not-allowed',
            transition: 'all 0.4s ease',
            boxShadow: selectedId
              ? `0 0 20px ${activeCharacter?.primaryColor || '#C9A96E'}40`
              : 'none',
          }}
          onMouseEnter={e => {
            if (selectedId) {
              e.currentTarget.style.boxShadow = `0 0 30px ${activeCharacter?.primaryColor || '#C9A96E'}60`;
              e.currentTarget.style.transform = 'scale(1.03)';
            }
          }}
          onMouseLeave={e => {
            if (selectedId) {
              e.currentTarget.style.boxShadow = `0 0 20px ${activeCharacter?.primaryColor || '#C9A96E'}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isFirstTime ? 'Begin Journey' : 'Confirm Selection'}
        </button>
      </div>
    </div>
  );
};

export default GuideCharacterSelector;
