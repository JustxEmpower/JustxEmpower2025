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
 * It captures a frame from the video at 1 second mark
 */
export default function VideoThumbnail({ 
  src, 
  alt = 'Video thumbnail', 
  className = '',
  showPlayIcon = true 
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get the proper URL
  const videoUrl = src ? (src.startsWith('http') ? src : getMediaUrl(src)) : '';

  useEffect(() => {
    if (!videoUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const generateThumbnail = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(true);
          setLoading(false);
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;

        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnail(dataUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error generating video thumbnail:', err);
        setError(true);
        setLoading(false);
      }
    };

    const handleLoadedData = () => {
      // Seek to 1 second to get a better thumbnail (not just the first frame)
      video.currentTime = 1;
    };

    const handleSeeked = () => {
      generateThumbnail();
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    // Load the video
    video.src = videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  // Fallback display when no thumbnail available
  if (error || !videoUrl) {
    return (
      <div className={`relative flex items-center justify-center bg-neutral-800 ${className}`}>
        <Video className="w-12 h-12 text-neutral-400" />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* Hidden canvas for drawing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Display thumbnail or loading state */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-neutral-800 animate-pulse">
          <Video className="w-12 h-12 text-neutral-500" />
        </div>
      ) : thumbnail ? (
        <>
          <img
            src={thumbnail}
            alt={alt}
            className="w-full h-full object-cover"
          />
          {showPlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
          <Video className="w-12 h-12 text-neutral-400" />
        </div>
      )}
    </div>
  );
}
