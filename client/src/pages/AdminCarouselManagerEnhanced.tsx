import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AdminSidebar from '@/components/AdminSidebar';
import MediaPicker from '@/components/MediaPicker';
import { motion } from "framer-motion";
import { Images, Plus, Edit, Trash2, Search, RefreshCw, Settings, Layers, LayoutGrid, GripVertical, Eye, EyeOff, Home, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

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

interface CarouselSlide {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
}

export default function AdminCarouselManagerEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("homepage");
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [slideFormData, setSlideFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
    order: 0,
  });

  // Fetch homepage carousel slides (legacy carouselOfferings table)
  const homepageCarouselQuery = trpc.carousel.getAll.useQuery();
  const homepageSlides = (homepageCarouselQuery.data || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    subtitle: s.description,
    imageUrl: s.imageUrl,
    linkUrl: s.link,
    isActive: s.isActive === 1,
    order: s.order,
  }));

  // Fetch page builder carousels (from content blocks)
  const pageBuilderCarouselsQuery = (trpc.content as any).getCarouselBlocks?.useQuery?.() || { data: [], isLoading: false };
  const pageBuilderCarousels = pageBuilderCarouselsQuery.data || [];

  // Mutations for homepage carousel (legacy carouselOfferings)
  const createSlideMutation = trpc.carousel.createOffering.useMutation({
    onSuccess: () => {
      toast.success("Slide added successfully");
      homepageCarouselQuery.refetch();
      resetSlideForm();
      setIsSlideDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to add slide: ${error.message}`),
  });

  const updateSlideMutation = trpc.carousel.updateOffering.useMutation({
    onSuccess: () => {
      toast.success("Slide updated successfully");
      homepageCarouselQuery.refetch();
      resetSlideForm();
      setEditingSlide(null);
      setIsSlideDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to update slide: ${error.message}`),
  });

  const deleteSlideMutation = trpc.carousel.deleteOffering.useMutation({
    onSuccess: () => {
      toast.success("Slide deleted");
      homepageCarouselQuery.refetch();
    },
    onError: (error) => toast.error(`Failed to delete slide: ${error.message}`),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const stats = useMemo(() => ({
    totalSlides: homepageSlides.length + pageBuilderCarousels.reduce((acc: number, c: any) => acc + (c.slides?.length || 0), 0),
    homepageActive: homepageSlides.filter((s: any) => s.isActive).length,
    pageBuilderCarousels: pageBuilderCarousels.length,
  }), [homepageSlides, pageBuilderCarousels]);

  const resetSlideForm = () => {
    setSlideFormData({ title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, order: 0 });
  };

  const handleEditSlide = (slide: any) => {
    setEditingSlide(slide);
    setSlideFormData({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      imageUrl: slide.imageUrl || "",
      linkUrl: slide.linkUrl || "",
      isActive: slide.isActive ?? true,
      order: slide.order || 0,
    });
    setIsSlideDialogOpen(true);
  };

  const handleSaveSlide = () => {
    // Map form fields to legacy API field names
    const legacyData = {
      title: slideFormData.title,
      description: slideFormData.subtitle,
      link: slideFormData.linkUrl,
      imageUrl: slideFormData.imageUrl,
      order: slideFormData.order,
      isActive: slideFormData.isActive ? 1 : 0,
    };
    
    if (editingSlide) {
      updateSlideMutation.mutate({ id: editingSlide.id, ...legacyData });
    } else {
      createSlideMutation.mutate(legacyData);
    }
  };

  const handleDeleteSlide = (id: number) => {
    if (confirm("Are you sure you want to delete this slide?")) {
      deleteSlideMutation.mutate({ id });
    }
  };

  const handleMediaSelect = (url: string) => {
    setSlideFormData({ ...slideFormData, imageUrl: url });
    setMediaPickerOpen(false);
  };

  if (isChecking || homepageCarouselQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Carousel Manager</h1>
                <p className="text-stone-500 text-sm">Manage all carousels across your site</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => homepageCarouselQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Slides", value: stats.totalSlides, icon: Images, color: "amber" },
              { label: "Homepage Active", value: stats.homepageActive, icon: Eye, color: "emerald" },
              { label: "Page Carousels", value: stats.pageBuilderCarousels, icon: Layers, color: "blue" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-gradient-to-br from-stone-50 to-stone-100/50 border-stone-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-stone-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-stone-900"><AnimatedCounter value={stat.value} /></p>
                      </div>
                      <stat.icon className="w-8 h-8 text-stone-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Carousel Sections */}
          <Accordion type="multiple" defaultValue={["homepage"]} className="space-y-4">
            {/* Homepage Carousel */}
            <AccordionItem value="homepage" className="border rounded-lg bg-white shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-stone-900">Homepage Carousel</h3>
                    <p className="text-sm text-stone-500">{homepageSlides.length} slides • Featured offerings on homepage</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => { resetSlideForm(); setEditingSlide(null); setIsSlideDialogOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4 mr-2" />Add Slide
                    </Button>
                  </div>

                  {homepageSlides.length === 0 ? (
                    <div className="text-center py-8 text-stone-500">
                      <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No slides yet. Add your first slide to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {homepageSlides.map((slide: any, i: number) => (
                        <motion.div key={slide.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center gap-4 p-4">
                              <GripVertical className="w-5 h-5 text-stone-400 cursor-grab" />
                              <div className="w-24 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                                {slide.imageUrl ? (
                                  <img src={getMediaUrl(slide.imageUrl)} alt={slide.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Images className="w-6 h-6 text-stone-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold truncate">{slide.title || "Untitled"}</h4>
                                  <Badge className={slide.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"}>
                                    {slide.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                {slide.subtitle && <p className="text-sm text-stone-500 truncate">{slide.subtitle}</p>}
                                {slide.linkUrl && (
                                  <p className="text-xs text-amber-600 truncate flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />{slide.linkUrl}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditSlide(slide)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSlide(slide.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Page Builder Carousels - dynamically listed */}
            {pageBuilderCarousels.map((carousel: any) => (
              <AccordionItem key={carousel.id} value={`pb-${carousel.id}`} className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-stone-900">{carousel.name || `Carousel on ${carousel.pageName}`}</h3>
                      <p className="text-sm text-stone-500">{carousel.slides?.length || 0} slides • {carousel.pageName}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-stone-500">Page: <span className="font-medium">{carousel.pageName}</span></p>
                      <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/page-builder?page=${carousel.pageSlug}`)}>
                        Edit in Page Builder <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    {carousel.slides?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {carousel.slides.map((slide: any, i: number) => (
                          <div key={i} className="relative group">
                            <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden">
                              {slide.imageUrl ? (
                                <img src={getMediaUrl(slide.imageUrl)} alt={slide.title || `Slide ${i + 1}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Images className="w-8 h-8 text-stone-300" />
                                </div>
                              )}
                            </div>
                            {slide.title && <p className="text-xs mt-1 truncate">{slide.title}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-stone-500">No slides configured. Edit in Page Builder to add slides.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}

            {/* Empty state for page builder carousels */}
            {pageBuilderCarousels.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Layers className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <h3 className="font-medium text-stone-700 mb-1">Page Builder Carousels</h3>
                  <p className="text-sm text-stone-500 mb-4">
                    Carousels added via the Page Builder will appear here automatically.
                  </p>
                  <Button variant="outline" onClick={() => setLocation("/admin/page-builder")}>
                    Go to Page Builder
                  </Button>
                </CardContent>
              </Card>
            )}
          </Accordion>
        </div>

        {/* Slide Edit Dialog */}
        <Dialog open={isSlideDialogOpen} onOpenChange={(open) => { if (!open) { setIsSlideDialogOpen(false); setEditingSlide(null); resetSlideForm(); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={slideFormData.title} 
                  onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })} 
                  placeholder="Slide title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea 
                  value={slideFormData.subtitle} 
                  onChange={(e) => setSlideFormData({ ...slideFormData, subtitle: e.target.value })} 
                  rows={2}
                  placeholder="Optional subtitle text"
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input 
                    value={slideFormData.imageUrl} 
                    onChange={(e) => setSlideFormData({ ...slideFormData, imageUrl: e.target.value })} 
                    placeholder="/media/image.jpg or https://..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => setMediaPickerOpen(true)}>
                    <Images className="w-4 h-4" />
                  </Button>
                </div>
                {slideFormData.imageUrl && (
                  <div className="mt-2 w-full h-32 bg-stone-100 rounded-lg overflow-hidden">
                    <img src={getMediaUrl(slideFormData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Link URL (Slug)</Label>
                <Input 
                  value={slideFormData.linkUrl} 
                  onChange={(e) => setSlideFormData({ ...slideFormData, linkUrl: e.target.value })} 
                  placeholder="/shop or /about or https://..."
                />
                <p className="text-xs text-stone-500">Where should this slide link to when clicked?</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={slideFormData.isActive} 
                  onCheckedChange={(v) => setSlideFormData({ ...slideFormData, isActive: v })} 
                />
                <Label>Active (visible on site)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsSlideDialogOpen(false); setEditingSlide(null); resetSlideForm(); }}>
                Cancel
              </Button>
              <Button 
                className="bg-amber-600 hover:bg-amber-700" 
                onClick={handleSaveSlide}
                disabled={createSlideMutation.isPending || updateSlideMutation.isPending}
              >
                {createSlideMutation.isPending || updateSlideMutation.isPending ? "Saving..." : editingSlide ? "Update Slide" : "Add Slide"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Media Picker */}
        <MediaPicker
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
        />
      </main>
    </div>
  );
}
