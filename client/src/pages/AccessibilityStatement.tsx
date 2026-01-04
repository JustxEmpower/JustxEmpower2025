import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function AccessibilityStatement() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('accessibility');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS with minimal fallbacks
  const title = getContent('hero', 'title');
  const lastUpdated = getContent('hero', 'lastUpdated');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>}

        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Our Commitment</h2>
            <p>
              {getContent('commitment', 'content')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Conformance Status</h2>
            <p>
              {getContent('conformance', 'content')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Measures We Take</h2>
            <p>Just Empower takes the following measures to ensure accessibility:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Include accessibility as part of our mission statement</li>
              <li>Integrate accessibility into our procurement practices</li>
              <li>Provide continual accessibility training for our staff</li>
              <li>Include people with disabilities in our design personas</li>
              <li>Use clear and consistent navigation throughout the website</li>
              <li>Provide text alternatives for non-text content</li>
              <li>Ensure sufficient color contrast</li>
              <li>Make all functionality available from a keyboard</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Accessibility Features</h2>
            <p>Our website includes the following accessibility features:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Keyboard Navigation:</strong> All interactive elements can be accessed using a keyboard</li>
              <li><strong>Screen Reader Compatibility:</strong> Our site is compatible with popular screen readers</li>
              <li><strong>Alt Text:</strong> Images include descriptive alternative text</li>
              <li><strong>Resizable Text:</strong> Text can be resized without loss of content or functionality</li>
              <li><strong>Color Contrast:</strong> We maintain sufficient contrast between text and backgrounds</li>
              <li><strong>Focus Indicators:</strong> Visible focus indicators for keyboard navigation</li>
              <li><strong>Skip Links:</strong> Skip navigation links for screen reader users</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Known Limitations</h2>
            <p>
              Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some older PDF documents may not be fully accessible</li>
              <li>Some video content may not have captions (we are working to add them)</li>
              <li>Some third-party content may not meet accessibility standards</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: {getContent('feedback', 'email')}</li>
              <li>Subject line: "Accessibility Feedback"</li>
            </ul>
            <p className="mt-4">
              We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Compatibility</h2>
            <p>
              Our website is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Screen readers (JAWS, NVDA, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have any questions about our accessibility efforts, please contact us:
            </p>
            <p className="mt-4">
              <strong>Just Empower</strong><br />
              Email: {getContent('contact', 'email')}<br />
              {getContent('contact', 'location') && getContent('contact', 'location')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
