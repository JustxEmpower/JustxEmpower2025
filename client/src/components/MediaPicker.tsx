'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Image as ImageIcon, Video, Upload, Search, X, Cloud, Check } from 'lucide-react';
import VideoThumbnail from './VideoThumbnail';

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

  const handleSelectMedia = () => {
    if (selectedMedia) {
      console.log('Selecting media:', selectedMedia.url);
      onSelect(selectedMedia.url);
      toast.success('Media selected successfully');
      setSelectedMedia(null);
      setSearchQuery('');
      onClose();
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
    
    setUploadProgress(prev => new Map(prev).set(fileId, {
      filename: file.name,
      progress: 0,
      status: 'pending'
    }));

    try {
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

    if (files.length === 1 && lastUploadedUrl) {
      onSelect(lastUploadedUrl);
      onClose();
    } else {
      setActiveTab('library');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => dataTransfer.items.add(file));
      input.files = dataTransfer.files;
      handleFileSelect({ target: input, currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden flex flex-col" style={{ maxHeight: '85vh', height: '85vh' }}>
        {/* Fixed Header */}
        <div className="shrink-0 p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Select {mediaType === 'all' ? 'Media' : mediaType === 'image' ? 'Image' : 'Video'}
          </h2>
          
          {/* Tab Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'library'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {activeTab === 'library' ? (
            <>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search media files..."
                  className="pl-10"
                />
              </div>

              {/* Media Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-neutral-500">Loading media...</p>
                </div>
              ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMedia.map((item: MediaItem) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90 ${
                        selectedMedia?.id === item.id
                          ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : item.thumbnailUrl ? (
                        // Use stored thumbnail if available
                        <div className="relative w-full h-full">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.originalName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                              <Video className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Fall back to VideoThumbnail component for on-the-fly generation
                        <VideoThumbnail
                          src={item.url}
                          alt={item.originalName}
                          className="w-full h-full"
                          showPlayIcon={true}
                        />
                      )}
                      
                      {/* Selected Checkmark */}
                      {selectedMedia?.id === item.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      {/* File Name Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-xs text-white truncate">{item.originalName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <ImageIcon className="w-12 h-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-500">
                    {searchQuery ? 'No media files match your search' : 'No media files uploaded yet'}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Upload Tab */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] hover:border-neutral-400 transition-colors cursor-pointer"
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
              <p className="text-sm text-neutral-500 text-center max-w-sm mb-4">
                {mediaType === 'image' 
                  ? 'Supports JPG, PNG, GIF, WebP'
                  : mediaType === 'video'
                  ? 'Supports MP4, MOV, WebM'
                  : 'Supports images and videos'}
              </p>
              
              <Button variant="outline" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress.size > 0 && (
            <div className="mt-4 space-y-2">
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
        </div>

        {/* Fixed Footer with Action Buttons - ALWAYS VISIBLE */}
        <div className="shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          {/* Selected Media Preview */}
          {selectedMedia && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} alt="" className="w-12 h-12 object-cover rounded" />
              ) : selectedMedia.thumbnailUrl ? (
                <img src={selectedMedia.thumbnailUrl} alt="" className="w-12 h-12 object-cover rounded" />
              ) : (
                <VideoThumbnail
                  src={selectedMedia.url}
                  alt={selectedMedia.originalName}
                  className="w-12 h-12 rounded"
                  showPlayIcon={false}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {selectedMedia.originalName}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatFileSize(selectedMedia.fileSize)} • {selectedMedia.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectMedia}
              disabled={!selectedMedia}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              Select Media
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
