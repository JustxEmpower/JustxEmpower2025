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
import { Plus, Edit, Trash2, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase, Search, Menu, FormInput, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';

type Redirect = {
  id: number;
  fromPath: string;
  toPath: string;
  redirectType: "301" | "302";
  isActive: number;
  createdAt: Date;
};

export default function AdminRedirects() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  
  const [formData, setFormData] = useState({
    fromPath: "",
    toPath: "",
    redirectType: "301" as "301" | "302",
    isActive: true,
  });

  const redirectsQuery = trpc.admin.redirects.list.useQuery();
  
  const createMutation = trpc.admin.redirects.create.useMutation({
    onSuccess: () => {
      toast.success("Redirect added");
      redirectsQuery.refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add redirect");
    },
  });
  
  const updateMutation = trpc.admin.redirects.update.useMutation({
    onSuccess: () => {
      toast.success("Redirect updated");
      redirectsQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingRedirect(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update redirect");
    },
  });
  
  const deleteMutation = trpc.admin.redirects.delete.useMutation({
    onSuccess: () => {
      toast.success("Redirect deleted");
      redirectsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete redirect");
    },
  });

  const resetForm = () => {
    setFormData({
      fromPath: "",
      toPath: "",
      redirectType: "301",
      isActive: true,
    });
  };

  const handleAdd = async () => {
    if (!formData.fromPath || !formData.toPath) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Ensure paths start with /
    const fromPath = formData.fromPath.startsWith("/") ? formData.fromPath : `/${formData.fromPath}`;
    const toPath = formData.toPath.startsWith("/") ? formData.toPath : `/${formData.toPath}`;

    await createMutation.mutateAsync({
      fromPath,
      toPath,
      redirectType: formData.redirectType,
      isActive: formData.isActive ? 1 : 0,
    });
  };

  const handleEdit = (redirect: Redirect) => {
    setEditingRedirect(redirect);
    setFormData({
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      redirectType: redirect.redirectType,
      isActive: redirect.isActive === 1,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingRedirect || !formData.fromPath || !formData.toPath) {
      toast.error("Please fill in all required fields");
      return;
    }

    const fromPath = formData.fromPath.startsWith("/") ? formData.fromPath : `/${formData.fromPath}`;
    const toPath = formData.toPath.startsWith("/") ? formData.toPath : `/${formData.toPath}`;

    await updateMutation.mutateAsync({
      id: editingRedirect.id,
      fromPath,
      toPath,
      redirectType: formData.redirectType,
      isActive: formData.isActive ? 1 : 0,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this redirect?")) {
      return;
    }
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">URL Redirects</h1>
            <p className="text-stone-600">Manage 301 and 302 redirects for SEO and site restructuring</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Redirects</CardTitle>
                  <CardDescription>Redirect old URLs to new locations</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Redirect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add URL Redirect</DialogTitle>
                      <DialogDescription>Create a new redirect rule</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="fromPath">From Path *</Label>
                        <Input
                          id="fromPath"
                          value={formData.fromPath}
                          onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
                          placeholder="/old-page"
                        />
                        <p className="text-xs text-stone-500 mt-1">The old URL path to redirect from</p>
                      </div>
                      <div>
                        <Label htmlFor="toPath">To Path *</Label>
                        <Input
                          id="toPath"
                          value={formData.toPath}
                          onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
                          placeholder="/new-page"
                        />
                        <p className="text-xs text-stone-500 mt-1">The new URL path to redirect to</p>
                      </div>
                      <div>
                        <Label htmlFor="redirectType">Redirect Type *</Label>
                        <Select
                          value={formData.redirectType}
                          onValueChange={(value) => setFormData({ ...formData, redirectType: value as "301" | "302" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="301">301 - Permanent</SelectItem>
                            <SelectItem value="302">302 - Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-stone-500 mt-1">
                          301 for permanent moves, 302 for temporary redirects
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                          Active
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
                            Add Redirect
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {redirectsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                </div>
              ) : !redirectsQuery.data || redirectsQuery.data.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No redirects configured</p>
                  <p className="text-sm">Click "Add Redirect" to create your first redirect</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redirectsQuery.data.map((redirect) => (
                    <div
                      key={redirect.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg hover:shadow-sm transition-shadow ${
                        redirect.isActive === 0 ? "opacity-50 bg-stone-50" : "bg-white"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium font-mono text-sm">
                          {redirect.fromPath} → {redirect.toPath}
                        </div>
                        <div className="text-sm text-stone-500 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            redirect.redirectType === "301" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {redirect.redirectType} {redirect.redirectType === "301" ? "Permanent" : "Temporary"}
                          </span>
                          {redirect.isActive === 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-stone-200 text-stone-600">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(redirect)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(redirect.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Redirect</DialogTitle>
                <DialogDescription>Update the redirect rule</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-fromPath">From Path *</Label>
                  <Input
                    id="edit-fromPath"
                    value={formData.fromPath}
                    onChange={(e) => setFormData({ ...formData, fromPath: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-toPath">To Path *</Label>
                  <Input
                    id="edit-toPath"
                    value={formData.toPath}
                    onChange={(e) => setFormData({ ...formData, toPath: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-redirectType">Redirect Type *</Label>
                  <Select
                    value={formData.redirectType}
                    onValueChange={(value) => setFormData({ ...formData, redirectType: value as "301" | "302" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="301">301 - Permanent</SelectItem>
                      <SelectItem value="302">302 - Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="edit-isActive" className="cursor-pointer">
                    Active
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
                      Update Redirect
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
