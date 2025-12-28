import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, Plus, Edit, Trash2, GripVertical, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase, Search } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
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

type NavigationItem = {
  id: number;
  location: "header" | "footer";
  label: string;
  url: string;
  order: number;
  isExternal: number;
  openInNewTab: number;
  parentId: number | null;
};

function SortableNavItem({ item, onEdit, onDelete }: { item: NavigationItem; onEdit: (item: NavigationItem) => void; onDelete: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-stone-400" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{item.label}</div>
        <div className="text-sm text-stone-500">{item.url}</div>
        {item.isExternal === 1 && (
          <span className="text-xs text-amber-600">External Link</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminNavigation() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState<"header" | "footer">("header");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    isExternal: false,
    openInNewTab: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const navQuery = trpc.admin.navigation.list.useQuery({ location: activeTab });
  const createMutation = trpc.admin.navigation.create.useMutation({
    onSuccess: () => {
      toast.success("Navigation item added");
      navQuery.refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add item");
    },
  });
  
  const updateMutation = trpc.admin.navigation.update.useMutation({
    onSuccess: () => {
      toast.success("Navigation item updated");
      navQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update item");
    },
  });
  
  const deleteMutation = trpc.admin.navigation.delete.useMutation({
    onSuccess: () => {
      toast.success("Navigation item deleted");
      navQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete item");
    },
  });
  
  const reorderMutation = trpc.admin.navigation.reorder.useMutation({
    onSuccess: () => {
      toast.success("Navigation order updated");
      navQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order");
    },
  });

  const resetForm = () => {
    setFormData({
      label: "",
      url: "",
      isExternal: false,
      openInNewTab: false,
    });
  };

  const handleAdd = async () => {
    if (!formData.label || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createMutation.mutateAsync({
      location: activeTab,
      label: formData.label,
      url: formData.url,
      isExternal: formData.isExternal ? 1 : 0,
      openInNewTab: formData.openInNewTab ? 1 : 0,
      order: (navQuery.data?.length || 0),
    });
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      url: item.url,
      isExternal: item.isExternal === 1,
      openInNewTab: item.openInNewTab === 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem || !formData.label || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    await updateMutation.mutateAsync({
      id: editingItem.id,
      label: formData.label,
      url: formData.url,
      isExternal: formData.isExternal ? 1 : 0,
      openInNewTab: formData.openInNewTab ? 1 : 0,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this navigation item?")) {
      return;
    }
    await deleteMutation.mutateAsync({ id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const items = navQuery.data || [];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    
    // Update order values
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    reorderMutation.mutate({ items: updates });
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Navigation Editor</h1>
            <p className="text-stone-600">Manage header and footer navigation menus</p>
          </div>

          {/* Tabs for Header/Footer */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "header" | "footer")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="header">Header Menu</TabsTrigger>
              <TabsTrigger value="footer">Footer Menu</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{activeTab === "header" ? "Header" : "Footer"} Navigation</CardTitle>
                      <CardDescription>Drag and drop to reorder menu items</CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Navigation Item</DialogTitle>
                          <DialogDescription>Create a new menu item for the {activeTab}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="label">Label *</Label>
                            <Input
                              id="label"
                              value={formData.label}
                              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                              placeholder="Home"
                            />
                          </div>
                          <div>
                            <Label htmlFor="url">URL *</Label>
                            <Input
                              id="url"
                              value={formData.url}
                              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                              placeholder="/about"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isExternal"
                              checked={formData.isExternal}
                              onCheckedChange={(checked) => setFormData({ ...formData, isExternal: checked })}
                            />
                            <Label htmlFor="isExternal" className="cursor-pointer">
                              External Link
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="openInNewTab"
                              checked={formData.openInNewTab}
                              onCheckedChange={(checked) => setFormData({ ...formData, openInNewTab: checked })}
                            />
                            <Label htmlFor="openInNewTab" className="cursor-pointer">
                              Open in New Tab
                            </Label>
                          </div>
                          <Button
                            onClick={handleAdd}
                            disabled={createMutation.isPending}
                            className="w-full bg-amber-600 hover:bg-amber-700"
                          >
                            {createMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {navQuery.isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                  ) : !navQuery.data || navQuery.data.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      <Menu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No navigation items yet</p>
                      <p className="text-sm">Click "Add Item" to create your first menu item</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={navQuery.data.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {navQuery.data.map((item) => (
                            <SortableNavItem
                              key={item.id}
                              item={item}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Navigation Item</DialogTitle>
                <DialogDescription>Update the menu item details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-label">Label *</Label>
                  <Input
                    id="edit-label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-url">URL *</Label>
                  <Input
                    id="edit-url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isExternal"
                    checked={formData.isExternal}
                    onCheckedChange={(checked) => setFormData({ ...formData, isExternal: checked })}
                  />
                  <Label htmlFor="edit-isExternal" className="cursor-pointer">
                    External Link
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-openInNewTab"
                    checked={formData.openInNewTab}
                    onCheckedChange={(checked) => setFormData({ ...formData, openInNewTab: checked })}
                  />
                  <Label htmlFor="edit-openInNewTab" className="cursor-pointer">
                    Open in New Tab
                  </Label>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Item
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
