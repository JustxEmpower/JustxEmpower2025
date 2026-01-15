import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

interface ContentBlock {
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3; // For headings: h1, h2, h3
}

interface LegalPageProps {
  pageSlug: string;
  defaultTitle: string;
}

/**
 * Free-form legal page component that renders dynamic content blocks
 * Content is stored as JSON in the 'freeformContent' section with 'blocks' key
 */
export default function LegalPage({ pageSlug, defaultTitle }: LegalPageProps) {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent(pageSlug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get page title and last updated from hero section
  const title = getContent('hero', 'title', defaultTitle);
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
      const level = block.level || 2;
      const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      const headingClasses = {
        1: 'font-serif text-3xl md:text-4xl italic mb-6 text-foreground',
        2: 'font-serif text-2xl italic mb-4 text-foreground',
        3: 'font-sans text-lg font-semibold mb-2 text-foreground',
      };
      return React.createElement(HeadingTag, { key: index, className: headingClasses[level as 1 | 2 | 3] }, block.text);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>}

        <div className="prose prose-lg max-w-none">
          {blocks.length > 0 ? (
            blocks.map((block, index) => renderBlock(block, index))
          ) : (
            <p className="text-muted-foreground italic">
              No content has been added yet. Please use the Content Editor to add content to this page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
