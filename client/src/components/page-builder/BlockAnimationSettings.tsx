import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ZoomIn, ZoomOut, Eye, EyeOff, MousePointer, Scroll, Play,
  RotateCcw, Layers, Wind, Type, Move, RefreshCw, Waves,
  Paintbrush, CircleDot, Maximize2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AnimationType = 
  | 'none' | 'fade-in' | 'fade-out'
  | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'zoom-in' | 'zoom-out' | 'bounce' | 'rotate' | 'flip'
  | 'blur-in' | 'scale-rotate' | 'curtain-reveal' | 'stagger-children';

export type AnimationTrigger = 'on-load' | 'on-scroll' | 'on-hover';
export type AnimationEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce';
export type AnimationCategory = 'entrance' | 'scroll' | 'continuous' | 'hover' | 'text';
export type ContinuousType = 'none' | 'float' | 'pulse' | 'spin' | 'shimmer' | 'glow' | 'gradient-shift' | 'breathe' | 'swing';
export type HoverType = 'none' | 'lift' | 'scale' | 'tilt-3d' | 'glow' | 'border-glow' | 'blur-sharpen' | 'color-shift';
export type TextAnimationType = 'none' | 'typewriter' | 'split-reveal' | 'fade-words' | 'blur-in' | 'highlight-sweep';
export type ParallaxDirection = 'up' | 'down' | 'left' | 'right';
export type ScrollProgressProperty = 'opacity' | 'scale' | 'rotate' | 'translateX' | 'translateY' | 'blur';

export interface BlockAnimationConfig {
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  enabled: boolean;
  repeat?: boolean;
  stagger?: number;
  category?: AnimationCategory;
  parallax?: { enabled: boolean; speed: number; direction: ParallaxDirection };
  scrollProgress?: { enabled: boolean; property: ScrollProgressProperty; from: number; to: number };
  continuous?: { type: ContinuousType; speed: number; intensity: number };
  hover?: { type: HoverType; intensity: number };
  text?: { type: TextAnimationType; speed: number; staggerDelay: number };
}

export const DEFAULT_ANIMATION_CONFIG: BlockAnimationConfig = {
  type: 'none', trigger: 'on-scroll', duration: 0.6, delay: 0, easing: 'ease-out',
  enabled: false, repeat: false, stagger: 0, category: 'entrance',
  parallax: { enabled: false, speed: 0.5, direction: 'up' },
  scrollProgress: { enabled: false, property: 'opacity', from: 0, to: 1 },
  continuous: { type: 'none', speed: 1, intensity: 1 },
  hover: { type: 'none', intensity: 1 },
  text: { type: 'none', speed: 1, staggerDelay: 0.05 },
};

const ANIMATION_TYPES: { value: AnimationType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'None', icon: EyeOff },
  { value: 'fade-in', label: 'Fade In', icon: Eye },
  { value: 'slide-up', label: 'Slide Up', icon: ArrowUp },
  { value: 'slide-down', label: 'Slide Down', icon: ArrowDown },
  { value: 'slide-left', label: 'Slide Left', icon: ArrowLeft },
  { value: 'slide-right', label: 'Slide Right', icon: ArrowRight },
  { value: 'zoom-in', label: 'Zoom In', icon: ZoomIn },
  { value: 'zoom-out', label: 'Zoom Out', icon: ZoomOut },
  { value: 'bounce', label: 'Bounce', icon: Sparkles },
  { value: 'rotate', label: 'Rotate', icon: RotateCcw },
  { value: 'flip', label: 'Flip', icon: Play },
  { value: 'blur-in', label: 'Blur In', icon: Eye },
  { value: 'scale-rotate', label: 'Scale+Spin', icon: RefreshCw },
  { value: 'curtain-reveal', label: 'Curtain', icon: Maximize2 },
  { value: 'stagger-children', label: 'Stagger', icon: Layers },
];

const TRIGGER_OPTIONS: { value: AnimationTrigger; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'on-load', label: 'On Page Load', icon: Play },
  { value: 'on-scroll', label: 'On Scroll Into View', icon: Scroll },
  { value: 'on-hover', label: 'On Hover', icon: MousePointer },
];

const EASING_OPTIONS: { value: AnimationEasing; label: string }[] = [
  { value: 'linear', label: 'Linear' }, { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' }, { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' }, { value: 'bounce', label: 'Bounce' },
];

