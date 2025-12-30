import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function TermsOfService() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: December 28, 2025</p>

        <div className="prose prose-lg max-w-none text-foreground/80 space-y-8">
          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Agreement to Terms</h2>
            <p>
              By accessing or using the Just Empower website (justxempower.com), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on Just Empower's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Products and Services</h2>
            <p>
              All products and services offered through our website are subject to availability. We reserve the right to discontinue any product or service at any time without notice.
            </p>
            <p className="mt-4">
              Prices for our products and services are subject to change without notice. We reserve the right to modify or discontinue any product or service without notice at any time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Event Registration and Tickets</h2>
            <p>
              When you register for an event or purchase tickets through our website:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You agree to provide accurate registration information</li>
              <li>Tickets are non-transferable unless otherwise stated</li>
              <li>Refund policies vary by event and will be clearly stated at the time of purchase</li>
              <li>We reserve the right to refuse entry or cancel registrations at our discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Warranty Disclaimer</h2>
            <p>
              The materials on Just Empower's website are provided on an 'as is' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Limitations</h2>
            <p>
              In no event shall Just Empower or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Just Empower's website.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Accuracy of Materials</h2>
            <p>
              The materials appearing on Just Empower's website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Links</h2>
            <p>
              Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the State of Texas, and you irrevocably submit to the exclusive jurisdiction of the courts in that State.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
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
