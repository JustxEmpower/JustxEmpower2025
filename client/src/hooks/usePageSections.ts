import { trpc } from '@/lib/trpc';
import { PageSection, SectionType, getDefaultSections } from '@/components/admin/PageSectionMapper';

/**
 * Hook to fetch page sections from the database
 * Falls back to static defaults if no sections exist in the database
 */
export function usePageSections(pageSlug: string, pageId?: number) {
  // Try to fetch sections by page ID first (more reliable)
  const { data: sectionsById, isLoading: isLoadingById } = trpc.pageSections.getByPage.useQuery(
    { pageId: pageId! },
    { enabled: !!pageId }
  );
  
  // Also try by slug as fallback
  const { data: sectionsBySlug, isLoading: isLoadingBySlug } = trpc.pageSections.getByPageSlug.useQuery(
    { slug: pageSlug },
    { enabled: !pageId && !!pageSlug }
  );
  
  // Get completeness data
  const { data: completenessData, isLoading: isLoadingCompleteness } = trpc.pageSections.getPageCompleteness.useQuery(
    { pageId: pageId! },
    { enabled: !!pageId }
  );
  
  const isLoading = isLoadingById || isLoadingBySlug || isLoadingCompleteness;
  const rawSections = sectionsById || sectionsBySlug || [];
  
  // Convert database sections to PageSection format
  const sections: PageSection[] = rawSections.length > 0 
    ? rawSections.map((section: any) => {
        // Find completeness data for this section
        const sectionCompleteness = completenessData?.sections?.find(
          (s: any) => s.id === section.id
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
  };
}

/**
 * Hook to get a single section by ID
 */
export function usePageSection(sectionId: number) {
  const { data, isLoading, error } = trpc.pageSections.getById.useQuery(
    { id: sectionId },
    { enabled: !!sectionId }
  );
  
  return {
    section: data,
    isLoading,
    error,
  };
}
