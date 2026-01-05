import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageSectionContent } from '@/hooks/usePageSectionContent';

export default function PrivacyPolicy() {
  const [location] = useLocation();
  const { getSection, isLoading } = usePageSectionContent('privacy-policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS
  const heroContent = getSection('hero');
  const title = heroContent.title || 'Privacy Policy';
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
              {contentSection.introductionHeading || 'Introduction'}
            </h2>
            <p>
              {contentSection.introductionContent || 'Just Empower ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.informationCollectHeading || 'Information We Collect'}
            </h2>
            <h3 className="font-sans text-lg font-semibold mb-2">
              {contentSection.informationCollectSubheading || 'Personal Data'}
            </h3>
            <p>{contentSection.informationCollectIntro || 'We may collect personally identifiable information, such as:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.informationCollectItem1 || 'Name and email address'}</li>
              <li>{contentSection.informationCollectItem2 || 'Phone number'}</li>
              <li>{contentSection.informationCollectItem3 || 'Mailing address'}</li>
              <li>{contentSection.informationCollectItem4 || 'Payment information'}</li>
              <li>{contentSection.informationCollectItem5 || 'Any other information you voluntarily provide'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.howWeUseHeading || 'How We Use Your Information'}
            </h2>
            <p>{contentSection.howWeUseIntro || 'We use the information we collect for purposes including:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.howWeUseItem1 || 'Providing and improving our services'}</li>
              <li>{contentSection.howWeUseItem2 || 'Processing transactions and sending related information'}</li>
              <li>{contentSection.howWeUseItem3 || 'Sending promotional communications (with your consent)'}</li>
              <li>{contentSection.howWeUseItem4 || 'Responding to your inquiries and requests'}</li>
              <li>{contentSection.howWeUseItem5 || 'Analyzing usage patterns to improve our website'}</li>
              <li>{contentSection.howWeUseItem6 || 'Complying with legal obligations'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.dataSecurityHeading || 'Data Security'}
            </h2>
            <p>
              {contentSection.dataSecurityContent || 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.yourRightsHeading || 'Your Rights'}
            </h2>
            <p>{contentSection.yourRightsIntro || 'Depending on your location, you may have certain rights regarding your personal information, including:'}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{contentSection.yourRightsItem1 || 'The right to access your personal data'}</li>
              <li>{contentSection.yourRightsItem2 || 'The right to correct inaccurate data'}</li>
              <li>{contentSection.yourRightsItem3 || 'The right to request deletion of your data'}</li>
              <li>{contentSection.yourRightsItem4 || 'The right to opt-out of marketing communications'}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {contentSection.contactHeading || 'Contact Us'}
            </h2>
            <p>
              {contentSection.contactIntro || 'If you have questions about this Privacy Policy or our privacy practices, please contact us:'}
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
