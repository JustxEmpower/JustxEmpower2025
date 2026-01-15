import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';

type AssetType = "logo_header" | "logo_footer" | "logo_mobile" | "logo_preloader" | "favicon" | "og_image" | "twitter_image";

export default function AdminBrand() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);

  const assetsQuery = trpc.admin.brand.list.useQuery();
  const uploadMutation = trpc.admin.brand.upload.useMutation();
  const deleteMutation = trpc.admin.brand.delete.useMutation();

  const assetTypes: { type: AssetType; label: string; description: string }[] = [
    { type: "logo_header", label: "Header Logo", description: "Main logo displayed in the website header" },
    { type: "logo_footer", label: "Footer Logo", description: "Logo displayed in the website footer" },
    { type: "logo_mobile", label: "Mobile Logo", description: "Optimized logo for mobile devices" },
    { type: "logo_preloader", label: "Preloader Logo", description: "Logo displayed during site loading animation" },
    { type: "favicon", label: "Favicon", description: "Small icon displayed in browser tabs (16x16 or 32x32)" },
    { type: "og_image", label: "Open Graph Image", description: "Image for social media sharing (1200x630)" },
    { type: "twitter_image", label: "Twitter Card Image", description: "Image for Twitter cards (1200x600)" },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, assetType: AssetType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setSelectedAssetType(assetType);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        await uploadMutation.mutateAsync({
          assetType,
          assetName: file.name,
          base64Data: base64,
        });

        toast.success(`${assetTypes.find(a => a.type === assetType)?.label} uploaded successfully`);
        assetsQuery.refetch();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload asset");
      console.error(error);
    } finally {
      setIsUploading(false);
      setSelectedAssetType(null);
    }
  };

  const handleDelete = async (assetType: AssetType) => {
    if (!confirm(`Are you sure you want to delete this ${assetTypes.find(a => a.type === assetType)?.label}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ assetType });
      toast.success("Asset deleted successfully");
      assetsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete asset");
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getAssetUrl = (assetType: AssetType) => {
    return assetsQuery.data?.find(a => a.assetType === assetType)?.assetUrl;
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Brand Assets</h1>
            <p className="text-stone-600">Manage your logo variants, favicon, and social media images</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {assetTypes.map((asset) => {
              const currentAsset = assetsQuery.data?.find(a => a.assetType === asset.type);
              const isUploadingThis = isUploading && selectedAssetType === asset.type;

              return (
                <Card key={asset.type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      {asset.label}
                    </CardTitle>
                    <CardDescription>{asset.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preview */}
                    {currentAsset && (
                      <div className="bg-stone-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                        <img
                          src={currentAsset.assetUrl}
                          alt={asset.label}
                          className="max-h-[180px] max-w-full object-contain"
                        />
                      </div>
                    )}

                    {!currentAsset && (
                      <div className="bg-stone-100 rounded-lg p-4 flex items-center justify-center min-h-[200px] border-2 border-dashed border-stone-300">
                        <div className="text-center text-stone-400">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No asset uploaded</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex gap-2">
                      <Label
                        htmlFor={`upload-${asset.type}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
                          {isUploadingThis ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>{currentAsset ? "Replace" : "Upload"}</span>
                            </>
                          )}
                        </div>
                      </Label>
                      <input
                        id={`upload-${asset.type}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, asset.type)}
                        disabled={isUploading}
                      />

                      {currentAsset && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(asset.type)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="text-red-600">×</span>
                          )}
                        </Button>
                      )}
                    </div>

                    {currentAsset && (
                      <div className="text-xs text-stone-500">
                        <p>Size: {currentAsset.width} × {currentAsset.height}px</p>
                        <p className="truncate">File: {currentAsset.assetName}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
