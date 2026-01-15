/**
 * Admin Carousel Manager
 * 
 * Central management for ALL carousels across the site.
 * Supports multiple carousel types with slides management.
 * 
 * Features:
 * - Create/edit/delete carousels
 * - Manage slides for each carousel
 * - Drag-and-drop reordering
 * - Preview carousel types
 * - Copy embed code for pages
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminSidebar from '@/components/AdminSidebar';
import MediaPicker from '@/components/MediaPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronRight,
  GripVertical,
  Image,
  Video,
  Quote,
  LayoutGrid,
  Layers,
  Settings,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================================
// TYPES
// ============================================================================

type CarouselType = 'hero' | 'featured' | 'testimonial' | 'gallery' | 'card' | 'custom';

interface Carousel {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  type: CarouselType;
  settings: Record<string, any>;
  styling: Record<string, any>;
  active: number;
  slideCount?: number;
  slides?: Slide[];
}

interface Slide {
  id: number;
  carouselId: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  authorAvatar?: string | null;
  rating?: number | null;
  visible: number;
  sortOrder: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminCarouselManager() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  const [view, setView] = useState<'list' | 'edit' | 'slides'>('list');
  const [selectedCarousel, setSelectedCarousel] = useState<Carousel | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: carousels, isLoading, refetch } = trpc.carousel.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleEditCarousel = (carousel: Carousel) => {
    setSelectedCarousel(carousel);
    setView('edit');
  };

  const handleManageSlides = async (carousel: Carousel) => {
    setSelectedCarousel(carousel);
    setView('slides');
  };

  const handleBack = () => {
    setSelectedCarousel(null);
    setView('list');
    refetch();
  };

  const handleCopyEmbed = (slug: string) => {
    const embedCode = `<ManagedCarousel slug="${slug}" />`;
    navigator.clipboard.writeText(embedCode);
    setCopiedSlug(slug);
    toast.success('Embed code copied to clipboard');
    setTimeout(() => setCopiedSlug(null), 2000);
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {view !== 'list' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-serif">
                  {view === 'list' && 'Carousel Manager'}
                  {view === 'edit' && (selectedCarousel?.id ? 'Edit Carousel' : 'New Carousel')}
                  {view === 'slides' && `${selectedCarousel?.name} - Slides`}
                </h1>
                <p className="text-neutral-600 mt-1">
                  {view === 'list' && 'Manage all carousels across your site'}
                  {view === 'edit' && 'Configure carousel settings'}
                  {view === 'slides' && 'Add, edit, and reorder slides'}
                </p>
              </div>
            </div>

            {view === 'list' && (
              <Button
                onClick={() => {
                  setSelectedCarousel(null);
                  setView('edit');
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Carousel
              </Button>
            )}
          </div>

          {/* Content */}
          {view === 'list' && (
            <CarouselList
              carousels={carousels || []}
              isLoading={isLoading}
              onEdit={handleEditCarousel}
              onManageSlides={handleManageSlides}
              onRefresh={refetch}
              copiedSlug={copiedSlug}
              onCopyEmbed={handleCopyEmbed}
            />
          )}

          {view === 'edit' && (
            <CarouselEditor
              carousel={selectedCarousel}
              onSave={() => {
                toast.success('Carousel saved successfully');
                handleBack();
              }}
              onCancel={handleBack}
            />
          )}

          {view === 'slides' && selectedCarousel && (
            <SlideManager
              carousel={selectedCarousel}
              onUpdate={() => refetch()}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// CAROUSEL LIST
// ============================================================================

interface CarouselListProps {
  carousels: Carousel[];
  isLoading: boolean;
  onEdit: (carousel: Carousel) => void;
  onManageSlides: (carousel: Carousel) => void;
  onRefresh: () => void;
  copiedSlug: string | null;
  onCopyEmbed: (slug: string) => void;
}

function CarouselList({ carousels, isLoading, onEdit, onManageSlides, onRefresh, copiedSlug, onCopyEmbed }: CarouselListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCarousel, setDeletingCarousel] = useState<Carousel | null>(null);

  const deleteMutation = trpc.carousel.delete.useMutation({
    onSuccess: () => {
      toast.success('Carousel deleted');
      onRefresh();
      setDeleteDialogOpen(false);
      setDeletingCarousel(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete carousel');
    },
  });

  const handleDelete = (carousel: Carousel) => {
    setDeletingCarousel(carousel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCarousel) {
      deleteMutation.mutate({ id: deletingCarousel.id });
    }
  };

  const getTypeIcon = (type: CarouselType) => {
    switch (type) {
      case 'hero': return <Layers className="w-5 h-5" />;
      case 'featured': return <Sparkles className="w-5 h-5" />;
      case 'testimonial': return <Quote className="w-5 h-5" />;
      case 'gallery': return <Image className="w-5 h-5" />;
      case 'card': return <LayoutGrid className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: CarouselType) => {
    const labels: Record<CarouselType, string> = {
      hero: 'Hero',
      featured: 'Featured',
      testimonial: 'Testimonial',
      gallery: 'Gallery',
      card: 'Card Grid',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-neutral-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (carousels.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
        <Layers className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-neutral-700 mb-2">No carousels yet</h3>
        <p className="text-neutral-500 mb-6">Create your first carousel to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {carousels.map(carousel => (
          <div
            key={carousel.id}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`p-3 rounded-lg ${carousel.active === 1 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-400'}`}>
                    {getTypeIcon(carousel.type)}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-900">{carousel.name}</h3>
                      {carousel.active !== 1 && (
                        <span className="px-2 py-0.5 text-xs bg-neutral-200 text-neutral-600 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{carousel.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-neutral-400">Type: <span className="text-neutral-600">{getTypeLabel(carousel.type)}</span></span>
                      <span className="text-neutral-400">Slides: <span className="text-neutral-600">{carousel.slideCount || 0}</span></span>
                      <span className="text-neutral-400">Slug: <code className="text-amber-600 bg-amber-50 px-1 rounded">{carousel.slug}</code></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyEmbed(carousel.slug)}
                    title="Copy embed code"
                  >
                    {copiedSlug === carousel.slug ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(carousel)}
                    title="Edit settings"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(carousel)}
                    title="Delete carousel"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>

              {/* Manage Slides Button */}
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => onManageSlides(carousel)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Manage Slides
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        ))}

        {/* Help Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
          <h4 className="font-medium text-amber-900 mb-2">How to use carousels</h4>
          <p className="text-sm text-amber-800 mb-3">
            To add a carousel to any page, use the embed code. Click the copy button next to any carousel to get its code.
          </p>
          <code className="block bg-white px-4 py-2 rounded border border-amber-200 text-sm text-amber-900">
            {'<ManagedCarousel slug="your-carousel-slug" />'}
          </code>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carousel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCarousel?.name}"? This will also delete all its slides. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// CAROUSEL EDITOR
// ============================================================================

interface CarouselEditorProps {
  carousel: Carousel | null;
  onSave: () => void;
  onCancel: () => void;
}

function CarouselEditor({ carousel, onSave, onCancel }: CarouselEditorProps) {
  const isNew = !carousel?.id;

  const [formData, setFormData] = useState({
    name: carousel?.name || '',
    slug: carousel?.slug || '',
    description: carousel?.description || '',
    type: (carousel?.type || 'featured') as CarouselType,
    active: carousel?.active === 1,
    settings: {
      autoPlay: carousel?.settings?.autoPlay ?? true,
      interval: carousel?.settings?.interval ?? 5000,
      showArrows: carousel?.settings?.showArrows ?? true,
      showDots: carousel?.settings?.showDots ?? true,
      pauseOnHover: carousel?.settings?.pauseOnHover ?? true,
      dark: carousel?.settings?.dark ?? false,
      overlayOpacity: carousel?.settings?.overlayOpacity ?? 50,
      itemsPerView: carousel?.settings?.itemsPerView ?? 3,
    },
  });

  const createMutation = trpc.carousel.create.useMutation({
    onSuccess: onSave,
    onError: (err) => toast.error(err.message || 'Failed to create carousel'),
  });

  const updateMutation = trpc.carousel.update.useMutation({
    onSuccess: onSave,
    onError: (err) => toast.error(err.message || 'Failed to update carousel'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (isNew) {
      createMutation.mutate({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        type: formData.type,
        active: formData.active,
        settings: formData.settings,
      });
    } else {
      updateMutation.mutate({
        id: carousel!.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        type: formData.type,
        active: formData.active,
        settings: formData.settings,
      });
    }
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const carouselTypes: { value: CarouselType; label: string; description: string }[] = [
    { value: 'hero', label: 'Hero', description: 'Full-screen slides with background images/videos' },
    { value: 'featured', label: 'Featured', description: 'Showcase offerings, products, or services' },
    { value: 'testimonial', label: 'Testimonial', description: 'Customer quotes and reviews' },
    { value: 'gallery', label: 'Gallery', description: 'Image gallery with thumbnails' },
    { value: 'card', label: 'Card Grid', description: 'Multiple cards visible at once' },
    { value: 'custom', label: 'Custom', description: 'Basic carousel with custom styling' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
        {/* Basic Info */}
        <div className="p-6 space-y-4">
          <h3 className="font-medium text-neutral-900">Basic Information</h3>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              onBlur={() => isNew && !formData.slug && generateSlug()}
              placeholder="e.g., Homepage Hero"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="homepage-hero"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={generateSlug}>
                Generate
              </Button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">Used in embed code: {`<ManagedCarousel slug="${formData.slug || '...'}" />`}</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Describe this carousel's purpose..."
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Active (visible on site)</Label>
          </div>
        </div>

        {/* Carousel Type */}
        <div className="p-6 space-y-4">
          <h3 className="font-medium text-neutral-900">Carousel Type</h3>

          <div className="grid grid-cols-2 gap-3">
            {carouselTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={`p-4 text-left rounded-lg border-2 transition-colors ${
                  formData.type === type.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <p className="font-medium text-neutral-900">{type.label}</p>
                <p className="text-xs text-neutral-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-6 space-y-4">
          <h3 className="font-medium text-neutral-900">Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="autoPlay"
                checked={formData.settings.autoPlay}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, autoPlay: checked }
                }))}
              />
              <Label htmlFor="autoPlay">Auto-play</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="showArrows"
                checked={formData.settings.showArrows}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, showArrows: checked }
                }))}
              />
              <Label htmlFor="showArrows">Show arrows</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="showDots"
                checked={formData.settings.showDots}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, showDots: checked }
                }))}
              />
              <Label htmlFor="showDots">Show dot indicators</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="pauseOnHover"
                checked={formData.settings.pauseOnHover}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, pauseOnHover: checked }
                }))}
              />
              <Label htmlFor="pauseOnHover">Pause on hover</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="dark"
                checked={formData.settings.dark}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, dark: checked }
                }))}
              />
              <Label htmlFor="dark">Dark mode</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="interval">Auto-play interval (ms)</Label>
            <Input
              id="interval"
              type="number"
              value={formData.settings.interval}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, interval: parseInt(e.target.value) || 5000 }
              }))}
              min={1000}
              max={30000}
              step={500}
              className="mt-1"
            />
          </div>

          {formData.type === 'card' && (
            <div>
              <Label htmlFor="itemsPerView">Items per view</Label>
              <Select
                value={String(formData.settings.itemsPerView)}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, itemsPerView: parseInt(value) }
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isNew ? 'Create Carousel' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// SLIDE MANAGER
// ============================================================================

interface SlideManagerProps {
  carousel: Carousel;
  onUpdate: () => void;
}

function SlideManager({ carousel, onUpdate }: SlideManagerProps) {
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSlide, setDeletingSlide] = useState<Slide | null>(null);

  const { data: carouselData, refetch } = trpc.carousel.get.useQuery(
    { id: carousel.id },
    { enabled: !!carousel.id }
  );

  const slides = carouselData?.slides || [];

  const addSlideMutation = trpc.carousel.createSlide.useMutation({
    onSuccess: () => {
      toast.success('Slide added');
      setIsAddingNew(false);
      refetch();
      onUpdate();
    },
    onError: (err) => toast.error(err.message || 'Failed to add slide'),
  });

  const updateSlideMutation = trpc.carousel.updateSlide.useMutation({
    onSuccess: () => {
      toast.success('Slide updated');
      setEditingSlide(null);
      refetch();
      onUpdate();
    },
    onError: (err) => toast.error(err.message || 'Failed to update slide'),
  });

  const deleteSlideMutation = trpc.carousel.deleteSlide.useMutation({
    onSuccess: () => {
      toast.success('Slide deleted');
      setDeleteDialogOpen(false);
      setDeletingSlide(null);
      refetch();
      onUpdate();
    },
    onError: (err) => toast.error(err.message || 'Failed to delete slide'),
  });

  const reorderMutation = trpc.carousel.reorderSlides.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => toast.error(err.message || 'Failed to reorder'),
  });

  const handleToggleVisibility = (slide: Slide) => {
    updateSlideMutation.mutate({ id: slide.id, visible: slide.visible === 1 ? false : true });
  };

  const handleDeleteSlide = (slide: Slide) => {
    setDeletingSlide(slide);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingSlide) {
      deleteSlideMutation.mutate({ id: deletingSlide.id });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = slides.map((s, i) => ({
      id: s.id,
      sortOrder: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    reorderMutation.mutate(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newOrder = slides.map((s, i) => ({
      id: s.id,
      sortOrder: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    reorderMutation.mutate(newOrder);
  };

  return (
    <div className="space-y-6">
      {/* Add Slide Button */}
      <Button onClick={() => setIsAddingNew(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Slide
      </Button>

      {/* Slides List */}
      <div className="space-y-3">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`bg-white rounded-xl border overflow-hidden ${slide.visible === 1 ? 'border-neutral-200' : 'border-neutral-100 opacity-60'}`}
          >
            <div className="flex items-center gap-4 p-4">
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === slides.length - 1}
                  className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : slide.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-neutral-400" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-neutral-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {slide.title || slide.authorName || `Slide ${index + 1}`}
                </p>
                <p className="text-sm text-neutral-500 truncate">
                  {slide.description || slide.subtitle || 'No description'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleVisibility(slide)}
                  title={slide.visible === 1 ? 'Hide slide' : 'Show slide'}
                >
                  {slide.visible === 1 ? (
                    <Eye className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-300" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSlide(slide)}
                  title="Edit slide"
                >
                  <Edit2 className="w-4 h-4 text-neutral-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlide(slide)}
                  title="Delete slide"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-neutral-300">
            <Image className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No slides yet. Add your first slide to get started.</p>
          </div>
        )}
      </div>

      {/* Slide Editor Modal */}
      {(editingSlide || isAddingNew) && (
        <SlideEditorModal
          slide={editingSlide}
          carouselId={carousel.id}
          carouselType={carousel.type}
          onSave={(data) => {
            if (editingSlide) {
              updateSlideMutation.mutate({ id: editingSlide.id, ...data });
            } else {
              addSlideMutation.mutate({ carouselId: carousel.id, ...data });
            }
          }}
          onClose={() => {
            setEditingSlide(null);
            setIsAddingNew(false);
          }}
          isSaving={addSlideMutation.isPending || updateSlideMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// SLIDE EDITOR MODAL
// ============================================================================

interface SlideEditorModalProps {
  slide: Slide | null;
  carouselId: number;
  carouselType: CarouselType;
  onSave: (data: any) => void;
  onClose: () => void;
  isSaving: boolean;
}

function SlideEditorModal({ slide, carouselId, carouselType, onSave, onClose, isSaving }: SlideEditorModalProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerField, setMediaPickerField] = useState<'imageUrl' | 'authorAvatar'>('imageUrl');
  
  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    description: slide?.description || '',
    imageUrl: slide?.imageUrl || '',
    videoUrl: slide?.videoUrl || '',
    ctaText: slide?.ctaText || '',
    ctaLink: slide?.ctaLink || '',
    authorName: slide?.authorName || '',
    authorRole: slide?.authorRole || '',
    authorAvatar: slide?.authorAvatar || '',
    rating: slide?.rating || 5,
    visible: slide?.visible === 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleMediaSelect = (url: string) => {
    setFormData(prev => ({ ...prev, [mediaPickerField]: url }));
    setMediaPickerOpen(false);
  };

  const openMediaPicker = (field: 'imageUrl' | 'authorAvatar') => {
    setMediaPickerField(field);
    setMediaPickerOpen(true);
  };

  const isTestimonial = carouselType === 'testimonial';
  const isHeroOrFeatured = carouselType === 'hero' || carouselType === 'featured';

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{slide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
            <DialogDescription>
              {isTestimonial ? 'Add a testimonial with author information' : 'Configure the slide content and appearance'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title / Quote */}
            <div>
              <Label htmlFor="title">{isTestimonial ? 'Quote' : 'Title'}</Label>
              <Input
                id="title"
                value={isTestimonial ? formData.description : formData.title}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [isTestimonial ? 'description' : 'title']: e.target.value
                }))}
                placeholder={isTestimonial ? 'Enter the testimonial quote...' : 'Enter slide title...'}
                className="mt-1"
              />
            </div>

            {/* Subtitle (non-testimonial) */}
            {!isTestimonial && (
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}

            {/* Description (non-testimonial) */}
            {!isTestimonial && (
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}

            {/* Image URL */}
            <div>
              <Label htmlFor="imageUrl">Image</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <Button type="button" variant="outline" onClick={() => openMediaPicker('imageUrl')}>
                  <Image className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Video URL (hero/featured only) */}
            {isHeroOrFeatured && (
              <div>
                <Label htmlFor="videoUrl">Video URL (optional)</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://...mp4"
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">Supported: .mp4, .webm, .mov</p>
              </div>
            )}

            {/* CTA (non-testimonial) */}
            {!isTestimonial && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Learn More"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ctaLink">Button Link</Label>
                  <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                    placeholder="/about"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Testimonial Author Fields */}
            {isTestimonial && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="authorName">Author Name</Label>
                    <Input
                      id="authorName"
                      value={formData.authorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authorRole">Author Role</Label>
                    <Input
                      id="authorRole"
                      value={formData.authorRole}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorRole: e.target.value }))}
                      placeholder="CEO, Company Name"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="authorAvatar">Author Avatar</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="authorAvatar"
                      value={formData.authorAvatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorAvatar: e.target.value }))}
                      placeholder="https://..."
                    />
                    <Button type="button" variant="outline" onClick={() => openMediaPicker('authorAvatar')}>
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Select
                    value={String(formData.rating)}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rating: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Visible */}
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="slideVisible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible: checked }))}
              />
              <Label htmlFor="slideVisible">Visible on site</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Slide'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        mediaType="image"
      />
    </>
  );
}
