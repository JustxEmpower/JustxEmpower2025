import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface CTABlockProps {
  content: string; // CTA text/headline
  settings?: {
    buttonText?: string;
    buttonLink?: string;
    subtitle?: string;
    alignment?: 'left' | 'center' | 'right';
    style?: 'default' | 'gradient' | 'minimal';
    buttonVariant?: 'default' | 'outline' | 'ghost';
  };
}

export default function CTABlock({ content, settings = {} }: CTABlockProps) {
  const {
    buttonText = 'Learn More',
    buttonLink = '#',
    subtitle,
    alignment = 'center',
    style = 'default',
    buttonVariant = 'default',
  } = settings;

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const styleClasses = {
    default: 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
    gradient: 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950',
    minimal: 'bg-transparent',
  };

  return (
    <div className={`my-12 p-8 md:p-12 rounded-xl ${styleClasses[style]}`}>
      <div className={`max-w-3xl mx-auto flex flex-col gap-6 ${alignmentClasses[alignment]}`}>
        <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 tracking-tight">
          {content}
        </h2>
        {subtitle && (
          <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light max-w-2xl">
            {subtitle}
          </p>
        )}
        <div>
          <Button
            asChild
            variant={buttonVariant as any}
            size="lg"
            className="min-w-[200px]"
          >
            <Link href={buttonLink}>{buttonText}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
