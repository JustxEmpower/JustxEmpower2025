import React, { useState, useCallback, useMemo } from 'react';
import {
  SKIN_TONE_PALETTE,
  SafetyValidator,
  type AvatarCustomization,
  type FaceGeometry,
} from './AvatarSystem';

interface AvatarCustomizerProps {
  guideName: string;
  initialCustomization?: Partial<AvatarCustomization>;
  onSave: (customization: AvatarCustomization) => void;
  onCancel: () => void;
  isOpen: boolean;
}

type TabType = 'appearance' | 'hair' | 'face' | 'outfit' | 'accessories';

const BODY_TYPES = [
  { id: 'slim', label: 'Slim', silhouette: '◷' },
  { id: 'athletic', label: 'Athletic', silhouette: '◉' },
  { id: 'curvy', label: 'Curvy', silhouette: '◉' },
  { id: 'plus_size', label: 'Plus Size', silhouette: '◉' },
] as const;

const AGE_RANGES = [
  { id: 'young_adult_20s', label: '20s' },
  { id: 'adult_30s', label: '30s' },
  { id: 'mature_40s', label: '40s' },
  { id: 'elder_50plus', label: '50+' },
] as const;

const EYE_COLORS = [
  { id: 'brown', label: 'Brown', hex: '#8B4513' },
  { id: 'dark_brown', label: 'Dark Brown', hex: '#3E2723' },
  { id: 'hazel', label: 'Hazel', hex: '#808000' },
  { id: 'green', label: 'Green', hex: '#228B22' },
  { id: 'blue', label: 'Blue', hex: '#4169E1' },
  { id: 'gray', label: 'Gray', hex: '#808080' },
  { id: 'amber', label: 'Amber', hex: '#FFBF00' },
  { id: 'black', label: 'Black', hex: '#000000' },
] as const;

const HAIR_STYLES = [
  { id: 'natural_coils', label: 'Natural Coils', symbol: '◎' },
  { id: 'tight_curls', label: 'Tight Curls', symbol: '≋' },
  { id: 'loose_curls', label: 'Loose Curls', symbol: '∿' },
  { id: 'locs', label: 'Locs', symbol: '⫼' },
  { id: 'braids', label: 'Braids', symbol: '⫻' },
  { id: 'cornrows', label: 'Cornrows', symbol: '≡' },
  { id: 'afro', label: 'Afro', symbol: '◉' },
  { id: 'straight', label: 'Straight', symbol: '|' },
  { id: 'wavy', label: 'Wavy', symbol: '~' },
  { id: 'pixie', label: 'Pixie', symbol: '·' },
  { id: 'long_flowing', label: 'Long Flowing', symbol: '⌇' },
  { id: 'shaved', label: 'Shaved', symbol: '○' },
  { id: 'headwrap', label: 'Head Wrap', symbol: '◬' },
] as const;

const OUTFIT_STYLES = [
  { id: 'flowing_robes', label: 'Flowing Robes', description: 'Ethereal, draped garments' },
  { id: 'modern_elegant', label: 'Modern Elegant', description: 'Contemporary professional' },
  { id: 'sacred_warrior', label: 'Sacred Warrior', description: 'Armored, powerful' },
  { id: 'earth_mother', label: 'Earth Mother', description: 'Natural, grounded' },
  { id: 'celestial', label: 'Celestial', description: 'Cosmic, star-touched' },
  { id: 'professional', label: 'Professional', description: 'Clean, authoritative' },
] as const;

const ACCESSORIES = [
  { id: 'crown', label: 'Crown', symbol: '♔' },
  { id: 'circlet', label: 'Circlet', symbol: '◆' },
  { id: 'pendant', label: 'Pendant', symbol: '◉' },
  { id: 'arm_cuffs', label: 'Arm Cuffs', symbol: '⟨⟩' },
  { id: 'earrings', label: 'Earrings', symbol: '◊' },
  { id: 'nose_ring', label: 'Nose Ring', symbol: '◇' },
  { id: 'headwrap_accent', label: 'Headwrap Accent', symbol: '✦' },
] as const;

