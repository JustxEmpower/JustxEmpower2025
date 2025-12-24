import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import BlockEditor from "@/components/BlockEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LogOut,
  FileText,
  Settings,
  Layout,
  FolderOpen,
  Palette,
  BarChart3,
  Files,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
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
  createdAt: Date;
  updatedAt: Date;
}

interface SortablePageProps {
  page: Page;
  onEdit: (page: Page) => void;
  onEditBlocks: (page: Page) => void;
  onDelete: (id: number) => void;
}

function SortablePage({ page, onEdit, onEditBlocks, onDelete }: SortablePageProps) {
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
      className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{page.title}</h3>
        <p className="text-sm text-neutral-500">/{page.slug}</p>
      </div>

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

export default function AdminPages() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingBlocksPage, setEditingBlocksPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    published: 1,
    showInNav: 1,
  });

  const pagesQuery = trpc.admin.pages.list.useQuery();
  const createMutation = trpc.admin.pages.create.useMutation();
  const updateMutation = trpc.admin.pages.update.useMutation();
  const deleteMutation = trpc.admin.pages.delete.useMutation();
  const reorderMutation = trpc.admin.pages.reorder.useMutation();

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

  const navItems = [
    { icon: Layout, label: "Content", path: "/admin/content" },
    { icon: FileText, label: "Articles", path: "/admin/articles" },
    { icon: FolderOpen, label: "Media", path: "/admin/media" },
    { icon: Palette, label: "Theme", path: "/admin/theme" },
    { icon: Files, label: "Pages", path: "/admin/pages" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

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
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Page deleted successfully");
      pagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete page");
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
    });
    setIsEditDialogOpen(true);
  };

  const handleEditBlocks = (page: Page) => {
    setEditingBlocksPage(page);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const pages = pagesQuery.data || [];
    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);

    const reorderedPages = arrayMove(pages, oldIndex, newIndex);
    const pageOrders = reorderedPages.map((page, index) => ({
      id: page.id,
      navOrder: index,
    }));

    try {
      await reorderMutation.mutateAsync({ pageOrders });
      pagesQuery.refetch();
      toast.success("Pages reordered");
    } catch (error) {
      toast.error("Failed to reorder pages");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src="/media/logo-white.png"
            alt="Just Empower"
            className="h-10 opacity-90"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Admin Portal
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administrator
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

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
                      Add a new page to your website
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="About Us"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
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
                      <Label htmlFor="metaTitle">SEO Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, metaTitle: e.target.value })
                        }
                        placeholder="About Us - Just Empower"
                      />
                    </div>

                    <div>
                      <Label htmlFor="metaDescription">SEO Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({ ...formData, metaDescription: e.target.value })
                        }
                        placeholder="Learn about our mission and values"
                        rows={3}
                      />
                    </div>

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

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePage}>Create Page</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Block Editor or Pages List */}
            {editingBlocksPage ? (
              <div className="space-y-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingBlocksPage(null)}
                  className="mb-4"
                >
                  ← Back to Pages
                </Button>
                <BlockEditor
                  pageId={editingBlocksPage.id}
                  pageName={editingBlocksPage.title}
                />
              </div>
            ) : (
            <div className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pagesQuery.data?.map((p) => p.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {pagesQuery.data?.map((page) => (
                    <SortablePage
                      key={page.id}
                      page={page}
                      onEdit={handleEditPage}
                      onEditBlocks={handleEditBlocks}
                      onDelete={handleDeletePage}
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
            )}
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Update page details and SEO settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Page Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-slug">URL Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-neutral-500 mt-1">URL: /{formData.slug}</p>
            </div>

            <div>
              <Label htmlFor="edit-metaTitle">SEO Title</Label>
              <Input
                id="edit-metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-metaDescription">SEO Description</Label>
              <Textarea
                id="edit-metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, metaDescription: e.target.value })
                }
                rows={3}
              />
            </div>

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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePage}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
