import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

interface ContentBlock {
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

export default function AccessibilityStatement() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('accessibility');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title and last updated from hero section
  const title = getContent('hero', 'title', 'Accessibility Statement');
  const lastUpdated = getContent('hero', 'lastUpdated', '');

  // Get free-form content blocks
  const blocksJson = getContent('freeformContent', 'blocks', '[]');
  
  // Parse the blocks JSON
  const blocks: ContentBlock[] = useMemo(() => {
    try {
      const parsed = JSON.parse(blocksJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse content blocks:', e);
      return [];
    }
  }, [blocksJson]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Render a content block
  const renderBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'heading') {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        1: 'font-serif text-3xl md:text-4xl italic mb-6 text-foreground',
        2: 'font-serif text-2xl italic mb-4 text-foreground',
        3: 'font-sans text-lg font-semibold mb-2 text-foreground',
      };
      return (
        <HeadingTag key={index} className={headingClasses[block.level || 2]}>
          {block.text}
        </HeadingTag>
      );
    }

    if (block.type === 'paragraph') {
      return (
        <p key={index} className="mb-4 text-foreground/80 leading-relaxed">
          {block.text}
        </p>
      );
    }

    return null;
  };

  // Check if we have free-form content or should show default
  const hasFreeformContent = blocks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>}

        <div className="prose prose-lg max-w-none">
          {hasFreeformContent ? (
            // Render free-form content blocks
            blocks.map((block, index) => renderBlock(block, index))
          ) : (
            // Default content when no free-form blocks exist
            <div className="text-foreground/80 space-y-8">
              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('commitment', 'heading', 'Our Commitment')}
                </h2>
                <p>
                  {getContent('commitment', 'content', 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('conformance', 'heading', 'Conformance Status')}
                </h2>
                <p>
                  {getContent('conformance', 'content', 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Just Empower is partially conformant with WCAG 2.1 level AA.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('measures', 'heading', 'Measures We Take')}
                </h2>
                <p>{getContent('measures', 'intro', 'Just Empower takes the following measures to ensure accessibility:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{getContent('measures', 'item1', 'Include accessibility as part of our mission statement')}</li>
                  <li>{getContent('measures', 'item2', 'Integrate accessibility into our procurement practices')}</li>
                  <li>{getContent('measures', 'item3', 'Provide continual accessibility training for our staff')}</li>
                  <li>{getContent('measures', 'item4', 'Include people with disabilities in our design personas')}</li>
                  <li>{getContent('measures', 'item5', 'Use clear and consistent navigation throughout the website')}</li>
                  <li>{getContent('measures', 'item6', 'Provide text alternatives for non-text content')}</li>
                  <li>{getContent('measures', 'item7', 'Ensure sufficient color contrast')}</li>
                  <li>{getContent('measures', 'item8', 'Make all functionality available from a keyboard')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('features', 'heading', 'Accessibility Features')}
                </h2>
                <p>{getContent('features', 'intro', 'Our website includes the following accessibility features:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Keyboard Navigation:</strong> {getContent('features', 'keyboard', 'All interactive elements can be accessed using a keyboard')}</li>
                  <li><strong>Screen Reader Compatibility:</strong> {getContent('features', 'screenReader', 'Our site is compatible with popular screen readers')}</li>
                  <li><strong>Alt Text:</strong> {getContent('features', 'altText', 'Images include descriptive alternative text')}</li>
                  <li><strong>Resizable Text:</strong> {getContent('features', 'resizableText', 'Text can be resized without loss of content or functionality')}</li>
                  <li><strong>Color Contrast:</strong> {getContent('features', 'colorContrast', 'We maintain sufficient contrast between text and backgrounds')}</li>
                  <li><strong>Focus Indicators:</strong> {getContent('features', 'focusIndicators', 'Visible focus indicators for keyboard navigation')}</li>
                  <li><strong>Skip Links:</strong> {getContent('features', 'skipLinks', 'Skip navigation links for screen reader users')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('limitations', 'heading', 'Known Limitations')}
                </h2>
                <p>
                  {getContent('limitations', 'intro', 'Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{getContent('limitations', 'item1', 'Some older PDF documents may not be fully accessible')}</li>
                  <li>{getContent('limitations', 'item2', 'Some video content may not have captions (we are working to add them)')}</li>
                  <li>{getContent('limitations', 'item3', 'Some third-party content may not meet accessibility standards')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('feedback', 'heading', 'Feedback')}
                </h2>
                <p>
                  {getContent('feedback', 'intro', 'We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email: {getContent('feedback', 'email', 'accessibility@justxempower.com')}</li>
                  <li>Subject line: "Accessibility Feedback"</li>
                </ul>
                <p className="mt-4">
                  {getContent('feedback', 'response', 'We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('compatibility', 'heading', 'Compatibility')}
                </h2>
                <p>
                  {getContent('compatibility', 'intro', 'Our website is designed to be compatible with the following assistive technologies:')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{getContent('compatibility', 'item1', 'Screen readers (JAWS, NVDA, VoiceOver)')}</li>
                  <li>{getContent('compatibility', 'item2', 'Screen magnification software')}</li>
                  <li>{getContent('compatibility', 'item3', 'Speech recognition software')}</li>
                  <li>{getContent('compatibility', 'item4', 'Keyboard-only navigation')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('contact', 'heading', 'Contact Us')}
                </h2>
                <p>
                  {getContent('contact', 'intro', 'If you have any questions about our accessibility efforts, please contact us:')}
                </p>
                <p className="mt-4">
                  <strong>{getContent('contact', 'companyName', 'Just Empower')}</strong><br />
                  Email: {getContent('contact', 'email', 'info@justxempower.com')}<br />
                  {getContent('contact', 'location', '')}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
