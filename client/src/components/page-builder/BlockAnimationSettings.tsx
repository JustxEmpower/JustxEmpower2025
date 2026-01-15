import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Clock,
  Timer,
  MousePointer,
  Scroll,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATION TYPES & CONFIGURATIONS
// ============================================================================

export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'rotate'
  | 'flip';

export type AnimationTrigger = 'on-load' | 'on-scroll' | 'on-hover';

export type AnimationEasing = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

export interface BlockAnimationConfig {
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number; // in seconds
  delay: number; // in seconds
  easing: AnimationEasing;
  enabled: boolean;
  repeat?: boolean;
  stagger?: number; // for child elements
}

export const DEFAULT_ANIMATION_CONFIG: BlockAnimationConfig = {
  type: 'none',
  trigger: 'on-scroll',
  duration: 0.6,
  delay: 0,
  easing: 'ease-out',
  enabled: false,
  repeat: false,
  stagger: 0,
};

// Animation type options with icons
const ANIMATION_TYPES: { value: AnimationType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'None', icon: EyeOff },
  { value: 'fade-in', label: 'Fade In', icon: Eye },
  { value: 'fade-out', label: 'Fade Out', icon: EyeOff },
  { value: 'slide-up', label: 'Slide Up', icon: ArrowUp },
  { value: 'slide-down', label: 'Slide Down', icon: ArrowDown },
  { value: 'slide-left', label: 'Slide Left', icon: ArrowLeft },
  { value: 'slide-right', label: 'Slide Right', icon: ArrowRight },
  { value: 'zoom-in', label: 'Zoom In', icon: ZoomIn },
  { value: 'zoom-out', label: 'Zoom Out', icon: ZoomOut },
  { value: 'bounce', label: 'Bounce', icon: Sparkles },
  { value: 'rotate', label: 'Rotate', icon: RotateCcw },
  { value: 'flip', label: 'Flip', icon: Play },
];

const TRIGGER_OPTIONS: { value: AnimationTrigger; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'on-load', label: 'On Page Load', icon: Play },
  { value: 'on-scroll', label: 'On Scroll Into View', icon: Scroll },
  { value: 'on-hover', label: 'On Hover', icon: MousePointer },
];

const EASING_OPTIONS: { value: AnimationEasing; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'bounce', label: 'Bounce' },
];

// ============================================================================
// ANIMATION VARIANTS FOR FRAMER MOTION
// ============================================================================

export function getAnimationVariants(config: BlockAnimationConfig) {
  const { type, duration, delay, easing } = config;

  const easingMap: Record<AnimationEasing, string | number[]> = {
    'linear': 'linear',
    'ease-in': 'easeIn',
    'ease-out': 'easeOut',
    'ease-in-out': 'easeInOut',
    'spring': [0.43, 0.13, 0.23, 0.96],
    'bounce': [0.68, -0.55, 0.27, 1.55],
  };

  const transition = {
    duration,
    delay,
    ease: easingMap[easing],
  };

  const variants: Record<string, { initial: object; animate: object; transition: object }> = {
    'none': {
      initial: {},
      animate: {},
      transition,
    },
    'fade-in': {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition,
    },
    'fade-out': {
      initial: { opacity: 1 },
      animate: { opacity: 0 },
      transition,
    },
    'slide-up': {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition,
    },
    'slide-down': {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      transition,
    },
    'slide-left': {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      transition,
    },
    'slide-right': {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition,
    },
    'zoom-in': {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition,
    },
    'zoom-out': {
      initial: { opacity: 0, scale: 1.2 },
      animate: { opacity: 1, scale: 1 },
      transition,
    },
    'bounce': {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { ...transition, type: 'spring', bounce: 0.5 },
    },
    'rotate': {
      initial: { opacity: 0, rotate: -180 },
      animate: { opacity: 1, rotate: 0 },
      transition,
    },
    'flip': {
      initial: { opacity: 0, rotateY: 90 },
      animate: { opacity: 1, rotateY: 0 },
      transition,
    },
  };

  return variants[type] || variants['none'];
}

// ============================================================================
// ANIMATION PREVIEW COMPONENT
// ============================================================================

interface AnimationPreviewProps {
  config: BlockAnimationConfig;
}

function AnimationPreview({ config }: AnimationPreviewProps) {
  const [key, setKey] = React.useState(0);
  const variants = getAnimationVariants(config);

  const replay = () => setKey(k => k + 1);

  if (!config.enabled || config.type === 'none') {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 text-center text-sm text-neutral-500">
        No animation configured
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-neutral-500">Preview</Label>
        <Button variant="ghost" size="sm" onClick={replay} className="h-6 px-2 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Replay
        </Button>
      </div>
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6 overflow-hidden">
        <motion.div
          key={key}
          initial={variants.initial}
          animate={variants.animate}
          transition={variants.transition}
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
// MAIN COMPONENT
// ============================================================================

interface BlockAnimationSettingsProps {
  config: BlockAnimationConfig;
  onChange: (config: BlockAnimationConfig) => void;
}

export function BlockAnimationSettings({ config, onChange }: BlockAnimationSettingsProps) {
  const updateConfig = (updates: Partial<BlockAnimationConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Animation</Label>
          <p className="text-xs text-neutral-500">Add entrance animation to this block</p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => updateConfig({ enabled })}
        />
      </div>

      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Animation Type */}
            <div className="space-y-2">
              <Label className="text-sm">Animation Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {ANIMATION_TYPES.map((anim) => {
                  const Icon = anim.icon;
                  return (
                    <button
                      key={anim.value}
                      onClick={() => updateConfig({ type: anim.value })}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-md border transition-all',
                        config.type === anim.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary/50'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{anim.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-2">
              <Label className="text-sm">Trigger</Label>
              <Select
                value={config.trigger}
                onValueChange={(value: AnimationTrigger) => updateConfig({ trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Duration</Label>
                <span className="text-xs text-neutral-500">{config.duration.toFixed(1)}s</span>
              </div>
              <Slider
                value={[config.duration]}
                onValueChange={([value]) => updateConfig({ duration: value })}
                min={0.1}
                max={2}
                step={0.1}
              />
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Delay</Label>
                <span className="text-xs text-neutral-500">{config.delay.toFixed(1)}s</span>
              </div>
              <Slider
                value={[config.delay]}
                onValueChange={([value]) => updateConfig({ delay: value })}
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <Label className="text-sm">Easing</Label>
              <Select
                value={config.easing}
                onValueChange={(value: AnimationEasing) => updateConfig({ easing: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <AnimationPreview config={config} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BlockAnimationSettings;
