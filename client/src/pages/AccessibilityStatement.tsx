import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageSectionContent } from '@/hooks/usePageSectionContent';

export default function AccessibilityStatement() {
  const [location] = useLocation();
  const { getSection, isLoading } = usePageSectionContent('accessibility');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS
  const heroContent = getSection('hero');
  const title = heroContent.title || 'Accessibility Statement';
  const lastUpdated = heroContent.lastUpdated || '';

  const contentSection = getSection('content');

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
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.commitmentHeading || 'Our Commitment'}
            </h2>
            <p>
              {contentSection.commitmentContent || 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.conformanceHeading || 'Conformance Status'}
            </h2>
            <p>
              {contentSection.conformanceContent || 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Just Empower is partially conformant with WCAG 2.1 level AA.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.measuresHeading || 'Measures We Take'}
            </h2>
            <p>{contentSection.measuresIntro || 'Just Empower takes the following measures to ensure accessibility:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.measuresItem1 || 'Include accessibility as part of our mission statement'}</li>
              <li>{contentSection.measuresItem2 || 'Integrate accessibility into our procurement practices'}</li>
              <li>{contentSection.measuresItem3 || 'Provide continual accessibility training for our staff'}</li>
              <li>{contentSection.measuresItem4 || 'Include people with disabilities in our design personas'}</li>
              <li>{contentSection.measuresItem5 || 'Use clear and consistent navigation throughout the website'}</li>
              <li>{contentSection.measuresItem6 || 'Provide text alternatives for non-text content'}</li>
              <li>{contentSection.measuresItem7 || 'Ensure sufficient color contrast'}</li>
              <li>{contentSection.measuresItem8 || 'Make all functionality available from a keyboard'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.featuresHeading || 'Accessibility Features'}
            </h2>
            <p>{contentSection.featuresIntro || 'Our website includes the following accessibility features:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Keyboard Navigation:</strong> {contentSection.featuresKeyboard || 'All interactive elements can be accessed using a keyboard'}</li>
              <li><strong>Screen Reader Compatibility:</strong> {contentSection.featuresScreenReader || 'Our site is compatible with popular screen readers'}</li>
              <li><strong>Alt Text:</strong> {contentSection.featuresAltText || 'Images include descriptive alternative text'}</li>
              <li><strong>Resizable Text:</strong> {contentSection.featuresResizableText || 'Text can be resized without loss of content or functionality'}</li>
              <li><strong>Color Contrast:</strong> {contentSection.featuresColorContrast || 'We maintain sufficient contrast between text and backgrounds'}</li>
              <li><strong>Focus Indicators:</strong> {contentSection.featuresFocusIndicators || 'Visible focus indicators for keyboard navigation'}</li>
              <li><strong>Skip Links:</strong> {contentSection.featuresSkipLinks || 'Skip navigation links for screen reader users'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.limitationsHeading || 'Known Limitations'}
            </h2>
            <p>
              {contentSection.limitationsIntro || 'Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.limitationsItem1 || 'Some older PDF documents may not be fully accessible'}</li>
              <li>{contentSection.limitationsItem2 || 'Some video content may not have captions (we are working to add them)'}</li>
              <li>{contentSection.limitationsItem3 || 'Some third-party content may not meet accessibility standards'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.feedbackHeading || 'Feedback'}
            </h2>
            <p>
              {contentSection.feedbackIntro || 'We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: {contentSection.feedbackEmail || 'accessibility@justxempower.com'}</li>
              <li>Subject line: "Accessibility Feedback"</li>
            </ul>
            <p className="mt-4">
              {contentSection.feedbackResponse || 'We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.compatibilityHeading || 'Compatibility'}
            </h2>
            <p>
              {contentSection.compatibilityIntro || 'Our website is designed to be compatible with the following assistive technologies:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.compatibilityItem1 || 'Screen readers (JAWS, NVDA, VoiceOver)'}</li>
              <li>{contentSection.compatibilityItem2 || 'Screen magnification software'}</li>
              <li>{contentSection.compatibilityItem3 || 'Speech recognition software'}</li>
              <li>{contentSection.compatibilityItem4 || 'Keyboard-only navigation'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.contactHeading || 'Contact Us'}
            </h2>
            <p>
              {contentSection.contactIntro || 'If you have any questions about our accessibility efforts, please contact us:'}
            </p>
            <p className="mt-4">
              <strong>{contentSection.contactCompanyName || 'Just Empower'}</strong><br />
              Email: {contentSection.contactEmail || 'info@justxempower.com'}<br />
              {contentSection.contactLocation || ''}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
