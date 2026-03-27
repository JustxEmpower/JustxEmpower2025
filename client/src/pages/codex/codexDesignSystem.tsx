import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// DESIGN TOKENS - CSS CUSTOM PROPERTIES
// ============================================================================

export const designTokens = `
:root {
  /* Colors - Warm Earth Palette (aligned with --cx-* tokens) */
  --lc-rose: #B87B65;
  --lc-rose-light: #C99080;
  --lc-gold: #B8976A;
  --lc-gold-light: #CAAA7E;
  --lc-ivory: #F6F1EB;
  --lc-cream: #ECE4DA;
  --lc-charcoal: #221E1A;
  --lc-warm-gray: #9C8E80;
  --lc-sage: #7D8E7F;
  --lc-indigo: #3C3489;
  --lc-void: #221E1A;

  /* Glass - Glassmorphism Effects */
  --lc-glass-bg: rgba(255, 255, 255, 0.28);
  --lc-glass-border: rgba(255, 255, 255, 0.52);
  --lc-glass-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(0,0,0,0.03);
  --lc-glass-blur: blur(18px);

  /* Glass Void - Deeper glassmorphism */
  --lc-glass-void-bg: rgba(236, 228, 218, 0.45);
  --lc-glass-void-border: rgba(184, 123, 101, 0.1);
  --lc-glass-void-shadow: 0 4px 16px rgba(0,0,0,0.03);

  /* Typography */
  --lc-font-display: 'Cormorant Garamond', Georgia, serif;
  --lc-font-body: 'DM Sans', system-ui, sans-serif;
  --lc-font-mono: 'JetBrains Mono', monospace;

  /* Spacing - 4px base unit */
  --lc-space-xs: 4px;
  --lc-space-sm: 8px;
  --lc-space-md: 16px;
  --lc-space-lg: 24px;
  --lc-space-xl: 32px;
  --lc-space-2xl: 48px;
  --lc-space-3xl: 64px;

  /* Border Radius */
  --lc-radius-sm: 8px;
  --lc-radius-md: 12px;
  --lc-radius-lg: 16px;
  --lc-radius-xl: 24px;
  --lc-radius-full: 9999px;

  /* Transitions - Refined motion */
  --lc-transition-fast: 150ms ease;
  --lc-transition-normal: 300ms ease;
  --lc-transition-slow: 500ms ease;
  --lc-transition-sacred: 800ms cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: var(--lc-font-body);
  color: var(--lc-charcoal);
  background-color: #F6F1EB;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Selection styling */
::selection {
  background-color: var(--lc-rose);
  color: #fff;
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--lc-gold);
  outline-offset: 2px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--lc-warm-gray);
  border-radius: var(--lc-radius-full);
  transition: background-color var(--lc-transition-normal);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--lc-charcoal);
}
`;

// ============================================================================
// INJECT TOKENS - Called on component mount
// ============================================================================

