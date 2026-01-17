import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, Upload, Trash2, RefreshCw, Loader2, Image, Monitor, Smartphone, 
  Globe, Share2, Twitter, CheckCircle, AlertCircle, Eye, Download, Copy,
  Sparkles, Layout, FileImage, Star
} from "lucide-react";
import { toast } from "sonner";

type AssetType = "logo_header" | "logo_footer" | "logo_mobile" | "logo_preloader" | "favicon" | "og_image" | "twitter_image";

interface BrandAsset {
  id: number;
  assetType: AssetType;
  assetUrl: string;
  assetName: string | null;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
  updatedAt?: Date;
}

const assetConfig: Record<AssetType, { 
  label: string; 
  description: string; 
  icon: React.ReactNode; 
  recommended: string;
  previewBg: string;
  category: "logos" | "icons" | "social";
}> = {
  logo_header: { 
    label: "Header Logo", 
    description: "Main logo displayed in the website header/navigation", 
    icon: <Layout className="w-5 h-5" />,
    recommended: "300×80px, PNG with transparency",
    previewBg: "bg-white",
    category: "logos"
  },
  logo_footer: { 
    label: "Footer Logo", 
    description: "Logo displayed in the website footer section", 
    icon: <Layout className="w-5 h-5 rotate-180" />,
    recommended: "250×70px, PNG with transparency",
    previewBg: "bg-stone-800",
    category: "logos"
  },
  logo_mobile: { 
    label: "Mobile Logo", 
    description: "Compact logo for mobile navigation and small screens", 
    icon: <Smartphone className="w-5 h-5" />,
    recommended: "150×50px, PNG with transparency",
    previewBg: "bg-white",
    category: "logos"
  },
  logo_preloader: { 
    label: "Preloader Logo", 
    description: "Logo shown during page loading animation", 
    icon: <Sparkles className="w-5 h-5" />,
    recommended: "200×200px, PNG/GIF/SVG",
    previewBg: "bg-gradient-to-br from-stone-100 to-stone-200",
    category: "logos"
  },
  favicon: { 
    label: "Favicon", 
    description: "Small icon shown in browser tabs and bookmarks", 
    icon: <Star className="w-5 h-5" />,
    recommended: "32×32px or 64×64px, ICO/PNG",
    previewBg: "bg-stone-100",
    category: "icons"
  },
  og_image: { 
    label: "Social Share Image", 
    description: "Image displayed when sharing on Facebook, LinkedIn, etc.", 
    icon: <Share2 className="w-5 h-5" />,
    recommended: "1200×630px, JPG/PNG",
    previewBg: "bg-stone-50",
    category: "social"
  },
  twitter_image: { 
    label: "Twitter Card Image", 
    description: "Image displayed when sharing on Twitter/X", 
    icon: <Twitter className="w-5 h-5" />,
    recommended: "1200×600px, JPG/PNG",
    previewBg: "bg-stone-50",
    category: "social"
  },
};

