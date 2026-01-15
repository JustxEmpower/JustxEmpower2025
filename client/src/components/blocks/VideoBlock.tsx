interface VideoBlockProps {
  content: string; // Video URL (YouTube, Vimeo, or direct video file)
  settings?: {
    alignment?: 'left' | 'center' | 'right';
    width?: 'small' | 'medium' | 'large' | 'full';
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
}

export default function VideoBlock({ content, settings = {} }: VideoBlockProps) {
  const { alignment = 'center', width = 'large', autoplay = false, loop = false, muted = false } = settings;

  const widthClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-full',
  };

  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };

  // Check if it's a YouTube or Vimeo URL
  const isYouTube = content.includes('youtube.com') || content.includes('youtu.be');
  const isVimeo = content.includes('vimeo.com');

  const getEmbedUrl = () => {
    if (isYouTube) {
      const videoId = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}`;
    }
    if (isVimeo) {
      const videoId = content.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`;
    }
    return content;
  };

  return (
    <div className={`${widthClasses[width]} ${alignmentClasses[alignment]} my-8`}>
      {(isYouTube || isVimeo) ? (
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          src={content}
          controls
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      )}
    </div>
  );
}
