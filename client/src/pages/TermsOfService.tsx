import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function TermsOfService() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('terms-of-service');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS with minimal fallbacks
  const title = getContent('hero', 'title') || 'Terms of Service';
  const lastUpdated = getContent('hero', 'lastUpdated') || '';

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
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Agreement to Terms</h2>
            <p>
              {getContent('agreement', 'content') || 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Just Empower's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Disclaimer</h2>
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
              The materials appearing on Just Empower's website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current. Just Empower may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Links</h2>
            <p>
              Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Modifications</h2>
            <p>
              Just Empower may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl italic mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <p className="mt-4">
              <strong>Just Empower</strong><br />
              Email: {getContent('contact', 'email') || 'contact@justxempower.com'}<br />
              {getContent('contact', 'location') && getContent('contact', 'location')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
