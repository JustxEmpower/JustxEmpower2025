interface ImageBlockProps {
  content: string; // Image URL
  settings?: {
    alignment?: 'left' | 'center' | 'right';
    width?: 'small' | 'medium' | 'large' | 'full';
    caption?: string;
    alt?: string;
  };
}

export default function ImageBlock({ content, settings = {} }: ImageBlockProps) {
  const { alignment = 'center', width = 'large', caption, alt } = settings;

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

  return (
    <figure className={`${widthClasses[width]} ${alignmentClasses[alignment]} my-8`}>
      <img
        src={content}
        alt={alt || caption || 'Image'}
        className="w-full h-auto rounded-lg shadow-md"
      />
      {caption && (
        <figcaption className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
