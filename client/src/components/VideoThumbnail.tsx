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
 * Uses the video element's poster or first frame as thumbnail
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

  // Get the proper URL
  const videoUrl = src ? (src.startsWith('http') ? src : getMediaUrl(src)) : '';

  useEffect(() => {
    if (!videoUrl) {
      setError(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      // Seek to 0.5 seconds to get a better thumbnail (not just black frame)
      video.currentTime = 0.5;
    };

    const handleSeeked = () => {
      setIsReady(true);
    };

    const handleError = () => {
      setError(true);
    };

    // Also handle loadedmetadata for faster response
    const handleLoadedMetadata = () => {
      if (video.duration > 0) {
        video.currentTime = Math.min(0.5, video.duration * 0.1);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    // Start loading
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  // Fallback display when no video URL or error
  if (error || !videoUrl) {
    return (
      <div className={`relative flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 ${className}`}>
        <Video className="w-8 h-8 text-neutral-400" />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video element that shows the frame directly */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full object-cover ${isReady ? 'opacity-100' : 'opacity-0'}`}
        muted
        playsInline
        preload="metadata"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Loading state */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 animate-pulse">
          <Video className="w-8 h-8 text-neutral-400" />
        </div>
      )}
      
      {/* Play icon overlay */}
      {showPlayIcon && isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
