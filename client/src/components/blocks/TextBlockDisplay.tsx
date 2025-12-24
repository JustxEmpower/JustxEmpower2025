interface TextBlockDisplayProps {
  content: string;
  settings?: {
    alignment?: 'left' | 'center' | 'right';
    fontSize?: 'small' | 'medium' | 'large';
  };
}

export default function TextBlockDisplay({ content, settings = {} }: TextBlockDisplayProps) {
  const { alignment = 'left', fontSize = 'medium' } = settings;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className={`prose dark:prose-invert max-w-none my-6 ${alignmentClasses[alignment]} ${fontSizeClasses[fontSize]}`}>
      <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}
