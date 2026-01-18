import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';
import AutoplayVideo from '@/components/AutoplayVideo';
import { EditablePageZone } from '@/components/PageZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Search,
  FolderOpen,
  Star,
  Eye,
  Play,
  X,
  ExternalLink,
  Lock,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

// File type icon mapping
const getFileIcon = (fileType: string, size: 'sm' | 'lg' = 'sm') => {
  const type = fileType.toLowerCase();
  const sizeClass = size === 'lg' ? 'w-12 h-12' : 'w-6 h-6';
  if (['pdf'].includes(type)) return <FileText className={`${sizeClass} text-red-500`} />;
  if (['doc', 'docx'].includes(type)) return <FileText className={`${sizeClass} text-blue-500`} />;
  if (['xls', 'xlsx', 'csv'].includes(type)) return <FileSpreadsheet className={`${sizeClass} text-green-500`} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) return <FileImage className={`${sizeClass} text-purple-500`} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) return <FileArchive className={`${sizeClass} text-amber-500`} />;
  if (['mp4', 'webm', 'mov', 'avi'].includes(type)) return <Play className={`${sizeClass} text-pink-500`} />;
  return <File className={`${sizeClass} text-muted-foreground`} />;
};

// File type badge color
const getFileTypeBadge = (fileType: string) => {
  const type = fileType.toUpperCase();
  const colors: Record<string, string> = {
    PDF: 'bg-red-100 text-red-700',
    DOC: 'bg-blue-100 text-blue-700',
    DOCX: 'bg-blue-100 text-blue-700',
    XLS: 'bg-green-100 text-green-700',
    XLSX: 'bg-green-100 text-green-700',
    CSV: 'bg-green-100 text-green-700',
    ZIP: 'bg-amber-100 text-amber-700',
    PNG: 'bg-purple-100 text-purple-700',
    JPG: 'bg-purple-100 text-purple-700',
    JPEG: 'bg-purple-100 text-purple-700',
    GIF: 'bg-purple-100 text-purple-700',
    MP4: 'bg-pink-100 text-pink-700',
    WEBM: 'bg-pink-100 text-pink-700',
    MOV: 'bg-pink-100 text-pink-700',
  };
  return (
    <Badge className={`${colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:${colors[type] || 'bg-gray-100 dark:bg-gray-800'}`}>
      {type}
    </Badge>
  );
};

// Check if file type is previewable
const isPreviewable = (fileType: string): boolean => {
  const type = fileType.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(type);
};

// Get preview button text based on file type
const getPreviewButtonText = (fileType: string): string => {
  const type = fileType.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) return 'View';
  if (['mp4', 'webm', 'mov'].includes(type)) return 'Play';
  return 'Preview';
};

// Get preview icon based on file type
const getPreviewIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (['mp4', 'webm', 'mov'].includes(type)) return <Play className="w-4 h-4 mr-2" />;
  return <Eye className="w-4 h-4 mr-2" />;
};

// Format price from cents to dollars
const formatPrice = (priceInCents: number): string => {
  if (!priceInCents || priceInCents === 0) return 'Free';
  return `$${(priceInCents / 100).toFixed(2)}`;
};

interface ResourcesProps {
  slug?: string;
}

