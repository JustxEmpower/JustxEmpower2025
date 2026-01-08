import { useEffect, useRef, useState } from 'react';
import { Video, Play } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface VideoThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
  showPlayIcon?: boolean;
}

/**
 * VideoThumbnail component generates a thumbnail preview from a video file
 * Uses the video element to display a frame from the video
 * Falls back to video icon if thumbnail generation fails
 */
export default function VideoThumbnail({ 
  src, 
  alt = 'Video thumbnail', 
  className = '',
  showPlayIcon = true 
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Get the proper URL
  const videoUrl = src ? (src.startsWith('http') ? src : getMediaUrl(src)) : '';

  useEffect(() => {
    if (!videoUrl) {
      setError(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Reset states
    setIsReady(false);
    setError(false);

    const handleLoadedData = () => {
      console.log('[VideoThumbnail] Video loaded, seeking to frame');
      // Seek to 0.5 seconds to get a better thumbnail (not just black frame)
      video.currentTime = 0.5;
    };

    const handleSeeked = () => {
      console.log('[VideoThumbnail] Seeked, thumbnail ready');
      setIsReady(true);
    };

    const handleError = (e: Event) => {
      console.error('[VideoThumbnail] Video error:', e, 'URL:', videoUrl);
      // Try without crossOrigin on first error
      if (retryCount === 0 && video.crossOrigin) {
        console.log('[VideoThumbnail] Retrying without crossOrigin');
        video.crossOrigin = null;
        setRetryCount(1);
        video.load();
        return;
      }
      setError(true);
    };

    const handleLoadedMetadata = () => {
      console.log('[VideoThumbnail] Metadata loaded, duration:', video.duration);
      if (video.duration > 0) {
        video.currentTime = Math.min(0.5, video.duration * 0.1);
      }
    };

    // Handle canplaythrough for better compatibility
    const handleCanPlayThrough = () => {
      console.log('[VideoThumbnail] Can play through');
      if (!isReady) {
        video.currentTime = 0.5;
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    video.addEventListener('canplaythrough', handleCanPlayThrough);

    // Start loading - try with crossOrigin first for S3
    video.crossOrigin = 'anonymous';
    video.load();

    // Timeout fallback - if video doesn't load in 5 seconds, show error state
    const timeout = setTimeout(() => {
      if (!isReady && !error) {
        console.log('[VideoThumbnail] Timeout - showing fallback');
        setError(true);
      }
    }, 5000);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      clearTimeout(timeout);
    };
  }, [videoUrl, retryCount]);

  // Fallback display when no video URL or error
  if (error || !videoUrl) {
    return (
      <div className={`relative flex items-center justify-center bg-neutral-800 ${className}`}>
        <Video className="w-8 h-8 text-neutral-500" />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {/* Video element that shows the frame directly */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Loading state */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
          <div className="flex flex-col items-center gap-2">
            <Video className="w-8 h-8 text-neutral-500 animate-pulse" />
            <span className="text-xs text-neutral-500">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Play icon overlay */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
