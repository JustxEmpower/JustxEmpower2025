import React from 'react';
import PageBuilder from '@/components/page-builder/PageBuilder';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function PageBuilderPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-500">Loading page builder...</p>
        </div>
      </div>
    );
  }

  // For now, allow access without auth for demo purposes
  // In production, you'd want to check user?.role === 'admin'

  const handleSave = async (blocks: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>) => {
    // TODO: Implement actual save to backend
    console.log('Saving blocks:', blocks);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  // Demo initial blocks
  const demoBlocks = [
    {
      id: 'demo-hero',
      type: 'hero',
      content: {
        headline: 'Build Beautiful Pages',
        subheadline: 'Drag and drop blocks to create stunning pages in minutes',
        ctaText: 'Get Started',
        ctaLink: '#',
        variant: 'centered',
        overlay: false,
      },
      order: 0,
    },
    {
      id: 'demo-features',
      type: 'feature-grid',
      content: {
        heading: 'Why Choose Our Builder?',
        features: [
          { icon: 'zap', title: 'Fast & Easy', description: 'Build pages in minutes with drag and drop' },
          { icon: 'shield', title: 'No Code Required', description: 'Visual editing for everyone' },
          { icon: 'sparkles', title: '50+ Blocks', description: 'Everything you need to build any page' },
        ],
        columns: 3,
      },
      order: 1,
    },
    {
      id: 'demo-cta',
      type: 'cta',
      content: {
        heading: 'Ready to Get Started?',
        description: 'Start building your page today with our visual builder.',
        primaryButton: { text: 'Start Building', link: '#' },
        secondaryButton: { text: 'Learn More', link: '#' },
        variant: 'centered',
      },
      order: 2,
    },
  ];

  return (
    <PageBuilder
      pageId="demo-page"
      initialBlocks={demoBlocks}
      onSave={handleSave}
    />
  );
}
