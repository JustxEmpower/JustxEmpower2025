import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function PrivacyPolicy() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('privacy-policy');

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
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Introduction</h2>
            <p>
              {getContent('introduction', 'content')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Information We Collect</h2>
            <h3 className="font-sans text-lg font-semibold mb-2">Personal Data</h3>
            <p>We may collect personally identifiable information, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
              <li>Payment information</li>
              <li>Any other information you voluntarily provide</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">How We Use Your Information</h2>
            <p>We use the information we collect for purposes including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing and improving our services</li>
              <li>Processing transactions and sending related information</li>
              <li>Sending promotional communications (with your consent)</li>
              <li>Responding to your inquiries and requests</li>
              <li>Analyzing usage patterns to improve our website</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Your Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal data</li>
              <li>The right to correct inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
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