const FACE_GEOMETRY_SLIDERS = [
  { key: 'jawWidth' as const, label: 'Jaw Width', min: 'Narrow', max: 'Wide' },
  { key: 'cheekHeight' as const, label: 'Cheek Height', min: 'Low', max: 'High' },
  { key: 'noseWidth' as const, label: 'Nose Width', min: 'Narrow', max: 'Wide' },
  { key: 'lipFullness' as const, label: 'Lip Fullness', min: 'Thin', max: 'Full' },
  { key: 'eyeSize' as const, label: 'Eye Size', min: 'Small', max: 'Large' },
  { key: 'browArch' as const, label: 'Brow Arch', min: 'Flat', max: 'Arched' },
  { key: 'foreheadHeight' as const, label: 'Forehead Height', min: 'Low', max: 'High' },
  { key: 'chinShape' as const, label: 'Chin Shape', min: 'Pointed', max: 'Round' },
] as const;

const GOLD = '#D4AF37';
const CREAM = '#F5F1E6';
const DARK_BG = '#0a0a0a';
const DARK_PANEL = '#1a1a1a';
const BORDER_DARK = '#2a2a2a';

// Keyframe animations
const globalStyles = `
  @keyframes sacredRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  @keyframes floatParticle {
    0%, 100% { transform: translateY(0px); opacity: 0.3; }
    50% { transform: translateY(-20px); opacity: 0.7; }
  }
`;

interface LivePreviewProps {
  customization: AvatarCustomization;
  guideName: string;
  isAnimating: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({ customization, guideName, isAnimating }) => {
  const skinToneColor = SKIN_TONE_PALETTE.find(
    (tone) => tone.id === customization.skinTone
  )?.hex || '#C4A57B';

  const hairColorValue =
    customization.hairColorCustom ||
    (customization.hairColor === 'black'
      ? '#1a1a1a'
      : customization.hairColor === 'brown'
        ? '#654321'
        : customization.hairColor === 'auburn'
          ? '#8B4513'
          : customization.hairColor === 'blonde'
            ? '#FFD700'
            : customization.hairColor === 'silver'
              ? '#C0C0C0'
              : customization.hairColor === 'white'
                ? '#FFFFFF'
                : '#FFB6C1');

  const hairStyle = HAIR_STYLES.find((h) => h.id === customization.hairStyle);
  const outfitStyle = OUTFIT_STYLES.find((o) => o.id === customization.outfit);
  const ageRange = AGE_RANGES.find((a) => a.id === customization.ageRange);

  const previewContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '24px',
    padding: '40px 20px',
  };

  const portraitFrameStyle: React.CSSProperties = {
    position: 'relative',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `2px solid ${GOLD}`,
    boxShadow: `0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.1)`,
    animation: isAnimating ? `shimmer 0.6s ease-in-out` : 'none',
  };

