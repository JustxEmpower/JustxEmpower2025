import { useState, useEffect, useCallback } from 'react';

/**
 * Page ID mapping for all pages in the CMS
 * These IDs correspond to the pageId in the pageSections table
 */
export const PAGE_IDS = {
  home: 18,
  philosophy: 2,
  founder: 3,
  'vision-ethos': 5,
  offerings: 6,
  'workshops-programs': 7,
  'vix-journal-trilogy': 8,
  'vi-x-journal-trilogy': 19,
  blog: 20,
  'blog-she-writes': 9,
  shop: 10,
  'community-events': 1,
  resources: 12,
  'walk-with-us': 13,
  contact: 14,
  'rooted-unity': 15,
  overview: 16,
  about: 21,
  'about-justxempower': 22,
  accessibility: 23,
  'privacy-policy': 24,
  'terms-of-service': 25,
  'cookie-policy': 26,
} as const;

export type PageSlug = keyof typeof PAGE_IDS;

interface SectionContent {
  id: number;
  pageId: number;
  sectionType: string;
  sectionOrder: number;
  title: string | null;
  content: Record<string, any>;
  requiredFields: string[];
  isVisible: number;
}

interface UsePageSectionContentReturn {
  /** Get content for a specific section by type */
  getSection: (sectionType: string) => Record<string, any>;
  /** Get a specific field from a section */
  getField: (sectionType: string, fieldName: string, defaultValue?: string) => string;
  /** All sections for this page */
  sections: SectionContent[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch content from database */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch page section content from the database for frontend rendering
 * This is the primary hook for making pages 100% database-driven
 * 
 * @param pageSlug - The page slug (e.g., 'home', 'philosophy', 'founder')
 * @returns Object with getSection, getField helpers and loading/error states
 */
export function usePageSectionContent(pageSlug: PageSlug): UsePageSectionContentReturn {
  const [sections, setSections] = useState<SectionContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const pageId = PAGE_IDS[pageSlug];

  const fetchSections = useCallback(async () => {
    if (!pageId) {
      setError(new Error(`Unknown page slug: ${pageSlug}`));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // IMPORTANT: tRPC with superjson requires input wrapped in {"json": {...}}
      const inputData = JSON.stringify({ json: { pageId } });
      const response = await fetch(
        `/api/trpc/pageSections.getByPage?input=${encodeURIComponent(inputData)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.statusText}`);
      }

      const data = await response.json();
      
      // tRPC superjson response has data in result.data.json
      if (data.result?.data?.json) {
        setSections(data.result.data.json);
      } else if (data.result?.data) {
        // Fallback for non-superjson response
        setSections(data.result.data);
      } else if (data.error) {
        throw new Error(data.error.json?.message || data.error.message || 'Failed to fetch sections');
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error('Error fetching page sections:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sections'));
    } finally {
      setIsLoading(false);
    }
  }, [pageId, pageSlug]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  /**
   * Get all content for a specific section type
   * Returns empty object if section not found
   */
  const getSection = useCallback((sectionType: string): Record<string, any> => {
    const section = sections.find(s => s.sectionType === sectionType);
    return section?.content || {};
  }, [sections]);

  /**
   * Get a specific field from a section
   * Returns defaultValue if section or field not found
   */
  const getField = useCallback((sectionType: string, fieldName: string, defaultValue: string = ''): string => {
    const section = sections.find(s => s.sectionType === sectionType);
    if (!section?.content) return defaultValue;
    
    const value = section.content[fieldName];
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return String(value);
  }, [sections]);

  return {
    getSection,
    getField,
    sections,
    isLoading,
    error,
    refetch: fetchSections,
  };
}

/**
 * Utility function to get proper media URL
 * Handles both absolute URLs and relative paths
 */
export function getProperMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // For relative paths, prepend the CloudFront or S3 base URL
  // This assumes media is stored in S3 and served via CloudFront
  return url;
}
