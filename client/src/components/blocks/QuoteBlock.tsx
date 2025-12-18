interface QuoteBlockProps {
  content: string; // Quote text
  settings?: {
    author?: string;
    role?: string;
    alignment?: 'left' | 'center' | 'right';
    style?: 'default' | 'bordered' | 'highlighted';
  };
}

export default function QuoteBlock({ content, settings = {} }: QuoteBlockProps) {
  const { author, role, alignment = 'center', style = 'default' } = settings;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const styleClasses = {
    default: 'border-l-4 border-neutral-300 dark:border-neutral-700 pl-6 italic',
    bordered: 'border-2 border-neutral-200 dark:border-neutral-800 p-6 rounded-lg',
    highlighted: 'bg-neutral-100 dark:bg-neutral-900 p-8 rounded-xl shadow-sm',
  };

  return (
    <blockquote className={`my-8 max-w-3xl mx-auto ${styleClasses[style]}`}>
      <p className={`text-xl md:text-2xl font-light text-neutral-800 dark:text-neutral-200 leading-relaxed ${alignmentClasses[alignment]}`}>
        "{content}"
      </p>
      {(author || role) && (
        <footer className={`mt-4 ${alignmentClasses[alignment]}`}>
          {author && (
            <cite className="text-base font-medium text-neutral-900 dark:text-neutral-100 not-italic">
              {author}
            </cite>
          )}
          {role && (
            <span className="text-sm text-neutral-600 dark:text-neutral-400 block mt-1">
              {role}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}
