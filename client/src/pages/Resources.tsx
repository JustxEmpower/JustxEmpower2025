import { useState } from 'react';
import { trpc } from '@/lib/trpc';
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
  ChevronRight,
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
  return <File className={`${sizeClass} text-gray-500`} />;
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
  };
  return (
    <Badge className={`${colors[type] || 'bg-gray-100 text-gray-700'} hover:${colors[type] || 'bg-gray-100'}`}>
      {type}
    </Badge>
  );
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [downloadError, setDownloadError] = useState('');

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

  // Filter resources by search
  const filteredResources = resourcesQuery.data?.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-6">Resources</h1>
            <p className="text-xl text-stone-300 mb-8">
              Download guides, templates, and materials to support your empowerment journey
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
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
              <h2 className="text-2xl font-serif text-stone-900">Featured Resources</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredQuery.data.map((resource) => (
                <Card key={resource.id} className="border-amber-200 bg-amber-50/50 hover:shadow-lg transition-shadow">
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
                      <div className="text-sm text-stone-500">
                        <span>{resource.formattedSize}</span>
                        <span className="mx-2">•</span>
                        <span>{resource.downloadCount} downloads</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleDownload(resource)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
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
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      !selectedCategory ? 'bg-amber-50 text-amber-700 font-medium' : 'text-stone-600'
                    }`}
                  >
                    <span>All Resources</span>
                    <Badge variant="outline">{resourcesQuery.data?.length || 0}</Badge>
                  </button>
                  {categoriesQuery.data?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-50 transition-colors ${
                        selectedCategory === category.slug ? 'bg-amber-50 text-amber-700 font-medium' : 'text-stone-600'
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
                <h2 className="text-xl font-semibold text-stone-900">
                  {selectedCategory 
                    ? categoriesQuery.data?.find(c => c.slug === selectedCategory)?.name || 'Resources'
                    : 'All Resources'
                  }
                </h2>
                <p className="text-stone-500">
                  {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} available
                </p>
              </div>
            </div>

            {/* Resources Grid */}
            {resourcesQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-stone-500">Loading resources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">No resources found</h3>
                  <p className="text-stone-500">
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
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getFileIcon(resource.fileType, 'lg')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-medium text-stone-900 mb-1">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-stone-600 mb-3 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-stone-500">
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
                            <Button
                              className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                              onClick={() => handleDownload(resource)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
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
            <p className="text-sm text-stone-500">
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
    </div>
  );
}
