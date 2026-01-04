import { trpc } from '@/lib/trpc';

export interface CarouselItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  link: string | null;
  order: number;
  isActive: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Hook to fetch carousel offerings from the database
 * Returns active items sorted by order
 */
export function useCarousel() {
  const { data, isLoading, error, refetch } = trpc.carousel.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Map items to the expected format
  const offerings = (data || []).map((item: CarouselItem) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    link: item.link,
    order: item.order,
    isActive: item.isActive,
  }));

  return {
    offerings,
    items: offerings, // Alias for backwards compatibility
    isLoading,
    error,
    refetch,
    // All items for admin editing
    allItems: data || [],
  };
}

export default useCarousel;
