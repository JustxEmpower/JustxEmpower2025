import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

interface ContentBlock {
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

export default function TermsOfService() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('terms-of-service');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title and last updated from hero section
  const title = getContent('hero', 'title', 'Terms of Service');
  const lastUpdated = getContent('hero', 'lastUpdated', '');

  // Get free-form content blocks
  const blocksJson = getContent('freeformContent', 'blocks', '[]');
  
  // Parse the blocks JSON
  const blocks: ContentBlock[] = useMemo(() => {
    try {
      const parsed = JSON.parse(blocksJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse content blocks:', e);
      return [];
    }
  }, [blocksJson]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Render a content block
  const renderBlock = (block: ContentBlock, index: number) => {
    if (block.type === 'heading') {
      const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        1: 'font-serif text-3xl md:text-4xl italic mb-6 text-foreground',
        2: 'font-serif text-2xl italic mb-4 text-foreground',
        3: 'font-sans text-lg font-semibold mb-2 text-foreground',
      };
      return (
        <HeadingTag key={index} className={headingClasses[block.level || 2]}>
          {block.text}
        </HeadingTag>
      );
    }

    if (block.type === 'paragraph') {
      return (
        <p key={index} className="mb-4 text-foreground/80 leading-relaxed">
          {block.text}
        </p>
      );
    }

    return null;
  };

  // Check if we have free-form content or should show default
  const hasFreeformContent = blocks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>}

        <div className="prose prose-lg max-w-none">
          {hasFreeformContent ? (
            // Render free-form content blocks
            blocks.map((block, index) => renderBlock(block, index))
          ) : (
            // Default content when no free-form blocks exist
            <div className="text-foreground/80 space-y-8">
              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('agreement', 'heading', 'Agreement to Terms')}
                </h2>
                <p>
                  {getContent('agreement', 'content', 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('useLicense', 'heading', 'Use License')}
                </h2>
                <p>
                  {getContent('useLicense', 'intro', 'Permission is granted to temporarily download one copy of the materials (information or software) on Just Empower\'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{getContent('useLicense', 'item1', 'Modify or copy the materials')}</li>
                  <li>{getContent('useLicense', 'item2', 'Use the materials for any commercial purpose or for any public display')}</li>
                  <li>{getContent('useLicense', 'item3', 'Attempt to decompile or reverse engineer any software contained on the website')}</li>
                  <li>{getContent('useLicense', 'item4', 'Remove any copyright or other proprietary notations from the materials')}</li>
                  <li>{getContent('useLicense', 'item5', 'Transfer the materials to another person or "mirror" the materials on any other server')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('disclaimer', 'heading', 'Disclaimer')}
                </h2>
                <p>
                  {getContent('disclaimer', 'content', 'The materials on Just Empower\'s website are provided on an \'as is\' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('limitations', 'heading', 'Limitations')}
                </h2>
                <p>
                  {getContent('limitations', 'content', 'In no event shall Just Empower or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Just Empower\'s website.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('accuracy', 'heading', 'Accuracy of Materials')}
                </h2>
                <p>
                  {getContent('accuracy', 'content', 'The materials appearing on Just Empower\'s website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current. Just Empower may make changes to the materials contained on its website at any time without notice.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('links', 'heading', 'Links')}
                </h2>
                <p>
                  {getContent('links', 'content', 'Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site. Use of any such linked website is at the user\'s own risk.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('modifications', 'heading', 'Modifications')}
                </h2>
                <p>
                  {getContent('modifications', 'content', 'Just Empower may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('governingLaw', 'heading', 'Governing Law')}
                </h2>
                <p>
                  {getContent('governingLaw', 'content', 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('contact', 'heading', 'Contact Us')}
                </h2>
                <p>
                  {getContent('contact', 'intro', 'If you have any questions about these Terms of Service, please contact us:')}
                </p>
                <p className="mt-4">
                  <strong>{getContent('contact', 'companyName', 'Just Empower')}</strong><br />
                  Email: {getContent('contact', 'email', 'legal@justxempower.com')}<br />
                  {getContent('contact', 'location', '')}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
