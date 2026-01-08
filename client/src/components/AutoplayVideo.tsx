import { useEffect, useRef } from 'react';
import { getMediaUrl } from '@/lib/media';

interface AutoplayVideoProps {
  src: string;
  className?: string;
  poster?: string;
  onLoadedData?: () => void;
  onError?: () => void;
}

/**
 * AutoplayVideo component ensures videos autoplay and loop properly
 * across all browsers, including mobile Safari which requires user interaction
 */
export default function AutoplayVideo({
  src,
  className = '',
  poster,
  onLoadedData,
  onError,
}: AutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get the proper URL (handle both absolute URLs and relative paths)
  const videoUrl = src ? (src.startsWith('http') ? src : getMediaUrl(src)) : '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // Attempt to play the video
    const playVideo = async () => {
      try {
        video.muted = true; // Ensure muted for autoplay
        await video.play();
      } catch (error) {
        console.log('Autoplay failed, will retry on user interaction:', error);
      }
    };

    // Play when video is ready
    const handleCanPlay = () => {
      playVideo();
    };

    // Handle visibility change (play when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && video.paused) {
        playVideo();
      }
    };

    // Handle user interaction to enable autoplay on mobile
    const handleUserInteraction = () => {
      if (video.paused) {
        playVideo();
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });

    // Initial play attempt
    if (video.readyState >= 3) {
      playVideo();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [videoUrl]);

  if (!videoUrl) {
    return null;
  }

  // Determine video type from URL
  const getVideoType = (url: string): string => {
    if (url.includes('.webm')) return 'video/webm';
    if (url.includes('.ogg')) return 'video/ogg';
    return 'video/mp4';
  };

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      loop
      muted
      playsInline
      crossOrigin="anonymous"
      preload="auto"
      poster={poster}
      className={className}
      onLoadedData={onLoadedData}
      onError={onError}
    />
  );
}

/**
 * Helper function to check if a URL is a video
 */
export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg|m4v)$/i.test(url);
}
