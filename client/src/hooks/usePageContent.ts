import { trpc } from '@/lib/trpc';

/**
 * Hook to fetch and organize page content from the database
 * Returns a helper function to get specific content values by section and key
 */
export function usePageContent(page: string) {
  // Use the public content route instead of admin route
  // Disable caching to ensure fresh content is always fetched
  const { data: contentData, isLoading } = trpc.content.getByPage.useQuery(
    { page },
    {
      staleTime: 0, // Always consider data stale
      refetchOnMount: 'always', // Always refetch on mount
      refetchOnWindowFocus: true, // Refetch when window regains focus
    }
  );

  // Helper function to get a specific content value
  const getContent = (section: string, key: string, defaultValue: string = ''): string => {
    if (!contentData) return defaultValue;
    
    const item = contentData.find(
      (c) => c.section === section && c.contentKey === key
    );
    
    return item?.contentValue || defaultValue;
  };

  // Helper to get all content for a section as an object
  const getSection = (section: string): Record<string, string> => {
    if (!contentData) return {};
    
    const sectionItems = contentData.filter((c) => c.section === section);
    return sectionItems.reduce((acc, item) => {
      acc[item.contentKey] = item.contentValue;
      return acc;
    }, {} as Record<string, string>);
  };

  return {
    content: contentData || [],
    isLoading,
    getContent,
    getSection,
  };
}