function AssetCard({ 
  type, 
  asset, 
  onUpload, 
  onDelete, 
  isUploading 
}: { 
  type: AssetType; 
  asset?: BrandAsset; 
  onUpload: (type: AssetType, file: File) => void;
  onDelete: (type: AssetType) => void;
  isUploading: boolean;
}) {
  const config = assetConfig[type];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      onUpload(type, file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyUrl = () => {
    if (asset?.assetUrl) {
      navigator.clipboard.writeText(asset.assetUrl);
      toast.success("URL copied to clipboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-stone-200 hover:border-amber-300">
        <div className={`relative h-40 ${config.previewBg} flex items-center justify-center overflow-hidden`}>
          {asset?.assetUrl ? (
            <>
              <img 
                src={asset.assetUrl} 
                alt={config.label} 
                className="max-h-full max-w-full object-contain p-4"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => window.open(asset.assetUrl, '_blank')}>
                  <Eye className="w-4 h-4 mr-1" />View
                </Button>
                <Button size="sm" variant="secondary" onClick={copyUrl}>
                  <Copy className="w-4 h-4 mr-1" />Copy
                </Button>
              </div>
              <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />Active
              </Badge>
            </>
          ) : (
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-stone-200 flex items-center justify-center">
                {config.icon}
              </div>
              <p className="text-sm text-stone-400">No image uploaded</p>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                {config.icon}
                {config.label}
              </h3>
              <p className="text-xs text-stone-500 mt-1">{config.description}</p>
            </div>
          </div>
          
          <div className="text-xs text-stone-400 mb-3 flex items-center gap-1">
            <FileImage className="w-3 h-3" />
            {config.recommended}
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              size="sm" 
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              {asset ? "Replace" : "Upload"}
            </Button>
            {asset && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 hover:bg-red-50"
                onClick={() => onDelete(type)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminBrandManager() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("logos");
  const [uploadingType, setUploadingType] = useState<AssetType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AssetType | null>(null);

  // Queries
  const assetsQuery = trpc.admin.brand.list.useQuery();

  // Mutations
  const uploadMutation = trpc.admin.brand.upload.useMutation({
    onSuccess: () => {
      toast.success("Brand asset uploaded successfully!");
      assetsQuery.refetch();
      setUploadingType(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload");
      setUploadingType(null);
    },
  });

  const deleteMutation = trpc.admin.brand.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand asset deleted");
      assetsQuery.refetch();
      setDeleteConfirm(null);
    },
    onError: (error) => toast.error(error.message || "Failed to delete"),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const assets = assetsQuery.data || [];
  const getAsset = (type: AssetType) => assets.find((a: BrandAsset) => a.assetType === type);

  const handleUpload = async (type: AssetType, file: File) => {
    setUploadingType(type);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await uploadMutation.mutateAsync({
          assetType: type,
          assetName: file.name,
          base64Data: base64,
        });
      } catch (e) {
        // Error handled in mutation
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploadingType(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (type: AssetType) => {
    setDeleteConfirm(type);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate({ assetType: deleteConfirm });
    }
  };

  const logoTypes: AssetType[] = ["logo_header", "logo_footer", "logo_mobile", "logo_preloader"];
  const iconTypes: AssetType[] = ["favicon"];
  const socialTypes: AssetType[] = ["og_image", "twitter_image"];

  const completedCount = assets.length;
  const totalCount = Object.keys(assetConfig).length;

  if (isChecking) {
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
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">Brand Assets</h1>
                  <p className="text-stone-500 text-sm">Manage logos, favicons, and social images</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1">
                  {completedCount}/{totalCount} configured
                </Badge>
                <Button variant="outline" size="sm" onClick={() => assetsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Progress Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-amber-50 border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">Brand Setup Progress</h3>
                  <p className="text-sm text-stone-600">
                    {completedCount === totalCount 
                      ? "All brand assets are configured!" 
                      : `${totalCount - completedCount} more asset${totalCount - completedCount !== 1 ? 's' : ''} to upload for complete branding`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {completedCount === totalCount ? (
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  )}
                </div>
              </div>
              <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="logos" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logos
                <Badge variant="secondary" className="ml-1 text-xs">
                  {logoTypes.filter(t => getAsset(t)).length}/{logoTypes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="icons" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Icons
                <Badge variant="secondary" className="ml-1 text-xs">
                  {iconTypes.filter(t => getAsset(t)).length}/{iconTypes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Social
                <Badge variant="secondary" className="ml-1 text-xs">
                  {socialTypes.filter(t => getAsset(t)).length}/{socialTypes.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Logos Tab */}
            <TabsContent value="logos" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {logoTypes.map((type, i) => (
                  <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <AssetCard
                      type={type}
                      asset={getAsset(type)}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                      isUploading={uploadingType === type}
                    />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Icons Tab */}
            <TabsContent value="icons" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {iconTypes.map((type, i) => (
                  <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <AssetCard
                      type={type}
                      asset={getAsset(type)}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                      isUploading={uploadingType === type}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Favicon Preview */}
              {getAsset("favicon") && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Browser Preview</CardTitle>
                    <CardDescription>How your favicon appears in browser tabs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-stone-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 bg-white rounded-t-lg px-3 py-2 w-fit shadow-sm border">
                        <img src={getAsset("favicon")?.assetUrl} alt="Favicon" className="w-4 h-4" />
                        <span className="text-sm text-stone-700">Just Empower</span>
                        <span className="text-stone-400 ml-2">×</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialTypes.map((type, i) => (
                  <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <AssetCard
                      type={type}
                      asset={getAsset(type)}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                      isUploading={uploadingType === type}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Social Preview */}
              {getAsset("og_image") && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Social Share Preview</CardTitle>
                    <CardDescription>How your link appears when shared on social media</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-stone-100 rounded-lg p-4 max-w-lg">
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
                        <img 
                          src={getAsset("og_image")?.assetUrl} 
                          alt="OG Preview" 
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-xs text-stone-500 uppercase">justxempower.com</p>
                          <p className="font-semibold text-stone-900">Just Empower</p>
                          <p className="text-sm text-stone-600 line-clamp-2">Where Empowerment Becomes Embodiment</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Usage Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Where Your Brand Assets Appear
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-stone-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />Header Logo
                  </h4>
                  <p className="text-sm text-stone-500">Top navigation bar on all pages</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Layout className="w-4 h-4" />Footer Logo
                  </h4>
                  <p className="text-sm text-stone-500">Bottom section of every page</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />Preloader
                  </h4>
                  <p className="text-sm text-stone-500">Loading animation on homepage</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />Favicon
                  </h4>
                  <p className="text-sm text-stone-500">Browser tab & bookmarks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Brand Asset?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the {deleteConfirm && assetConfig[deleteConfirm]?.label}? 
                This will remove it from your site until you upload a new one.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