export function injectDesignTokens() {
  if (typeof document === 'undefined') return;

  const styleId = 'lc-design-tokens';
  if (document.getElementById(styleId)) return; // Already injected

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = designTokens;
  document.head.appendChild(style);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

const phaseColors: Record<string, string> = {
  shadow: '#221E1A',
  threshold: '#7D8E7F',
  gift: '#B8976A',
  void: '#221E1A',
  genesis: '#B87B65',
  crystallization: '#3C3489',
};

// ============================================================================
// COMPONENT: GlassCard
// ============================================================================

interface GlassCardProps {
  variant?: 'default' | 'elevated' | 'sacred' | 'void';
  glow?: boolean;
  glowColor?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function GlassCard({
  variant = 'default',
  glow = false,
  glowColor = '#C4A265',
  padding = 'md',
  onClick,
  className = '',
  children,
}: GlassCardProps) {
  const paddingMap = {
    sm: '8px',
    md: '16px',
    lg: '24px',
  };

  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--lc-glass-bg)',
      border: '1px solid var(--lc-glass-border)',
      boxShadow: 'var(--lc-glass-shadow)',
      backdropFilter: 'var(--lc-glass-blur)',
    },
    elevated: {
      background: 'var(--lc-glass-bg)',
      border: '1px solid var(--lc-gold)',
      boxShadow: glow
        ? `var(--lc-glass-shadow), 0 0 32px ${glowColor}33`
        : 'var(--lc-glass-shadow)',
      backdropFilter: 'var(--lc-glass-blur)',
    },
    sacred: {
      background: 'rgba(255, 251, 247, 0.85)',
      border: '1px solid var(--lc-gold)',
      boxShadow: glow
        ? `0 8px 32px rgba(0, 0, 0, 0.12), 0 0 48px ${glowColor}40`
        : '0 8px 32px rgba(0, 0, 0, 0.12)',
      backdropFilter: 'blur(30px)',
    },
    void: {
      background: 'var(--lc-glass-void-bg)',
      border: '1px solid var(--lc-glass-void-border)',
      boxShadow: glow
        ? `var(--lc-glass-void-shadow), 0 0 32px ${glowColor}20`
        : 'var(--lc-glass-void-shadow)',
      backdropFilter: 'var(--lc-glass-blur)',
    },
  };

  return (
    <div
      onClick={onClick}
      className={cn('lc-glass-card', className)}
      style={{
        borderRadius: 'var(--lc-radius-lg)',
        padding: paddingMap[padding],
        transition: `all var(--lc-transition-normal)`,
        cursor: onClick ? 'pointer' : 'default',
        ...styles[variant],
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENT: SacredText
// ============================================================================

interface SacredTextProps {
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'invocation';
  color?: string;
  phase?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function SacredText({
  variant = 'body',
  color,
  phase,
  className = '',
  children,
}: SacredTextProps) {
  const finalColor = color || phase ? phaseColors[phase || ''] || color : undefined;

  const styles: Record<string, React.CSSProperties> = {
    display: {
      fontFamily: 'var(--lc-font-display)',
      fontSize: '36px',
      fontWeight: 400,
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    heading: {
      fontFamily: 'var(--lc-font-display)',
      fontSize: '28px',
      fontWeight: 400,
      letterSpacing: '-0.3px',
      lineHeight: 1.3,
    },
    subheading: {
      fontFamily: 'var(--lc-font-display)',
      fontSize: '20px',
      fontWeight: 400,
      letterSpacing: '-0.2px',
      lineHeight: 1.4,
    },
    body: {
      fontFamily: 'var(--lc-font-body)',
      fontSize: '16px',
      fontWeight: 400,
      letterSpacing: '0px',
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: 'var(--lc-font-body)',
      fontSize: '12px',
      fontWeight: 400,
      letterSpacing: '0.5px',
      lineHeight: 1.5,
      color: 'var(--lc-warm-gray)',
    },
    invocation: {
      fontFamily: 'var(--lc-font-display)',
      fontSize: '18px',
      fontWeight: 400,
      fontStyle: 'italic',
      color: 'var(--lc-rose)',
      letterSpacing: '0.2px',
      lineHeight: 1.5,
    },
  };

  return (
    <div
      className={cn('lc-sacred-text', className)}
      style={{
        ...styles[variant],
        color: finalColor || 'inherit',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENT: PhaseIndicator
// ============================================================================

interface PhaseIndicatorProps {
  phase: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

export function PhaseIndicator({
  phase,
  size = 'md',
  animated = true,
  showLabel = true,
}: PhaseIndicatorProps) {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 56,
  };

  const phaseColor = phaseColors[phase] || '#C4A265';
  const diameter = sizeMap[size];

  useEffect(() => {
    if (!animated) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes breathing {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .lc-phase-indicator.animated {
        animation: breathing 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [animated]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        className={cn('lc-phase-indicator', animated && 'animated')}
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          backgroundColor: phaseColor,
          boxShadow: `0 0 24px ${phaseColor}40`,
          transition: 'all var(--lc-transition-normal)',
        }}
      />
      {showLabel && (
        <SacredText variant="caption" style={{ marginTop: '4px' }}>
          {phase.charAt(0).toUpperCase() + phase.slice(1)}
        </SacredText>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: ArchetypeSymbol
// ============================================================================

interface ArchetypeSymbolProps {
  archetype: string;
  size?: number;
  glowing?: boolean;
}

const archetypeSymbols: Record<string, string> = {
  hero: '⚔',
  shadow: '◐',
  sage: '◯',
  lover: '♡',
  guide: '✦',
  threshold: '◈',
  genesis: '✧',
};

export function ArchetypeSymbol({
  archetype,
  size = 32,
  glowing = false,
}: ArchetypeSymbolProps) {
  const symbol = archetypeSymbols[archetype] || '✦';
  const color = phaseColors[archetype] || 'var(--lc-gold)';

  return (
    <div
      style={{
        fontSize: size,
        color,
        textShadow: glowing ? `0 0 16px ${color}60` : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--lc-transition-normal)',
      }}
    >
      {symbol}
    </div>
  );
}

// ============================================================================
// COMPONENT: SpectrumBar
// ============================================================================

interface SpectrumBarProps {
  shadow: number;
  threshold: number;
  gift: number;
  animated?: boolean;
  height?: number;
}

export function SpectrumBar({
  shadow,
  threshold,
  gift,
  animated = true,
  height = 8,
}: SpectrumBarProps) {
  const total = shadow + threshold + gift || 1;
  const shadowPercent = (shadow / total) * 100;
  const thresholdPercent = (threshold / total) * 100;
  const giftPercent = (gift / total) * 100;

  useEffect(() => {
    if (!animated) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      .lc-spectrum-bar.animated {
        animation: shimmer 3s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [animated]);

  return (
    <div
      className={cn('lc-spectrum-bar', animated && 'animated')}
      style={{
        display: 'flex',
        height: `${height}px`,
        borderRadius: 'var(--lc-radius-full)',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backgroundSize: '200% 100%',
      }}
    >
      <div
        style={{
          width: `${shadowPercent}%`,
          backgroundColor: '#221E1A',
          transition: 'width var(--lc-transition-normal)',
        }}
      />
      <div
        style={{
          width: `${thresholdPercent}%`,
          backgroundColor: '#7D8E7F',
          transition: 'width var(--lc-transition-normal)',
        }}
      />
      <div
        style={{
          width: `${giftPercent}%`,
          backgroundColor: '#B8976A',
          transition: 'width var(--lc-transition-normal)',
        }}
      />
    </div>
  );
}

// ============================================================================
// COMPONENT: ProgressRing
// ============================================================================

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 4,
  color = '#C4A265',
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E0D8"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset var(--lc-transition-normal)',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, color }}>
            {Math.round(percent)}%
          </div>
        </div>
      </div>
      {label && <SacredText variant="caption">{label}</SacredText>}
    </div>
  );
}

// ============================================================================
// COMPONENT: IconButton
// ============================================================================

interface IconButtonProps {
  icon: React.ReactNode;
  variant?: 'ghost' | 'glass' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  title,
}: IconButtonProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const styles: Record<string, React.CSSProperties> = {
    ghost: {
      background: 'transparent',
      border: 'none',
      color: 'var(--lc-charcoal)',
    },
    glass: {
      background: 'var(--lc-glass-bg)',
      border: '1px solid var(--lc-glass-border)',
      backdropFilter: 'var(--lc-glass-blur)',
      color: 'var(--lc-charcoal)',
    },
    solid: {
      background: 'var(--lc-gold)',
      border: 'none',
      color: 'var(--lc-ivory)',
    },
  };

  return (
    <button
      className={cn('lc-icon-button', className)}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: 'var(--lc-radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all var(--lc-transition-fast)`,
        fontSize: size === 'sm' ? '18px' : size === 'md' ? '20px' : '24px',
        ...styles[variant],
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// COMPONENT: TextInput
// ============================================================================

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'sacred';
  disabled?: boolean;
  type?: string;
}

export function TextInput({
  label,
  placeholder,
  value,
  onChange,
  variant = 'default',
  disabled = false,
  type = 'text',
}: TextInputProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--lc-glass-bg)',
      borderColor: 'var(--lc-glass-border)',
      color: 'var(--lc-charcoal)',
    },
    sacred: {
      background: 'rgba(255, 251, 247, 0.9)',
      borderColor: 'var(--lc-gold)',
      color: 'var(--lc-charcoal)',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && <SacredText variant="body" style={{ fontWeight: 500 }}>{label}</SacredText>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        style={{
          padding: '12px 16px',
          fontSize: '16px',
          fontFamily: 'var(--lc-font-body)',
          border: '1px solid',
          borderRadius: 'var(--lc-radius-md)',
          transition: `all var(--lc-transition-fast)`,
          backdropFilter: 'var(--lc-glass-blur)',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
          ...styles[variant],
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 12px rgba(196, 162, 107, 0.2)';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ============================================================================
// COMPONENT: CodexButton
// ============================================================================

interface CodexButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'sacred';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: React.ReactNode;
}

export function CodexButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  children,
}: CodexButtonProps) {
  const sizeMap = {
    sm: { padding: '8px 16px', fontSize: '14px' },
    md: { padding: '12px 24px', fontSize: '16px' },
    lg: { padding: '16px 32px', fontSize: '18px' },
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #B87B65 0%, #B8976A 100%)',
      border: 'none',
      color: '#fff',
    },
    secondary: {
      background: 'transparent',
      border: '1px solid var(--lc-charcoal)',
      color: 'var(--lc-charcoal)',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      color: 'var(--lc-charcoal)',
    },
    sacred: {
      background: 'linear-gradient(135deg, #B8976A 0%, #CAAA7E 100%)',
      border: 'none',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    },
  };

  useEffect(() => {
    if (variant !== 'sacred') return;
    const style = document.createElement('style');
    style.textContent = `
      .lc-button.sacred::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
        animation: shimmer-button 3s infinite;
      }
      @keyframes shimmer-button {
        0% { transform: translate(-100%, -100%) rotate(45deg); }
        100% { transform: translate(100%, 100%) rotate(45deg); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [variant]);

  return (
    <button
      className={cn('lc-button', variant, className)}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...sizeMap[size],
        borderRadius: 'var(--lc-radius-md)',
        fontFamily: 'var(--lc-font-body)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: `all var(--lc-transition-normal)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...styles[variant],
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {loading ? (
        <>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================================================
// COMPONENT: Modal
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  children?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}: ModalProps) {
  if (!isOpen) return null;

  const sizeMap = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    fullscreen: '95vw',
  };

  useEffect(() => {
    if (!isOpen) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modal-enter {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .lc-modal-content {
        animation: modal-enter 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isOpen]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <GlassCard
        className="lc-modal-content"
        variant="sacred"
        padding="lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: sizeMap[size],
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {title && (
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--lc-glass-border)' }}>
            <SacredText variant="heading">{title}</SacredText>
          </div>
        )}
        {children}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'var(--lc-warm-gray)',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </GlassCard>
    </div>
  );
}

// ============================================================================
// COMPONENT: Toast
// ============================================================================

interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'sacred';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  type = 'info',
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  const typeMap: Record<string, { bg: string; color: string; icon: string }> = {
    info: { bg: '#3C3489', color: 'white', icon: 'ℹ' },
    success: { bg: '#7D8E7F', color: 'white', icon: '✓' },
    warning: { bg: '#B8976A', color: '#221E1A', icon: '(!)' },
    sacred: { bg: '#B87B65', color: 'white', icon: '✦' },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const config = typeMap[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: config.bg,
        color: config.color,
        padding: '16px 24px',
        borderRadius: 'var(--lc-radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        animation: 'slide-in 0.3s ease-out',
        zIndex: 2000,
        fontFamily: 'var(--lc-font-body)',
      }}
    >
      <span style={{ fontSize: '18px' }}>{config.icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ============================================================================
// COMPONENT: Tabs
// ============================================================================

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'sacred';
}

export function Tabs({
  tabs,
  activeTab = tabs[0]?.id,
  onChange,
  variant = 'default',
}: TabsProps) {
  const [active, setActive] = useState(activeTab);

  const handleChange = (tabId: string) => {
    setActive(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === active)?.content;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          borderBottom: variant === 'default' ? '1px solid var(--lc-glass-border)' : '2px solid var(--lc-gold)',
          gap: '24px',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              fontFamily: 'var(--lc-font-body)',
              fontSize: '16px',
              fontWeight: active === tab.id ? 600 : 400,
              color: active === tab.id ? 'var(--lc-charcoal)' : 'var(--lc-warm-gray)',
              cursor: 'pointer',
              borderBottom: active === tab.id ? '2px solid var(--lc-gold)' : 'none',
              transition: 'all var(--lc-transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--lc-charcoal)';
            }}
            onMouseLeave={(e) => {
              if (active !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--lc-warm-gray)';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {activeTabContent && (
        <div style={{ marginTop: '24px' }}>
          {activeTabContent}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: Badge
// ============================================================================

interface BadgeProps {
  variant?: 'default' | 'gold' | 'rose' | 'sage';
  count?: number;
  label?: string;
  style?: React.CSSProperties;
}

export function Badge({
  variant = 'default',
  count,
  label,
}: BadgeProps) {
  const colorMap = {
    default: { bg: 'var(--lc-charcoal)', color: 'white' },
    gold: { bg: 'var(--lc-gold)', color: 'var(--lc-void)' },
    rose: { bg: 'var(--lc-rose)', color: 'white' },
    sage: { bg: 'var(--lc-sage)', color: 'white' },
  };

  const config = colorMap[variant];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: config.bg,
        color: config.color,
        padding: count !== undefined ? '4px 8px' : '8px 12px',
        borderRadius: 'var(--lc-radius-full)',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--lc-font-body)',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ fontWeight: 700 }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: Divider
// ============================================================================

interface DividerProps {
  symbol?: '✦' | '·' | '—';
  spacing?: 'sm' | 'md' | 'lg';
}

export function Divider({
  symbol = '✦',
  spacing = 'md',
}: DividerProps) {
  const spacingMap = {
    sm: '8px',
    md: '16px',
    lg: '24px',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacingMap[spacing],
        margin: `${spacingMap[spacing]} 0`,
        color: 'var(--lc-gold)',
        fontSize: '18px',
      }}
    >
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--lc-glass-border)' }} />
      <span>{symbol}</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--lc-glass-border)' }} />
    </div>
  );
}

// ============================================================================
// COMPONENT: LoadingState
// ============================================================================

interface LoadingStateProps {
  variant?: 'breathing' | 'materializing' | 'constellation';
  message?: string;
}

export function LoadingState({
  variant = 'breathing',
  message = 'Loading...',
}: LoadingStateProps) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes breathing {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.6; }
      }
      @keyframes materializing {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      .loading-breathing {
        animation: breathing 2s ease-in-out infinite;
      }
      .loading-materializing-1 { animation: materializing 1s ease-out 0s forwards; }
      .loading-materializing-2 { animation: materializing 1s ease-out 0.2s forwards; }
      .loading-materializing-3 { animation: materializing 1s ease-out 0.4s forwards; }
      .loading-constellation {
        animation: float 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '48px 24px',
      }}
    >
      {variant === 'breathing' && (
        <div
          className="loading-breathing"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--lc-gold)',
            boxShadow: '0 0 24px rgba(196, 162, 107, 0.4)',
          }}
        />
      )}

      {variant === 'materializing' && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`loading-materializing-${i}`}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--lc-gold)',
                boxShadow: '0 0 12px rgba(196, 162, 107, 0.4)',
              }}
            />
          ))}
        </div>
      )}

      {variant === 'constellation' && (
        <div
          className="loading-constellation"
          style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}
        >
          ✦
        </div>
      )}

      <SacredText variant="body" color="var(--lc-warm-gray)">
        {message}
      </SacredText>
    </div>
  );
}

