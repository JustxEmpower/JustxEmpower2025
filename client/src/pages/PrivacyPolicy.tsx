import LegalPageRenderer from '@/components/LegalPageRenderer';

// Default content for Privacy Policy when no dynamic sections exist
const DefaultPrivacyContent = () => (
  <div className="text-foreground/80 space-y-8">
    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Introduction</h2>
      <p>Just Empower ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Personal Information:</strong> Name, email address, and other contact details you provide</li>
        <li><strong>Usage Data:</strong> Information about how you use our website</li>
        <li><strong>Technical Data:</strong> IP address, browser type, and device information</li>
        <li><strong>Cookies:</strong> Data collected through cookies and similar technologies</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Provide and maintain our services</li>
        <li>Communicate with you about updates and offerings</li>
        <li>Improve our website and user experience</li>
        <li>Comply with legal obligations</li>
        <li>Protect against fraud and unauthorized access</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Data Sharing</h2>
      <p>We do not sell your personal information. We may share your data with:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Service providers who assist in our operations</li>
        <li>Legal authorities when required by law</li>
        <li>Business partners with your consent</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Your Rights</h2>
      <p>You have the right to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Opt out of marketing communications</li>
        <li>Lodge a complaint with a supervisory authority</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
      <p>If you have questions about this privacy policy, please contact us:</p>
      <p className="mt-4">
        <strong>Just Empower</strong><br />
        Email: privacy@justxempower.com
      </p>
    </section>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <LegalPageRenderer 
      pageKey="privacy-policy"
      defaultTitle="Privacy Policy"
      defaultContent={<DefaultPrivacyContent />}
    />
  );
}
