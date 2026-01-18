import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
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
  Sparkles,
  ArrowLeft,
  Zap,
  LayoutGrid,
  MousePointer,
  Wand2
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

// Define available pages and their zones
const AVAILABLE_PAGES = [
  { 
    slug: 'home', 
    name: 'Home', 
    icon: Home,
    zones: ['after-hero', 'after-carousel', 'mid-page', 'after-content', 'before-newsletter', 'before-footer'],
    description: 'Main landing page'
  },
  { 
    slug: 'about', 
    name: 'About', 
    icon: Info,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-newsletter', 'before-footer'],
    description: 'About the founder'
  },
  { 
    slug: 'philosophy', 
    name: 'Philosophy', 
    icon: Heart,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-newsletter', 'before-footer'],
    description: 'Vision & ethos'
  },
  { 
    slug: 'offerings', 
    name: 'Offerings', 
    icon: Sparkles,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-newsletter', 'before-footer'],
    description: 'Programs & services'
  },
  { 
    slug: 'blog', 
    name: 'Journal', 
    icon: BookOpen,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-footer'],
    description: 'Blog & articles'
  },
  { 
    slug: 'events', 
    name: 'Events', 
    icon: Calendar,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-footer'],
    description: 'Upcoming events'
  },
  { 
    slug: 'shop', 
    name: 'Shop', 
    icon: ShoppingBag,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-footer'],
    description: 'Products'
  },
  { 
    slug: 'contact', 
    name: 'Contact', 
    icon: Mail,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-footer'],
    description: 'Contact form'
  },
  { 
    slug: 'resources', 
    name: 'Resources', 
    icon: FolderOpen,
    zones: ['after-hero', 'mid-page', 'after-content', 'before-footer'],
    description: 'Downloads & files'
  },
];

// Page color schemes for vibrant cards
const PAGE_COLORS: Record<string, { bg: string; icon: string; border: string; gradient: string }> = {
  home: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
  about: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-pink-600' },
  philosophy: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-orange-500' },
  offerings: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-yellow-500' },
  blog: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
  events: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200', gradient: 'from-indigo-500 to-violet-600' },
  shop: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-500 to-red-500' },
  contact: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-500 to-blue-600' },
  resources: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200', gradient: 'from-teal-500 to-green-600' },
};

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

  // Calculate total stats
  const totalZonesWithBlocks = allZones?.filter(z => {
    try {
      const blocks = JSON.parse(z.blocks || '[]');
      return blocks.length > 0;
    } catch { return false; }
  }).length || 0;

  const totalBlocksCount = allZones?.reduce((sum, z) => {
    try {
      const blocks = JSON.parse(z.blocks || '[]');
      return sum + blocks.length;
    } catch { return sum; }
  }, 0) || 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100">
      <AdminSidebar />
      
      <main className="flex-1 lg:pl-64 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Vibrant Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4 -ml-2 hover:bg-stone-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-xl" />
              </div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Layers className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Page Zone Manager</h1>
                      <p className="text-white/80 mt-1">
                        Add Page Builder blocks to specific zones on your existing pages
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Pills */}
                <div className="flex gap-3">
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <p className="text-sm font-medium">{AVAILABLE_PAGES.length} Pages</p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <p className="text-sm font-medium">{totalZonesWithBlocks} Active Zones</p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <p className="text-sm font-medium">{totalBlocksCount} Blocks</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Page Filter Tabs */}
          <Tabs value={selectedPage} onValueChange={setSelectedPage} className="mb-6">
            <TabsList className="flex-wrap h-auto gap-1 p-1.5 bg-white shadow-sm">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                All Pages
              </TabsTrigger>
              {AVAILABLE_PAGES.map(page => (
                <TabsTrigger key={page.slug} value={page.slug} className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  {page.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Pages Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((page, index) => {
              const Icon = page.icon;
              const totalBlocks = page.zones.reduce((sum, zone) => sum + getZoneBlockCount(page.slug, zone), 0);
              const colors = PAGE_COLORS[page.slug] || PAGE_COLORS.home;
              
              return (
                <motion.div
                  key={page.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`overflow-hidden border-2 ${colors.border} hover:shadow-lg transition-all duration-300 group`}>
                    {/* Gradient Header Bar */}
                    <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">{page.name}</CardTitle>
                            <CardDescription className="text-xs">{page.description}</CardDescription>
                          </div>
                        </div>
                        {totalBlocks > 0 && (
                          <Badge className={`text-xs bg-gradient-to-r ${colors.gradient} text-white border-0`}>
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
                              className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} hover:brightness-95 transition-all cursor-pointer group/zone`}
                              onClick={() => navigate(`/admin/zone-editor/${page.slug}/${zone}`)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${blockCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`} />
                                <span className="text-sm font-medium capitalize">
                                  {zone.replace(/-/g, ' ')}
                                </span>
                                {blockCount > 0 && (
                                  <Badge variant="secondary" className="text-xs bg-white/80">
                                    {blockCount}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover/zone:opacity-100 transition-opacity"
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
                          className="flex-1 hover:bg-stone-100"
                          onClick={() => window.open(`/${page.slug === 'home' ? '' : page.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className={`flex-1 bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white border-0`}
                          onClick={() => navigate(`/admin/zone-editor/${page.slug}/${page.zones[0]}`)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Blocks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mt-8 overflow-hidden border-2 border-violet-100">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <Wand2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <CardTitle className="text-lg">How Page Zones Work</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-4">
                  <strong className="text-stone-800">Page Zones</strong> allow you to inject Page Builder blocks into specific locations 
                  on your existing pages without modifying code.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">After Hero</p>
                      <p className="text-xs text-stone-500">Appears right after the hero section</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Mid Page</p>
                      <p className="text-xs text-stone-500">In the middle of the page content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Before Newsletter</p>
                      <p className="text-xs text-stone-500">Appears before the newsletter signup</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold text-xs">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">Before Footer</p>
                      <p className="text-xs text-stone-500">At the bottom, before the footer</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200">
                  <p className="text-xs flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-violet-500" />
                    <span><strong>Pro tip:</strong> When logged in as admin, hover over zone areas on the live page to see an "Edit Zone" button.</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
