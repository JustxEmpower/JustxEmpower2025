import LegalPageRenderer from '@/components/LegalPageRenderer';

// Default content for Cookie Policy when no dynamic sections exist
const DefaultCookieContent = () => (
  <div className="text-foreground/80 space-y-8">
    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">What Are Cookies</h2>
      <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">How We Use Cookies</h2>
      <p>Just Empower uses cookies for the following purposes:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
        <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
        <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Types of Cookies We Use</h2>
      <p>We use both session cookies (which expire when you close your browser) and persistent cookies (which remain on your device for a set period or until you delete them).</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Third-Party Cookies</h2>
      <p>Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third-party cookies may include:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Google Analytics for website analytics</li>
        <li>Social media platforms for sharing functionality</li>
        <li>Payment processors for secure transactions</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Managing Cookies</h2>
      <p>You can control and manage cookies in various ways:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Browser settings: Most browsers allow you to refuse or accept cookies</li>
        <li>Third-party tools: Various opt-out tools are available online</li>
        <li>Our cookie banner: Use our cookie consent tool when you first visit</li>
      </ul>
      <p className="mt-4">Please note that disabling cookies may affect the functionality of our website.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Updates to This Policy</h2>
      <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
      <p>If you have questions about our use of cookies, please contact us:</p>
      <p className="mt-4">
        <strong>Just Empower</strong><br />
        Email: privacy@justxempower.com
      </p>
    </section>
  </div>
);

export default function CookiePolicy() {
  return (
    <LegalPageRenderer 
      pageKey="cookie-policy"
      defaultTitle="Cookie Policy"
      defaultContent={<DefaultCookieContent />}
    />
  );
}
