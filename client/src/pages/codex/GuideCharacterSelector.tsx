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

// Guides with Simli face IDs — others show as "Coming Soon"
const SIMLI_READY_GUIDE_IDS = new Set(['leda', 'theia', 'selene', 'zephyr']);

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
          ? `1.5px solid rgba(184,123,101,0.7)`
          : '1.5px solid transparent',
        background: 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: active ? 'scale(1.04)' : 'scale(1)',
        boxShadow: active
          ? '0 0 24px rgba(184,123,101,0.15)'
          : '0 4px 20px rgba(0,0,0,0.3)',
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
            background: 'rgba(184,123,101,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            zIndex: 3,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
            fontWeight: 300,
            fontStyle: 'italic' as const,
            color: active ? 'rgba(220,205,185,0.95)' : 'rgba(220,205,185,0.9)',
            margin: 0,
            transition: 'color 0.3s ease',
            letterSpacing: '0.03em',
          }}
        >
          {character.name}
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.65rem',
            color: active ? 'rgba(184,123,101,0.9)' : 'rgba(154,148,141,0.7)',
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
            border: '2px solid rgba(184,123,101,0.25)',
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
        background: 'linear-gradient(170deg, #1A1510 0%, #1C1814 40%, #18140F 100%)',
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
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(184,123,101,0.7)',
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
            color: 'rgba(230,215,195,0.95)',
            margin: 0,
            letterSpacing: '0.05em',
          }}
        >
          Select Your Avatar
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.8rem',
            color: 'rgba(154,148,141,0.8)',
            marginTop: '0.5rem',
            maxWidth: '32rem',
            lineHeight: 1.7,
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
                    background: 'rgba(20,16,12,0.7)',
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
                    fontFamily: "'DM Sans', sans-serif",
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
              color: 'rgba(220,205,185,0.95)',
              margin: '0 0 0.35rem',
              fontStyle: 'italic' as const,
              // @ts-ignore
              '--glow-color': activeCharacter.primaryColor,
            } as React.CSSProperties}
          >
            {activeCharacter.name}
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem',
              color: 'rgba(154,148,141,0.8)',
              lineHeight: 1.7,
              margin: '0 0 0.5rem',
            }}
          >
            {activeCharacter.description}
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.65rem',
              color: 'rgba(184,123,101,0.7)',
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
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(154,148,141,0.8)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(200,185,165,0.9)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(154,148,141,0.8)';
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedId}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '50px',
            border: '1px solid rgba(184,123,101,0.38)',
            background: selectedId
              ? 'rgba(184,123,101,0.18)'
              : 'rgba(255,255,255,0.05)',
            color: selectedId ? 'rgba(220,185,155,0.95)' : 'rgba(255,255,255,0.3)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
            cursor: selectedId ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: 'none',
          }}
          onMouseEnter={e => {
            if (selectedId) {
              e.currentTarget.style.background = 'rgba(184,123,101,0.28)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            if (selectedId) {
              e.currentTarget.style.background = 'rgba(184,123,101,0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
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
