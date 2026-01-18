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
import { 
  Plus, Trash2, Eye, Search, Box, Sparkles, 
  Type, Image, Layout, List, Grid, Heart, Star, Zap, 
  FileText, MessageSquare, Users, MoreVertical, Copy, ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import AdminSidebar from '@/components/AdminSidebar';

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/dashboard')}
              className="mb-3 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-stone-900">Block Store</h1>
                <p className="text-sm text-stone-500">Manage your custom reusable blocks</p>
              </div>
              <Button onClick={() => navigate('/admin/block-creator')}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Block
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar - Categories */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-3 space-y-1">
                  {categories?.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {category === 'all' ? 'All Blocks' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Block Grid */}
          <div className={previewBlockId ? "lg:col-span-5" : "lg:col-span-10"}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
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
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredBlocks?.length === 0 ? (
                  <div className="text-center py-12">
                    <Box className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No blocks yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first custom block to get started</p>
                    <Button onClick={() => navigate('/admin/block-creator')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Block
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBlocks?.map(block => {
                      const IconComp = iconMap[block.icon || 'box'] || Box;
                      return (
                        <div
                          key={block.id}
                          className={`relative group border rounded-lg p-4 cursor-pointer transition-all ${
                            previewBlockId === block.id
                              ? 'ring-2 ring-primary border-primary'
                              : 'hover:border-primary/50 hover:shadow-md'
                          }`}
                          onClick={() => setPreviewBlockId(block.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconComp className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{block.name}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {block.description || 'No description'}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
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
                            <Badge variant="secondary" className="text-xs">
                              {block.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Used {block.usageCount} times
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          {previewBlockId && previewBlock && (
            <div className="lg:col-span-5">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Preview: {previewBlock.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewBlockId(null)}>
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh]">
                    <div className="border rounded-lg overflow-hidden bg-white">
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
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
