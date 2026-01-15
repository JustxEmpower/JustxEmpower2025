import { useState, useEffect } from 'react';
import { PageSection, SectionType, getDefaultSections } from '@/components/admin/PageSectionMapper';

interface RawSection {
  id: number;
  pageId: number;
  sectionType: string;
  sectionOrder: number;
  title: string | null;
  content: Record<string, any>;
  requiredFields: string[];
  isVisible: number;
}

interface CompletenessData {
  pageId: number;
  totalSections: number;
  overallCompleteness: number;
  sections: Array<{
    id: number;
    sectionType: string;
    completeness: number;
    filledFields: string[];
    missingFields: string[];
  }>;
}

/**
 * Hook to fetch page sections from the database
 * Falls back to static defaults if no sections exist in the database
 */
export function usePageSections(pageSlug: string, pageId?: number) {
  const [rawSections, setRawSections] = useState<RawSection[]>([]);
  const [completenessData, setCompletenessData] = useState<CompletenessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSections() {
      setIsLoading(true);
      setError(null);
      
      try {
        let sections: RawSection[] = [];
        
        // Try to fetch by pageId first
        if (pageId && pageId > 0) {
          const response = await fetch(`/api/trpc/pageSections.getByPage?input=${encodeURIComponent(JSON.stringify({ json: { pageId } }))}`);
          const data = await response.json();
          if (data.result?.data?.json) {
            sections = data.result.data.json;
          } else if (data.result?.data) {
            sections = data.result.data;
          }
          
          // Also fetch completeness data
          const completenessResponse = await fetch(`/api/trpc/pageSections.getPageCompleteness?input=${encodeURIComponent(JSON.stringify({ json: { pageId } }))}`);
          const completenessResult = await completenessResponse.json();
          if (completenessResult.result?.data?.json) {
            setCompletenessData(completenessResult.result.data.json);
          } else if (completenessResult.result?.data) {
            setCompletenessData(completenessResult.result.data);
          }
        } else if (pageSlug) {
          // Fallback to slug
          const response = await fetch(`/api/trpc/pageSections.getByPageSlug?input=${encodeURIComponent(JSON.stringify({ json: { slug: pageSlug } }))}`);
          const data = await response.json();
          if (data.result?.data?.json) {
            sections = data.result.data.json;
          } else if (data.result?.data) {
            sections = data.result.data;
          }
        }
        
        setRawSections(sections);
      } catch (err) {
        console.error('Error fetching page sections:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch sections'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSections();
  }, [pageId, pageSlug]);

  // Convert database sections to PageSection format
  const sections: PageSection[] = rawSections.length > 0
    ? rawSections.map((section) => {
        // Find completeness data for this section
        const sectionCompleteness = completenessData?.sections?.find(
          (s) => s.id === section.id
        );

        return {
          id: section.id.toString(),
          type: section.sectionType as SectionType,
          label: section.title || section.sectionType,
          contentKey: section.sectionType,
          hasContent: Object.keys(section.content || {}).length > 0,
          fields: section.requiredFields || [],
          completeness: sectionCompleteness?.completeness ?? 0,
          requiredFields: section.requiredFields || [],
          missingFields: sectionCompleteness?.missingFields || [],
        };
      })
    : getDefaultSections(pageSlug);

  return {
    sections,
    isLoading,
    hasDbSections: rawSections.length > 0,
    completenessData,
    error,
  };
}

/**
 * Hook to get a single section by ID
 */
export function usePageSection(sectionId: number) {
  const [section, setSection] = useState<RawSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSection() {
      if (!sectionId || sectionId <= 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/trpc/pageSections.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: sectionId } }))}`);
        const data = await response.json();
        if (data.result?.data?.json) {
          setSection(data.result.data.json);
        } else if (data.result?.data) {
          setSection(data.result.data);
        }
      } catch (err) {
        console.error('Error fetching section:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch section'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSection();
  }, [sectionId]);

  return {
    section,
    isLoading,
    error,
  };
}
