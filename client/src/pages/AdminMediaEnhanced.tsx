import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Image as ImageIcon, Video, Sparkles, Music, X, Copy, RefreshCw, Search, LayoutGrid, List, Filter, HardDrive, FileImage, FileVideo, FileAudio, Zap, Play, RefreshCcw, Loader2, Wand2, Film } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { getMediaUrl } from '@/lib/media';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Video thumbnail - simple display, parent handles hover
function VideoThumbnail({ src, alt, className = "", videoRef, isPlaying }: { 
  src: string; 
  alt: string; 
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isPlaying?: boolean;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const ref = videoRef || localRef;
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={() => setHasLoaded(true)}
        className="w-full h-full object-cover"
      />
      {/* Play icon overlay when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
      {/* Loading state */}
      {!hasLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
          <FileVideo className="w-8 h-8 text-purple-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// Media grid card with video hover-to-play at card level
function MediaGridCard({ item, onPreview, onCopy, onConvert, onDelete, onGenerateAlt, onGenerateAiImage, onGenerateVideoLoop, formatFileSize, getMediaIcon, isGeneratingAlt, isGeneratingAiImage, isGeneratingVideoLoop }: {
  item: MediaItem;
  onPreview: () => void;
  onCopy: () => void;
  onConvert: () => void;
  onDelete: () => void;
  onGenerateAlt: () => void;
  onGenerateAiImage: () => void;
  onGenerateVideoLoop: () => void;
  formatFileSize: (bytes: number) => string;
  getMediaIcon: (mimeType: string, size?: string) => React.ReactNode;
  isGeneratingAlt?: boolean;
  isGeneratingAiImage?: boolean;
  isGeneratingVideoLoop?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const isVideo = item.mimeType.startsWith('video/');

  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={onPreview}
      onMouseEnter={isVideo ? handleMouseEnter : undefined}
      onMouseLeave={isVideo ? handleMouseLeave : undefined}
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {item.mimeType.startsWith('image/') ? (
          <img src={getMediaUrl(item.url)} alt={item.originalName} className="w-full h-full object-cover" loading="lazy" />
        ) : isVideo ? (
          <VideoThumbnail 
            src={getMediaUrl(item.url)} 
            alt={item.originalName} 
            className="w-full h-full" 
            videoRef={videoRef}
            isPlaying={isPlaying}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">{getMediaIcon(item.mimeType, 'w-12 h-12')}</div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onCopy(); }}><Copy className="w-4 h-4" /></Button>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onConvert(); }} title="Convert format">
            <RefreshCcw className="w-4 h-4" />
          </Button>
          {item.mimeType.startsWith('image/') && (
            <>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onGenerateAlt(); }} disabled={isGeneratingAlt} title="Generate Alt Text">
                {isGeneratingAlt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onGenerateAiImage(); }} disabled={isGeneratingAiImage} title="Generate AI Image Variation" className="bg-purple-600 hover:bg-purple-700 text-white">
                {isGeneratingAiImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onGenerateVideoLoop(); }} disabled={isGeneratingVideoLoop} title="Generate AI Video Loop" className="bg-blue-600 hover:bg-blue-700 text-white">
                {isGeneratingVideoLoop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              </Button>
            </>
          )}
          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{item.originalName}</p>
        <p className="text-xs text-stone-500">{formatFileSize(item.fileSize)}</p>
      </CardContent>
    </Card>
  );
}

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  type: 'image' | 'video';
  createdAt: Date | string;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
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
  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminMediaEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingItem, setConvertingItem] = useState<MediaItem | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  const { data: mediaList, isLoading, refetch } = trpc.admin.media.list.useQuery(undefined, { enabled: isAuthenticated });
  const getUploadUrlMutation = trpc.admin.media.getUploadUrl.useMutation();
  const confirmUploadMutation = trpc.admin.media.confirmUpload.useMutation();
  const deleteMutation = trpc.admin.media.delete.useMutation({
    onSuccess: () => { toast.success('Deleted'); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [generatingAltFor, setGeneratingAltFor] = useState<number | null>(null);
  
  const updateAltTextMutation = trpc.admin.media.updateAltText.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.altText);
      toast.success(`Alt text saved & copied: "${data.altText}"`);
      refetch();
    },
    onError: (e) => toast.error(`Failed to save: ${e.message}`),
  });
  
  const generateAltTextMutation = trpc.admin.ai.generateImageAlt.useMutation({
    onSuccess: (data, variables) => {
      // After generating, save it to the media item
      const mediaId = (variables as any).mediaId;
      if (mediaId) {
        updateAltTextMutation.mutate({ id: mediaId, altText: data.altText });
      } else {
        navigator.clipboard.writeText(data.altText);
        toast.success(`Alt text: "${data.altText}"`);
      }
      setGeneratingAltFor(null);
    },
    onError: (e) => { toast.error(e.message); setGeneratingAltFor(null); },
  });
  
  const handleGenerateAlt = (item: MediaItem) => {
    setGeneratingAltFor(item.id);
    generateAltTextMutation.mutate({ 
      imageUrl: getMediaUrl(item.url), 
      context: item.originalName,
      mediaId: item.id,
    } as any);
  };

  // AI Image Generation
  const [generatingAiImageFor, setGeneratingAiImageFor] = useState<number | null>(null);
  
  const generateAiImageMutation = trpc.admin.ai.generateImage.useMutation({
    onSuccess: (data) => {
      toast.success(`AI image generated and saved! View it in your media library.`);
      refetch();
      setGeneratingAiImageFor(null);
    },
    onError: (e) => {
      toast.error(`AI generation failed: ${e.message}`);
      setGeneratingAiImageFor(null);
    },
  });

  const handleGenerateAiImage = (item: MediaItem) => {
    setGeneratingAiImageFor(item.id);
    toast.info("Generating AI variation... This may take a moment.");
    generateAiImageMutation.mutate({
      sourceImageUrl: getMediaUrl(item.url),
      style: "similar style and mood",
    });
  };

  // AI Video Loop Generation
  const [generatingVideoLoopFor, setGeneratingVideoLoopFor] = useState<number | null>(null);
  
  const generateVideoLoopMutation = trpc.admin.ai.generateVideoLoop.useMutation({
    onSuccess: (data) => {
      toast.success(`AI video loop generated and saved! View it in your media library.`);
      refetch();
      setGeneratingVideoLoopFor(null);
    },
    onError: (e) => {
      toast.error(`Video generation failed: ${e.message}`);
      setGeneratingVideoLoopFor(null);
    },
  });

  const handleGenerateVideoLoop = (item: MediaItem) => {
    setGeneratingVideoLoopFor(item.id);
    toast.info("Generating AI video loop... This may take a moment.");
    generateVideoLoopMutation.mutate({
      sourceImageUrl: getMediaUrl(item.url),
      duration: 4,
    });
  };

  // Conversion queries and mutations
  const conversionFormatsQuery = trpc.admin.media.getConversionFormats.useQuery(
    { id: convertingItem?.id || 0 },
    { enabled: !!convertingItem && convertDialogOpen }
  );
  const convertMediaMutation = trpc.admin.media.convertMedia.useMutation({
    onSuccess: (data) => {
      toast.success(`Converted to ${data.format}! New file: ${data.filename}`);
      refetch();
      setConvertDialogOpen(false);
      setConvertingItem(null);
      setSelectedFormat('');
    },
    onError: (e) => toast.error(`Conversion failed: ${e.message}`),
  });

  const openConvertDialog = (item: MediaItem) => {
    setConvertingItem(item);
    setSelectedFormat('');
    setConvertDialogOpen(true);
  };

  const handleConvert = () => {
    if (!convertingItem || !selectedFormat) return;
    convertMediaMutation.mutate({ id: convertingItem.id, targetFormat: selectedFormat });
  };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation('/admin/login');
  }, [isAuthenticated, isChecking, setLocation]);

  // Filter media
  const filteredMedia = useMemo(() => {
    return (mediaList || []).filter((item: MediaItem) => {
      const matchesSearch = searchQuery === '' || item.originalName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'image' && item.mimeType.startsWith('image/')) ||
        (typeFilter === 'video' && item.mimeType.startsWith('video/')) ||
        (typeFilter === 'audio' && item.mimeType.startsWith('audio/'));
      return matchesSearch && matchesType;
    });
  }, [mediaList, searchQuery, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const all = mediaList || [];
    const images = all.filter((m: MediaItem) => m.mimeType.startsWith('image/')).length;
    const videos = all.filter((m: MediaItem) => m.mimeType.startsWith('video/')).length;
    const audio = all.filter((m: MediaItem) => m.mimeType.startsWith('audio/')).length;
    const totalSize = all.reduce((sum: number, m: MediaItem) => sum + m.fileSize, 0);
    return { total: all.length, images, videos, audio, totalSize };
  }, [mediaList]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const uploadFileDirectToS3 = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    setUploadProgress(prev => new Map(prev).set(fileId, { filename: file.name, progress: 0, status: 'pending' }));
    try {
      setUploadProgress(prev => new Map(prev).set(fileId, { ...prev.get(fileId)!, status: 'uploading', progress: 10 }));
      const { uploadUrl, s3Key, uniqueFilename, publicUrl } = await getUploadUrlMutation.mutateAsync({
        filename: file.name, mimeType: file.type, fileSize: file.size,
      });
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 80) + 10;
            setUploadProgress(prev => new Map(prev).set(fileId, { ...prev.get(fileId)!, progress: pct }));
          }
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
      setUploadProgress(prev => new Map(prev).set(fileId, { ...prev.get(fileId)!, status: 'confirming', progress: 95 }));
      await confirmUploadMutation.mutateAsync({ 
        s3Key, 
        uniqueFilename, 
        originalName: file.name, 
        mimeType: file.type, 
        fileSize: file.size,
        publicUrl,
      });
      setUploadProgress(prev => new Map(prev).set(fileId, { ...prev.get(fileId)!, status: 'complete', progress: 100 }));
      setTimeout(() => setUploadProgress(prev => { const m = new Map(prev); m.delete(fileId); return m; }), 2000);
    } catch (error: any) {
      setUploadProgress(prev => new Map(prev).set(fileId, { ...prev.get(fileId)!, status: 'error', error: error.message }));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    await Promise.all(Array.from(files).map(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        toast.error(`${file.name}: Unsupported type`);
        return Promise.resolve();
      }
      return uploadFileDirectToS3(file);
    }));
    setUploading(false);
    refetch();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(getMediaUrl(url)); toast.success('URL copied'); };

  const getMediaIcon = (mimeType: string, size = 'w-6 h-6') => {
    if (mimeType.startsWith('image/')) return <FileImage className={`${size} text-blue-500`} />;
    if (mimeType.startsWith('video/')) return <FileVideo className={`${size} text-purple-500`} />;
    if (mimeType.startsWith('audio/')) return <FileAudio className={`${size} text-pink-500`} />;
    return <ImageIcon className={`${size} text-stone-400`} />;
  };

  if (isChecking || isLoading) {
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
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Media Library</h1>
                <p className="text-stone-500 text-sm">Upload and manage images, videos, and audio</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-amber-600 hover:bg-amber-700">
                  <Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Files', value: stats.total, icon: HardDrive, color: 'amber' },
              { label: 'Images', value: stats.images, icon: FileImage, color: 'blue' },
              { label: 'Videos', value: stats.videos, icon: FileVideo, color: 'purple' },
              { label: 'Audio', value: stats.audio, icon: FileAudio, color: 'pink' },
              { label: 'Storage', value: formatFileSize(stats.totalSize), icon: HardDrive, color: 'emerald', isText: true },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-900`}>
                          {stat.isText ? stat.value : <AnimatedCounter value={stat.value as number} />}
                        </p>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Upload Progress */}
          {uploadProgress.size > 0 && (
            <div className="space-y-2">
              {Array.from(uploadProgress.entries()).map(([id, p]) => (
                <Card key={id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">{p.filename}</span>
                      <Badge className={p.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : p.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                        {p.status === 'complete' ? '✓ Done' : p.status === 'error' ? '✗ Failed' : `${p.progress}%`}
                      </Badge>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                    {p.error && <p className="text-xs text-red-500 mt-1">{p.error}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Media Grid/List */}
          {filteredMedia.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="w-12 h-12 text-stone-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No media found</h3>
                <p className="text-stone-500 mb-4">{searchQuery || typeFilter !== 'all' ? 'Try adjusting filters' : 'Upload your first file'}</p>
                <Button onClick={() => fileInputRef.current?.click()} className="bg-amber-600 hover:bg-amber-700">
                  <Upload className="w-4 h-4 mr-2" />Upload
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMedia.map((item: MediaItem, i: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                    <MediaGridCard
                      item={item}
                      onPreview={() => setPreviewItem(item)}
                      onCopy={() => copyUrl(item.url)}
                      onConvert={() => openConvertDialog(item)}
                      onDelete={() => { if (confirm('Delete?')) deleteMutation.mutate({ id: item.id }); }}
                      onGenerateAlt={() => handleGenerateAlt(item)}
                      onGenerateAiImage={() => handleGenerateAiImage(item)}
                      onGenerateVideoLoop={() => handleGenerateVideoLoop(item)}
                      formatFileSize={formatFileSize}
                      getMediaIcon={getMediaIcon}
                      isGeneratingAlt={generatingAltFor === item.id}
                      isGeneratingAiImage={generatingAiImageFor === item.id}
                      isGeneratingVideoLoop={generatingVideoLoopFor === item.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMedia.map((item: MediaItem, i: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.mimeType.startsWith('image/') ? (
                            <img src={getMediaUrl(item.url)} alt={item.originalName} className="w-full h-full object-cover" loading="lazy" />
                          ) : item.mimeType.startsWith('video/') ? (
                            <VideoThumbnail src={getMediaUrl(item.url)} alt={item.originalName} className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">{getMediaIcon(item.mimeType)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.originalName}</p>
                          <div className="flex items-center gap-3 text-sm text-stone-500">
                            <span>{formatFileSize(item.fileSize)}</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => copyUrl(item.url)}><Copy className="w-4 h-4" /></Button>
                          {item.mimeType.startsWith('image/') && (
                            <Button variant="ghost" size="icon" onClick={() => handleGenerateAlt(item)} disabled={generatingAltFor === item.id}>
                              {generatingAltFor === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ id: item.id }); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>{previewItem?.originalName}</DialogTitle></DialogHeader>
            {previewItem && (
              <div className="space-y-4">
                {previewItem.mimeType.startsWith('image/') ? (
                  <img src={getMediaUrl(previewItem.url)} alt={previewItem.originalName} className="w-full max-h-[60vh] object-contain rounded-lg" />
                ) : previewItem.mimeType.startsWith('video/') ? (
                  <video src={getMediaUrl(previewItem.url)} controls className="w-full max-h-[60vh] rounded-lg" />
                ) : previewItem.mimeType.startsWith('audio/') ? (
                  <audio src={getMediaUrl(previewItem.url)} controls className="w-full" />
                ) : null}
                <div className="flex items-center justify-between text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{previewItem.mimeType}</Badge>
                    <span>{formatFileSize(previewItem.fileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setPreviewItem(null); openConvertDialog(previewItem); }}>
                      <RefreshCcw className="w-4 h-4 mr-2" />Convert
                    </Button>
                    <Button size="sm" onClick={() => copyUrl(previewItem.url)}><Copy className="w-4 h-4 mr-2" />Copy URL</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Convert Dialog */}
        <Dialog open={convertDialogOpen} onOpenChange={(open) => { if (!open) { setConvertDialogOpen(false); setConvertingItem(null); setSelectedFormat(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convert Media</DialogTitle>
            </DialogHeader>
            {convertingItem && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="w-16 h-16 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                    {convertingItem.mimeType.startsWith('image/') ? (
                      <img src={getMediaUrl(convertingItem.url)} alt={convertingItem.originalName} className="w-full h-full object-cover" />
                    ) : convertingItem.mimeType.startsWith('video/') ? (
                      <VideoThumbnail src={getMediaUrl(convertingItem.url)} alt={convertingItem.originalName} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">{getMediaIcon(convertingItem.mimeType)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{convertingItem.originalName}</p>
                    <p className="text-sm text-stone-500">{convertingItem.mimeType}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Convert to:</label>
                  {conversionFormatsQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-stone-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading formats...</span>
                    </div>
                  ) : conversionFormatsQuery.data?.availableFormats?.length === 0 ? (
                    <p className="text-sm text-stone-500">No conversion formats available for this file type.</p>
                  ) : (
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output format" />
                      </SelectTrigger>
                      <SelectContent>
                        {conversionFormatsQuery.data?.availableFormats?.map((format: string) => (
                          <SelectItem key={format} value={format}>
                            {format.replace('image/', '').replace('video/', '').replace('audio/', '').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setConvertDialogOpen(false); setConvertingItem(null); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConvert} 
                    disabled={!selectedFormat || convertMediaMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {convertMediaMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Convert
                      </>
                    )}
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
