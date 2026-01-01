import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function PrivacyPolicy() {
  const [location] = useLocation();
  
  // Fetch content from database
  const { data: contentData, isLoading } = trpc.content.getByPage.useQuery({ page: 'privacy-policy' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Helper to get content value by key
  const getContent = (key: string, defaultValue: string = '') => {
    const item = contentData?.find((c: any) => c.contentKey === key);
    return item?.contentValue || defaultValue;
  };

  // Default values
  const title = getContent('title', 'Privacy Policy');
  const lastUpdated = getContent('lastUpdated', 'December 2024');

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
        <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Introduction</h2>
            <p>
              {getContent('introduction', 'Just Empower ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website justxempower.com, including any other media form, media channel, mobile website, or mobile application related or connected thereto.')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Information We Collect</h2>
            <h3 className="font-sans text-lg font-semibold mb-2">Personal Data</h3>
            <p>We may collect personally identifiable information, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>

            <h3 className="font-sans text-lg font-semibold mb-2 mt-6">Derivative Data</h3>
            <p>
              Information our servers automatically collect when you access the site, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Use of Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process transactions and send related information</li>
              <li>Send you newsletters and marketing communications (with your consent)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Improve our website and services</li>
              <li>Monitor and analyze usage and trends</li>
              <li>Prevent fraudulent transactions and protect against criminal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Disclosure of Your Information</h2>
            <p>We may share information we have collected about you in certain situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>By Law or to Protect Rights:</strong> If we believe disclosure is necessary to comply with the law or protect our rights.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us (payment processing, email delivery, analytics).</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Security of Your Information</h2>
            <p>
              {getContent('security', 'We use administrative, technical, and physical security measures to protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.')}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Just Empower</strong><br />
              Email: {getContent('contactEmail', 'connect@justxempower.com')}<br />
              {getContent('location', 'Austin, Texas')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
