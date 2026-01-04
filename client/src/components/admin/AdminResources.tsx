import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Upload,
  Trash2,
  Edit,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Eye,
  FolderPlus,
  GripVertical,
  BarChart3,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// File type icon mapping
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (['pdf'].includes(type)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['doc', 'docx'].includes(type)) return <FileText className="w-5 h-5 text-blue-500" />;
  if (['xls', 'xlsx', 'csv'].includes(type)) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) return <FileImage className="w-5 h-5 text-purple-500" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) return <FileArchive className="w-5 h-5 text-amber-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

// Status badge color mapping
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>;
    case 'draft':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
    case 'archived':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminResources() {
  const [activeTab, setActiveTab] = useState('resources');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    isPublic: true,
    requiresEmail: false,
    status: 'published' as 'draft' | 'published' | 'archived',
    isFeatured: false,
    // Premium fields
    isPremium: false,
    price: '',
    allowPreview: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
  });

  // Queries
  const resourcesQuery = trpc.adminResources.list.useQuery({
    categoryId: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });
  const categoriesQuery = trpc.adminResources.categories.list.useQuery();
  const topDownloadsQuery = trpc.adminResources.getTopDownloads.useQuery({ limit: 5 });

  // Mutations
  const uploadMutation = trpc.adminResources.upload.useMutation({
    onSuccess: () => {
      resourcesQuery.refetch();
      setIsUploadOpen(false);
      resetUploadForm();
      toast.success('Resource uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });
  const updateMutation = trpc.adminResources.update.useMutation({
    onSuccess: () => {
      resourcesQuery.refetch();
      setIsEditOpen(false);
      setSelectedResource(null);
    },
  });
  const deleteMutation = trpc.adminResources.delete.useMutation({
    onSuccess: () => {
      resourcesQuery.refetch();
    },
  });
  const createCategoryMutation = trpc.adminResources.categories.create.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      setIsCategoryOpen(false);
      setCategoryForm({ name: '', description: '', icon: '' });
    },
  });
  const deleteCategoryMutation = trpc.adminResources.categories.delete.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
    },
  });

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      categoryId: '',
      isPublic: true,
      requiresEmail: false,
      status: 'published',
      isFeatured: false,
      isPremium: false,
      price: '',
      allowPreview: true,
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!uploadForm.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadForm(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      await uploadMutation.mutateAsync({
        title: uploadForm.title,
        description: uploadForm.description || undefined,
        categoryId: uploadForm.categoryId ? parseInt(uploadForm.categoryId) : undefined,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        base64Data: base64,
        isPublic: uploadForm.isPublic ? 1 : 0,
        requiresEmail: uploadForm.requiresEmail ? 1 : 0,
        status: uploadForm.status,
        isFeatured: uploadForm.isFeatured ? 1 : 0,
        isPremium: uploadForm.isPremium ? 1 : 0,
        price: uploadForm.price ? Math.round(parseFloat(uploadForm.price) * 100) : 0, // Convert to cents
        allowPreview: uploadForm.allowPreview ? 1 : 0,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleEdit = (resource: any) => {
    setSelectedResource(resource);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedResource) return;
    
    await updateMutation.mutateAsync({
      id: selectedResource.id,
      title: selectedResource.title,
      description: selectedResource.description,
      categoryId: selectedResource.categoryId,
      isPublic: selectedResource.isPublic,
      requiresEmail: selectedResource.requiresEmail,
      status: selectedResource.status,
      isFeatured: selectedResource.isFeatured,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category? Resources in this category will become uncategorized.')) {
      await deleteCategoryMutation.mutateAsync({ id });
    }
  };

  // Filter resources by search
  const filteredResources = resourcesQuery.data?.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resources</h1>
          <p className="text-stone-500">Manage downloadable files and documents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>Add a new category to organize your resources</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Category Name</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Guides, Templates, Reports"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this category"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCategoryOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createCategoryMutation.mutate(categoryForm)}
                  disabled={!categoryForm.name || createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Resource</DialogTitle>
                <DialogDescription>Add a new downloadable file to your resource library</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* File Upload */}
                <div className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.txt"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {getFileIcon(selectedFile.name.split('.').pop() || '')}
                      <div className="text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-stone-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={resetUploadForm}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 mx-auto text-stone-400 mb-2" />
                      <p className="text-stone-600 mb-2">Drag and drop or click to upload</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Select File
                      </Button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this resource"
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div>
                  <Label>Category</Label>
                  <Select
                    value={uploadForm.categoryId}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesQuery.data?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={uploadForm.status}
                    onValueChange={(value: any) => setUploadForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Access</Label>
                      <p className="text-sm text-stone-500">Allow anyone to download</p>
                    </div>
                    <Switch
                      checked={uploadForm.isPublic}
                      onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, isPublic: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email</Label>
                      <p className="text-sm text-stone-500">Capture email before download</p>
                    </div>
                    <Switch
                      checked={uploadForm.requiresEmail}
                      onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, requiresEmail: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-sm text-stone-500">Highlight this resource</p>
                    </div>
                    <Switch
                      checked={uploadForm.isFeatured}
                      onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, isFeatured: checked }))}
                    />
                  </div>
                  
                  {/* Premium Content Section */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label>Premium Content</Label>
                        <p className="text-sm text-stone-500">Require payment to download</p>
                      </div>
                      <Switch
                        checked={uploadForm.isPremium}
                        onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, isPremium: checked }))}
                      />
                    </div>
                    
                    {uploadForm.isPremium && (
                      <>
                        <div className="mb-3">
                          <Label>Price (USD)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={uploadForm.price}
                              onChange={(e) => setUploadForm(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="9.99"
                              className="pl-7"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Allow Preview</Label>
                            <p className="text-sm text-stone-500">Let users preview before purchase</p>
                          </div>
                          <Switch
                            checked={uploadForm.allowPreview}
                            onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, allowPreview: checked }))}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsUploadOpen(false); resetUploadForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadForm.title || uploadMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Resource'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="resources">All Resources</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesQuery.data?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resources Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-stone-500">
                        No resources found. Upload your first resource to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>{getFileIcon(resource.fileType)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-sm text-stone-500 truncate max-w-xs">
                              {resource.fileName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {resource.categoryName || <span className="text-stone-400">Uncategorized</span>}
                        </TableCell>
                        <TableCell>{resource.formattedSize}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4 text-stone-400" />
                            {resource.downloadCount}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(resource.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(resource.fileUrl, '_blank')}>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(resource)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(resource.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoriesQuery.data?.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-500">
                    {resourcesQuery.data?.filter(r => r.categoryId === category.id).length || 0} resources
                  </p>
                </CardContent>
              </Card>
            ))}
            {categoriesQuery.data?.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-stone-500">
                  No categories yet. Create your first category to organize resources.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDownloadsQuery.data?.map((resource, index) => (
                    <div key={resource.id} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-stone-400 w-6">{index + 1}</span>
                      {getFileIcon(resource.fileType)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{resource.title}</p>
                        <p className="text-sm text-stone-500">{resource.downloadCount} downloads</p>
                      </div>
                    </div>
                  ))}
                  {topDownloadsQuery.data?.length === 0 && (
                    <p className="text-stone-500 text-center py-4">No downloads yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">
                      {resourcesQuery.data?.length || 0}
                    </p>
                    <p className="text-sm text-stone-500">Total Resources</p>
                  </div>
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">
                      {categoriesQuery.data?.length || 0}
                    </p>
                    <p className="text-sm text-stone-500">Categories</p>
                  </div>
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">
                      {resourcesQuery.data?.reduce((sum, r) => sum + r.downloadCount, 0) || 0}
                    </p>
                    <p className="text-sm text-stone-500">Total Downloads</p>
                  </div>
                  <div className="text-center p-4 bg-stone-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">
                      {resourcesQuery.data?.filter(r => r.status === 'published').length || 0}
                    </p>
                    <p className="text-sm text-stone-500">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update resource details</DialogDescription>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={selectedResource.title}
                  onChange={(e) => setSelectedResource({ ...selectedResource, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedResource.description || ''}
                  onChange={(e) => setSelectedResource({ ...selectedResource, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={selectedResource.categoryId?.toString() || 'uncategorized'}
                  onValueChange={(value) => setSelectedResource({ ...selectedResource, categoryId: value === 'uncategorized' ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categoriesQuery.data?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedResource.status}
                  onValueChange={(value) => setSelectedResource({ ...selectedResource, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Public Access</Label>
                  <Switch
                    checked={selectedResource.isPublic === 1}
                    onCheckedChange={(checked) => setSelectedResource({ ...selectedResource, isPublic: checked ? 1 : 0 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Email</Label>
                  <Switch
                    checked={selectedResource.requiresEmail === 1}
                    onCheckedChange={(checked) => setSelectedResource({ ...selectedResource, requiresEmail: checked ? 1 : 0 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Featured</Label>
                  <Switch
                    checked={selectedResource.isFeatured === 1}
                    onCheckedChange={(checked) => setSelectedResource({ ...selectedResource, isFeatured: checked ? 1 : 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
