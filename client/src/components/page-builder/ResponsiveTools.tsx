/**
 * Responsive Design Tools - Advanced responsive editing capabilities
 * 
 * Features:
 * - Device-specific style overrides
 * - Breakpoint preview
 * - Responsive spacing controls
 * - Visibility per device
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Grid3X3,
} from 'lucide-react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}

interface ResponsiveToolsProps {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}

// Breakpoint configurations
export const BREAKPOINTS = {
  mobile: { name: 'Mobile', icon: Smartphone, maxWidth: 639, minWidth: 0 },
  tablet: { name: 'Tablet', icon: Tablet, maxWidth: 1023, minWidth: 640 },
  desktop: { name: 'Desktop', icon: Monitor, maxWidth: 9999, minWidth: 1024 },
};

// Spacing presets
const SPACING_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: '4px' },
  { value: '2', label: '8px' },
  { value: '3', label: '12px' },
  { value: '4', label: '16px' },
  { value: '6', label: '24px' },
  { value: '8', label: '32px' },
  { value: '12', label: '48px' },
  { value: '16', label: '64px' },
  { value: '20', label: '80px' },
  { value: '24', label: '96px' },
];

// Font size presets
const FONT_SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra Small' },
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Base' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
  { value: '4xl', label: '4XL' },
  { value: '5xl', label: '5XL' },
  { value: '6xl', label: '6XL' },
  { value: '7xl', label: '7XL' },
];

// Column layout options
const COLUMN_OPTIONS = [
  { value: '1', label: '1 Column' },
  { value: '2', label: '2 Columns' },
  { value: '3', label: '3 Columns' },
  { value: '4', label: '4 Columns' },
  { value: '6', label: '6 Columns' },
];

export default function ResponsiveTools({ content, onUpdate }: ResponsiveToolsProps) {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');

  // Get responsive value with fallback chain
  const getResponsiveValue = <T,>(key: string, defaultValue: T): T => {
    const responsiveKey = `${key}_${activeBreakpoint}`;
    if (content[responsiveKey] !== undefined) return content[responsiveKey] as T;
    
    // Fallback chain: mobile <- tablet <- desktop <- default
    if (activeBreakpoint === 'mobile') {
      return (content[`${key}_tablet`] as T) ?? (content[`${key}_desktop`] as T) ?? (content[key] as T) ?? defaultValue;
    }
    if (activeBreakpoint === 'tablet') {
      return (content[`${key}_desktop`] as T) ?? (content[key] as T) ?? defaultValue;
    }
    return (content[key] as T) ?? defaultValue;
  };

  // Set responsive value
  const setResponsiveValue = (key: string, value: unknown) => {
    const responsiveKey = `${key}_${activeBreakpoint}`;
    onUpdate({ ...content, [responsiveKey]: value });
  };

  // Check visibility for current breakpoint
  const isVisibleOnBreakpoint = getResponsiveValue('visible', true);

  return (
    <div className="space-y-6">
      {/* Breakpoint Selector */}
      <div className="flex items-center gap-2 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
        {Object.entries(BREAKPOINTS).map(([key, bp]) => {
          const Icon = bp.icon;
          const isActive = activeBreakpoint === key;
          return (
            <Button
              key={key}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBreakpoint(key as Breakpoint)}
              className={`flex-1 gap-2 ${isActive ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{bp.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Current Breakpoint Info */}
      <div className="text-xs text-stone-500 text-center">
        Editing styles for: <span className="font-medium text-stone-700 dark:text-stone-300">
          {BREAKPOINTS[activeBreakpoint].minWidth}px - {BREAKPOINTS[activeBreakpoint].maxWidth === 9999 ? '∞' : `${BREAKPOINTS[activeBreakpoint].maxWidth}px`}
        </span>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          {isVisibleOnBreakpoint ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-red-500" />
          )}
          <Label>Visible on {BREAKPOINTS[activeBreakpoint].name}</Label>
        </div>
        <Switch
          checked={isVisibleOnBreakpoint as boolean}
          onCheckedChange={(checked) => setResponsiveValue('visible', checked)}
        />
      </div>

      {/* Spacing Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          Spacing
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Padding Top</Label>
            <Select
              value={getResponsiveValue('paddingTop', '4') as string}
              onValueChange={(v) => setResponsiveValue('paddingTop', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Padding Bottom</Label>
            <Select
              value={getResponsiveValue('paddingBottom', '4') as string}
              onValueChange={(v) => setResponsiveValue('paddingBottom', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Padding Left</Label>
            <Select
              value={getResponsiveValue('paddingLeft', '4') as string}
              onValueChange={(v) => setResponsiveValue('paddingLeft', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Padding Right</Label>
            <Select
              value={getResponsiveValue('paddingRight', '4') as string}
              onValueChange={(v) => setResponsiveValue('paddingRight', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Margin Top</Label>
            <Select
              value={getResponsiveValue('marginTop', '0') as string}
              onValueChange={(v) => setResponsiveValue('marginTop', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Margin Bottom</Label>
            <Select
              value={getResponsiveValue('marginBottom', '0') as string}
              onValueChange={(v) => setResponsiveValue('marginBottom', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPACING_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Typography Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Typography</h4>
        
        <div className="space-y-2">
          <Label className="text-xs">Font Size</Label>
          <Select
            value={getResponsiveValue('fontSize', 'base') as string}
            onValueChange={(v) => setResponsiveValue('fontSize', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Text Alignment</Label>
          <div className="flex gap-2">
            {[
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <Button
                key={value}
                variant={getResponsiveValue('textAlign', 'left') === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setResponsiveValue('textAlign', value)}
                className="flex-1"
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Columns className="w-4 h-4" />
          Layout
        </h4>

        <div className="space-y-2">
          <Label className="text-xs">Columns</Label>
          <Select
            value={getResponsiveValue('columns', '1') as string}
            onValueChange={(v) => setResponsiveValue('columns', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMN_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Gap Between Items</Label>
          <Select
            value={getResponsiveValue('gap', '4') as string}
            onValueChange={(v) => setResponsiveValue('gap', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Max Width</Label>
          <Select
            value={getResponsiveValue('maxWidth', 'full') as string}
            onValueChange={(v) => setResponsiveValue('maxWidth', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Width</SelectItem>
              <SelectItem value="7xl">1280px</SelectItem>
              <SelectItem value="6xl">1152px</SelectItem>
              <SelectItem value="5xl">1024px</SelectItem>
              <SelectItem value="4xl">896px</SelectItem>
              <SelectItem value="3xl">768px</SelectItem>
              <SelectItem value="2xl">672px</SelectItem>
              <SelectItem value="xl">576px</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Copy/Apply */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-700 space-y-2">
        <p className="text-xs text-stone-500">Quick Actions</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // Copy current breakpoint styles to all breakpoints
              const keysToSync = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'fontSize', 'textAlign', 'columns', 'gap', 'maxWidth'];
              const updates: Record<string, unknown> = { ...content };
              
              keysToSync.forEach(key => {
                const currentValue = getResponsiveValue(key, undefined);
                if (currentValue !== undefined) {
                  updates[`${key}_mobile`] = currentValue;
                  updates[`${key}_tablet`] = currentValue;
                  updates[`${key}_desktop`] = currentValue;
                }
              });
              
              onUpdate(updates);
            }}
          >
            Apply to All Devices
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // Reset current breakpoint to defaults
              const keysToReset = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'fontSize', 'textAlign', 'columns', 'gap', 'maxWidth', 'visible'];
              const updates: Record<string, unknown> = { ...content };
              
              keysToReset.forEach(key => {
                delete updates[`${key}_${activeBreakpoint}`];
              });
              
              onUpdate(updates);
            }}
          >
            Reset {BREAKPOINTS[activeBreakpoint].name}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper to apply responsive styles in renderers
export function applyResponsiveStyles(
  content: Record<string, unknown>,
  viewport: Breakpoint = 'desktop'
): Record<string, string> {
  const styles: Record<string, string> = {};
  
  const getValue = (key: string): string | undefined => {
    const responsiveKey = `${key}_${viewport}`;
    return (content[responsiveKey] as string) ?? (content[key] as string);
  };

  // Spacing
  const spacingMap: Record<string, string> = {
    '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem',
    '4': '1rem', '6': '1.5rem', '8': '2rem', '12': '3rem',
    '16': '4rem', '20': '5rem', '24': '6rem',
  };

  ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom'].forEach(key => {
    const val = getValue(key);
    if (val && spacingMap[val]) {
      styles[key] = spacingMap[val];
    }
  });

  // Font size
  const fontSizeMap: Record<string, string> = {
    'xs': '0.75rem', 'sm': '0.875rem', 'base': '1rem', 'lg': '1.125rem',
    'xl': '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem',
    '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem',
  };
  
  const fontSize = getValue('fontSize');
  if (fontSize && fontSizeMap[fontSize]) {
    styles.fontSize = fontSizeMap[fontSize];
  }

  // Text align
  const textAlign = getValue('textAlign');
  if (textAlign) {
    styles.textAlign = textAlign;
  }

  // Max width
  const maxWidthMap: Record<string, string> = {
    'xl': '576px', '2xl': '672px', '3xl': '768px', '4xl': '896px',
    '5xl': '1024px', '6xl': '1152px', '7xl': '1280px', 'full': '100%',
  };
  
  const maxWidth = getValue('maxWidth');
  if (maxWidth && maxWidthMap[maxWidth]) {
    styles.maxWidth = maxWidthMap[maxWidth];
  }

  return styles;
}
