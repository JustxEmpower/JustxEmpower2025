/**
 * Microsoft Word-style Margin Ruler Component
 * 
 * Provides visual draggable rulers for setting text margins
 * like Microsoft Word's horizontal ruler.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MarginRulerProps {
  containerWidth: number;
  leftMargin: number;
  rightMargin: number;
  onLeftMarginChange: (percent: number) => void;
  onRightMarginChange: (percent: number) => void;
  className?: string;
}

export function MarginRuler({
  containerWidth,
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  className = '',
}: MarginRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Convert percentage to pixels
  const leftPx = (leftMargin / 100) * containerWidth;
  const rightPx = (rightMargin / 100) * containerWidth;
  const textWidth = containerWidth - leftPx - rightPx;

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!rulerRef.current) return;
    
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(45, (x / containerWidth) * 100));

    if (isDraggingLeft) {
      // Ensure left margin doesn't overlap with right margin
      const maxLeft = 100 - rightMargin - 10;
      onLeftMarginChange(Math.min(percent, maxLeft));
    } else if (isDraggingRight) {
      // Calculate right margin from right edge
      const rightPercent = Math.max(0, Math.min(45, ((containerWidth - x) / containerWidth) * 100));
      const maxRight = 100 - leftMargin - 10;
      onRightMarginChange(Math.min(rightPercent, maxRight));
    }
  }, [isDraggingLeft, isDraggingRight, containerWidth, leftMargin, rightMargin, onLeftMarginChange, onRightMarginChange]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  // Generate ruler tick marks
  const ticks = [];
  const tickCount = Math.floor(containerWidth / 50);
  for (let i = 0; i <= tickCount; i++) {
    const isMajor = i % 2 === 0;
    ticks.push(
      <div
        key={i}
        className="absolute top-0"
        style={{ left: `${(i / tickCount) * 100}%` }}
      >
        <div className={cn(
          'w-px bg-neutral-400',
          isMajor ? 'h-3' : 'h-2'
        )} />
        {isMajor && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] text-neutral-500">
            {Math.round((i / tickCount) * 100)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative select-none', className)}>
      {/* Ruler background */}
      <div
        ref={rulerRef}
        className="relative h-8 bg-gradient-to-b from-neutral-100 to-neutral-200 border border-neutral-300 rounded-sm overflow-hidden"
        style={{ width: containerWidth }}
      >
        {/* Tick marks */}
        <div className="absolute inset-0">
          {ticks}
        </div>

        {/* Left margin zone (gray) */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-neutral-300/50"
          style={{ width: `${leftMargin}%` }}
        />

        {/* Right margin zone (gray) */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-neutral-300/50"
          style={{ width: `${rightMargin}%` }}
        />

        {/* Text area indicator (white) */}
        <div
          className="absolute top-1 bottom-1 bg-white border border-blue-300 rounded-sm shadow-inner"
          style={{
            left: `${leftMargin}%`,
            right: `${rightMargin}%`,
          }}
        />

        {/* Left margin handle */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-3 cursor-ew-resize z-10 group',
            'flex items-center justify-center'
          )}
          style={{ left: `calc(${leftMargin}% - 6px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingLeft(true);
          }}
        >
          <div className={cn(
            'w-2 h-6 rounded-sm transition-colors',
            isDraggingLeft ? 'bg-blue-500' : 'bg-blue-400 group-hover:bg-blue-500'
          )}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right margin handle */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-3 cursor-ew-resize z-10 group',
            'flex items-center justify-center'
          )}
          style={{ right: `calc(${rightMargin}% - 6px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingRight(true);
          }}
        >
          <div className={cn(
            'w-2 h-6 rounded-sm transition-colors',
            isDraggingRight ? 'bg-blue-500' : 'bg-blue-400 group-hover:bg-blue-500'
          )}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
              <div className="w-0.5 h-1 bg-white/70 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Margin labels */}
      <div className="flex justify-between mt-1 text-[10px] text-neutral-500">
        <span>L: {leftMargin.toFixed(1)}%</span>
        <span className="text-blue-600 font-medium">Text: {(100 - leftMargin - rightMargin).toFixed(1)}%</span>
        <span>R: {rightMargin.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/**
 * Compact margin ruler for inline use in settings panels
 */
export function CompactMarginRuler({
  leftMargin,
  rightMargin,
  onLeftMarginChange,
  onRightMarginChange,
  className = '',
}: Omit<MarginRulerProps, 'containerWidth'>) {
  return (
    <div className={cn('w-full', className)}>
      <MarginRuler
        containerWidth={280}
        leftMargin={leftMargin}
        rightMargin={rightMargin}
        onLeftMarginChange={onLeftMarginChange}
        onRightMarginChange={onRightMarginChange}
      />
    </div>
  );
}

export default MarginRuler;