// ============================================================================
// COMPONENT: EmptyState
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '✦',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '56px',
          color: 'var(--lc-gold)',
          opacity: 0.6,
        }}
      >
        {icon}
      </div>
      <SacredText variant="subheading" color="var(--lc-warm-gray)">
        {message}
      </SacredText>
      {actionLabel && (
        <CodexButton variant="sacred" onClick={onAction}>
          {actionLabel}
        </CodexButton>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: Avatar
// ============================================================================

interface AvatarProps {
  name?: string;
  archetypeSymbol?: string;
  size?: 'sm' | 'md' | 'lg';
  glowing?: boolean;
  initials?: string;
  imageUrl?: string;
}

export function Avatar({
  name,
  archetypeSymbol,
  size = 'md',
  glowing = false,
  initials,
  imageUrl,
}: AvatarProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const fontSize = sizeMap[size] * 0.4;
  const diameter = sizeMap[size];

  const getInitials = () => {
    if (initials) return initials;
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <div
        style={{
          width: diameter,
          height: diameter,
          borderRadius: '50%',
          backgroundColor: imageUrl ? 'transparent' : 'var(--lc-gold)',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 600,
          color: 'var(--lc-void)',
          boxShadow: glowing ? `0 0 24px rgba(196, 162, 107, 0.4)` : undefined,
          border: '2px solid var(--lc-ivory)',
        }}
      >
        {!imageUrl && getInitials()}
      </div>
      {archetypeSymbol && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: 'var(--lc-ivory)',
            borderRadius: '50%',
            width: diameter * 0.35,
            height: diameter * 0.35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: diameter * 0.2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {archetypeSymbol}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: Sidebar
// ============================================================================

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  href?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  currentView?: string;
  onNavigate?: (itemId: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  userProfile?: {
    name: string;
    archetype: string;
    phase: string;
  };
}

export function Sidebar({
  items,
  currentView,
  onNavigate,
  collapsed = false,
  onToggle,
  userProfile,
}: SidebarProps) {
  return (
    <GlassCard
      variant="default"
      padding="sm"
      style={{
        height: '100vh',
        width: collapsed ? '80px' : '280px',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--lc-transition-normal)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--lc-glass-border)',
          marginBottom: '16px',
        }}
      >
        {!collapsed && <SacredText variant="subheading">Living</SacredText>}
        <IconButton
          icon={collapsed ? '→' : '←'}
          variant="ghost"
          size="sm"
          onClick={onToggle}
        />
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: currentView === item.id ? 'rgba(184,123,101,0.08)' : 'transparent',
              border: 'none',
              borderLeft: currentView === item.id ? '3px solid var(--lc-rose)' : 'none',
              color: currentView === item.id ? 'var(--lc-charcoal)' : 'var(--lc-warm-gray)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              transition: 'all var(--lc-transition-fast)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: '4px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,123,101,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--lc-charcoal)';
            }}
            onMouseLeave={(e) => {
              if (currentView !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--lc-warm-gray)';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            {!collapsed && (
              <div style={{ flex: 1, textAlign: 'left' }}>
                {item.label}
              </div>
            )}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <Badge variant="gold" count={item.badge} />
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      {userProfile && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--lc-glass-border)',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Avatar
            name={userProfile.name}
            archetypeSymbol={userProfile.archetype}
            size="md"
            glowing
          />
          {!collapsed && (
            <>
              <SacredText variant="caption" style={{ textAlign: 'center', fontWeight: 500 }}>
                {userProfile.name}
              </SacredText>
              <PhaseIndicator phase={userProfile.phase} size="sm" showLabel={false} />
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ============================================================================
// COMPONENT: TopBar
// ============================================================================

interface TopBarProps {
  phase?: string;
  userName?: string;
  onMenuToggle?: () => void;
  notifications?: number;
  onNotifications?: () => void;
}

export function TopBar({
  phase,
  userName,
  onMenuToggle,
  notifications = 0,
  onNotifications,
}: TopBarProps) {
  return (
    <GlassCard
      variant="default"
      padding="md"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 0,
        borderBottom: '1px solid var(--lc-glass-border)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <IconButton
          icon="☰"
          variant="ghost"
          onClick={onMenuToggle}
          title="Toggle menu"
        />
        {phase && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhaseIndicator phase={phase} size="sm" animated={false} showLabel={false} />
            <SacredText variant="caption" style={{ textTransform: 'capitalize' }}>
              {phase}
            </SacredText>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <IconButton
            icon="\u266A"
            variant="ghost"
            onClick={onNotifications}
            title="Notifications"
          />
          {notifications > 0 && (
            <Badge
              variant="rose"
              count={notifications}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
              }}
            />
          )}
        </div>
        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--lc-glass-border)' }}>
            <Avatar name={userName} size="sm" />
            <SacredText variant="body" style={{ fontWeight: 500 }}>
              {userName}
            </SacredText>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// GLOBAL STYLES INJECTION
// ============================================================================

export function injectGlobalStyles() {
  injectDesignTokens();

  if (typeof document === 'undefined') return;

  const styleId = 'lc-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Spin animation for loading states */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Slide in animation for toasts */
    @keyframes slide-in {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Main content area adjustment */
    body.with-sidebar {
      margin-left: 280px;
    }

    body.with-sidebar.collapsed {
      margin-left: 80px;
    }

    body.with-topbar {
      margin-top: 70px;
    }

    /* Ensure proper z-index layering */
    .lc-modal-backdrop {
      z-index: 999;
    }

    .lc-toast {
      z-index: 2000;
    }

    /* Smooth transitions for all interactive elements */
    button, a, input, select, textarea {
      transition: all var(--lc-transition-fast);
    }

    /* Remove default focus outline */
    button:focus, a:focus, input:focus {
      outline: none;
    }
  `;

  document.head.appendChild(style);
}

// ============================================================================
// INITIALIZATION HOOK
// ============================================================================

export function useDesignSystem() {
  useEffect(() => {
    injectGlobalStyles();
  }, []);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Utilities
  injectDesignTokens,
  injectGlobalStyles,
  useDesignSystem,

  // Components
  GlassCard,
  SacredText,
  PhaseIndicator,
  ArchetypeSymbol,
  SpectrumBar,
  ProgressRing,
  IconButton,
  TextInput,
  CodexButton,
  Modal,
  Toast,
  Tabs,
  Badge,
  Divider,
  LoadingState,
  EmptyState,
  Avatar,
  Sidebar,
  TopBar,
};