const CATEGORY_OPTIONS: { value: AnimationCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { value: 'entrance', label: 'Entrance', icon: Eye, desc: 'Fade, slide, zoom' },
  { value: 'scroll', label: 'Scroll', icon: Scroll, desc: 'Parallax & scroll-linked' },
  { value: 'continuous', label: 'Continuous', icon: RefreshCw, desc: 'Float, pulse, spin' },
  { value: 'hover', label: 'Hover', icon: MousePointer, desc: 'Interactive effects' },
  { value: 'text', label: 'Text', icon: Type, desc: 'Typing, reveal, fade' },
];

const CONTINUOUS_TYPES: { value: ContinuousType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'None', icon: EyeOff }, { value: 'float', label: 'Float', icon: Wind },
  { value: 'pulse', label: 'Pulse', icon: CircleDot }, { value: 'spin', label: 'Spin', icon: RefreshCw },
  { value: 'shimmer', label: 'Shimmer', icon: Sparkles }, { value: 'glow', label: 'Glow', icon: Paintbrush },
  { value: 'gradient-shift', label: 'Gradient', icon: Waves }, { value: 'breathe', label: 'Breathe', icon: Wind },
  { value: 'swing', label: 'Swing', icon: Move },
];

const HOVER_TYPES: { value: HoverType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'None', icon: EyeOff }, { value: 'lift', label: 'Lift', icon: ArrowUp },
  { value: 'scale', label: 'Scale', icon: Maximize2 }, { value: 'tilt-3d', label: '3D Tilt', icon: Layers },
  { value: 'glow', label: 'Glow', icon: Paintbrush }, { value: 'border-glow', label: 'Border', icon: CircleDot },
  { value: 'blur-sharpen', label: 'Sharpen', icon: Eye }, { value: 'color-shift', label: 'Color', icon: Waves },
];

const TEXT_TYPES: { value: TextAnimationType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'None', icon: EyeOff }, { value: 'typewriter', label: 'Typewriter', icon: Type },
  { value: 'split-reveal', label: 'Split', icon: Layers }, { value: 'fade-words', label: 'Fade Words', icon: Eye },
  { value: 'blur-in', label: 'Blur In', icon: Wind }, { value: 'highlight-sweep', label: 'Highlight', icon: Paintbrush },
];

// ============================================================================
// ANIMATION VARIANTS FOR FRAMER MOTION
// ============================================================================

