import LegalPageRenderer from '@/components/LegalPageRenderer';

// Default content for Terms of Service when no dynamic sections exist
const DefaultTermsContent = () => (
  <div className="text-foreground/80 space-y-8">
    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Agreement to Terms</h2>
      <p>By accessing and using the Just Empower website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Use License</h2>
      <p>Permission is granted to temporarily access the materials on Just Empower's website for personal, non-commercial use only. This license does not include:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Modifying or copying the materials</li>
        <li>Using the materials for commercial purposes</li>
        <li>Attempting to reverse engineer any software on the website</li>
        <li>Removing any copyright or proprietary notations</li>
        <li>Transferring the materials to another person</li>
      </ul>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Disclaimer</h2>
      <p>The materials on Just Empower's website are provided on an 'as is' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Limitations</h2>
      <p>In no event shall Just Empower or its suppliers be liable for any damages arising out of the use or inability to use the materials on Just Empower's website, even if Just Empower has been notified of the possibility of such damage.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Accuracy of Materials</h2>
      <p>The materials appearing on Just Empower's website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Links</h2>
      <p>Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Modifications</h2>
      <p>Just Empower may revise these terms of service at any time without notice. By using this website, you agree to be bound by the current version of these terms of service.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
    </section>

    <section>
      <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
      <p>If you have questions about these Terms of Service, please contact us:</p>
      <p className="mt-4">
        <strong>Just Empower</strong><br />
        Email: legal@justxempower.com
      </p>
    </section>
  </div>
);

export default function TermsOfService() {
  return (
    <LegalPageRenderer 
      pageKey="terms-of-service"
      defaultTitle="Terms of Service"
      defaultContent={<DefaultTermsContent />}
    />
  );
}