  const portraitBackgroundStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${skinToneColor}dd 0%, ${skinToneColor} 100%)`,
  };

  const sacredBorderStyle: React.CSSProperties = {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    border: `1px solid ${GOLD}`,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: `sacredRotate 20s linear infinite`,
    opacity: 0.6,
  };

  const sacredBorder2Style: React.CSSProperties = {
    position: 'absolute',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    border: `1px solid ${GOLD}`,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: `sacredRotate 30s linear infinite reverse`,
    opacity: 0.3,
  };

  const portraitContentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: CREAM,
    textAlign: 'center',
    padding: '20px',
    gap: '8px',
  };

  const portraitTextStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.4',
    color: CREAM,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  };

  const particlesContainerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  };

  const particleStyle = (index: number): React.CSSProperties => ({
    position: 'absolute',
    width: '2px',
    height: '2px',
    borderRadius: '50%',
    backgroundColor: GOLD,
    opacity: 0.3,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animation: `floatParticle ${3 + index * 0.5}s ease-in-out infinite`,
    animationDelay: `${index * 0.2}s`,
  });

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
  };

  const guideNameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: CREAM,
  };

  const avatarLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: GOLD,
    opacity: 0.8,
  };

  return (
    <div style={previewContainerStyle}>
      <style>{globalStyles}</style>
      <div style={portraitFrameStyle}>
        <div style={portraitBackgroundStyle} />
        <div style={particlesContainerStyle}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={particleStyle(i)} />
          ))}
        </div>
        <div style={sacredBorderStyle} />
        <div style={sacredBorder2Style} />
        <div style={portraitContentStyle}>
          <div style={portraitTextStyle}>
            {hairStyle?.label} <span style={{ color: hairColorValue }}>■</span>
          </div>
          <div style={portraitTextStyle}>{customization.bodyType}</div>
          <div style={portraitTextStyle}>{ageRange?.label}</div>
          <div style={portraitTextStyle}>{outfitStyle?.label}</div>
          {customization.accessories && customization.accessories.length > 0 && (
            <div style={portraitTextStyle}>
              {customization.accessories.map((acc) => {
                const accessory = ACCESSORIES.find((a) => a.id === acc);
                return <span key={acc}>{accessory?.symbol} </span>;
              })}
            </div>
          )}
        </div>
      </div>
      <div style={labelContainerStyle}>
        <div style={guideNameStyle}>{guideName}</div>
        <div style={avatarLabelStyle}>Custom Avatar</div>
      </div>
    </div>
  );
};

interface SkinTonePickerProps {
  value: string;
  customHex?: string;
  onChange: (toneId: string) => void;
  onCustomChange: (hex: string) => void;
}

const SkinTonePicker: React.FC<SkinTonePickerProps> = ({
  value,
  customHex,
  onChange,
  onCustomChange,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  };

  const swatchStyle = (tone: (typeof SKIN_TONE_PALETTE)[0], isSelected: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: tone.hex,
    border: isSelected ? `3px solid ${GOLD}` : `2px solid ${BORDER_DARK}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isSelected ? `0 0 12px rgba(212, 175, 55, 0.4)` : 'none',
  });

  const customInputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const customInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: DARK_PANEL,
    border: `1px solid ${BORDER_DARK}`,
    color: CREAM,
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: CREAM,
    opacity: 0.7,
  };

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {SKIN_TONE_PALETTE.map((tone) => (
          <div
            key={tone.id}
            style={swatchStyle(tone, value === tone.id)}
            onClick={() => onChange(tone.id)}
            title={tone.name}
          />
        ))}
      </div>
      <div style={customInputContainerStyle}>
        <label style={labelStyle}>Custom:</label>
        <input
          type="color"
          value={customHex || '#C4A57B'}
          onChange={(e) => onCustomChange(e.target.value)}
          style={{
            width: '40px',
            height: '32px',
            border: `1px solid ${BORDER_DARK}`,
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        />
        <input
          type="text"
          value={customHex || ''}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="#hexcolor"
          style={customInputStyle}
        />
      </div>
    </div>
  );
};

interface ButtonGroupProps {
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ options, value, onChange }) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  };

  const buttonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    backgroundColor: isSelected ? GOLD : DARK_PANEL,
    color: isSelected ? '#000' : CREAM,
    border: `1px solid ${isSelected ? GOLD : BORDER_DARK}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isSelected ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={containerStyle}>
      {options.map((option) => (
        <button
          key={option.id}
          style={buttonStyle(value === option.id)}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

interface CardGridProps {
  children: React.ReactNode;
  columns?: number;
}

const CardGrid: React.FC<CardGridProps> = ({ children, columns = 3 }) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '12px',
  };

  return <div style={containerStyle}>{children}</div>;
};

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ selected, onClick, children }) => {
  const cardStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: selected ? `${GOLD}20` : DARK_PANEL,
    border: `2px solid ${selected ? GOLD : BORDER_DARK}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: CREAM,
    fontSize: '12px',
  };

  return (
    <div style={cardStyle} onClick={onClick}>
      {children}
    </div>
  );
};

