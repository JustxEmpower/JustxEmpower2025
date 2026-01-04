import { trpc } from '@/lib/trpc';

interface ContentItem {
  page: string;
  section: string;
  contentKey: string;
  contentValue: string;
}

/**
 * Hook to fetch global content from the database
 * Global content includes footer, preloader, newsletter_popup, and other site-wide content
 */
export function useGlobalContent() {
  const { data, isLoading, error, refetch } = trpc.content.getByPage.useQuery(
    { page: 'global' },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  /**
   * Get a specific content value by section and key
   * @param section - The section name (e.g., 'footer', 'preloader')
   * @param key - The content key (e.g., 'tagline', 'instagramUrl')
   * @param defaultValue - Default value if not found
   */
  const getContent = (section: string, key: string, defaultValue: string = ''): string => {
    if (!data) return defaultValue;
    const item = data.find(
      (c: ContentItem) => c.section === section && c.contentKey === key
    );
    return item?.contentValue || defaultValue;
  };

  /**
   * Get all content for a specific section as a key-value object
   * @param section - The section name (e.g., 'footer')
   */
  const getSection = (section: string): Record<string, string> => {
    if (!data) return {};
    return data
      .filter((c: ContentItem) => c.section === section)
      .reduce((acc: Record<string, string>, item: ContentItem) => {
        acc[item.contentKey] = item.contentValue;
        return acc;
      }, {});
  };

  // Pre-built sections for convenience
  const footer = getSection('footer');
  const preloader = getSection('preloader');
  const newsletterPopup = getSection('newsletter_popup');

  return {
    getContent,
    getSection,
    footer,
    preloader,
    newsletterPopup,
    isLoading,
    error,
    refetch,
    rawData: data || [],
  };
}

export default useGlobalContent;
