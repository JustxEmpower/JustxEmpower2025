import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon, Video, FolderOpen, Sparkles, Music, X, Zap } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { getMediaUrl } from '@/lib/media';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string | null;
  type: 'image' | 'video';
  uploadedBy?: string | null;
  createdAt: Date | string;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
}

export default function AdminMedia() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [selectedMediaForConversion, setSelectedMediaForConversion] = useState<MediaItem | null>(null);
  const [selectedTargetFormat, setSelectedTargetFormat] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const { data: mediaList, isLoading, refetch } = trpc.admin.media.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const getUploadUrlMutation = trpc.admin.media.getUploadUrl.useMutation();
  const confirmUploadMutation = trpc.admin.media.confirmUpload.useMutation();

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
      
      const results = data.results;
      const successCount = results.filter(r => r.altText !== 'Image').length;
      
      toast.success(`Generated alt text for ${successCount} of ${results.length} images`);
      
      const altTexts = results.map((r, i) => `${i + 1}. ${r.altText}`).join('\n');
      navigator.clipboard.writeText(altTexts);
      toast.info('All alt texts copied to clipboard!', { duration: 5000 });
    },
    onError: (error) => {
      setIsBulkProcessing(false);
      toast.error(error.message || 'Failed to generate bulk alt text');
    },
  });

  const getConversionFormatsMutation = trpc.admin.media.getConversionFormats.useQuery(
    { id: selectedMediaForConversion?.id || 0 },
    { enabled: !!selectedMediaForConversion }
  );

  const convertMediaMutation = trpc.admin.media.convertMedia.useMutation({
    onSuccess: (data) => {
      setIsConverting(false);
      setConversionDialogOpen(false);
      setSelectedMediaForConversion(null);
      setSelectedTargetFormat('');
      toast.success(`Media converted successfully to ${data.format}`);
      navigator.clipboard.writeText(data.url);
      toast.info('Converted file URL copied to clipboard!', { duration: 5000 });
      refetch();
    },
    onError: (error) => {
      setIsConverting(false);
      toast.error(error.message || 'Failed to convert media');
    },
  });

  const handleOpenConversionDialog = (item: MediaItem) => {
    setSelectedMediaForConversion(item);
    setConversionDialogOpen(true);
    setSelectedTargetFormat('');
  };

  const handleConvertMedia = () => {
    if (!selectedMediaForConversion || !selectedTargetFormat) return;
    setIsConverting(true);
    convertMediaMutation.mutate({
      id: selectedMediaForConversion.id,
      targetFormat: selectedTargetFormat,
    });
  };

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

  // Direct S3 upload with presigned URL
  const uploadFileDirectToS3 = async (file: File): Promise<void> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Update progress state
    setUploadProgress(prev => new Map(prev).set(fileId, {
      filename: file.name,
      progress: 0,
      status: 'pending'
    }));

    try {
      // Step 1: Get presigned URL from server
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, { ...newMap.get(fileId)!, status: 'uploading', progress: 5 });
        return newMap;
      });

      const uploadData = await getUploadUrlMutation.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      // Step 2: Upload directly to S3 using presigned URL
      const xhr = new XMLHttpRequest();
      
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 90) + 5; // 5-95%
            setUploadProgress(prev => {
              const newMap = new Map(prev);
              newMap.set(fileId, { ...newMap.get(fileId)!, progress: percentComplete });
              return newMap;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', uploadData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Step 3: Confirm upload with server
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, { ...newMap.get(fileId)!, status: 'confirming', progress: 95 });
        return newMap;
      });

      await confirmUploadMutation.mutateAsync({
        s3Key: uploadData.s3Key,
        uniqueFilename: uploadData.uniqueFilename,
        originalName: uploadData.originalName,
        mimeType: uploadData.mimeType,
        fileSize: uploadData.fileSize,
        publicUrl: uploadData.publicUrl,
      });

      // Success!
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, { ...newMap.get(fileId)!, status: 'complete', progress: 100 });
        return newMap;
      });

      toast.success(`${file.name} uploaded successfully`);
      
      // Remove from progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, { 
          ...newMap.get(fileId)!, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        return newMap;
      });
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    // Process all files in parallel
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        toast.error(`${file.name}: Only images, videos, and audio files are supported`);
        return;
      }

      // No file size limit for direct S3 uploads!
      await uploadFileDirectToS3(file);
    });

    await Promise.all(uploadPromises);

    setUploading(false);
    refetch();

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
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const cancelUpload = (fileId: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />;
    return <ImageIcon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />;
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
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Upload and manage images, videos, and audio files for your website
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mb-8">
              ✓ Direct S3 upload enabled - No file size limit!
            </p>

            {/* Hidden file input - now accepts audio too */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Progress */}
            {uploadProgress.size > 0 && (
              <div className="mb-6 space-y-3">
                {Array.from(uploadProgress.entries()).map(([fileId, progress]) => (
                  <div key={fileId} className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate flex-1">
                        {progress.filename}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {progress.status === 'pending' && 'Preparing...'}
                          {progress.status === 'uploading' && `${progress.progress}%`}
                          {progress.status === 'confirming' && 'Finalizing...'}
                          {progress.status === 'complete' && '✓ Complete'}
                          {progress.status === 'error' && '✗ Failed'}
                        </span>
                        {progress.status === 'error' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelUpload(fileId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={progress.progress} 
                      className={`h-2 ${progress.status === 'error' ? 'bg-red-100' : ''}`}
                    />
                    {progress.error && (
                      <p className="text-xs text-red-500 mt-1">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                      ) : item.mimeType.startsWith('audio/') ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-12 h-12 text-neutral-400" />
                        </div>
                      ) : item.type === 'video' && item.thumbnailUrl ? (
                        <img
                          src={getMediaUrl(item.thumbnailUrl)}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-neutral-400" />
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                          className="bg-blue-500/90 hover:bg-blue-600 text-white border-blue-500"
                          onClick={() => handleOpenConversionDialog(item)}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
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
                        {getMediaIcon(item.mimeType)}
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
                  No media files yet. Upload your first image, video, or audio file to get started.
                </p>
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Media
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Dialog */}
        <Dialog open={conversionDialogOpen} onOpenChange={setConversionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert Media</DialogTitle>
              <DialogDescription>
                Convert {selectedMediaForConversion?.originalName} to a different format
              </DialogDescription>
            </DialogHeader>
            {getConversionFormatsMutation.isLoading && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading available formats...</p>
              </div>
            )}
            {getConversionFormatsMutation.error && (
              <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">Error: {getConversionFormatsMutation.error.message}</p>
              </div>
            )}
            {getConversionFormatsMutation.data && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Current Format: {getConversionFormatsMutation.data.currentFormat}
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Convert To:
                  </label>
                  <Select value={selectedTargetFormat} onValueChange={setSelectedTargetFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target format" />
                    </SelectTrigger>
                    <SelectContent>
                      {getConversionFormatsMutation.data.availableFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setConversionDialogOpen(false)}
                    disabled={isConverting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConvertMedia}
                    disabled={isConverting || !selectedTargetFormat}
                  >
                    {isConverting ? 'Converting...' : 'Convert'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
