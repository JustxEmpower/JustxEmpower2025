import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import {
  Menu,
  Plus,
  Edit,
  GripVertical,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Search,
  Layout,
  Home,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Page {
  id: number;
  title: string;
  slug: string;
  template: string | null;
  published: number;
  showInNav: number;
  navOrder: number | null;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface HierarchicalPage {
  page: Page;
  isChild: boolean;
  parentTitle?: string;
  children?: Page[];
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000, steps = 30, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
}

interface SortableNavItemProps {
  page: Page;
  isChild: boolean;
  parentTitle?: string;
  children?: Page[];
  onEdit: (page: Page) => void;
  onToggleNav: (page: Page) => void;
  onDelete: (page: Page) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function SortableNavItem({ 
  page, 
  isChild, 
  parentTitle, 
  children = [],
  onEdit, 
  onToggleNav,
  onDelete,
  isExpanded,
  onToggleExpand,
}: SortableNavItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = children.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-3 p-4 bg-white rounded-lg border border-stone-200 hover:shadow-md transition-all ${
          isChild ? 'ml-8 border-l-4 border-l-amber-400' : ''
        } ${isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 p-1"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {hasChildren && !isChild && (
          <button
            onClick={onToggleExpand}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {isChild && <ChevronRight className="w-4 h-4 text-amber-500" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-900 truncate">{page.title}</h3>
            {page.showInNav === 1 ? (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">In Nav</Badge>
            ) : (
              <Badge className="bg-stone-100 text-stone-500 text-xs">Hidden</Badge>
            )}
            {page.published !== 1 && (
              <Badge className="bg-amber-100 text-amber-700 text-xs">Draft</Badge>
            )}
          </div>
          <p className="text-sm text-stone-500">/{page.slug}</p>
          {isChild && parentTitle && (
            <p className="text-xs text-amber-600 mt-1">↳ Under: {parentTitle}</p>
          )}
          {hasChildren && !isChild && (
            <p className="text-xs text-stone-400 mt-1">{children.length} sub-item{children.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleNav(page)}
            className={page.showInNav === 1 ? 'text-emerald-600' : 'text-stone-400'}
          >
            {page.showInNav === 1 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => onEdit(page)}>
            <Edit className="w-4 h-4" />
          </Button>

          <Link href={`/${page.slug}`} target="_blank">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(page)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && !isChild && (
        <div className="mt-2 space-y-2">
          {children.map(child => (
            <SortableNavItem
              key={child.id}
              page={child}
              isChild={true}
              parentTitle={page.title}
              onEdit={onEdit}
              onToggleNav={onToggleNav}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNavigationManager() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    showInNav: 1,
    parentId: null as number | null,
  });

  const pagesQuery = trpc.admin.pages.list.useQuery();
  const updateMutation = trpc.admin.pages.update.useMutation({
    onSuccess: () => {
      toast.success("Navigation updated");
      pagesQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingPage(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const reorderMutation = trpc.admin.pages.reorder.useMutation({
    onSuccess: () => {
      toast.success("Navigation order updated");
      pagesQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.pages.delete.useMutation({
    onSuccess: () => {
      toast.success("Page deleted");
      pagesQuery.refetch();
    },
    onError: (e) => toast.error(e.message || "Failed to delete page"),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Organize pages hierarchically
  const pages = pagesQuery.data || [];
  const topLevelPages = pages.filter(p => !p.parentId);
  const childPagesMap = new Map<number, Page[]>();
  
  pages.filter(p => p.parentId).forEach(child => {
    const parentId = child.parentId!;
    if (!childPagesMap.has(parentId)) {
      childPagesMap.set(parentId, []);
    }
    childPagesMap.get(parentId)!.push(child);
  });

  // Filter pages based on search
  const filteredTopLevel = topLevelPages.filter(p => 
    searchQuery === "" || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: pages.length,
    inNav: pages.filter(p => p.showInNav === 1).length,
    hidden: pages.filter(p => p.showInNav !== 1).length,
    dropdowns: topLevelPages.filter(p => childPagesMap.has(p.id)).length,
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setFormData({
      showInNav: page.showInNav,
      parentId: page.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleNav = async (page: Page) => {
    try {
      await updateMutation.mutateAsync({
        id: page.id,
        showInNav: page.showInNav === 1 ? 0 : 1,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePage = async (page: Page) => {
    if (!confirm(`Are you sure you want to delete "${page.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: page.id });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateNavSettings = async () => {
    if (!editingPage) return;
    try {
      await updateMutation.mutateAsync({
        id: editingPage.id,
        showInNav: formData.showInNav,
        parentId: formData.parentId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const allItems = [...topLevelPages];
    const oldIndex = allItems.findIndex(p => p.id === active.id);
    const newIndex = allItems.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPages = arrayMove(allItems, oldIndex, newIndex);
    
    const pageUpdates = reorderedPages.map((page, index) => ({
      id: page.id,
      navOrder: index,
      parentId: page.parentId,
    }));

    try {
      await reorderMutation.mutateAsync({ pageOrders: pageUpdates });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Get available parent pages (exclude current page when editing)
  const availableParentPages = topLevelPages.filter(p => 
    !editingPage || p.id !== editingPage.id
  );

  if (isChecking || pagesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Navigation Manager</h1>
                <p className="text-stone-500 text-sm">Organize your site navigation and dropdown menus</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => pagesQuery.refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pages', value: stats.total, icon: Layout, color: 'amber' },
              { label: 'In Navigation', value: stats.inNav, icon: Eye, color: 'emerald' },
              { label: 'Hidden', value: stats.hidden, icon: EyeOff, color: 'stone' },
              { label: 'Dropdowns', value: stats.dropdowns, icon: Menu, color: 'blue' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">Navigation Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Drag pages</strong> to reorder them in the navigation menu</li>
                <li>• <strong>Set a parent</strong> to create dropdown menus (sub-pages appear under parent)</li>
                <li>• <strong>Toggle visibility</strong> with the eye icon to show/hide from navigation</li>
                <li>• Pages marked "Hidden" won't appear in the site navigation but are still accessible via URL</li>
              </ul>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Navigation Tree */}
          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTopLevel.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredTopLevel.map((page, i) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <SortableNavItem
                      page={page}
                      isChild={false}
                      children={childPagesMap.get(page.id) || []}
                      onEdit={handleEditPage}
                      onToggleNav={handleToggleNav}
                      onDelete={handleDeletePage}
                      isExpanded={expandedItems.has(page.id)}
                      onToggleExpand={() => toggleExpand(page.id)}
                    />
                  </motion.div>
                ))}
              </SortableContext>
            </DndContext>

            {filteredTopLevel.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Menu className="w-12 h-12 mx-auto text-stone-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pages Found</h3>
                  <p className="text-stone-500">
                    {searchQuery ? "No pages match your search" : "Create pages to manage navigation"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Navigation Settings</DialogTitle>
              <DialogDescription>
                Configure how "{editingPage?.title}" appears in navigation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Parent Page (for dropdown menu)</Label>
                <Select
                  value={formData.parentId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent page (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        No parent (top-level)
                      </div>
                    </SelectItem>
                    {availableParentPages.map((page) => (
                      <SelectItem key={page.id} value={page.id.toString()}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-stone-500 mt-1">
                  Sub-pages appear as dropdown items under their parent
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div>
                  <Label>Show in Navigation</Label>
                  <p className="text-xs text-stone-500">Display this page in the site menu</p>
                </div>
                <Button
                  variant={formData.showInNav === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, showInNav: formData.showInNav === 1 ? 0 : 1 })}
                  className={formData.showInNav === 1 ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  {formData.showInNav === 1 ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {formData.showInNav === 1 ? "Visible" : "Hidden"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNavSettings} className="bg-amber-600 hover:bg-amber-700">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