interface AppearanceTabProps {
  customization: AvatarCustomization;
  onChange: (updates: Partial<AvatarCustomization>) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ customization, onChange }) => {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '28px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: GOLD,
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Skin Tone</div>
        <SkinTonePicker
          value={customization.skinTone}
          customHex={customization.skinToneCustom}
          onChange={(toneId) => onChange({ skinTone: toneId })}
          onCustomChange={(hex) => onChange({ skinToneCustom: hex })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Body Type</div>
        <CardGrid columns={2}>
          {BODY_TYPES.map((bt) => (
            <SelectableCard
              key={bt.id}
              selected={customization.bodyType === bt.id}
              onClick={() => onChange({ bodyType: bt.id })}
            >
              <div style={{ fontSize: '20px' }}>{bt.silhouette}</div>
              <div>{bt.label}</div>
            </SelectableCard>
          ))}
        </CardGrid>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Age Range</div>
        <ButtonGroup
          options={AGE_RANGES}
          value={customization.ageRange}
          onChange={(ageId) => onChange({ ageRange: ageId })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Eye Color</div>
        <CardGrid columns={4}>
          {EYE_COLORS.map((ec) => (
            <div
              key={ec.id}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: ec.hex,
                border:
                  customization.eyeColor === ec.id ? `3px solid ${GOLD}` : `2px solid ${BORDER_DARK}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onChange({ eyeColor: ec.id })}
              title={ec.label}
            />
          ))}
        </CardGrid>
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '12px', color: CREAM, opacity: 0.7 }}>Custom:</label>
          <input
            type="color"
            value={customization.eyeColorCustom || '#8B4513'}
            onChange={(e) => onChange({ eyeColorCustom: e.target.value })}
            style={{
              width: '40px',
              height: '32px',
              border: `1px solid ${BORDER_DARK}`,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface HairTabProps {
  customization: AvatarCustomization;
  onChange: (updates: Partial<AvatarCustomization>) => void;
}

const HairTab: React.FC<HairTabProps> = ({ customization, onChange }) => {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '28px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: GOLD,
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div>
      <div style={sectionStyle}>
        <div style={labelStyle}>Hair Style</div>
        <CardGrid columns={3}>
          {HAIR_STYLES.map((hs) => (
            <SelectableCard
              key={hs.id}
              selected={customization.hairStyle === hs.id}
              onClick={() => onChange({ hairStyle: hs.id })}
            >
              <div style={{ fontSize: '18px' }}>{hs.symbol}</div>
              <div>{hs.label}</div>
            </SelectableCard>
          ))}
        </CardGrid>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Hair Color</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {['black', 'brown', 'auburn', 'blonde', 'silver', 'white'].map((color) => {
            const colorMap: Record<string, string> = {
              black: '#1a1a1a',
              brown: '#654321',
              auburn: '#8B4513',
              blonde: '#FFD700',
              silver: '#C0C0C0',
              white: '#FFFFFF',
            };
            return (
              <button
                key={color}
                style={{
                  padding: '10px',
                  backgroundColor: `${colorMap[color]}40`,
                  border:
                    customization.hairColor === color ? `2px solid ${GOLD}` : `1px solid ${BORDER_DARK}`,
                  color: CREAM,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => onChange({ hairColor: color })}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '2px',
                    backgroundColor: colorMap[color],
                  }}
                />
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: '12px',
            backgroundColor: DARK_PANEL,
            border: `1px solid ${BORDER_DARK}`,
            borderRadius: '4px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '12px', color: CREAM, fontWeight: '500' }}>
            Unnatural (Creative):
          </label>
          <input
            type="color"
            value={customization.hairColorCustom || '#FF1493'}
            onChange={(e) => onChange({ hairColorCustom: e.target.value })}
            style={{
              width: '40px',
              height: '32px',
              border: `1px solid ${BORDER_DARK}`,
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface FaceTabProps {
  customization: AvatarCustomization;
  faceGeometry: FaceGeometry;
  onChange: (updates: Partial<AvatarCustomization>) => void;
  onGeometryChange: (geometry: Partial<FaceGeometry>) => void;
}

const FaceTab: React.FC<FaceTabProps> = ({
  customization,
  faceGeometry,
  onChange,
  onGeometryChange,
}) => {
  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  };

  const sliderGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const sliderLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: CREAM,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const sliderRangeStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: `linear-gradient(to right, ${BORDER_DARK}, ${GOLD}, ${BORDER_DARK})`,
    outline: 'none',
    accentColor: GOLD,
  };

  const resetButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: `1px solid ${BORDER_DARK}`,
    color: CREAM,
    borderRadius: '3px',
    fontSize: '10px',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'all 0.2s ease',
  };

  const handleReset = () => {
    onGeometryChange({
      jawWidth: 50,
      cheekHeight: 50,
      noseWidth: 50,
      lipFullness: 50,
      eyeSize: 50,
      browArch: 50,
      foreheadHeight: 50,
      chinShape: 50,
    });
  };

  return (
    <div>
      <div style={sectionStyle}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: GOLD,
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Face Geometry</span>
          <button style={resetButtonStyle} onClick={handleReset}>
            Reset All
          </button>
        </div>

        <div style={sliderContainerStyle}>
          {FACE_GEOMETRY_SLIDERS.map((slider) => (
            <div key={slider.key} style={sliderGroupStyle}>
              <div style={sliderLabelStyle}>
                <span>{slider.label}</span>
                <span style={{ color: GOLD, fontSize: '11px' }}>
                  {Math.round(faceGeometry[slider.key] || 50)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={faceGeometry[slider.key] || 50}
                onChange={(e) =>
                  onGeometryChange({
                    [slider.key]: parseInt(e.target.value, 10),
                  })
                }
                style={sliderRangeStyle}
              />
              <div
                style={{
                  fontSize: '10px',
                  color: CREAM,
                  opacity: 0.6,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{slider.min}</span>
                <span>{slider.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface OutfitTabProps {
  customization: AvatarCustomization;
  onChange: (updates: Partial<AvatarCustomization>) => void;
}

const OutfitTab: React.FC<OutfitTabProps> = ({ customization, onChange }) => {
  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: GOLD,
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div>
      <div style={labelStyle}>Outfit Style</div>
      <CardGrid columns={2}>
        {OUTFIT_STYLES.map((os) => (
          <SelectableCard
            key={os.id}
            selected={customization.outfit === os.id}
            onClick={() => onChange({ outfit: os.id })}
          >
            <div style={{ fontSize: '12px', fontWeight: '600' }}>{os.label}</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>{os.description}</div>
          </SelectableCard>
        ))}
      </CardGrid>
    </div>
  );
};

interface AccessoriesTabProps {
  customization: AvatarCustomization;
  onChange: (updates: Partial<AvatarCustomization>) => void;
}

const AccessoriesTab: React.FC<AccessoriesTabProps> = ({ customization, onChange }) => {
  const handleToggleAccessory = (accessoryId: string) => {
    const accessories = customization.accessories || [];
    const updated = accessories.includes(accessoryId)
      ? accessories.filter((a) => a !== accessoryId)
      : [...accessories, accessoryId];
    onChange({ accessories: updated });
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: GOLD,
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    backgroundColor: selected ? GOLD : DARK_PANEL,
    color: selected ? '#000' : CREAM,
    border: `1px solid ${selected ? GOLD : BORDER_DARK}`,
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: selected ? '600' : '400',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  return (
    <div>
      <div style={labelStyle}>Select Accessories</div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {ACCESSORIES.map((acc) => (
          <button
            key={acc.id}
            style={chipStyle((customization.accessories || []).includes(acc.id))}
            onClick={() => handleToggleAccessory(acc.id)}
          >
            <span>{acc.symbol}</span>
            <span>{acc.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  guideName,
  initialCustomization,
  onSave,
  onCancel,
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [customization, setCustomization] = useState<AvatarCustomization>(
    initialCustomization as AvatarCustomization || {
      skinTone: 'medium',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: 'brown',
      hairStyle: 'natural_coils',
      hairColor: 'black',
      outfit: 'flowing_robes',
      accessories: [],
      faceGeometry: {
        jawWidth: 50,
        cheekHeight: 50,
        noseWidth: 50,
        lipFullness: 50,
        eyeSize: 50,
        browArch: 50,
        foreheadHeight: 50,
        chinShape: 50,
      },
    }
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometry>(
    customization.faceGeometry || {
      jawWidth: 50,
      cheekHeight: 50,
      noseWidth: 50,
      lipFullness: 50,
      eyeSize: 50,
      browArch: 50,
      foreheadHeight: 50,
      chinShape: 50,
    }
  );

  const handleCustomizationChange = useCallback((updates: Partial<AvatarCustomization>) => {
    setIsAnimating(true);
    setCustomization((prev) => ({ ...prev, ...updates }));
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  const handleGeometryChange = useCallback((updates: Partial<FaceGeometry>) => {
    setIsAnimating(true);
    setFaceGeometry((prev) => ({ ...prev, ...updates }));
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  const handleSave = () => {
    const fullCustomization: AvatarCustomization = {
      ...customization,
      faceGeometry,
    };
    const validation = SafetyValidator.validateCustomization(fullCustomization);
    if (validation.isValid) {
      onSave(fullCustomization);
    }
  };

  const validation = useMemo(
    () =>
      SafetyValidator.validateCustomization({
        ...customization,
        faceGeometry,
      }),
    [customization, faceGeometry]
  );

  if (!isOpen) return null;

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const modalContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '95vw',
    maxWidth: '1600px',
    height: '90vh',
    backgroundColor: DARK_BG,
    border: `1px solid ${BORDER_DARK}`,
    borderRadius: '12px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: `0 0 40px rgba(212, 175, 55, 0.1)`,
  };

  const leftPanelStyle: React.CSSProperties = {
    flex: '0 0 40%',
    backgroundColor: DARK_PANEL,
    borderRight: `1px solid ${BORDER_DARK}`,
    padding: '40px 20px',
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
  };

  const rightPanelStyle: React.CSSProperties = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: DARK_BG,
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${BORDER_DARK}`,
    backgroundColor: DARK_PANEL,
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '14px 16px',
    backgroundColor: isActive ? `${GOLD}10` : 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${GOLD}` : 'none',
    color: isActive ? GOLD : CREAM,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  };

  const bottomBarStyle: React.CSSProperties = {
    borderTop: `1px solid ${BORDER_DARK}`,
    backgroundColor: DARK_PANEL,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  };

  const validationMessageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: validation.isValid ? '#4CAF50' : '#FF6B6B',
  };

  const buttonGroupBottomStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const buttonStyle = (variant: 'primary' | 'ghost' | 'subtle'): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };

    if (variant === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: GOLD,
        color: '#000',
      };
    }

    if (variant === 'ghost') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        color: GOLD,
        border: `1px solid ${GOLD}`,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: CREAM,
      opacity: 0.6,
    };
  };

  return (
    <div style={modalOverlayStyle} onClick={onCancel}>
      <style>{globalStyles}</style>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={leftPanelStyle}>
          <LivePreview
            customization={{ ...customization, faceGeometry }}
            guideName={guideName}
            isAnimating={isAnimating}
          />
        </div>

        <div style={rightPanelStyle}>
          <div style={tabBarStyle}>
            {(['appearance', 'hair', 'face', 'outfit', 'accessories'] as const).map((tab) => (
              <button
                key={tab}
                style={tabButtonStyle(activeTab === tab)}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={contentStyle}>
            {activeTab === 'appearance' && (
              <AppearanceTab customization={customization} onChange={handleCustomizationChange} />
            )}
            {activeTab === 'hair' && (
              <HairTab customization={customization} onChange={handleCustomizationChange} />
            )}
            {activeTab === 'face' && (
              <FaceTab
                customization={customization}
                faceGeometry={faceGeometry}
                onChange={handleCustomizationChange}
                onGeometryChange={handleGeometryChange}
              />
            )}
            {activeTab === 'outfit' && (
              <OutfitTab customization={customization} onChange={handleCustomizationChange} />
            )}
            {activeTab === 'accessories' && (
              <AccessoriesTab customization={customization} onChange={handleCustomizationChange} />
            )}
          </div>

          <div style={bottomBarStyle}>
            <div style={validationMessageStyle}>
              {validation.isValid ? (
                <>
                  <span>✓</span>
                  <span>Avatar ready to save</span>
                </>
              ) : (
                <>
                  <span>⚠</span>
                  <span>{validation.message}</span>
                </>
              )}
            </div>

            <div style={buttonGroupBottomStyle}>
              <button
                style={buttonStyle('ghost')}
                onClick={() => {
                  setCustomization(initialCustomization as AvatarCustomization || {
                    skinTone: 'medium',
                    bodyType: 'curvy',
                    ageRange: 'adult_30s',
                    eyeColor: 'brown',
                    hairStyle: 'natural_coils',
                    hairColor: 'black',
                    outfit: 'flowing_robes',
                    accessories: [],
                    faceGeometry: {
                      jawWidth: 50,
                      cheekHeight: 50,
                      noseWidth: 50,
                      lipFullness: 50,
                      eyeSize: 50,
                      browArch: 50,
                      foreheadHeight: 50,
                      chinShape: 50,
                    },
                  });
                  setFaceGeometry({
                    jawWidth: 50,
                    cheekHeight: 50,
                    noseWidth: 50,
                    lipFullness: 50,
                    eyeSize: 50,
                    browArch: 50,
                    foreheadHeight: 50,
                    chinShape: 50,
                  });
                }}
              >
                Reset to Default
              </button>
              <button style={buttonStyle('subtle')} onClick={onCancel}>
                Cancel
              </button>
              <button
                style={buttonStyle('primary')}
                onClick={handleSave}
                disabled={!validation.isValid}
              >
                Save Avatar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
