/**
 * Block Store Manager - View, edit, and manage custom blocks
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Plus, Trash2, Eye, Search, Box, Sparkles, 
  Type, Image, Layout, List, Grid, Heart, Star, Zap, 
  FileText, MessageSquare, Users, MoreVertical, Copy, ArrowLeft,
  Package, Layers, Wand2, TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import AdminSidebar from '@/components/AdminSidebar';

// Category color schemes for vibrant cards
const CATEGORY_COLORS: Record<string, { bg: string; icon: string; border: string; gradient: string }> = {
  hero: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
  content: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-pink-600' },
  media: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-600' },
  layout: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' },
  interactive: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-pink-500' },
  navigation: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-500 to-blue-600' },
  all: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200', gradient: 'from-violet-500 to-purple-600' },
};

const iconMap: Record<string, any> = {
  box: Box,
  sparkles: Sparkles,
  type: Type,
  image: Image,
  layout: Layout,
  list: List,
  grid: Grid,
  heart: Heart,
  star: Star,
  zap: Zap,
  'file-text': FileText,
  'message-square': MessageSquare,
  users: Users,
};

export default function AdminBlockStore() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewBlockId, setPreviewBlockId] = useState<number | null>(null);
  
  const { data: blocks, isLoading, refetch } = trpc.blockStore.getAll.useQuery({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });
  
  const { data: categories } = trpc.blockStore.getCategories.useQuery();
  const deleteBlock = trpc.blockStore.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this block?')) return;
    try {
      await deleteBlock.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const filteredBlocks = blocks?.filter(block => 
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewBlock = blocks?.find(b => b.id === previewBlockId);

  // Calculate stats
  const totalUsage = blocks?.reduce((sum, b) => sum + (b.usageCount || 0), 0) || 0;

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
            
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-8 text-white shadow-xl">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-500/20 rounded-full blur-xl" />
              </div>
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Block Store</h1>
                      <p className="text-white/80 mt-1">
                        Your library of reusable custom blocks
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Pills */}
                <div className="flex gap-3">
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <p className="text-sm font-medium">{blocks?.length || 0} Blocks</p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <p className="text-sm font-medium">{categories?.length || 0} Categories</p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <p className="text-sm font-medium">{totalUsage} Uses</p>
                  </div>
                </div>
              </div>
              
              {/* Create Button */}
              <div className="relative z-10 mt-4">
                <Button 
                  onClick={() => navigate('/admin/block-creator')}
                  className="bg-white text-orange-600 hover:bg-white/90 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Block
                </Button>
              </div>
            </div>
          </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar - Categories */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-2 border-amber-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-base">Categories</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-3 space-y-1">
                  {categories?.map(category => {
                    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.all;
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${colors.gradient} text-white shadow-md`
                            : `${colors.bg} ${colors.icon} hover:shadow-sm`
                        }`}
                      >
                        {category === 'all' ? '✨ All Blocks' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content - Block Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={previewBlockId ? "lg:col-span-5" : "lg:col-span-10"}
          >
            <Card className="border-2 border-stone-200 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Box className="w-5 h-5 text-orange-500" />
                      {filteredBlocks?.length || 0} Custom Blocks
                    </CardTitle>
                    <CardDescription>Click a block to preview, or use menu to edit/delete</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search blocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 border-amber-200 focus:border-amber-400"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                  </div>
                ) : filteredBlocks?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Package className="w-10 h-10 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800 mb-2">No blocks yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first custom block to get started</p>
                    <Button 
                      onClick={() => navigate('/admin/block-creator')}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Block
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBlocks?.map((block, index) => {
                      const IconComp = iconMap[block.icon || 'box'] || Box;
                      const colors = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.all;
                      return (
                        <motion.div
                          key={block.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className={`relative group border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            previewBlockId === block.id
                              ? `ring-2 ring-orange-400 ${colors.border} shadow-lg`
                              : `${colors.border} hover:shadow-lg hover:scale-[1.02]`
                          }`}
                          onClick={() => setPreviewBlockId(block.id)}
                        >
                          {/* Gradient accent */}
                          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${colors.gradient}`} />
                          
                          <div className="flex items-start justify-between pt-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <IconComp className={`w-5 h-5 ${colors.icon}`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-stone-800">{block.name}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {block.description || 'No description'}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewBlockId(block.id); }}>
                                  <Eye className="w-4 h-4 mr-2" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(block.id); }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className={`text-xs bg-gradient-to-r ${colors.gradient} text-white border-0`}>
                              {block.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Used {block.usageCount} times
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Panel */}
          {previewBlockId && previewBlock && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5"
            >
              <Card className="sticky top-20 border-2 border-rose-200 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-100">
                        <Eye className="w-4 h-4 text-rose-600" />
                      </div>
                      <CardTitle className="text-base">Preview: {previewBlock.name}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewBlockId(null)}
                      className="hover:bg-rose-100 hover:text-rose-600"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh]">
                    <div className="border-2 border-dashed border-stone-200 rounded-xl overflow-hidden bg-white">
                      {(() => {
                        try {
                          const content = JSON.parse(previewBlock.content);
                          return (
                            <BlockRenderer 
                              block={{
                                id: `preview-${previewBlock.id}`,
                                type: previewBlock.blockType,
                                content,
                              }} 
                              isPreviewMode={true} 
                            />
                          );
                        } catch (e) {
                          return <div className="p-4 text-destructive">Failed to parse block content</div>;
                        }
                      })()}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
