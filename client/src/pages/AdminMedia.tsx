import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, Upload, Trash2, Image as ImageIcon, Video, FolderOpen, Palette, Files, BarChart3, Sparkles } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { getMediaUrl } from '@/lib/media';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  type: 'image' | 'video';
  uploadedBy?: string | null;
  createdAt: Date | string;
}

export default function AdminMedia() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const { data: mediaList, isLoading, refetch } = trpc.admin.media.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const uploadMutation = trpc.admin.media.upload.useMutation({
    onSuccess: () => {
      toast.success('Media uploaded successfully');
      refetch();
      setUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload media');
      setUploading(false);
    },
  });

  const deleteMutation = trpc.admin.media.delete.useMutation({
    onSuccess: () => {
      toast.success('Media deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete media');
    },
  });

  const generateAltTextMutation = trpc.admin.ai.generateImageAlt.useMutation({
    onSuccess: (data, variables) => {
      toast.success('Alt text generated!');
      // Show the generated alt text in a toast with copy button
      navigator.clipboard.writeText(data.altText);
      toast.info(`Alt text copied: "${data.altText}"`, { duration: 5000 });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate alt text');
    },
  });

  const generateBulkAltTextMutation = trpc.admin.ai.generateBulkAltText.useMutation({
    onSuccess: (data) => {
      setIsBulkProcessing(false);
      setSelectedImages(new Set());
      
      // Show results
      const results = data.results;
      const successCount = results.filter(r => r.altText !== 'Image').length;
      
      toast.success(`Generated alt text for ${successCount} of ${results.length} images`);
      
      // Copy all alt texts to clipboard
      const altTexts = results.map((r, i) => `${i + 1}. ${r.altText}`).join('\n');
      navigator.clipboard.writeText(altTexts);
      toast.info('All alt texts copied to clipboard!', { duration: 5000 });
    },
    onError: (error) => {
      setIsBulkProcessing(false);
      toast.error(error.message || 'Failed to generate bulk alt text');
    },
  });

  const handleGenerateAltText = (imageUrl: string, filename: string) => {
    generateAltTextMutation.mutate({ 
      imageUrl, 
      context: `Image filename: ${filename}` 
    });
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (!mediaList) return;
    const imageIds = mediaList.filter(m => m.type === 'image').map(m => m.id);
    if (selectedImages.size === imageIds.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(imageIds));
    }
  };

  const handleBulkGenerateAltText = () => {
    if (!mediaList || selectedImages.size === 0) return;
    
    const selectedMedia = mediaList.filter(m => selectedImages.has(m.id));
    const imageUrls = selectedMedia.map(m => m.url);
    
    setIsBulkProcessing(true);
    generateBulkAltTextMutation.mutate({ imageUrls });
  };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name}: Only images and videos are supported`);
        continue;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: File size must be less than 50MB`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const base64Content = base64Data.split(',')[1]; // Remove data:image/png;base64, prefix

        try {
          await uploadMutation.mutateAsync({
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            base64Data: base64Content,
          });
        } catch (error) {
          console.error('Upload error:', error);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: number, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Media'}
                </Button>
                {selectedImages.size > 0 && (
                  <Button
                    onClick={handleBulkGenerateAltText}
                    disabled={isBulkProcessing}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isBulkProcessing ? 'Processing...' : `Generate Alt Text (${selectedImages.size})`}
                  </Button>
                )}
              </div>
              {mediaList && mediaList.filter(m => m.type === 'image').length > 0 && (
                <Button
                  onClick={handleSelectAll}
                  variant="ghost"
                  size="sm"
                >
                  {selectedImages.size === mediaList.filter(m => m.type === 'image').length
                    ? 'Deselect All'
                    : 'Select All Images'}
                </Button>
              )}
            </div>

            <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
              Media Library
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Upload and manage images and videos for your website
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Media Grid */}
            {mediaList && mediaList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mediaList.map((item: MediaItem) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden group relative"
                  >
                    {/* Selection Checkbox (only for images) */}
                    {item.type === 'image' && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedImages.has(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-5 h-5 rounded border-2 border-white shadow-lg cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* Media Preview */}
                    <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                      {item.type === 'image' ? (
                        <img
                          src={getMediaUrl(item.url)}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-neutral-400" />
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 hover:bg-white"
                          onClick={() => copyToClipboard(item.url)}
                        >
                          Copy URL
                        </Button>
                        {item.type === 'image' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-purple-500/90 hover:bg-purple-600 text-white border-purple-500"
                            onClick={() => handleGenerateAltText(item.url, item.originalName)}
                            disabled={generateAltTextMutation.isPending}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500/90 hover:bg-red-600 text-white border-red-500"
                          onClick={() => handleDelete(item.id, item.originalName)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Media Info */}
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {item.type === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Video className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {item.originalName}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatFileSize(item.fileSize)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 border border-neutral-200 dark:border-neutral-800 text-center">
                <FolderOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  No media files yet. Upload your first image or video to get started.
                </p>
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Media
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
