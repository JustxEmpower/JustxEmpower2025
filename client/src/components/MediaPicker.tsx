import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Image as ImageIcon, Video, Upload, Search, X } from 'lucide-react';

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

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  mediaType?: 'image' | 'video' | 'all';
}

export default function MediaPicker({ open, onClose, onSelect, mediaType = 'all' }: MediaPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const { data: mediaList, isLoading, refetch } = trpc.admin.media.list.useQuery(
    undefined,
    { enabled: open }
  );

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            Select {mediaType === 'all' ? 'Media' : mediaType === 'image' ? 'Image' : 'Video'}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media files..."
            className="pl-10"
          />
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-neutral-500">Loading media...</p>
            </div>
          ) : filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedMedia?.id === item.id && (
                    <div className="absolute inset-0 bg-neutral-900/20 dark:bg-neutral-100/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
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
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  Upload files from the Media Library page
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selected Media Info */}
        {selectedMedia && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedMedia.type === 'image' ? (
                <ImageIcon className="w-5 h-5 text-neutral-400" />
              ) : (
                <Video className="w-5 h-5 text-neutral-400" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedMedia.originalName}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(selectedMedia.fileSize)} • {selectedMedia.type}
                </p>
              </div>
            </div>
            <Button onClick={() => setSelectedMedia(null)} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedMedia}>
            Select Media
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
