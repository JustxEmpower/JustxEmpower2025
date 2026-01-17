import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Layers, 
  Edit, 
  Eye, 
  Plus, 
  Home, 
  Info, 
  Heart, 
  ShoppingBag, 
  Calendar, 
  Mail, 
  BookOpen, 
  FolderOpen,
  ExternalLink,
  Sparkles
} from 'lucide-react';

// Define available pages and their zones
const AVAILABLE_PAGES = [
  { 
    slug: 'home', 
    name: 'Home', 
    icon: Home,
    zones: ['after-hero', 'after-carousel', 'before-footer'],
    description: 'Main landing page'
  },
  { 
    slug: 'about', 
    name: 'About', 
    icon: Info,
    zones: ['before-newsletter', 'before-footer'],
    description: 'About the founder'
  },
  { 
    slug: 'philosophy', 
    name: 'Philosophy', 
    icon: Heart,
    zones: ['before-newsletter', 'before-footer'],
    description: 'Vision & ethos'
  },
  { 
    slug: 'offerings', 
    name: 'Offerings', 
    icon: Sparkles,
    zones: ['before-footer'],
    description: 'Programs & services'
  },
  { 
    slug: 'blog', 
    name: 'Journal', 
    icon: BookOpen,
    zones: ['before-footer'],
    description: 'Blog & articles'
  },
  { 
    slug: 'events', 
    name: 'Events', 
    icon: Calendar,
    zones: ['before-footer'],
    description: 'Upcoming events'
  },
  { 
    slug: 'shop', 
    name: 'Shop', 
    icon: ShoppingBag,
    zones: ['before-footer'],
    description: 'Products'
  },
  { 
    slug: 'contact', 
    name: 'Contact', 
    icon: Mail,
    zones: ['before-footer'],
    description: 'Contact form'
  },
  { 
    slug: 'resources', 
    name: 'Resources', 
    icon: FolderOpen,
    zones: ['before-footer'],
    description: 'Downloads & files'
  },
];

export default function AdminZoneManager() {
  const [, navigate] = useLocation();
  const [selectedPage, setSelectedPage] = useState<string>('all');
  
  const { data: allZones, isLoading } = trpc.pageZones.getAllZones.useQuery();

  // Count blocks in each zone
  const getZoneBlockCount = (pageSlug: string, zoneName: string) => {
    const zone = allZones?.find(z => z.pageSlug === pageSlug && z.zoneName === zoneName);
    if (!zone?.blocks) return 0;
    try {
      const blocks = JSON.parse(zone.blocks);
      return Array.isArray(blocks) ? blocks.length : 0;
    } catch {
      return 0;
    }
  };

  const filteredPages = selectedPage === 'all' 
    ? AVAILABLE_PAGES 
    : AVAILABLE_PAGES.filter(p => p.slug === selectedPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Page Zone Manager</h1>
          </div>
          <p className="text-muted-foreground">
            Add Page Builder blocks to specific zones on your existing pages
          </p>
        </div>

        {/* Page Filter Tabs */}
        <Tabs value={selectedPage} onValueChange={setSelectedPage} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">All Pages</TabsTrigger>
            {AVAILABLE_PAGES.map(page => (
              <TabsTrigger key={page.slug} value={page.slug} className="text-xs">
                {page.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Pages Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map(page => {
            const Icon = page.icon;
            const totalBlocks = page.zones.reduce((sum, zone) => sum + getZoneBlockCount(page.slug, zone), 0);
            
            return (
              <Card key={page.slug} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{page.name}</CardTitle>
                        <CardDescription className="text-xs">{page.description}</CardDescription>
                      </div>
                    </div>
                    {totalBlocks > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {totalBlocks} block{totalBlocks !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {page.zones.map(zone => {
                      const blockCount = getZoneBlockCount(page.slug, zone);
                      return (
                        <div 
                          key={zone}
                          className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${blockCount > 0 ? 'bg-green-500' : 'bg-neutral-300'}`} />
                            <span className="text-sm font-medium capitalize">
                              {zone.replace(/-/g, ' ')}
                            </span>
                            {blockCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {blockCount}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigate(`/admin/zone-editor/${page.slug}/${zone}`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`/${page.slug === 'home' ? '' : page.slug}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/admin/zone-editor/${page.slug}/${page.zones[0]}`)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Blocks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">How Page Zones Work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Page Zones</strong> allow you to inject Page Builder blocks into specific locations 
              on your existing pages without modifying code.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>after-hero</strong> - Appears right after the hero section</li>
              <li><strong>after-carousel</strong> - Appears after the carousel</li>
              <li><strong>before-newsletter</strong> - Appears before the newsletter signup</li>
              <li><strong>before-footer</strong> - Appears at the bottom, before the footer</li>
            </ul>
            <p className="text-xs pt-2">
              Tip: When logged in as admin, you can also hover over zone areas on the live page to see an "Edit Zone" button.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
