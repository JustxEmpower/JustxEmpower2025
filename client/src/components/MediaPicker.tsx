'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Image as ImageIcon, Video, Upload, Search, X, FolderOpen, Cloud, CheckCircle2 } from 'lucide-react';

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

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  mediaType?: 'image' | 'video' | 'all';
}

export default function MediaPicker({ open, onClose, onSelect, mediaType = 'all' }: MediaPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaList, isLoading, refetch } = trpc.admin.media.list.useQuery(
    undefined,
    { enabled: open }
  );

  const getUploadUrlMutation = trpc.admin.media.getUploadUrl.useMutation();
  const confirmUploadMutation = trpc.admin.media.confirmUpload.useMutation();

  // Filter media based on type and search query
  const filteredMedia = mediaList?.filter((item: MediaItem) => {
    const matchesType = mediaType === 'all' || item.type === mediaType;
    const matchesSearch = item.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url);
      setSelectedMedia(null);
      setSearchQuery('');
      onClose();
      toast.success('Media selected');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Direct S3 upload with presigned URL
  const uploadFileDirectToS3 = async (file: File): Promise<string | null> => {
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
            const percentComplete = Math.round((event.loaded / event.total) * 90) + 5;
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

      return uploadData.publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, { ...newMap.get(fileId)!, status: 'error', error: errorMessage });
        return newMap;
      });
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let lastUploadedUrl: string | null = null;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (mediaType === 'image' && !isImage) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (mediaType === 'video' && !isVideo) {
        toast.error(`${file.name} is not a video`);
        continue;
      }
      if (mediaType === 'all' && !isImage && !isVideo) {
        toast.error(`${file.name} is not a supported media type`);
        continue;
      }

      const url = await uploadFileDirectToS3(file);
      if (url) {
        lastUploadedUrl = url;
      }
    }

    setUploading(false);
    refetch();

    // If only one file was uploaded, auto-select it
    if (files.length === 1 && lastUploadedUrl) {
      onSelect(lastUploadedUrl);
      onClose();
    } else {
      // Switch to library tab to see uploaded files
      setActiveTab('library');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Create a synthetic event to reuse handleFileSelect logic
    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => dataTransfer.items.add(file));
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              Select {mediaType === 'all' ? 'Media' : mediaType === 'image' ? 'Image' : 'Video'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')} className="flex-1 flex flex-col overflow-hidden px-8 pt-6">
          <TabsList className="grid w-full grid-cols-2 mb-6 w-fit">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Media Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload New
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media files..."
                className="pl-10 h-11"
              />
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-neutral-500">Loading media...</p>
                </div>
              ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                  {filteredMedia.map((item: MediaItem) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia?.id === item.id
                          ? 'border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900 dark:ring-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {/* Media Preview */}
                      <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
                            <Video className="w-8 h-8 text-neutral-500" />
                          </div>
                        )}
                      </div>

                      {/* Selected Indicator */}
                      {selectedMedia?.id === item.id && (
                        <div className="absolute inset-0 bg-neutral-900/20 dark:bg-neutral-100/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white dark:text-neutral-900" />
                          </div>
                        </div>
                      )}

                      {/* Hover Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{item.originalName}</p>
                        <p className="text-xs text-neutral-300">{formatFileSize(item.fileSize)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ImageIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                    {searchQuery ? 'No media files match your search' : 'No media files uploaded yet'}
                  </p>
                  {!searchQuery && (
                    <Button variant="outline" onClick={() => setActiveTab('upload')} className="mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex-1 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'image/*,video/*'}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Cloud className="w-8 h-8 text-neutral-400" />
              </div>
              
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
                {mediaType === 'image' 
                  ? 'Supports JPG, PNG, GIF, WebP, and other image formats'
                  : mediaType === 'video'
                  ? 'Supports MP4, MOV, WebM, and other video formats'
                  : 'Supports images (JPG, PNG, GIF) and videos (MP4, MOV, WebM)'}
              </p>
              
              <Button variant="outline" className="mt-4" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>

            {/* Upload Progress */}
            {uploadProgress.size > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(uploadProgress.entries()).map(([id, progress]) => (
                  <div key={id} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate flex-1">{progress.filename}</span>
                      <span className="text-xs text-neutral-500 ml-2">
                        {progress.status === 'complete' ? '✓ Complete' : 
                         progress.status === 'error' ? '✗ Failed' :
                         progress.status === 'confirming' ? 'Confirming...' :
                         `${progress.progress}%`}
                      </span>
                    </div>
                    <Progress value={progress.progress} className="h-1" />
                    {progress.error && (
                      <p className="text-xs text-red-500 mt-1">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer with Selected Media Info and Actions */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-8 py-6 space-y-4">
          {/* Selected Media Info */}
          {selectedMedia && activeTab === 'library' && (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              {selectedMedia.type === 'image' ? (
                <ImageIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              ) : (
                <Video className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {selectedMedia.originalName}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(selectedMedia.fileSize)} • {selectedMedia.type}
                </p>
              </div>
              <Button onClick={() => setSelectedMedia(null)} variant="ghost" size="sm" className="flex-shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button onClick={onClose} variant="outline" className="px-6">
              Cancel
            </Button>
            {activeTab === 'library' && (
              <Button 
                onClick={handleSelect} 
                disabled={!selectedMedia}
                className="px-6 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Select Media
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