export function getAnimationVariants(config: BlockAnimationConfig) {
  const { type, duration, delay, easing } = config;
  const easingMap: Record<AnimationEasing, string | number[]> = {
    'linear': 'linear', 'ease-in': 'easeIn', 'ease-out': 'easeOut',
    'ease-in-out': 'easeInOut', 'spring': [0.43, 0.13, 0.23, 0.96], 'bounce': [0.68, -0.55, 0.27, 1.55],
  };
  const transition = { duration, delay, ease: easingMap[easing] };
  const variants: Record<string, { initial: object; animate: object; transition: object }> = {
    'none': { initial: {}, animate: {}, transition },
    'fade-in': { initial: { opacity: 0 }, animate: { opacity: 1 }, transition },
    'fade-out': { initial: { opacity: 1 }, animate: { opacity: 0 }, transition },
    'slide-up': { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition },
    'slide-down': { initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, transition },
    'slide-left': { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, transition },
    'slide-right': { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, transition },
    'zoom-in': { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition },
    'zoom-out': { initial: { opacity: 0, scale: 1.2 }, animate: { opacity: 1, scale: 1 }, transition },
    'bounce': { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: { ...transition, type: 'spring', bounce: 0.5 } },
    'rotate': { initial: { opacity: 0, rotate: -180 }, animate: { opacity: 1, rotate: 0 }, transition },
    'flip': { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 }, transition },
    'blur-in': { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' }, transition },
    'scale-rotate': { initial: { opacity: 0, scale: 0.5, rotate: -90 }, animate: { opacity: 1, scale: 1, rotate: 0 }, transition: { ...transition, type: 'spring', stiffness: 200 } },
    'curtain-reveal': { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' }, transition },
    'stagger-children': { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { ...transition, staggerChildren: config.stagger || 0.1 } },
  };
  return variants[type] || variants['none'];
}

// ============================================================================
// PREVIEW COMPONENT
// ============================================================================

function AnimationPreview({ config }: { config: BlockAnimationConfig }) {
  const [key, setKey] = useState(0);
  const replay = () => setKey(k => k + 1);
  const category = config.category || 'entrance';

  const hasEntrance = config.type !== 'none';
  const hasContinuous = config.continuous?.type && config.continuous.type !== 'none';
  const hasHover = config.hover?.type && config.hover.type !== 'none';
  const hasParallax = config.parallax?.enabled;
  const hasText = config.text?.type && config.text.type !== 'none';
  const hasAny = hasEntrance || hasContinuous || hasHover || hasParallax || hasText;

  if (!config.enabled || !hasAny) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 text-center text-sm text-neutral-500">
        No animation configured
      </div>
    );
  }

  const getContinuousAnimation = () => {
    if (!hasContinuous) return {};
    const cont = config.continuous!;
    const dur = 2 / cont.speed;
    const int = cont.intensity * 10;
    switch (cont.type) {
      case 'float': return { animate: { y: [-int, int, -int] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'pulse': return { animate: { scale: [1, 1 + int * 0.01, 1] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'spin': return { animate: { rotate: 360 }, transition: { duration: dur, repeat: Infinity, ease: 'linear' } };
      case 'breathe': return { animate: { opacity: [1, 0.5, 1] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'swing': return { animate: { rotate: [-int, int, -int] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      default: return { animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
    }
  };

  const getHoverAnimation = () => {
    if (!hasHover) return {};
    const h = config.hover!;
    const int = h.intensity;
    switch (h.type) {
      case 'lift': return { whileHover: { y: -8 * int, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } };
      case 'scale': return { whileHover: { scale: 1 + 0.05 * int } };
      case 'tilt-3d': return { whileHover: { rotateX: 5 * int, rotateY: 5 * int } };
      case 'glow': return { whileHover: { boxShadow: `0 0 ${20 * int}px rgba(var(--primary-rgb, 59, 130, 246), 0.5)` } };
      default: return { whileHover: { scale: 1.02 } };
    }
  };

  let animProps: any = {};
  if (category === 'entrance' && hasEntrance) {
    const v = getAnimationVariants(config);
    animProps = { initial: v.initial, animate: v.animate, transition: v.transition };
  } else if (category === 'continuous') {
    animProps = getContinuousAnimation();
  } else if (category === 'hover') {
    animProps = getHoverAnimation();
  } else if (category === 'scroll' && hasParallax) {
    animProps = { animate: { y: [-10, 10, -10] }, transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } };
  } else if (category === 'text' && hasText) {
    animProps = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, staggerChildren: 0.05 } };
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-500">Preview</Label>
        <Button variant="ghost" size="sm" onClick={replay} className="h-6 px-2 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" /> Replay
        </Button>
      </div>
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6 overflow-hidden" style={{ perspective: '800px' }}>
        <motion.div
          key={key}
          {...animProps}
          className="bg-gradient-to-br from-primary/20 to-primary/40 rounded-md p-4 text-center"
        >
          <div className="w-full h-4 bg-primary/30 rounded mb-2" />
          <div className="w-3/4 h-3 bg-primary/20 rounded mx-auto" />
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// ICON GRID HELPER
// ============================================================================

function IconGrid<T extends string>({
  items,
  value,
  onChange,
  cols = 3,
}: {
  items: { value: T; label: string; icon: React.ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md border transition-all',
              value === item.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface BlockAnimationSettingsProps {
  config: BlockAnimationConfig;
  onChange: (config: BlockAnimationConfig) => void;
}

export function BlockAnimationSettings({ config, onChange }: BlockAnimationSettingsProps) {
  const category = config.category || 'entrance';

  const updateConfig = (updates: Partial<BlockAnimationConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateParallax = (u: Partial<NonNullable<BlockAnimationConfig['parallax']>>) => {
    const current = config.parallax || DEFAULT_ANIMATION_CONFIG.parallax!;
    updateConfig({ parallax: { ...current, ...u } });
  };

  const updateScrollProgress = (u: Partial<NonNullable<BlockAnimationConfig['scrollProgress']>>) => {
    const current = config.scrollProgress || DEFAULT_ANIMATION_CONFIG.scrollProgress!;
    updateConfig({ scrollProgress: { ...current, ...u } });
  };

  const updateContinuous = (u: Partial<NonNullable<BlockAnimationConfig['continuous']>>) => {
    const current = config.continuous || DEFAULT_ANIMATION_CONFIG.continuous!;
    updateConfig({ continuous: { ...current, ...u } });
  };

  const updateHover = (u: Partial<NonNullable<BlockAnimationConfig['hover']>>) => {
    const current = config.hover || DEFAULT_ANIMATION_CONFIG.hover!;
    updateConfig({ hover: { ...current, ...u } });
  };

  const updateText = (u: Partial<NonNullable<BlockAnimationConfig['text']>>) => {
    const current = config.text || DEFAULT_ANIMATION_CONFIG.text!;
    updateConfig({ text: { ...current, ...u } });
  };

  const parallax = config.parallax || DEFAULT_ANIMATION_CONFIG.parallax!;
  const scrollProg = config.scrollProgress || DEFAULT_ANIMATION_CONFIG.scrollProgress!;
  const cont = config.continuous || DEFAULT_ANIMATION_CONFIG.continuous!;
  const hover = config.hover || DEFAULT_ANIMATION_CONFIG.hover!;
  const text = config.text || DEFAULT_ANIMATION_CONFIG.text!;

  return (
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Animation</Label>
          <p className="text-xs text-neutral-500">Add motion effects to this block</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(enabled) => updateConfig({ enabled })} />
      </div>

      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Category Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Animation Category</Label>
              <div className="grid grid-cols-5 gap-1">
                {CATEGORY_OPTIONS.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => updateConfig({ category: cat.value })}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2 rounded-md border transition-all',
                        category === cat.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] font-medium">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-400">
                {CATEGORY_OPTIONS.find(c => c.value === category)?.desc}
              </p>
            </div>

            {/* ===== ENTRANCE PANEL ===== */}
            {category === 'entrance' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Animation Type</Label>
                  <IconGrid items={ANIMATION_TYPES} value={config.type} onChange={(v) => updateConfig({ type: v })} cols={4} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Trigger</Label>
                  <Select value={config.trigger} onValueChange={(v: AnimationTrigger) => updateConfig({ trigger: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return <SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><Icon className="w-4 h-4" />{opt.label}</div></SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Label className="text-sm">Duration</Label><span className="text-xs text-neutral-500">{config.duration.toFixed(1)}s</span></div>
                  <Slider value={[config.duration]} onValueChange={([v]) => updateConfig({ duration: v })} min={0.1} max={3} step={0.1} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Label className="text-sm">Delay</Label><span className="text-xs text-neutral-500">{config.delay.toFixed(1)}s</span></div>
                  <Slider value={[config.delay]} onValueChange={([v]) => updateConfig({ delay: v })} min={0} max={3} step={0.1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Easing</Label>
                  <Select value={config.easing} onValueChange={(v: AnimationEasing) => updateConfig({ easing: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EASING_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {config.type === 'stagger-children' && (
                  <div className="space-y-2">
                    <div className="flex justify-between"><Label className="text-sm">Stagger Delay</Label><span className="text-xs text-neutral-500">{(config.stagger || 0.1).toFixed(2)}s</span></div>
                    <Slider value={[config.stagger || 0.1]} onValueChange={([v]) => updateConfig({ stagger: v })} min={0.02} max={0.5} step={0.02} />
                  </div>
                )}
              </div>
            )}

            {/* ===== SCROLL PANEL ===== */}
            {category === 'scroll' && (
              <div className="space-y-5">
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Parallax Scrolling</Label>
                      <p className="text-xs text-neutral-500">Elements move at different speeds</p>
                    </div>
                    <Switch checked={parallax.enabled} onCheckedChange={(v) => updateParallax({ enabled: v })} />
                  </div>
                  {parallax.enabled && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between"><Label className="text-sm">Speed</Label><span className="text-xs text-neutral-500">{parallax.speed.toFixed(1)}x</span></div>
                        <Slider value={[parallax.speed]} onValueChange={([v]) => updateParallax({ speed: v })} min={0.1} max={2} step={0.1} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Direction</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['up', 'down', 'left', 'right'] as ParallaxDirection[]).map((dir) => {
                            const icons: Record<string, any> = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight };
                            const Icon = icons[dir];
                            return (
                              <button key={dir} onClick={() => updateParallax({ direction: dir })}
                                className={cn('flex flex-col items-center gap-1 p-2 rounded-md border text-xs',
                                  parallax.direction === dir ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 hover:border-primary/50'
                                )}>
                                <Icon className="w-4 h-4" />
                                <span className="text-[10px] capitalize">{dir}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Scroll Progress</Label>
                      <p className="text-xs text-neutral-500">Animate property with scroll position</p>
                    </div>
                    <Switch checked={scrollProg.enabled} onCheckedChange={(v) => updateScrollProgress({ enabled: v })} />
                  </div>
                  {scrollProg.enabled && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Property</Label>
                        <Select value={scrollProg.property} onValueChange={(v: ScrollProgressProperty) => updateScrollProgress({ property: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opacity">Opacity</SelectItem>
                            <SelectItem value="scale">Scale</SelectItem>
                            <SelectItem value="rotate">Rotate</SelectItem>
                            <SelectItem value="translateX">Move X</SelectItem>
                            <SelectItem value="translateY">Move Y</SelectItem>
                            <SelectItem value="blur">Blur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">From: {scrollProg.from}</Label>
                          <Slider value={[scrollProg.from]} onValueChange={([v]) => updateScrollProgress({ from: v })} min={-100} max={100} step={1} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">To: {scrollProg.to}</Label>
                          <Slider value={[scrollProg.to]} onValueChange={([v]) => updateScrollProgress({ to: v })} min={-100} max={100} step={1} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== CONTINUOUS PANEL ===== */}
            {category === 'continuous' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">Subtle looping animations that run continuously.</p>
                <div className="space-y-2">
                  <Label className="text-sm">Effect Type</Label>
                  <IconGrid items={CONTINUOUS_TYPES} value={cont.type} onChange={(v) => updateContinuous({ type: v })} cols={3} />
                </div>
                {cont.type !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-sm">Speed</Label><span className="text-xs text-neutral-500">{cont.speed.toFixed(1)}x</span></div>
                      <Slider value={[cont.speed]} onValueChange={([v]) => updateContinuous({ speed: v })} min={0.1} max={3} step={0.1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-sm">Intensity</Label><span className="text-xs text-neutral-500">{cont.intensity.toFixed(1)}</span></div>
                      <Slider value={[cont.intensity]} onValueChange={([v]) => updateContinuous({ intensity: v })} min={0.1} max={3} step={0.1} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== HOVER PANEL ===== */}
            {category === 'hover' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">Interactive effects triggered on mouse hover.</p>
                <div className="space-y-2">
                  <Label className="text-sm">Hover Effect</Label>
                  <IconGrid items={HOVER_TYPES} value={hover.type} onChange={(v) => updateHover({ type: v })} cols={4} />
                </div>
                {hover.type !== 'none' && (
                  <div className="space-y-2">
                    <div className="flex justify-between"><Label className="text-sm">Intensity</Label><span className="text-xs text-neutral-500">{hover.intensity.toFixed(1)}</span></div>
                    <Slider value={[hover.intensity]} onValueChange={([v]) => updateHover({ intensity: v })} min={0.1} max={3} step={0.1} />
                  </div>
                )}
              </div>
            )}

            {/* ===== TEXT PANEL ===== */}
            {category === 'text' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">Animated text for stronger messaging.</p>
                <div className="space-y-2">
                  <Label className="text-sm">Text Effect</Label>
                  <IconGrid items={TEXT_TYPES} value={text.type} onChange={(v) => updateText({ type: v })} cols={3} />
                </div>
                {text.type !== 'none' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-sm">Speed</Label><span className="text-xs text-neutral-500">{text.speed.toFixed(1)}x</span></div>
                      <Slider value={[text.speed]} onValueChange={([v]) => updateText({ speed: v })} min={0.1} max={3} step={0.1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-sm">Letter Delay</Label><span className="text-xs text-neutral-500">{text.staggerDelay.toFixed(2)}s</span></div>
                      <Slider value={[text.staggerDelay]} onValueChange={([v]) => updateText({ staggerDelay: v })} min={0.01} max={0.2} step={0.01} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Preview */}
            <AnimationPreview config={config} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BlockAnimationSettings;
