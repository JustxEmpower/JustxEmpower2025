import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, ArrowLeft, Upload, Trash2, Image as ImageIcon, Video, FolderOpen } from 'lucide-react';

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

  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: FolderOpen, label: 'Media', path: '/admin/media' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src="/media/logo-white.png"
            alt="Just Empower"
            className="h-10 opacity-90"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Admin Portal
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administrator
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Media'}
              </Button>
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
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden group"
                  >
                    {/* Media Preview */}
                    <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
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
