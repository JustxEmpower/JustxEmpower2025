import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { BlockRenderer } from './page-builder/BlockRenderer';

interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
  settings?: Record<string, unknown>;
}

interface PageZoneProps {
  pageSlug: string;
  zoneName: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * PageZone component renders Page Builder blocks in a specific zone
 * of an existing React page. This enables hybrid editing where existing
 * pages keep their structure but can have dynamic blocks injected.
 * 
 * Usage:
 * <PageZone pageSlug="home" zoneName="after-hero" />
 * <PageZone pageSlug="about" zoneName="before-footer" />
 */
export function PageZone({ pageSlug, zoneName, className = '', fallback }: PageZoneProps) {
  const { data: zone, isLoading, error } = trpc.pageZones.getZone.useQuery(
    { pageSlug, zoneName },
    { 
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false 
    }
  );

  if (isLoading) {
    return fallback || null;
  }

  if (error || !zone || !zone.isActive) {
    return fallback || null;
  }

  // Parse blocks from JSON
  let blocks: PageBlock[] = [];
  try {
    blocks = zone.blocks ? JSON.parse(zone.blocks) : [];
  } catch (e) {
    console.error(`[PageZone] Failed to parse blocks for ${pageSlug}/${zoneName}:`, e);
    return fallback || null;
  }

  if (blocks.length === 0) {
    return fallback || null;
  }

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={`page-zone page-zone-${zoneName} ${className}`} data-zone={zoneName}>
      {sortedBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isPreviewMode={true}
        />
      ))}
    </div>
  );
}

/**
 * EditablePageZone shows an edit button for admins to open Page Builder
 * for the specific zone
 */
export function EditablePageZone({ 
  pageSlug, 
  zoneName, 
  className = '',
  fallback,
  showEditButton = true 
}: PageZoneProps & { showEditButton?: boolean }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if admin token exists
    const token = localStorage.getItem('adminToken');
    setIsAdmin(!!token);
  }, []);

  return (
    <div className="relative group">
      <PageZone 
        pageSlug={pageSlug} 
        zoneName={zoneName} 
        className={className}
        fallback={fallback}
      />
      
      {isAdmin && showEditButton && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <a
            href={`/admin/zone-editor/${pageSlug}/${zoneName}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Zone
          </a>
        </div>
      )}
    </div>
  );
}

export default PageZone;
