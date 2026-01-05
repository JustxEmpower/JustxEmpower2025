import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function PrivacyPolicy() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('privacy-policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS
  const title = getContent('hero', 'title', 'Privacy Policy');
  const lastUpdated = getContent('hero', 'lastUpdated', '');

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
              {getContent('introduction', 'heading', 'Introduction')}
            </h2>
            <p>
              {getContent('introduction', 'content', 'Just Empower ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {getContent('informationCollect', 'heading', 'Information We Collect')}
            </h2>
            <h3 className="font-sans text-lg font-semibold mb-2">
              {getContent('informationCollect', 'subheading', 'Personal Data')}
            </h3>
            <p>{getContent('informationCollect', 'intro', 'We may collect personally identifiable information, such as:')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{getContent('informationCollect', 'item1', 'Name and email address')}</li>
              <li>{getContent('informationCollect', 'item2', 'Phone number')}</li>
              <li>{getContent('informationCollect', 'item3', 'Mailing address')}</li>
              <li>{getContent('informationCollect', 'item4', 'Payment information')}</li>
              <li>{getContent('informationCollect', 'item5', 'Any other information you voluntarily provide')}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {getContent('howWeUse', 'heading', 'How We Use Your Information')}
            </h2>
            <p>{getContent('howWeUse', 'intro', 'We use the information we collect for purposes including:')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{getContent('howWeUse', 'item1', 'Providing and improving our services')}</li>
              <li>{getContent('howWeUse', 'item2', 'Processing transactions and sending related information')}</li>
              <li>{getContent('howWeUse', 'item3', 'Sending promotional communications (with your consent)')}</li>
              <li>{getContent('howWeUse', 'item4', 'Responding to your inquiries and requests')}</li>
              <li>{getContent('howWeUse', 'item5', 'Analyzing usage patterns to improve our website')}</li>
              <li>{getContent('howWeUse', 'item6', 'Complying with legal obligations')}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {getContent('dataSecurity', 'heading', 'Data Security')}
            </h2>
            <p>
              {getContent('dataSecurity', 'content', 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {getContent('yourRights', 'heading', 'Your Rights')}
            </h2>
            <p>{getContent('yourRights', 'intro', 'Depending on your location, you may have certain rights regarding your personal information, including:')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{getContent('yourRights', 'item1', 'The right to access your personal data')}</li>
              <li>{getContent('yourRights', 'item2', 'The right to correct inaccurate data')}</li>
              <li>{getContent('yourRights', 'item3', 'The right to request deletion of your data')}</li>
              <li>{getContent('yourRights', 'item4', 'The right to opt-out of marketing communications')}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">
              {getContent('contact', 'heading', 'Contact Us')}
            </h2>
            <p>
              {getContent('contact', 'intro', 'If you have questions about this Privacy Policy or our privacy practices, please contact us:')}
            </p>
            <p className="mt-4">
              <strong>{getContent('contact', 'companyName', 'Just Empower')}</strong><br />
              Email: {getContent('contact', 'email', 'privacy@justxempower.com')}<br />
              {getContent('contact', 'location', '')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
