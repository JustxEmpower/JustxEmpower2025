import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  RotateCcw,
  Columns,
  Square,
  Link2,
  Link2Off
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePageBuilderStore, PageBlock } from '../usePageBuilderStore';
import BlockRenderer from '../BlockRenderer';

// ============================================================================
// VIEWPORT CONFIGURATIONS
// ============================================================================

interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PREVIEW_VIEWPORTS: ViewportConfig[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, icon: Monitor },
  { id: 'laptop', name: 'Laptop', width: 1280, height: 800, icon: Laptop },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { id: 'mobile', name: 'Mobile', width: 375, height: 812, icon: Smartphone },
];

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

// ============================================================================
// DEVICE FRAME COMPONENT
// ============================================================================

interface DeviceFrameProps {
  viewport: ViewportConfig;
  blocks: PageBlock[];
  scale: number;
  isRotated: boolean;
  onScroll?: (scrollTop: number) => void;
  scrollTop?: number;
  syncScroll?: boolean;
}

function DeviceFrame({ 
  viewport, 
  blocks, 
  scale, 
  isRotated, 
  onScroll, 
  scrollTop,
  syncScroll 
}: DeviceFrameProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const viewportWidth = isRotated ? viewport.height : viewport.width;
  const viewportHeight = isRotated ? viewport.width : viewport.height;

  // Sync scroll position
  useEffect(() => {
    if (syncScroll && contentRef.current && scrollTop !== undefined) {
      contentRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop, syncScroll]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll((e.target as HTMLDivElement).scrollTop);
    }
  }, [onScroll]);

  return (
    <div className="flex flex-col items-center">
      {/* Device label */}
      <div className="mb-2 text-sm text-neutral-400">
        <span className="font-medium text-white">{viewport.name}</span>
        <span className="mx-2">•</span>
        <span>{viewportWidth} × {viewportHeight}</span>
      </div>

      {/* Device Frame */}
      <motion.div
        layout
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Browser Chrome (for desktop/laptop) */}
        {(viewport.id === 'desktop' || viewport.id === 'laptop') && (
          <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center px-3 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white rounded-md px-3 py-1 text-xs text-neutral-500 border border-neutral-200">
                justxempower.com
              </div>
            </div>
          </div>
        )}

        {/* Mobile Notch (for mobile) */}
        {viewport.id === 'mobile' && !isRotated && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
        )}

        {/* Content Area */}
        <div 
          ref={contentRef}
          className="overflow-auto bg-white"
          style={{
            height: viewport.id === 'desktop' || viewport.id === 'laptop' 
              ? `calc(100% - 32px)` 
              : '100%',
            paddingTop: viewport.id === 'mobile' && !isRotated ? '24px' : 0,
          }}
          onScroll={handleScroll}
        >
          {blocks.length > 0 ? (
            <div className="min-h-full">
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400">
              <p>No blocks to preview</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// PREVIEW PANEL COMPONENT
// ============================================================================

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewPanel({ isOpen, onClose }: PreviewPanelProps) {
  const { blocks } = usePageBuilderStore();
  
  // Single view state
  const [viewport, setViewport] = useState<ViewportConfig>(PREVIEW_VIEWPORTS[0]);
  const [zoom, setZoom] = useState(100);
  const [isRotated, setIsRotated] = useState(false);
  
  // Side-by-side mode state
  const [isSideBySide, setIsSideBySide] = useState(false);
  const [leftViewport, setLeftViewport] = useState<ViewportConfig>(PREVIEW_VIEWPORTS[0]); // Desktop
  const [rightViewport, setRightViewport] = useState<ViewportConfig>(PREVIEW_VIEWPORTS[3]); // Mobile
  const [leftRotated, setLeftRotated] = useState(false);
  const [rightRotated, setRightRotated] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  // Calculate auto-scale to fit viewport in container
  useEffect(() => {
    const updateAutoScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 80;
        const containerHeight = containerRef.current.clientHeight - 80;
        
        if (isSideBySide) {
          // For side-by-side, calculate scale for both viewports
          const leftWidth = leftRotated ? leftViewport.height : leftViewport.width;
          const rightWidth = rightRotated ? rightViewport.height : rightViewport.width;
          const maxHeight = Math.max(
            leftRotated ? leftViewport.width : leftViewport.height,
            rightRotated ? rightViewport.width : rightViewport.height
          );
          
          const availableWidth = (containerWidth - 40) / 2; // 40px gap between
          const scaleX = Math.min(availableWidth / leftWidth, availableWidth / rightWidth);
          const scaleY = containerHeight / maxHeight;
          const scale = Math.min(scaleX, scaleY, 0.8);
          
          setAutoScale(scale);
        } else {
          const viewportWidth = isRotated ? viewport.height : viewport.width;
          const viewportHeight = isRotated ? viewport.width : viewport.height;
          
          const scaleX = containerWidth / viewportWidth;
          const scaleY = containerHeight / viewportHeight;
          const scale = Math.min(scaleX, scaleY, 1);
          
          setAutoScale(scale);
        }
      }
    };

    updateAutoScale();
    window.addEventListener('resize', updateAutoScale);
    return () => window.removeEventListener('resize', updateAutoScale);
  }, [viewport, isRotated, isSideBySide, leftViewport, rightViewport, leftRotated, rightRotated]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 25, 150));
      } else if (e.key === '-') {
        setZoom(prev => Math.max(prev - 25, 50));
      } else if (e.key === '0') {
        setZoom(100);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsSideBySide(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const effectiveScale = (zoom / 100) * autoScale;
  const viewportWidth = isRotated ? viewport.height : viewport.width;
  const viewportHeight = isRotated ? viewport.width : viewport.height;

  // Handle scroll sync
  const handleScroll = useCallback((newScrollTop: number) => {
    if (syncScroll) {
      setScrollTop(newScrollTop);
    }
  }, [syncScroll]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-neutral-900/80 backdrop-blur border-b border-neutral-800 flex items-center justify-between px-6">
            {/* Left Section - Mode Toggle & Viewport Selector */}
            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                <button
                  onClick={() => setIsSideBySide(false)}
                  className={cn(
                    'p-2 rounded-md transition-all duration-200 flex items-center gap-2',
                    !isSideBySide
                      ? 'bg-primary text-white'
                      : 'hover:bg-neutral-700 text-neutral-400'
                  )}
                  title="Single view"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-xs">Single</span>
                </button>
                <button
                  onClick={() => setIsSideBySide(true)}
                  className={cn(
                    'p-2 rounded-md transition-all duration-200 flex items-center gap-2',
                    isSideBySide
                      ? 'bg-primary text-white'
                      : 'hover:bg-neutral-700 text-neutral-400'
                  )}
                  title="Side-by-side comparison (C)"
                >
                  <Columns className="w-4 h-4" />
                  <span className="text-xs">Compare</span>
                </button>
              </div>

              {/* Viewport Selector - Single Mode */}
              {!isSideBySide && (
                <>
                  <span className="text-sm text-neutral-400">Device:</span>
                  <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                    {PREVIEW_VIEWPORTS.map((vp) => {
                      const Icon = vp.icon;
                      return (
                        <button
                          key={vp.id}
                          onClick={() => setViewport(vp)}
                          className={cn(
                            'p-2 rounded-md transition-all duration-200',
                            viewport.id === vp.id
                              ? 'bg-primary text-white'
                              : 'hover:bg-neutral-700 text-neutral-400'
                          )}
                          title={`${vp.name} (${vp.width}×${vp.height})`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                  
                  {(viewport.id === 'tablet' || viewport.id === 'mobile') && (
                    <button
                      onClick={() => setIsRotated(!isRotated)}
                      className={cn(
                        'p-2 rounded-md transition-all duration-200',
                        isRotated
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-neutral-700 text-neutral-400'
                      )}
                      title="Rotate device"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              {/* Viewport Selectors - Side-by-Side Mode */}
              {isSideBySide && (
                <>
                  {/* Left viewport selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Left:</span>
                    <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                      {PREVIEW_VIEWPORTS.map((vp) => {
                        const Icon = vp.icon;
                        return (
                          <button
                            key={vp.id}
                            onClick={() => setLeftViewport(vp)}
                            className={cn(
                              'p-1.5 rounded-md transition-all duration-200',
                              leftViewport.id === vp.id
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-neutral-700 text-neutral-400'
                            )}
                            title={vp.name}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right viewport selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Right:</span>
                    <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                      {PREVIEW_VIEWPORTS.map((vp) => {
                        const Icon = vp.icon;
                        return (
                          <button
                            key={vp.id}
                            onClick={() => setRightViewport(vp)}
                            className={cn(
                              'p-1.5 rounded-md transition-all duration-200',
                              rightViewport.id === vp.id
                                ? 'bg-green-500 text-white'
                                : 'hover:bg-neutral-700 text-neutral-400'
                            )}
                            title={vp.name}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sync scroll toggle */}
                  <button
                    onClick={() => setSyncScroll(!syncScroll)}
                    className={cn(
                      'p-2 rounded-md transition-all duration-200 flex items-center gap-2',
                      syncScroll
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'hover:bg-neutral-700 text-neutral-400'
                    )}
                    title={syncScroll ? 'Disable scroll sync' : 'Enable scroll sync'}
                  >
                    {syncScroll ? (
                      <Link2 className="w-4 h-4" />
                    ) : (
                      <Link2Off className="w-4 h-4" />
                    )}
                    <span className="text-xs">Sync</span>
                  </button>
                </>
              )}
            </div>

            {/* Center Section - Zoom Controls (Single Mode Only) */}
            {!isSideBySide && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Zoom:</span>
                <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
                  <button
                    onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
                    disabled={zoom <= 50}
                    className="p-2 rounded-md hover:bg-neutral-700 text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1 px-2">
                    {ZOOM_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => setZoom(level)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-all duration-200',
                          zoom === level
                            ? 'bg-primary text-white'
                            : 'hover:bg-neutral-700 text-neutral-400'
                        )}
                      >
                        {level}%
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setZoom(prev => Math.min(prev + 25, 150))}
                    disabled={zoom >= 150}
                    className="p-2 rounded-md hover:bg-neutral-700 text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => setZoom(100)}
                  className="p-2 rounded-md hover:bg-neutral-700 text-neutral-400"
                  title="Reset zoom (100%)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right Section - Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-neutral-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Preview Container */}
          <div 
            ref={containerRef}
            className="absolute top-16 left-0 right-0 bottom-0 flex items-start justify-center overflow-auto p-10"
          >
            {isSideBySide ? (
              /* Side-by-Side View */
              <div className="flex items-start justify-center gap-10">
                <DeviceFrame
                  viewport={leftViewport}
                  blocks={blocks}
                  scale={autoScale}
                  isRotated={leftRotated}
                  onScroll={handleScroll}
                  syncScroll={false}
                />
                <DeviceFrame
                  viewport={rightViewport}
                  blocks={blocks}
                  scale={autoScale}
                  isRotated={rightRotated}
                  scrollTop={scrollTop}
                  syncScroll={syncScroll}
                />
              </div>
            ) : (
              /* Single View */
              <motion.div
                layout
                transition={{ duration: 0.3 }}
                className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
                style={{
                  width: viewportWidth,
                  height: viewportHeight,
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* Browser Chrome (for desktop/laptop) */}
                {(viewport.id === 'desktop' || viewport.id === 'laptop') && (
                  <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center px-3 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-white rounded-md px-3 py-1 text-xs text-neutral-500 border border-neutral-200">
                        justxempower.com
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Notch (for mobile) */}
                {viewport.id === 'mobile' && !isRotated && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
                )}

                {/* Content Area */}
                <div 
                  className="overflow-auto bg-white"
                  style={{
                    height: viewport.id === 'desktop' || viewport.id === 'laptop' 
                      ? `calc(100% - 32px)` 
                      : '100%',
                    paddingTop: viewport.id === 'mobile' && !isRotated ? '24px' : 0,
                  }}
                >
                  {blocks.length > 0 ? (
                    <div className="min-h-full">
                      {blocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400">
                      <p>No blocks to preview</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-800/80 backdrop-blur rounded-lg px-4 py-2 text-sm text-neutral-400">
            {isSideBySide ? (
              <>
                <span className="text-blue-400">{leftViewport.name}</span>
                <span className="mx-2">vs</span>
                <span className="text-green-400">{rightViewport.name}</span>
                <span className="mx-2">•</span>
                <span>{Math.round(autoScale * 100)}% scale</span>
                {syncScroll && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-amber-400">Scroll synced</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="font-medium text-white">{viewport.name}</span>
                <span className="mx-2">•</span>
                <span>{viewportWidth} × {viewportHeight}</span>
                <span className="mx-2">•</span>
                <span>{Math.round(effectiveScale * 100)}% scale</span>
              </>
            )}
            <span className="mx-4 text-neutral-600">|</span>
            <span className="text-neutral-500">ESC to close • C to toggle compare • +/- to zoom</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
