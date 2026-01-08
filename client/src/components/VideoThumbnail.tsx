/**
 * VideoThumbnail.tsx - Fixed Video Thumbnail Component
 * 
 * FIXES ADDRESSED:
 * - CORS errors preventing canvas capture
 * - Black box thumbnails
 * - Fallback to poster image
 * - Retry logic for transient failures
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, AlertCircle, Video } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

// ============================================
// TYPES
// ============================================

interface VideoThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  posterImage?: string;
  showPlayIcon?: boolean;
  captureTime?: number; // Time in seconds to capture frame
  onError?: (error: Error) => void;
  onClick?: () => void;
}

interface ThumbnailState {
  status: 'loading' | 'captured' | 'fallback' | 'error';
  thumbnailUrl: string | null;
  errorMessage: string | null;
}

// ============================================
// THUMBNAIL CACHE
// ============================================

const thumbnailCache = new Map<string, string>();

/**
 * Get cached thumbnail or null
 */
function getCachedThumbnail(src: string): string | null {
  return thumbnailCache.get(src) || null;
}

/**
 * Cache a thumbnail
 */
function cacheThumbnail(src: string, dataUrl: string): void {
  // Limit cache size
  if (thumbnailCache.size > 100) {
    const firstKey = thumbnailCache.keys().next().value;
    if (firstKey) thumbnailCache.delete(firstKey);
  }
  thumbnailCache.set(src, dataUrl);
}

// ============================================
// COMPONENT
// ============================================

export default function VideoThumbnail({
  src,
  alt = 'Video thumbnail',
  className = '',
  width = 320,
  height = 180,
  posterImage,
  showPlayIcon = true,
  captureTime = 1,
  onError,
  onClick,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<ThumbnailState>({
    status: 'loading',
    thumbnailUrl: null,
    errorMessage: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Resolve the video URL
  const videoUrl = src ? getMediaUrl(src) : '';
  const posterUrl = posterImage ? getMediaUrl(posterImage) : '';

  // Check cache first
  useEffect(() => {
    if (!videoUrl) {
      setState({ status: 'error', thumbnailUrl: null, errorMessage: 'No video URL' });
      return;
    }

    const cached = getCachedThumbnail(videoUrl);
    if (cached) {
      setState({ status: 'captured', thumbnailUrl: cached, errorMessage: null });
      return;
    }

    // Reset state for new video
    setState({ status: 'loading', thumbnailUrl: null, errorMessage: null });
    setRetryCount(0);
  }, [videoUrl]);

  // Capture thumbnail from video
  const captureThumbnail = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.warn('[VideoThumbnail] Missing video or canvas ref');
      return false;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Check if we got a valid image (not just black)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const isBlack = isImageMostlyBlack(imageData);

      if (isBlack && retryCount < MAX_RETRIES) {
        // Try again at a different time
        console.log('[VideoThumbnail] Captured black frame, retrying...');
        setRetryCount(prev => prev + 1);
        return false;
      }

      // Cache and use the thumbnail
      cacheThumbnail(videoUrl, dataUrl);
      setState({ status: 'captured', thumbnailUrl: dataUrl, errorMessage: null });
      return true;
    } catch (error) {
      console.error('[VideoThumbnail] Capture failed:', error);

      // CORS error detection
      if (error instanceof DOMException && error.name === 'SecurityError') {
        setState({
          status: 'fallback',
          thumbnailUrl: null,
          errorMessage: 'CORS restriction - using poster image',
        });
        onError?.(error);
        return false;
      }

      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        return false;
      }

      setState({
        status: 'error',
        thumbnailUrl: null,
        errorMessage: error instanceof Error ? error.message : 'Capture failed',
      });
      onError?.(error instanceof Error ? error : new Error('Capture failed'));
      return false;
    }
  }, [videoUrl, width, height, retryCount, onError]);

  // Handle video loaded
  const handleLoadedData = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Seek to capture time
    const seekTime = Math.min(captureTime + retryCount * 0.5, video.duration - 0.1);
    video.currentTime = seekTime;
  }, [captureTime, retryCount]);

  // Handle seeked - capture the frame
  const handleSeeked = useCallback(() => {
    // Small delay to ensure frame is rendered
    requestAnimationFrame(() => {
      captureThumbnail();
    });
  }, [captureThumbnail]);

  // Handle video error
  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const error = video.error;

    console.error('[VideoThumbnail] Video error:', {
      code: error?.code,
      message: error?.message,
      src: videoUrl,
    });

    setState({
      status: 'fallback',
      thumbnailUrl: null,
      errorMessage: error?.message || 'Video load failed',
    });
  }, [videoUrl]);

  // Determine what to show
  const showLoading = state.status === 'loading';
  const showThumbnail = state.status === 'captured' && state.thumbnailUrl;
  const showPoster = (state.status === 'fallback' || state.status === 'error') && posterUrl;
  const showPlaceholder = !showThumbnail && !showPoster && !showLoading;

  return (
    <div
      className={`relative overflow-hidden bg-neutral-900 ${className}`}
      style={{ width: '100%', height: '100%' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Hidden video element for thumbnail capture */}
      {state.status === 'loading' && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          muted
          playsInline
          preload="metadata"
          onLoadedData={handleLoadedData}
          onSeeked={handleSeeked}
          onError={handleError}
          style={{ display: 'none' }}
        />
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Loading state */}
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Captured thumbnail */}
      {showThumbnail && (
        <img
          src={state.thumbnailUrl!}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Poster fallback */}
      {showPoster && (
        <img
          src={posterUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {/* Placeholder when nothing available */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-800 text-neutral-400">
          <Video className="w-8 h-8 mb-2" strokeWidth={1.5} />
          <span className="text-xs">No preview</span>
        </div>
      )}

      {/* Play icon overlay */}
      {showPlayIcon && !showLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}

      {/* Error indicator (small, non-intrusive) */}
      {state.status === 'error' && (
        <div className="absolute bottom-1 right-1 p-1 rounded bg-red-500/80" title={state.errorMessage || 'Error'}>
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

// ============================================
// UTILITIES
// ============================================

/**
 * Check if an image is mostly black (failed capture)
 */
function isImageMostlyBlack(imageData: ImageData): boolean {
  const data = imageData.data;
  const totalPixels = data.length / 4;
  let darkPixels = 0;
  const threshold = 20; // RGB values below this are considered "dark"

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < threshold && g < threshold && b < threshold) {
      darkPixels++;
    }
  }

  const sampledPixels = totalPixels / 10;
  return darkPixels / sampledPixels > 0.9; // More than 90% dark
}

/**
 * Generate thumbnail for a video URL (async)
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  options: {
    captureTime?: number;
    width?: number;
    height?: number;
  } = {}
): Promise<string | null> {
  const { captureTime = 1, width = 320, height = 180 } = options;
  const resolvedUrl = getMediaUrl(videoUrl);

  // Check cache
  const cached = getCachedThumbnail(resolvedUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const cleanup = () => {
      video.remove();
      canvas.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(captureTime, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        canvas.width = video.videoWidth || width;
        canvas.height = video.videoHeight || height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        cacheThumbnail(resolvedUrl, dataUrl);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        console.error('[generateVideoThumbnail] Error:', error);
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      console.error('[generateVideoThumbnail] Video load error');
      cleanup();
      resolve(null);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);

    video.src = resolvedUrl;
  });
}
