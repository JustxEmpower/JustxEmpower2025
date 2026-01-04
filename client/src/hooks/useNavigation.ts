import { trpc } from '@/lib/trpc';

export interface NavigationItem {
  id: number;
  location: 'header' | 'footer';
  label: string;
  url: string;
  order: number;
  isExternal: number;
  openInNewTab: number;
  parentId: number | null;
  children?: NavigationItem[];
}

/**
 * Hook to fetch navigation items from the database
 * Returns items organized in a tree structure with children
 */
export function useNavigation() {
  // Fetch both header and footer navigation
  const headerQuery = trpc.navigation.getByLocation.useQuery(
    { location: 'header' },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  const footerQuery = trpc.navigation.getByLocation.useQuery(
    { location: 'footer' },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Build tree structure from flat list
  const buildTree = (items: NavigationItem[]): NavigationItem[] => {
    if (!items || items.length === 0) return [];
    
    const itemMap = new Map<number, NavigationItem>();
    const roots: NavigationItem[] = [];

    // First pass: create map of all items
    items.forEach((item: NavigationItem) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree
    items.forEach((item: NavigationItem) => {
      const node = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order
    const sortByOrder = (a: NavigationItem, b: NavigationItem) => a.order - b.order;
    roots.sort(sortByOrder);
    roots.forEach((root: NavigationItem) => {
      if (root.children) {
        root.children.sort(sortByOrder);
      }
    });

    return roots;
  };

  const headerItems = buildTree((headerQuery.data as NavigationItem[]) || []);
  const footerItems = buildTree((footerQuery.data as NavigationItem[]) || []);

  return {
    headerItems,
    footerItems,
    isLoading: headerQuery.isLoading || footerQuery.isLoading,
    error: headerQuery.error || footerQuery.error,
    refetch: () => {
      headerQuery.refetch();
      footerQuery.refetch();
    },
    // Flat lists for admin editing
    flatHeaderItems: (headerQuery.data as NavigationItem[]) || [],
    flatFooterItems: (footerQuery.data as NavigationItem[]) || [],
  };
}

export default useNavigation;