export default function Resources({ slug = 'resources' }: ResourcesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [downloadError, setDownloadError] = useState('');
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<any>(null);
  
  // Purchase state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseResource, setPurchaseResource] = useState<any>(null);

  // Get hero content from CMS - use dynamic slug
  const { getContent, isLoading: contentLoading } = usePageContent(slug);
  
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Get overview content from CMS
  const overviewTitle = getContent('overview', 'title');
  const overviewParagraph1 = getContent('overview', 'paragraph1');
  const overviewParagraph2 = getContent('overview', 'paragraph2');
  
  // Determine which media to use (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;
  
  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Queries
  const resourcesQuery = trpc.resources.list.useQuery({
    categorySlug: selectedCategory || undefined,
  });
  const categoriesQuery = trpc.resources.categories.useQuery();
  const featuredQuery = trpc.resources.featured.useQuery({ limit: 3 });

  // Mutations
  const downloadMutation = trpc.resources.download.useMutation({
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.fileUrl;
      link.download = data.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Close dialog and reset
      setEmailDialogOpen(false);
      setEmail('');
      setSelectedResource(null);
      
      // Refetch to update download count
      resourcesQuery.refetch();
    },
    onError: (error) => {
      setDownloadError(error.message);
    },
  });

  const handleDownload = (resource: any) => {
    // Check if premium content
    if (resource.isPremium && resource.price > 0) {
      // TODO: Check if user has purchased this resource
      // For now, show purchase dialog
      setPurchaseResource(resource);
      setPurchaseDialogOpen(true);
      return;
    }
    
    if (resource.requiresEmail) {
      setSelectedResource(resource);
      setEmailDialogOpen(true);
    } else {
      downloadMutation.mutate({
        id: resource.id,
        visitorId: localStorage.getItem('visitorId') || undefined,
      });
    }
  };

  const handlePreview = (resource: any) => {
    // Check if preview is allowed for premium content
    if (resource.isPremium && !resource.allowPreview) {
      // Show purchase dialog instead
      setPurchaseResource(resource);
      setPurchaseDialogOpen(true);
      return;
    }
    
    setPreviewResource(resource);
    setPreviewOpen(true);
  };

  const handlePurchase = (resource: any) => {
    // TODO: Integrate with Stripe or payment system
    // For now, redirect to contact or show message
    window.location.href = `/contact?subject=Purchase: ${encodeURIComponent(resource.title)}`;
  };

  const handleEmailSubmit = () => {
    if (!email || !selectedResource) return;
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDownloadError('Please enter a valid email address');
      return;
    }
    
    setDownloadError('');
    downloadMutation.mutate({
      id: selectedResource.id,
      email,
      visitorId: localStorage.getItem('visitorId') || undefined,
    });
  };

  // Get preview content based on file type
  const renderPreviewContent = () => {
    if (!previewResource) return null;
    
    const fileType = previewResource.fileType.toLowerCase();
    const fileUrl = previewResource.fileUrl;
    
    // Images - direct display
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-full bg-black/5 rounded-lg overflow-hidden">
          <img 
            src={fileUrl} 
            alt={previewResource.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }
    
    // Videos - HTML5 video player
    if (['mp4', 'webm', 'mov'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
          <video 
            src={fileUrl} 
            controls 
            autoPlay
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="max-w-full max-h-[70vh]"
          />
        </div>
      );
    }
    
    // PDFs - embedded viewer
    if (fileType === 'pdf') {
      return (
        <div className="h-[70vh] bg-muted rounded-lg overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={previewResource.title}
          />
        </div>
      );
    }
    
    // Office documents - Google Docs Viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType)) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="h-[70vh] bg-muted rounded-lg overflow-hidden">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title={previewResource.title}
          />
        </div>
      );
    }
    
    // Fallback - show message with download option
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
        <File className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
        <Button onClick={() => handleDownload(previewResource)} className="bg-amber-600 hover:bg-amber-700">
          <Download className="w-4 h-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  // Filter resources by search
  const filteredResources = resourcesQuery.data?.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Render action buttons for a resource
  const renderResourceActions = (resource: any, size: 'sm' | 'default' = 'default') => {
    const isPremium = resource.isPremium && resource.price > 0;
    const canPreview = isPreviewable(resource.fileType) && (!isPremium || resource.allowPreview);
    
    return (
      <div className="flex gap-2 flex-shrink-0">
        {/* Preview/View Button */}
        {canPreview && (
          <Button
            variant="outline"
            size={size}
            onClick={() => handlePreview(resource)}
          >
            {getPreviewIcon(resource.fileType)}
            {getPreviewButtonText(resource.fileType)}
          </Button>
        )}
        
        {/* Download or Purchase Button */}
        {isPremium ? (
          <Button
            size={size}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={() => handleDownload(resource)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {formatPrice(resource.price ?? 0)}
          </Button>
        ) : (
          <Button
            size={size}
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => handleDownload(resource)}
            disabled={downloadMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Hero Section - Now reads from CMS */}
      <section className="relative overflow-hidden text-white py-20">
        {/* Background Media */}
        <div className="absolute inset-0">
          {heroMediaUrl && isVideo ? (
            <AutoplayVideo
              src={getProperMediaUrl(heroMediaUrl)}
              className="w-full h-full object-cover"
            />
          ) : heroMediaUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-6">{heroTitle}</h1>
            <p className="text-xl text-white/70 mb-8">
              {heroSubtitle}
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-stone-400 focus:bg-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Resources */}
        {featuredQuery.data && featuredQuery.data.length > 0 && !searchQuery && !selectedCategory && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-serif text-foreground">Featured Resources</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredQuery.data.map((resource) => (
                <Card key={resource.id} className={`border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 hover:shadow-lg transition-shadow relative ${resource.isPremium ? 'ring-2 ring-amber-400' : ''}`}>
                  {resource.isPremium && (resource.price ?? 0) > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      {getFileIcon(resource.fileType, 'lg')}
                      {getFileTypeBadge(resource.fileType)}
                    </div>
                    <CardTitle className="text-lg mt-4">{resource.title}</CardTitle>
                    {resource.description && (
                      <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span>{resource.formattedSize}</span>
                        <span className="mx-2">•</span>
                        <span>{resource.downloadCount} downloads</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {renderResourceActions(resource, 'sm')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="divide-y">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted transition-colors ${
                      !selectedCategory ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <span>All Resources</span>
                    <Badge variant="outline">{resourcesQuery.data?.length || 0}</Badge>
                  </button>
                  {categoriesQuery.data?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted transition-colors ${
                        selectedCategory === category.slug ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{category.name}</span>
                      <Badge variant="outline">{category.resourceCount}</Badge>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Resources List */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedCategory 
                    ? categoriesQuery.data?.find(c => c.slug === selectedCategory)?.name || 'Resources'
                    : 'All Resources'
                  }
                </h2>
                <p className="text-muted-foreground">
                  {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} available
                </p>
              </div>
            </div>

            {/* Resources Grid */}
            {resourcesQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading resources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No resources found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Check back soon for new resources'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className={`hover:shadow-md transition-shadow ${resource.isPremium && (resource.price ?? 0) > 0 ? 'border-l-4 border-l-amber-500' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 relative">
                          {getFileIcon(resource.fileType, 'lg')}
                          {resource.isPremium && (resource.price ?? 0) > 0 && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-medium text-foreground">
                                  {resource.title}
                                </h3>
                                {resource.isPremium && (resource.price ?? 0) > 0 && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs">
                                    {formatPrice(resource.price ?? 0)}
                                  </Badge>
                                )}
                              </div>
                              {resource.description && (
                                <p className="text-muted-foreground mb-3 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {getFileTypeBadge(resource.fileType)}
                                <span>{resource.formattedSize}</span>
                                <span className="flex items-center gap-1">
                                  <Download className="w-4 h-4" />
                                  {resource.downloadCount}
                                </span>
                                {resource.categoryName && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="w-4 h-4" />
                                    {resource.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                            {renderResourceActions(resource)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Email Capture Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Resource</DialogTitle>
            <DialogDescription>
              Enter your email to download "{selectedResource?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
              {downloadError && (
                <p className="text-sm text-red-500 mt-1">{downloadError}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              We'll send you updates about new resources and content. You can unsubscribe anytime.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              disabled={!email || downloadMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {downloadMutation.isPending ? 'Downloading...' : 'Download'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Premium Resource
            </DialogTitle>
            <DialogDescription>
              "{purchaseResource?.title}" is a premium resource
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground dark:text-white">{purchaseResource?.title}</span>
                <span className="text-2xl font-bold text-amber-600">
                  {purchaseResource && formatPrice(purchaseResource.price)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{purchaseResource?.description}</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" />
                Instant download after purchase
              </p>
              <p className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {purchaseResource?.fileType.toUpperCase()} format • {purchaseResource?.formattedSize}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handlePurchase(purchaseResource)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                {previewResource && getFileIcon(previewResource.fileType, 'sm')}
                <div>
                  <DialogTitle className="text-lg">{previewResource?.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    {previewResource && getFileTypeBadge(previewResource.fileType)}
                    <span>{previewResource?.formattedSize}</span>
                    {previewResource?.isPremium && previewResource?.price > 0 && (
                      <Badge className="bg-amber-500 text-white">Premium</Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewResource?.fileUrl, '_blank')}
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                {previewResource?.isPremium && previewResource?.price > 0 ? (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    onClick={() => {
                      setPreviewOpen(false);
                      handleDownload(previewResource);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {formatPrice(previewResource.price)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => {
                      handleDownload(previewResource);
                      setPreviewOpen(false);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 overflow-auto">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Builder Zone: Before Footer */}
      <EditablePageZone pageSlug="resources" zoneName="before-footer" />
    </div>
  );
}
