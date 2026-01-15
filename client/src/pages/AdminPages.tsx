import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Layout,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Trash,
  Clock,
  AlertTriangle,
  Settings,
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminSidebar from '@/components/AdminSidebar';

interface Page {
  id: number;
  title: string;
  slug: string;
  template: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  published: number;
  showInNav: number;
  navOrder: number | null;
  parentId: number | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SortablePageProps {
  page: Page;
  onEdit: (page: Page) => void;
  onEditBlocks: (page: Page) => void;
  onDelete: (id: number) => void;
  isChild?: boolean;
  parentTitle?: string;
}

function SortablePage({ page, onEdit, onEditBlocks, onDelete, isChild, parentTitle }: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 ${isChild ? 'ml-8 border-l-4 border-l-primary/30' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <Link 
        href={`/admin/content?page=${page.slug}`}
        className="flex-1 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg p-2 -m-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isChild && (
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          )}
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary transition-colors">{page.title}</h3>
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-500">/{page.slug}</p>
        {isChild && parentTitle && (
          <p className="text-xs text-primary/70 mt-1">Sub-page of: {parentTitle}</p>
        )}
        <p className="text-xs text-primary mt-1">Click to edit content →</p>
      </Link>

      <div className="flex items-center gap-2">
        {page.published === 1 ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Eye className="w-3 h-3" />
            Published
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <EyeOff className="w-3 h-3" />
            Draft
          </span>
        )}

        {page.showInNav === 1 && (
          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
            In Nav
          </span>
        )}

        <Button onClick={() => onEditBlocks(page)} variant="outline" size="sm">
          <Layout className="w-4 h-4" />
        </Button>

        <Button onClick={() => onEdit(page)} variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => onDelete(page.id)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Trash item component
function TrashItem({ 
  page, 
  onRestore, 
  onPermanentDelete,
  retentionDays 
}: { 
  page: Page; 
  onRestore: (id: number) => void; 
  onPermanentDelete: (id: number) => void;
  retentionDays: number;
}) {
  const deletedDate = page.deletedAt ? new Date(page.deletedAt) : new Date();
  const expiryDate = new Date(deletedDate);
  expiryDate.setDate(expiryDate.getDate() + retentionDays);
  const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysRemaining <= 7;

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-neutral-400" />
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{page.title}</h3>
        </div>
        <p className="text-sm text-neutral-500">/{page.slug}</p>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-neutral-400">
            Deleted: {deletedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {page.deletedBy && (
            <span className="text-neutral-400">by {page.deletedBy}</span>
          )}
          <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-amber-600' : 'text-neutral-400'}`}>
            <Clock className="w-3 h-3" />
            {daysRemaining} days until auto-delete
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onRestore(page.id)}
          variant="outline"
          size="sm"
          className="text-green-600 hover:text-green-700 gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          Restore
        </Button>

        <Button
          onClick={() => onPermanentDelete(page.id)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 gap-1"
        >
          <Trash className="w-4 h-4" />
          Delete Forever
        </Button>
      </div>
    </div>
  );
}

