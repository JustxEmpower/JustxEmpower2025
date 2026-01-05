import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageSectionContent } from '@/hooks/usePageSectionContent';

export default function CookiePolicy() {
  const [location] = useLocation();
  const { getSection, isLoading } = usePageSectionContent('cookie-policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS
  const heroContent = getSection('hero');
  const title = heroContent.title || 'Cookie Policy';
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
              {contentSection.whatAreCookiesHeading || 'What Are Cookies?'}
            </h2>
            <p>
              {contentSection.whatAreCookiesContent || 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.howWeUseHeading || 'How We Use Cookies'}
            </h2>
            <p>{contentSection.howWeUseIntro || 'Just Empower uses cookies for the following purposes:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> {contentSection.howWeUseEssential || 'Required for the website to function properly'}</li>
              <li><strong>Performance Cookies:</strong> {contentSection.howWeUsePerformance || 'Help us understand how visitors use our website'}</li>
              <li><strong>Functional Cookies:</strong> {contentSection.howWeUseFunctional || 'Remember your preferences and settings'}</li>
              <li><strong>Marketing Cookies:</strong> {contentSection.howWeUseMarketing || 'Track your activity for targeted advertising (with consent)'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.thirdPartyHeading || 'Third-Party Cookies'}
            </h2>
            <p>
              {contentSection.thirdPartyContent || 'We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.managingHeading || 'Managing Cookies'}
            </h2>
            <p>
              {contentSection.managingContent || 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.yourChoicesHeading || 'Your Choices'}
            </h2>
            <p>
              {contentSection.yourChoicesContent || 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or contacting us.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.contactHeading || 'Contact Us'}
            </h2>
            <p>
              {contentSection.contactIntro || 'If you have questions about our cookie practices, please contact us:'}
            </p>
            <p className="mt-4">
              <strong>{contentSection.contactCompanyName || 'Just Empower'}</strong><br />
              Email: {contentSection.contactEmail || 'privacy@justxempower.com'}<br />
              {contentSection.contactLocation || ''}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
