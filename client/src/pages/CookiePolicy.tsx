import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

interface ContentBlock {
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

export default function CookiePolicy() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('cookie-policy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title and last updated from hero section
  const title = getContent('hero', 'title', 'Cookie Policy');
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
                  {getContent('whatAreCookies', 'heading', 'What Are Cookies?')}
                </h2>
                <p>
                  {getContent('whatAreCookies', 'content', 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('howWeUse', 'heading', 'How We Use Cookies')}
                </h2>
                <p>{getContent('howWeUse', 'intro', 'Just Empower uses cookies for the following purposes:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> {getContent('howWeUse', 'essential', 'Required for the website to function properly')}</li>
                  <li><strong>Performance Cookies:</strong> {getContent('howWeUse', 'performance', 'Help us understand how visitors use our website')}</li>
                  <li><strong>Functional Cookies:</strong> {getContent('howWeUse', 'functional', 'Remember your preferences and settings')}</li>
                  <li><strong>Marketing Cookies:</strong> {getContent('howWeUse', 'marketing', 'Track your activity for targeted advertising (with consent)')}</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('thirdParty', 'heading', 'Third-Party Cookies')}
                </h2>
                <p>
                  {getContent('thirdParty', 'content', 'We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('managing', 'heading', 'Managing Cookies')}
                </h2>
                <p>
                  {getContent('managing', 'content', 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('yourChoices', 'heading', 'Your Choices')}
                </h2>
                <p>
                  {getContent('yourChoices', 'content', 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or contacting us.')}
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl italic mb-4 text-foreground">
                  {getContent('contact', 'heading', 'Contact Us')}
                </h2>
                <p>
                  {getContent('contact', 'intro', 'If you have questions about our cookie practices, please contact us:')}
                </p>
                <p className="mt-4">
                  <strong>{getContent('contact', 'companyName', 'Just Empower')}</strong><br />
                  Email: {getContent('contact', 'email', 'privacy@justxempower.com')}<br />
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
