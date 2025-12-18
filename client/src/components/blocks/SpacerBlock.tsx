interface SpacerBlockProps {
  content: string; // Not used, but required by schema
  settings?: {
    height?: 'small' | 'medium' | 'large' | 'xlarge';
  };
}

export default function SpacerBlock({ settings = {} }: SpacerBlockProps) {
  const { height = 'medium' } = settings;

  const heightClasses = {
    small: 'h-8',
    medium: 'h-16',
    large: 'h-24',
    xlarge: 'h-32',
  };

  return <div className={heightClasses[height]} aria-hidden="true" />;
}
