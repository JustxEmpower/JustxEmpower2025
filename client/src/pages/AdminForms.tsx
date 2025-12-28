import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput, Plus, Edit, Trash2, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase, Search, Menu, Mail, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';

type FormField = {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
  placeholder: string | null;
  required: number;
  order: number;
  options: string | null;
  validation: string | null;
  isActive: number;
};

type FormSubmission = {
  id: number;
  formData: string;
  ipAddress: string | null;
  submittedAt: Date;
  isRead: number;
};

export default function AdminForms() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState<"fields" | "submissions">("fields");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);
  
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text" as FormField["fieldType"],
    placeholder: "",
    required: true,
    options: "",
  });

  const fieldsQuery = trpc.admin.forms.listFields.useQuery();
  const submissionsQuery = trpc.admin.forms.listSubmissions.useQuery();
  
  const createFieldMutation = trpc.admin.forms.createField.useMutation({
    onSuccess: () => {
      toast.success("Form field added");
      fieldsQuery.refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add field");
    },
  });
  
  const updateFieldMutation = trpc.admin.forms.updateField.useMutation({
    onSuccess: () => {
      toast.success("Form field updated");
      fieldsQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingField(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update field");
    },
  });
  
  const deleteFieldMutation = trpc.admin.forms.deleteField.useMutation({
    onSuccess: () => {
      toast.success("Form field deleted");
      fieldsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete field");
    },
  });
  
  const markReadMutation = trpc.admin.forms.markSubmissionRead.useMutation({
    onSuccess: () => {
      toast.success("Submission marked as read");
      submissionsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark as read");
    },
  });

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      placeholder: "",
      required: true,
      options: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.fieldName || !formData.fieldLabel) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createFieldMutation.mutateAsync({
      fieldName: formData.fieldName,
      fieldLabel: formData.fieldLabel,
      fieldType: formData.fieldType,
      placeholder: formData.placeholder || null,
      required: formData.required ? 1 : 0,
      order: (fieldsQuery.data?.length || 0),
      options: formData.options || null,
      isActive: 1,
    });
  };

  const handleEdit = (field: FormField) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      placeholder: field.placeholder || "",
      required: field.required === 1,
      options: field.options || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingField || !formData.fieldName || !formData.fieldLabel) {
      toast.error("Please fill in all required fields");
      return;
    }

    await updateFieldMutation.mutateAsync({
      id: editingField.id,
      fieldName: formData.fieldName,
      fieldLabel: formData.fieldLabel,
      fieldType: formData.fieldType,
      placeholder: formData.placeholder || null,
      required: formData.required ? 1 : 0,
      options: formData.options || null,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this form field?")) {
      return;
    }
    await deleteFieldMutation.mutateAsync({ id });
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setViewingSubmission(submission);
    if (submission.isRead === 0) {
      markReadMutation.mutate({ id: submission.id });
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Form Builder</h1>
            <p className="text-stone-600">Customize contact form fields and view submissions</p>
          </div>

          {/* Tabs for Fields/Submissions */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fields" | "submissions")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="fields">Form Fields</TabsTrigger>
              <TabsTrigger value="submissions">
                Submissions
                {submissionsQuery.data && submissionsQuery.data.filter((s) => s.isRead === 0).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-600 text-white rounded-full">
                    {submissionsQuery.data.filter((s) => s.isRead === 0).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Form Fields Tab */}
            <TabsContent value="fields">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Contact Form Fields</CardTitle>
                      <CardDescription>Manage custom fields for your contact form</CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Field
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Form Field</DialogTitle>
                          <DialogDescription>Create a new field for the contact form</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="fieldName">Field Name (ID) *</Label>
                            <Input
                              id="fieldName"
                              value={formData.fieldName}
                              onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                              placeholder="email"
                            />
                            <p className="text-xs text-stone-500 mt-1">Lowercase, no spaces (e.g., "email", "phone_number")</p>
                          </div>
                          <div>
                            <Label htmlFor="fieldLabel">Field Label *</Label>
                            <Input
                              id="fieldLabel"
                              value={formData.fieldLabel}
                              onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                              placeholder="Email Address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fieldType">Field Type *</Label>
                            <Select
                              value={formData.fieldType}
                              onValueChange={(value) => setFormData({ ...formData, fieldType: value as FormField["fieldType"] })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Phone</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="select">Select Dropdown</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="placeholder">Placeholder</Label>
                            <Input
                              id="placeholder"
                              value={formData.placeholder}
                              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                              placeholder="Enter your email..."
                            />
                          </div>
                          {(formData.fieldType === "select" || formData.fieldType === "checkbox") && (
                            <div>
                              <Label htmlFor="options">Options (comma-separated)</Label>
                              <Input
                                id="options"
                                value={formData.options}
                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="required"
                              checked={formData.required}
                              onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                            />
                            <Label htmlFor="required" className="cursor-pointer">
                              Required Field
                            </Label>
                          </div>
                          <Button
                            onClick={handleAdd}
                            disabled={createFieldMutation.isPending}
                            className="w-full bg-amber-600 hover:bg-amber-700"
                          >
                            {createFieldMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Field
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {fieldsQuery.isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                  ) : !fieldsQuery.data || fieldsQuery.data.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      <FormInput className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No form fields yet</p>
                      <p className="text-sm">Click "Add Field" to create your first field</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fieldsQuery.data.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {field.fieldLabel}
                              {field.required === 1 && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <div className="text-sm text-stone-500">
                              {field.fieldName} • {field.fieldType}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(field)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(field.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle>Form Submissions</CardTitle>
                  <CardDescription>View and manage contact form submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {submissionsQuery.isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                  ) : !submissionsQuery.data || submissionsQuery.data.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No submissions yet</p>
                      <p className="text-sm">Form submissions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissionsQuery.data.map((submission) => {
                        const data = JSON.parse(submission.formData);
                        return (
                          <div
                            key={submission.id}
                            className={`flex items-center gap-3 p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer ${
                              submission.isRead === 0 ? "bg-amber-50 border-amber-200" : "bg-white"
                            }`}
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {data.name || data.email || "Anonymous"}
                                {submission.isRead === 0 && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-600 text-white rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-stone-500">
                                {new Date(submission.submittedAt).toLocaleString()}
                              </div>
                            </div>

                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Field Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Form Field</DialogTitle>
                <DialogDescription>Update the field details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-fieldName">Field Name (ID) *</Label>
                  <Input
                    id="edit-fieldName"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fieldLabel">Field Label *</Label>
                  <Input
                    id="edit-fieldLabel"
                    value={formData.fieldLabel}
                    onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fieldType">Field Type *</Label>
                  <Select
                    value={formData.fieldType}
                    onValueChange={(value) => setFormData({ ...formData, fieldType: value as FormField["fieldType"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-placeholder">Placeholder</Label>
                  <Input
                    id="edit-placeholder"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  />
                </div>
                {(formData.fieldType === "select" || formData.fieldType === "checkbox") && (
                  <div>
                    <Label htmlFor="edit-options">Options (comma-separated)</Label>
                    <Input
                      id="edit-options"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-required"
                    checked={formData.required}
                    onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                  />
                  <Label htmlFor="edit-required" className="cursor-pointer">
                    Required Field
                  </Label>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={updateFieldMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {updateFieldMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Field
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Submission Dialog */}
          <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Form Submission</DialogTitle>
                <DialogDescription>
                  Submitted on {viewingSubmission && new Date(viewingSubmission.submittedAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              {viewingSubmission && (
                <div className="space-y-4 mt-4">
                  {Object.entries(JSON.parse(viewingSubmission.formData)).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-stone-600">{key}</Label>
                      <div className="mt-1 p-3 bg-stone-50 rounded border">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                  {viewingSubmission.ipAddress && (
                    <div className="text-sm text-stone-500 pt-4 border-t">
                      IP Address: {viewingSubmission.ipAddress}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
