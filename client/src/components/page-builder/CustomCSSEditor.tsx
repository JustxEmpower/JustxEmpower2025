import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Palette,
  Box,
  Type,
  Layers,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// ============================================================================
// CSS PRESETS / SNIPPETS
// ============================================================================

interface CSSPreset {
  id: string;
  name: string;
  description: string;
  category: 'layout' | 'typography' | 'effects' | 'animation' | 'responsive';
  icon: React.ComponentType<{ className?: string }>;
  css: string;
}

const CSS_PRESETS: CSSPreset[] = [
  // Layout Presets
  {
    id: 'glass-effect',
    name: 'Glass Effect',
    description: 'Frosted glass background with blur',
    category: 'effects',
    icon: Layers,
    css: `background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;`,
  },
  {
    id: 'gradient-border',
    name: 'Gradient Border',
    description: 'Animated gradient border effect',
    category: 'effects',
    icon: Palette,
    css: `position: relative;
background: linear-gradient(var(--background), var(--background)) padding-box,
            linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
border: 2px solid transparent;
border-radius: 12px;`,
  },
  {
    id: 'shadow-elevation',
    name: 'Elevated Shadow',
    description: 'Multi-layer shadow for depth',
    category: 'effects',
    icon: Box,
    css: `box-shadow: 
  0 1px 2px rgba(0, 0, 0, 0.05),
  0 4px 8px rgba(0, 0, 0, 0.05),
  0 16px 32px rgba(0, 0, 0, 0.1);`,
  },
  {
    id: 'text-gradient',
    name: 'Text Gradient',
    description: 'Gradient text effect',
    category: 'typography',
    icon: Type,
    css: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;`,
  },
  {
    id: 'hover-lift',
    name: 'Hover Lift',
    description: 'Lift effect on hover',
    category: 'animation',
    icon: Zap,
    css: `transition: transform 0.3s ease, box-shadow 0.3s ease;

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}`,
  },
  {
    id: 'pulse-glow',
    name: 'Pulse Glow',
    description: 'Pulsing glow animation',
    category: 'animation',
    icon: Sparkles,
    css: `animation: pulse-glow 2s ease-in-out infinite;

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.8); }
}`,
  },
  {
    id: 'responsive-padding',
    name: 'Responsive Padding',
    description: 'Adaptive padding for all screens',
    category: 'responsive',
    icon: Box,
    css: `padding: 1rem;

@media (min-width: 640px) {
  padding: 1.5rem;
}

@media (min-width: 1024px) {
  padding: 2rem;
}`,
  },
  {
    id: 'center-content',
    name: 'Center Content',
    description: 'Perfect centering with flexbox',
    category: 'layout',
    icon: Layers,
    css: `display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
text-align: center;`,
  },
  {
    id: 'overlay-gradient',
    name: 'Overlay Gradient',
    description: 'Dark gradient overlay for images',
    category: 'effects',
    icon: Palette,
    css: `position: relative;

&::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  pointer-events: none;
}`,
  },
  {
    id: 'clip-diagonal',
    name: 'Diagonal Clip',
    description: 'Diagonal edge clipping',
    category: 'effects',
    icon: Box,
    css: `clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
margin-bottom: -5rem;
padding-bottom: 8rem;`,
  },
];

// ============================================================================
// CSS VALIDATION
// ============================================================================

interface CSSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateCSS(css: string): CSSValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!css.trim()) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // Check for unbalanced braces
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
  }

  // Check for common syntax errors
  if (css.includes(';;')) {
    warnings.push('Double semicolons detected');
  }

  // Check for potentially dangerous properties
  const dangerousPatterns = [
    { pattern: /position\s*:\s*fixed/i, message: 'Fixed positioning may cause layout issues' },
    { pattern: /z-index\s*:\s*\d{4,}/i, message: 'Very high z-index values may cause stacking issues' },
    { pattern: /!important/gi, message: '!important overrides may cause specificity conflicts' },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(css)) {
      warnings.push(message);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
  blockType?: string;
}

export function CustomCSSEditor({ value, onChange, blockType }: CustomCSSEditorProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [validation, setValidation] = useState<CSSValidationResult>({ isValid: true, errors: [], warnings: [] });

  const handleChange = useCallback((newValue: string) => {
    onChange(newValue);
    setValidation(validateCSS(newValue));
  }, [onChange]);

  const insertPreset = (preset: CSSPreset) => {
    const newValue = value ? `${value}\n\n/* ${preset.name} */\n${preset.css}` : `/* ${preset.name} */\n${preset.css}`;
    handleChange(newValue);
  };

  const copyPreset = async (preset: CSSPreset) => {
    await navigator.clipboard.writeText(preset.css);
    setCopied(preset.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const categories = [
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layers },
    { id: 'animation', label: 'Animation', icon: Zap },
    { id: 'responsive', label: 'Responsive', icon: Box },
  ];

  return (
    <div className="space-y-4">
      {/* CSS Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Code className="w-4 h-4" />
            Custom CSS
          </Label>
          {blockType && (
            <Badge variant="outline" className="text-xs">
              .block-{blockType}
            </Badge>
          )}
        </div>
        
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`/* Add custom styles for this block */
.my-class {
  color: #333;
  padding: 1rem;
}`}
            rows={8}
            className={cn(
              'font-mono text-sm bg-neutral-900 text-neutral-100 border-neutral-700',
              'placeholder:text-neutral-500',
              !validation.isValid && 'border-red-500'
            )}
          />
          
          {/* Line numbers overlay (visual only) */}
          <div className="absolute top-2 left-2 text-neutral-600 font-mono text-sm pointer-events-none select-none">
            {value.split('\n').map((_, i) => (
              <div key={i} className="h-[1.5rem] text-right pr-2 w-6">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Validation Messages */}
        <AnimatePresence>
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              {validation.errors.map((error, i) => (
                <div key={`error-${i}`} className="flex items-center gap-2 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              ))}
              {validation.warnings.map((warning, i) => (
                <div key={`warning-${i}`} className="flex items-center gap-2 text-xs text-yellow-500">
                  <AlertCircle className="w-3 h-3" />
                  {warning}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS Presets */}
      <Collapsible open={showPresets} onOpenChange={setShowPresets}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              CSS Presets & Snippets
            </span>
            {showPresets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4">
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryPresets = CSS_PRESETS.filter(p => p.category === category.id);
              if (categoryPresets.length === 0) return null;
              
              const Icon = category.icon;
              
              return (
                <div key={category.id} className="space-y-2">
                  <h4 className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryPresets.map((preset) => {
                      const PresetIcon = preset.icon;
                      return (
                        <div
                          key={preset.id}
                          className="group relative p-3 border rounded-md hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <PresetIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{preset.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyPreset(preset)}
                              >
                                {copied === preset.id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500 mb-2">{preset.description}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => insertPreset(preset)}
                          >
                            Insert
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Help Text */}
      <p className="text-xs text-neutral-500">
        Custom CSS will be scoped to this block. Use standard CSS syntax.
        Avoid using !important unless necessary.
      </p>
    </div>
  );
}

export default CustomCSSEditor;
