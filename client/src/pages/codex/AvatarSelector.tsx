import React, { useState, useMemo, useCallback } from 'react';
import {
  AVATAR_PRESETS,
  getPresetsForGuide,
  getDefaultPreset,
  SKIN_TONE_PALETTE,
  type AvatarPreset,
  type AvatarCustomization
} from './AvatarSystem';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AvatarSelectorProps {
  currentGuide: string;
  currentAvatarId: string;
  onSelectAvatar: (presetId: string) => void;
  onOpenCustomizer: () => void;
  onClose: () => void;
  isOpen: boolean;
}

interface AvatarSettingsButtonProps {
  onClick: () => void;
  currentAvatarName: string;
  skinToneColor: string;
}

interface DiversityFilters {
  skinTone: string;
  bodyType: string;
  hairStyle: string;
  ageRange: string;
}

// ============================================================================
// DIVERSITY FILTER COMPONENT
// ============================================================================

const DiversityFilter: React.FC<{
  filters: DiversityFilters;
  onFilterChange: (key: keyof DiversityFilters, value: string) => void;
}> = ({ filters, onFilterChange }) => {
  const filterOptions = {
    skinTone: ['All', 'Light', 'Medium', 'Dark'],
    bodyType: ['All', 'Slim', 'Athletic', 'Curvy', 'Plus Size'],
    hairStyle: ['All', 'Natural Texture', 'Straight/Wavy', 'Short', 'Long'],
    ageRange: ['All', '20s', '30s', '40s', '50+']
  };

  const baseStyles = {
    filterRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    } as React.CSSProperties,
    filterLabel: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '14px',
      color: '#D4AF37',
      minWidth: '90px',
      fontWeight: 600
    } as React.CSSProperties,
    chipContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    } as React.CSSProperties,
    chip: (isActive: boolean) => ({
      padding: '6px 12px',
      border: `1px solid #D4AF37`,
      backgroundColor: isActive ? '#D4AF37' : 'transparent',
      color: isActive ? '#0A0A0A' : '#D4AF37',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      fontWeight: 500
    } as React.CSSProperties)
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={baseStyles.filterRow}>
        <div style={baseStyles.filterLabel}>Skin Tone</div>
        <div style={baseStyles.chipContainer}>
          {filterOptions.skinTone.map((option) => (
            <button
              key={option}
              style={baseStyles.chip(filters.skinTone === option)}
              onClick={() => onFilterChange('skinTone', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={baseStyles.filterRow}>
        <div style={baseStyles.filterLabel}>Body Type</div>
        <div style={baseStyles.chipContainer}>
          {filterOptions.bodyType.map((option) => (
            <button
              key={option}
              style={baseStyles.chip(filters.bodyType === option)}
              onClick={() => onFilterChange('bodyType', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={baseStyles.filterRow}>
        <div style={baseStyles.filterLabel}>Hair</div>
        <div style={baseStyles.chipContainer}>
          {filterOptions.hairStyle.map((option) => (
            <button
              key={option}
              style={baseStyles.chip(filters.hairStyle === option)}
              onClick={() => onFilterChange('hairStyle', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={baseStyles.filterRow}>
        <div style={baseStyles.filterLabel}>Age Range</div>
        <div style={baseStyles.chipContainer}>
          {filterOptions.ageRange.map((option) => (
            <button
              key={option}
              style={baseStyles.chip(filters.ageRange === option)}
              onClick={() => onFilterChange('ageRange', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AVATAR PLACEHOLDER COMPONENT
// ============================================================================

const AvatarPlaceholder: React.FC<{ preset: AvatarPreset }> = ({ preset }) => {
  const skinToneColor = SKIN_TONE_PALETTE[preset.skinTone] || '#D4B896';

  const styles = {
    container: {
      width: '100%',
      height: '200px',
      background: `linear-gradient(135deg, ${skinToneColor}22 0%, ${skinToneColor}44 100%)`,
      border: `1px solid ${skinToneColor}66`,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    silhouette: {
      width: '80px',
      height: '120px',
      background: `linear-gradient(135deg, ${skinToneColor} 0%, ${skinToneColor}cc 100%)`,
      borderRadius: '50% 50% 40% 40%',
      position: 'relative' as const,
      boxShadow: `0 4px 16px ${skinToneColor}33`
    },
    hairElement: {
      position: 'absolute' as const,
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90px',
      height: '45px',
      background: '#3A3A3A',
      borderRadius: '50% 50% 40% 40%',
      boxShadow: `inset 0 2px 8px rgba(0,0,0,0.5)`
    },
    skinToneSwatch: {
      position: 'absolute' as const,
      bottom: '8px',
      right: '8px',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: skinToneColor,
      border: '2px solid #D4AF37',
      boxShadow: `0 2px 8px rgba(0,0,0,0.4)`
    },
    metadataOverlay: {
      position: 'absolute' as const,
      bottom: '8px',
      left: '8px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      fontSize: '10px',
      color: '#F5F1E6',
      fontFamily: 'Inter, sans-serif',
      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      fontWeight: 500
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.silhouette}>
        <div style={styles.hairElement} />
      </div>
      <div style={styles.skinToneSwatch} />
      <div style={styles.metadataOverlay}>
        <div>{preset.hairStyle}</div>
        <div>{preset.bodyType}</div>
      </div>
    </div>
  );
};

// ============================================================================
// AVATAR PRESET CARD COMPONENT
// ============================================================================

const AvatarPresetCard: React.FC<{
  preset: AvatarPreset;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}> = ({ preset, isSelected, onSelect, onPreview }) => {
  const skinToneColor = SKIN_TONE_PALETTE[preset.skinTone] || '#D4B896';

  const styles = {
    card: {
      width: '280px',
      background: 'rgba(15, 15, 15, 0.8)',
      border: isSelected ? `2px solid #D4AF37` : `1px solid #D4AF37`,
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
      boxShadow: isSelected
        ? `0 0 24px #D4AF3744, 0 8px 24px rgba(0,0,0,0.6)`
        : `0 4px 12px rgba(0,0,0,0.4)`
    } as React.CSSProperties,
    portraitArea: {
      height: '200px',
      position: 'relative' as const,
      background: 'rgba(10, 10, 10, 0.6)'
    },
    checkmark: {
      position: 'absolute' as const,
      top: '8px',
      right: '8px',
      width: '24px',
      height: '24px',
      background: '#D4AF37',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0A0A0A',
      fontWeight: 'bold',
      fontSize: '14px',
      opacity: isSelected ? 1 : 0,
      transition: 'opacity 0.2s ease'
    } as React.CSSProperties,
    contentArea: {
      padding: '16px',
      borderTop: `1px solid #D4AF3722`
    },
    name: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '18px',
      color: '#F5F1E6',
      marginBottom: '12px',
      fontWeight: 600
    } as React.CSSProperties,
    badgeContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      marginBottom: '16px'
    } as React.CSSProperties,
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#D4AF37',
      fontFamily: 'Inter, sans-serif'
    } as React.CSSProperties,
    badgeCircle: (color: string) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: color,
      border: '1px solid #D4AF37'
    } as React.CSSProperties),
    buttonContainer: {
      display: 'flex',
      gap: '8px'
    } as React.CSSProperties,
    button: (isPrimary: boolean) => ({
      flex: 1,
      padding: '10px 12px',
      border: `1px solid #D4AF37`,
      backgroundColor: isPrimary ? '#D4AF37' : 'transparent',
      color: isPrimary ? '#0A0A0A' : '#D4AF37',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    } as React.CSSProperties)
  };

  const getSkinToneLabel = (tone: string) => {
    const toneMap: Record<string, string> = {
      light: 'Light',
      medium: 'Medium',
      dark: 'Dark',
      deepDark: 'Deep Dark'
    };
    return toneMap[tone] || tone;
  };

  return (
    <div style={styles.card}>
      <div style={styles.portraitArea}>
        <AvatarPlaceholder preset={preset} />
        {isSelected && <div style={styles.checkmark}>✓</div>}
      </div>

      <div style={styles.contentArea}>
        <div style={styles.name}>{preset.name}</div>

        <div style={styles.badgeContainer}>
          <div style={styles.badge}>
            <div style={styles.badgeCircle(skinToneColor)} />
            <span>{getSkinToneLabel(preset.skinTone)}</span>
          </div>
          <div style={styles.badge}>
            <div style={styles.badgeCircle('#C9A876')} />
            <span>{preset.bodyType}</span>
          </div>
          <div style={styles.badge}>
            <div style={styles.badgeCircle('#8B7355')} />
            <span>{preset.hairStyle}</span>
          </div>
          <div style={styles.badge}>
            <div style={styles.badgeCircle('#9D7E8A')} />
            <span>{preset.ageRange}</span>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button
            style={styles.button(true)}
            onClick={onSelect}
          >
            Select
          </button>
          <button
            style={styles.button(false)}
            onClick={onPreview}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN AVATAR SELECTOR COMPONENT
// ============================================================================

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentGuide,
  currentAvatarId,
  onSelectAvatar,
  onOpenCustomizer,
  onClose,
  isOpen
}) => {
  const [filters, setFilters] = useState<DiversityFilters>({
    skinTone: 'All',
    bodyType: 'All',
    hairStyle: 'All',
    ageRange: 'All'
  });

  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');

  // Get recommended presets for this guide
  const recommendedPresets = useMemo(() => {
    return getPresetsForGuide(currentGuide).slice(0, 4);
  }, [currentGuide]);

  // Filter all presets based on selected filters
  const allPresets = useMemo(() => {
    return AVATAR_PRESETS.filter((preset) => {
      if (filters.skinTone !== 'All' && preset.skinTone !== filters.skinTone.toLowerCase().replace(' ', '')) {
        return false;
      }
      if (filters.bodyType !== 'All' && preset.bodyType !== filters.bodyType.toLowerCase().replace(' ', '')) {
        return false;
      }
      if (filters.hairStyle !== 'All' && preset.hairStyle !== filters.hairStyle.toLowerCase().replace(' ', '')) {
        return false;
      }
      if (filters.ageRange !== 'All' && preset.ageRange !== filters.ageRange.replace('+', '')) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleFilterChange = useCallback((key: keyof DiversityFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const guideName = currentGuide || 'Your Guide';

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    },
    panel: {
      background: 'rgba(10, 10, 10, 0.95)',
      border: '1px solid #D4AF37',
      borderRadius: '8px',
      maxWidth: '1000px',
      maxHeight: '85vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: `0 0 40px rgba(212, 175, 55, 0.2), 0 8px 32px rgba(0, 0, 0, 0.8)`
    },
    header: {
      padding: '32px',
      borderBottom: '1px solid #D4AF3722',
      position: 'sticky' as const,
      top: 0,
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(4px)',
      zIndex: 1
    },
    headerTitle: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '32px',
      color: '#F5F1E6',
      marginBottom: '4px',
      fontWeight: 600
    } as React.CSSProperties,
    headerSubtitle: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#D4AF37',
      marginBottom: '16px'
    } as React.CSSProperties,
    closeButton: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      width: '32px',
      height: '32px',
      background: 'transparent',
      border: '1px solid #D4AF37',
      color: '#D4AF37',
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    } as React.CSSProperties,
    content: {
      flex: 1,
      overflow: 'auto' as const,
      padding: '32px'
    },
    section: {
      marginBottom: '48px'
    } as React.CSSProperties,
    sectionTitle: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '24px',
      color: '#F5F1E6',
      marginBottom: '24px',
      fontWeight: 600
    } as React.CSSProperties,
    tabContainer: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      borderBottom: '1px solid #D4AF3722',
      paddingBottom: '12px'
    } as React.CSSProperties,
    tab: (isActive: boolean) => ({
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: isActive ? '#D4AF37' : '#A08959',
      cursor: 'pointer',
      padding: '8px 0',
      borderBottom: isActive ? '2px solid #D4AF37' : 'none',
      background: 'transparent',
      border: 'none',
      fontWeight: 600,
      transition: 'all 0.2s ease'
    } as React.CSSProperties),
    presetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    } as React.CSSProperties,
    footer: {
      padding: '32px',
      borderTop: '1px solid #D4AF3722',
      background: 'rgba(10, 10, 10, 0.95)',
      display: 'flex',
      gap: '16px',
      justifyContent: 'center'
    },
    customButton: {
      padding: '14px 32px',
      border: '2px solid #D4AF37',
      backgroundColor: 'transparent',
      color: '#D4AF37',
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    } as React.CSSProperties,
    emptyState: {
      textAlign: 'center' as const,
      padding: '48px 32px',
      color: '#A08959',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px'
    } as React.CSSProperties
  };

  const presetsToDisplay = activeTab === 'recommended' ? recommendedPresets : allPresets;

  return (
    <div style={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
          <div style={styles.headerTitle}>Choose Your Guide's Appearance</div>
          <div style={styles.headerSubtitle}>
            Select how {guideName} appears to you
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Recommended Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recommended for {guideName}</div>
            <div style={styles.presetGrid}>
              {recommendedPresets.map((preset) => (
                <AvatarPresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={preset.id === currentAvatarId}
                  onSelect={() => onSelectAvatar(preset.id)}
                  onPreview={() => {
                    onSelectAvatar(preset.id);
                  }}
                />
              ))}
            </div>
          </div>

          {/* All Avatars Section */}
          <div style={styles.section}>
            <div style={{ ...styles.sectionTitle, marginBottom: '16px' }}>All Avatars</div>

            {/* Tabs */}
            <div style={styles.tabContainer}>
              <button
                style={styles.tab(activeTab === 'recommended')}
                onClick={() => setActiveTab('recommended')}
              >
                Recommended
              </button>
              <button
                style={styles.tab(activeTab === 'all')}
                onClick={() => setActiveTab('all')}
              >
                Browse All
              </button>
            </div>

            {/* Filters - only show in "all" tab */}
            {activeTab === 'all' && (
              <DiversityFilter filters={filters} onFilterChange={handleFilterChange} />
            )}

            {/* Grid */}
            {presetsToDisplay.length > 0 ? (
              <div style={styles.presetGrid}>
                {presetsToDisplay.map((preset) => (
                  <AvatarPresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={preset.id === currentAvatarId}
                    onSelect={() => onSelectAvatar(preset.id)}
                    onPreview={() => {
                      onSelectAvatar(preset.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                No avatars match your filters. Try adjusting your selections.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={{
              ...styles.customButton,
              backgroundColor: '#D4AF37',
              color: '#0A0A0A'
            }}
            onClick={onOpenCustomizer}
          >
            Create Custom Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AVATAR SETTINGS BUTTON COMPONENT
// ============================================================================

const AvatarSettingsButton: React.FC<AvatarSettingsButtonProps> = ({
  onClick,
  currentAvatarName,
  skinToneColor
}) => {
  const styles = {
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: 'transparent',
      border: '1px solid #D4AF37',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#D4AF37',
      fontWeight: 500
    } as React.CSSProperties,
    miniPortrait: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${skinToneColor} 0%, ${skinToneColor}88 100%)`,
      border: '1px solid #D4AF37',
      flexShrink: 0
    } as React.CSSProperties,
    label: {
      display: 'inline'
    } as React.CSSProperties
  };

  return (
    <button
      style={styles.button}
      onClick={onClick}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLButtonElement;
        target.style.borderColor = '#E5C158';
        target.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.3)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLButtonElement;
        target.style.borderColor = '#D4AF37';
        target.style.boxShadow = 'none';
      }}
    >
      <div style={styles.miniPortrait} />
      <span style={styles.label}>{currentAvatarName}</span>
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AvatarSelector;
export { AvatarSelector, AvatarSettingsButton };