export default function AdminPages() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState("pages");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    published: 1,
    showInNav: 1,
    parentId: null as number | null,
    autoGenerateSeo: true,
  });

  const [trashSettings, setTrashSettings] = useState({
    retentionDays: 30,
    autoCleanup: true,
  });

  const pagesQuery = trpc.admin.pages.list.useQuery();
  const trashQuery = trpc.admin.pages.trash.list.useQuery();
  const trashSettingsQuery = trpc.admin.pages.trash.getSettings.useQuery();
  const createMutation = trpc.admin.pages.create.useMutation();
  const updateMutation = trpc.admin.pages.update.useMutation();
  const deleteMutation = trpc.admin.pages.delete.useMutation();
  const reorderMutation = trpc.admin.pages.reorder.useMutation();
  const restoreMutation = trpc.admin.pages.trash.restore.useMutation();
  const permanentDeleteMutation = trpc.admin.pages.trash.permanentDelete.useMutation();
  const emptyTrashMutation = trpc.admin.pages.trash.emptyAll.useMutation();
  const updateTrashSettingsMutation = trpc.admin.pages.trash.updateSettings.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (trashSettingsQuery.data) {
      setTrashSettings(trashSettingsQuery.data);
    }
  }, [trashSettingsQuery.data]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Organize pages hierarchically
  const pages = pagesQuery.data || [];
  const topLevelPages = pages.filter(p => !p.parentId);
  const childPages = pages.filter(p => p.parentId);

  // Build hierarchical list for display
  const hierarchicalPages: { page: Page; isChild: boolean; parentTitle?: string }[] = [];
  topLevelPages.forEach(parent => {
    hierarchicalPages.push({ page: parent, isChild: false });
    const children = childPages.filter(c => c.parentId === parent.id);
    children.forEach(child => {
      hierarchicalPages.push({ page: child, isChild: true, parentTitle: parent.title });
    });
  });
  // Add orphan children (parent deleted)
  const orphans = childPages.filter(c => !topLevelPages.find(p => p.id === c.parentId));
  orphans.forEach(orphan => {
    hierarchicalPages.push({ page: orphan, isChild: true, parentTitle: '(Parent Deleted)' });
  });

  const trashedPages = trashQuery.data || [];

  const handleCreatePage = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Page created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        title: "",
        slug: "",
        metaTitle: "",
        metaDescription: "",
        published: 1,
        showInNav: 1,
        parentId: null,
        autoGenerateSeo: true,
      });
      pagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to create page");
      console.error(error);
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;

    try {
      await updateMutation.mutateAsync({
        id: editingPage.id,
        ...formData,
      });
      toast.success("Page updated successfully");
      setIsEditDialogOpen(false);
      setEditingPage(null);
      pagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to update page");
      console.error(error);
    }
  };

  const handleDeletePage = async (id: number) => {
    // Check if page has children
    const hasChildren = pages.some(p => p.parentId === id);
    if (hasChildren) {
      toast.error("Cannot delete page with sub-pages. Delete or reassign sub-pages first.");
      return;
    }

    if (!confirm("Move this page to trash? You can restore it within " + trashSettings.retentionDays + " days.")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Page moved to trash");
      pagesQuery.refetch();
      trashQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete page");
      console.error(error);
    }
  };

  const handleRestorePage = async (id: number) => {
    try {
      await restoreMutation.mutateAsync({ id });
      toast.success("Page restored successfully");
      pagesQuery.refetch();
      trashQuery.refetch();
    } catch (error) {
      toast.error("Failed to restore page");
      console.error(error);
    }
  };

  const handlePermanentDelete = async (id: number) => {
    setPageToDelete(id);
    setIsPermanentDeleteDialogOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!pageToDelete) return;

    try {
      await permanentDeleteMutation.mutateAsync({ id: pageToDelete });
      toast.success("Page permanently deleted");
      trashQuery.refetch();
      setIsPermanentDeleteDialogOpen(false);
      setPageToDelete(null);
    } catch (error) {
      toast.error("Failed to delete page");
      console.error(error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const result = await emptyTrashMutation.mutateAsync();
      toast.success(`Trash emptied. ${result.deletedCount} page(s) permanently deleted.`);
      trashQuery.refetch();
      setIsEmptyTrashDialogOpen(false);
    } catch (error) {
      toast.error("Failed to empty trash");
      console.error(error);
    }
  };

  const handleUpdateTrashSettings = async () => {
    try {
      await updateTrashSettingsMutation.mutateAsync(trashSettings);
      toast.success("Trash settings updated");
      setIsSettingsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    }
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published,
      showInNav: page.showInNav,
      parentId: page.parentId,
      autoGenerateSeo: false,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditBlocks = (page: Page) => {
    // Navigate to Page Builder with the page ID to edit existing page
    setLocation(`/admin/page-builder/${page.id}`);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = hierarchicalPages.findIndex((p) => p.page.id === active.id);
    const newIndex = hierarchicalPages.findIndex((p) => p.page.id === over.id);

    const reorderedPages = arrayMove(hierarchicalPages, oldIndex, newIndex);
    
    // Determine new parent for each page based on its position in the reordered list
    const pageUpdates: { id: number; navOrder: number; parentId: number | null }[] = [];
    let currentParent: Page | null = null;
    
    reorderedPages.forEach((item, index) => {
      const page = item.page;
      let newParentId: number | null = null;
      
      // Check if this page was originally a child page
      const wasChild = item.isChild;
      
      // If it was a child and is still positioned after a top-level page, keep it as child
      if (wasChild && currentParent) {
        newParentId = currentParent.id;
      }
      
      // If this is a top-level page, update currentParent
      if (!wasChild) {
        currentParent = page;
      }
      
      pageUpdates.push({
        id: page.id,
        navOrder: index,
        parentId: newParentId,
      });
    });

    try {
      await reorderMutation.mutateAsync({ pageOrders: pageUpdates });
      pagesQuery.refetch();
      toast.success("Pages reordered");
    } catch (error) {
      toast.error("Failed to reorder pages");
      console.error(error);
    }
  };

  // Get available parent pages (exclude current page when editing)
  const availableParentPages = topLevelPages.filter(p => 
    !editingPage || p.id !== editingPage.id
  );

  const PageFormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor={isEdit ? "edit-title" : "title"}>Page Title</Label>
        <Input
          id={isEdit ? "edit-title" : "title"}
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="About Us"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-slug" : "slug"}>URL Slug</Label>
        <Input
          id={isEdit ? "edit-slug" : "slug"}
          value={formData.slug}
          onChange={(e) =>
            setFormData({ ...formData, slug: e.target.value })
          }
          placeholder="about-us"
        />
        <p className="text-xs text-neutral-500 mt-1">
          URL: /{formData.slug}
        </p>
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-parent" : "parent"}>Parent Page (for dropdown menu)</Label>
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
            <SelectItem value="none">No parent (top-level page)</SelectItem>
            {availableParentPages.map((page) => (
              <SelectItem key={page.id} value={page.id.toString()}>
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-neutral-500 mt-1">
          Sub-pages appear as dropdown items under their parent in navigation
        </p>
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-metaTitle" : "metaTitle"}>SEO Title</Label>
        <Input
          id={isEdit ? "edit-metaTitle" : "metaTitle"}
          value={formData.metaTitle}
          onChange={(e) =>
            setFormData({ ...formData, metaTitle: e.target.value })
          }
          placeholder="About Us - Just Empower"
        />
      </div>

      <div>
        <Label htmlFor={isEdit ? "edit-metaDescription" : "metaDescription"}>SEO Description</Label>
        <Textarea
          id={isEdit ? "edit-metaDescription" : "metaDescription"}
          value={formData.metaDescription}
          onChange={(e) =>
            setFormData({ ...formData, metaDescription: e.target.value })
          }
          placeholder="Learn about our mission and values"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-3">
        {!isEdit && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoGenerateSeo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  autoGenerateSeo: e.target.checked,
                })
              }
              className="rounded"
            />
            <span className="text-sm">Auto-generate SEO with AI</span>
            <span className="text-xs text-neutral-500">(uses AI to create optimized meta tags)</span>
          </label>
        )}

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.published === 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  published: e.target.checked ? 1 : 0,
                })
              }
              className="rounded"
            />
            <span className="text-sm">Published</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.showInNav === 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  showInNav: e.target.checked ? 1 : 0,
                })
              }
              className="rounded"
            />
            <span className="text-sm">Show in Navigation</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                  Pages Manager
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Create, edit, and organize your site pages
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Page
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Page</DialogTitle>
                      <DialogDescription>
                        Add a new page to your website. Set a parent page to create dropdown menus.
                      </DialogDescription>
                    </DialogHeader>

                    <PageFormFields />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePage}>Create Page</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabs for Pages and Trash */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="pages" className="gap-2">
                    <Layout className="w-4 h-4" />
                    Pages ({pages.length})
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="gap-2">
                    <Trash className="w-4 h-4" />
                    Trash ({trashedPages.length})
                  </TabsTrigger>
                </TabsList>

                {activeTab === "trash" && trashedPages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSettingsDialogOpen(true)}
                      className="gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEmptyTrashDialogOpen(true)}
                      className="text-red-600 hover:text-red-700 gap-1"
                    >
                      <Trash className="w-4 h-4" />
                      Empty Trash
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="pages" className="mt-6">
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Navigation Tips</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Pages marked "In Nav" appear in the main site navigation</li>
                    <li>• Set a parent page to create dropdown menus</li>
                    <li>• Drag pages to reorder them in the navigation</li>
                    <li>• Deleted pages go to Trash and can be restored within {trashSettings.retentionDays} days</li>
                  </ul>
                </div>

                {/* Pages List */}
                <div className="space-y-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={hierarchicalPages.map((p) => p.page.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {hierarchicalPages.map(({ page, isChild, parentTitle }) => (
                        <SortablePage
                          key={page.id}
                          page={page}
                          onEdit={handleEditPage}
                          onEditBlocks={handleEditBlocks}
                          onDelete={handleDeletePage}
                          isChild={isChild}
                          parentTitle={parentTitle}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {(!pagesQuery.data || pagesQuery.data.length === 0) && (
                    <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <p className="text-neutral-500">No pages yet. Create your first page!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="trash" className="mt-6">
                {/* Trash Info Box */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">Trash Bin</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Deleted pages are kept here for {trashSettings.retentionDays} days before being permanently removed.
                        You can restore pages or delete them permanently at any time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trashed Pages List */}
                <div className="space-y-3">
                  {trashedPages.map((page) => (
                    <TrashItem
                      key={page.id}
                      page={page}
                      onRestore={handleRestorePage}
                      onPermanentDelete={handlePermanentDelete}
                      retentionDays={trashSettings.retentionDays}
                    />
                  ))}

                  {trashedPages.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <Trash className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">Trash is empty</p>
                      <p className="text-sm text-neutral-400 mt-1">Deleted pages will appear here</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Update page details, SEO settings, and parent page</DialogDescription>
          </DialogHeader>

          <PageFormFields isEdit />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePage}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trash Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trash Settings</DialogTitle>
            <DialogDescription>Configure how long deleted pages are kept before permanent deletion</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="retentionDays">Retention Period (days)</Label>
              <Input
                id="retentionDays"
                type="number"
                min={1}
                max={365}
                value={trashSettings.retentionDays}
                onChange={(e) => setTrashSettings({ ...trashSettings, retentionDays: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Pages in trash will be automatically deleted after this many days (1-365)
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trashSettings.autoCleanup}
                  onChange={(e) => setTrashSettings({ ...trashSettings, autoCleanup: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enable automatic cleanup</span>
              </label>
              <p className="text-xs text-neutral-500 mt-1 ml-6">
                Automatically delete expired pages from trash
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrashSettings}>Save Settings</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty Trash Confirmation Dialog */}
      <AlertDialog open={isEmptyTrashDialogOpen} onOpenChange={setIsEmptyTrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {trashedPages.length} page(s) in the trash.
              This action cannot be undone. All page content, blocks, and associated data will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              className="bg-red-600 hover:bg-red-700"
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this page and all its content.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
