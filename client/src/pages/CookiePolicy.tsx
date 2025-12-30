import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function CookiePolicy() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: December 28, 2025</p>

        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">How We Use Cookies</h2>
            <p>Just Empower uses cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.</li>
              <li><strong>Analytics Cookies:</strong> We use analytics cookies to understand how visitors interact with our website, helping us improve our services.</li>
              <li><strong>Functional Cookies:</strong> These cookies enable enhanced functionality and personalization, such as remembering your preferences.</li>
              <li><strong>Marketing Cookies:</strong> These cookies may be set through our site by our advertising partners to build a profile of your interests.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Types of Cookies We Use</h2>
            
            <h3 className="font-sans text-lg font-semibold mb-2">Essential Cookies</h3>
            <table className="w-full border-collapse border border-border mb-6">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Cookie Name</th>
                  <th className="border border-border p-2 text-left">Purpose</th>
                  <th className="border border-border p-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2">session</td>
                  <td className="border border-border p-2">Maintains user session state</td>
                  <td className="border border-border p-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">cart</td>
                  <td className="border border-border p-2">Stores shopping cart contents</td>
                  <td className="border border-border p-2">7 days</td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-sans text-lg font-semibold mb-2">Analytics Cookies</h3>
            <table className="w-full border-collapse border border-border mb-6">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Cookie Name</th>
                  <th className="border border-border p-2 text-left">Purpose</th>
                  <th className="border border-border p-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2">_ga</td>
                  <td className="border border-border p-2">Google Analytics - distinguishes users</td>
                  <td className="border border-border p-2">2 years</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">_gid</td>
                  <td className="border border-border p-2">Google Analytics - distinguishes users</td>
                  <td className="border border-border p-2">24 hours</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website and deliver advertisements on and through the website. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>Google Analytics:</strong> For website analytics</li>
              <li><strong>Social Media:</strong> For social sharing functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may impact your overall user experience.
            </p>
            <p className="mt-4">
              To manage cookies in your browser:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Your Consent</h2>
            <p>
              By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by clearing cookies from your browser and adjusting your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us:
            </p>
            <p className="mt-4">
              <strong>Just Empower</strong><br />
              Email: connect@justxempower.com<br />
              Austin, Texas
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
