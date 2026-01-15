import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Image, ExternalLink, Eye, EyeOff } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import MediaPicker from '@/components/MediaPicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CarouselOffering {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  imageUrl: string | null;
  order: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminCarousel() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<CarouselOffering | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    imageUrl: '',
    isActive: 1,
  });

  const utils = trpc.useUtils();
  
  const { data: offerings, isLoading, refetch } = trpc.carousel.getAllAdmin.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.carousel.createOffering.useMutation({
    onSuccess: () => {
      toast.success('Offering created successfully');
      utils.carousel.getAllAdmin.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create offering');
    },
  });

  const updateMutation = trpc.carousel.updateOffering.useMutation({
    onSuccess: () => {
      toast.success('Offering updated successfully');
      utils.carousel.getAllAdmin.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update offering');
    },
  });

  const deleteMutation = trpc.carousel.deleteOffering.useMutation({
    onSuccess: () => {
      toast.success('Offering deleted successfully');
      utils.carousel.getAllAdmin.invalidate();
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete offering');
    },
  });

  const reorderMutation = trpc.carousel.reorderOfferings.useMutation({
    onSuccess: () => {
      toast.success('Order updated');
      utils.carousel.getAllAdmin.invalidate();
    },
    onError: (error) => {
      toast.error((error as unknown as Error).message || 'Failed to reorder');
    },
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      imageUrl: '',
      isActive: 1,
    });
    setEditingOffering(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (offering: CarouselOffering) => {
    setEditingOffering(offering);
    setFormData({
      title: offering.title,
      description: offering.description || '',
      link: offering.link || '',
      imageUrl: offering.imageUrl || '',
      isActive: offering.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingOffering) {
      updateMutation.mutate({
        id: editingOffering.id,
        title: formData.title,
        description: formData.description || undefined,
        link: formData.link || undefined,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description || undefined,
        link: formData.link || undefined,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        order: offerings?.length || 0,
      });
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const handleToggleActive = (offering: CarouselOffering) => {
    updateMutation.mutate({
      id: offering.id,
      isActive: offering.isActive === 1 ? 0 : 1,
    });
  };

  const handleMoveUp = (index: number) => {
    if (!offerings || index === 0) return;
    const newOrder = offerings.map((o, i) => ({
      id: o.id,
      order: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    reorderMutation.mutate(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (!offerings || index === offerings.length - 1) return;
    const newOrder = offerings.map((o, i) => ({
      id: o.id,
      order: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    reorderMutation.mutate(newOrder);
  };

  const handleMediaSelect = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setMediaPickerOpen(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif">Featured Offerings</h1>
              <p className="text-neutral-600 mt-1">Manage the featured offerings displayed on the homepage</p>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Offering
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : offerings && offerings.length > 0 ? (
            <div className="space-y-4">
              {offerings.map((offering, index) => (
                <div
                  key={offering.id}
                  className={`bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4 ${
                    offering.isActive === 0 ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === offerings.length - 1}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {offering.imageUrl ? (
                      <img
                        src={offering.imageUrl}
                        alt={offering.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center ${offering.imageUrl ? 'hidden' : ''}`}>
                      <span className="text-2xl font-serif text-amber-600/60">{offering.title.charAt(0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{offering.title}</h3>
                    {offering.description && (
                      <p className="text-sm text-neutral-600 truncate">{offering.description}</p>
                    )}
                    {offering.link && (
                      <p className="text-xs text-blue-600 truncate flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {offering.link}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(offering)}
                      title={offering.isActive === 1 ? 'Hide from carousel' : 'Show in carousel'}
                    >
                      {offering.isActive === 1 ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(offering)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(offering.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center">
                <span className="text-3xl font-serif text-amber-600/60">✦</span>
              </div>
              <h3 className="text-lg font-medium text-neutral-700">No offerings yet</h3>
              <p className="text-neutral-500 mt-1 mb-4">Add your first featured offering to display on the homepage</p>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Offering
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingOffering ? 'Edit Offering' : 'Add New Offering'}</DialogTitle>
            <DialogDescription>
              {editingOffering
                ? 'Update the details of this featured offering.'
                : 'Create a new featured offering to display on the homepage.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Seeds of a New Paradigm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of this offering..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Link URL</label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/offerings/seeds-of-a-new-paradigm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Image</label>
              <div className="flex gap-2">
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
              {formData.imageUrl && (
                <div className="mt-2 w-full h-32 rounded-lg overflow-hidden relative">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center">
                    <span className="text-sm text-amber-600/80">Image failed to load</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive === 1}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked ? 1 : 0 }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm">Show in carousel</label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offering</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offering? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
