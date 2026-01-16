import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import {
  FormInput, Plus, Search, RefreshCw, FileText, Users, CheckCircle,
  Mail, Phone, MessageSquare, Eye, EyeOff, Trash2, Download, Filter,
  MoreVertical, Calendar, Clock, Star, Archive, Reply, Forward,
  CheckCheck, AlertCircle, TrendingUp, BarChart3, PieChart, Settings,
  Inbox, Send, X, ChevronDown, ChevronRight, User, Tag, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 800, steps = 20, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
}

export default function AdminFormsTurbo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("submissions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  // Form field state
  const [fieldForm, setFieldForm] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text" as "text" | "email" | "tel" | "textarea" | "select" | "checkbox",
    placeholder: "",
    required: 1,
    order: 0,
    options: "",
    isActive: 1,
  });

  // Queries
  const submissionsQuery = trpc.admin.forms.listSubmissions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const fieldsQuery = trpc.admin.forms.listFields.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const markReadMutation = trpc.admin.forms.markSubmissionRead.useMutation({
    onSuccess: () => {
      toast.success("Marked as read");
      submissionsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const createFieldMutation = trpc.admin.forms.createField.useMutation({
    onSuccess: () => {
      toast.success("Field created");
      fieldsQuery.refetch();
      setIsFieldDialogOpen(false);
      resetFieldForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateFieldMutation = trpc.admin.forms.updateField.useMutation({
    onSuccess: () => {
      toast.success("Field updated");
      fieldsQuery.refetch();
      setIsFieldDialogOpen(false);
      setEditingField(null);
      resetFieldForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteFieldMutation = trpc.admin.forms.deleteField.useMutation({
    onSuccess: () => {
      toast.success("Field deleted");
      fieldsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const submissions = submissionsQuery.data || [];
  const fields = fieldsQuery.data || [];

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub: any) => {
      const matchesSearch = searchQuery === "" ||
        sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "unread" && sub.isRead === 0) ||
        (statusFilter === "read" && sub.isRead === 1);
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = submissions.length;
    const unread = submissions.filter((s: any) => s.isRead === 0).length;
    const today = submissions.filter((s: any) => {
      const subDate = new Date(s.submittedAt);
      const now = new Date();
      return subDate.toDateString() === now.toDateString();
    }).length;
    const thisWeek = submissions.filter((s: any) => {
      const subDate = new Date(s.submittedAt);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return subDate >= weekAgo;
    }).length;
    return { total, unread, today, thisWeek };
  }, [submissions]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const resetFieldForm = () => {
    setFieldForm({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      placeholder: "",
      required: 1,
      order: fields.length,
      options: "",
      isActive: 1,
    });
  };

  const handleCreateField = () => {
    setEditingField(null);
    resetFieldForm();
    setFieldForm(prev => ({ ...prev, order: fields.length }));
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: any) => {
    setEditingField(field);
    setFieldForm({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      placeholder: field.placeholder || "",
      required: field.required,
      order: field.order,
      options: field.options || "",
      isActive: field.isActive,
    });
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!fieldForm.fieldName || !fieldForm.fieldLabel) {
      toast.error("Field name and label are required");
      return;
    }
    if (editingField) {
      updateFieldMutation.mutate({
        id: editingField.id,
        ...fieldForm,
        placeholder: fieldForm.placeholder || null,
        options: fieldForm.options || null,
      });
    } else {
      createFieldMutation.mutate({
        ...fieldForm,
        placeholder: fieldForm.placeholder || null,
        options: fieldForm.options || null,
      });
    }
  };

  const handleBulkMarkRead = () => {
    selectedSubmissions.forEach(id => {
      markReadMutation.mutate({ id });
    });
    setSelectedSubmissions(new Set());
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Message", "Status"];
    const rows = filteredSubmissions.map((sub: any) => [
      format(new Date(sub.submittedAt), "yyyy-MM-dd HH:mm"),
      sub.name || "",
      sub.email || "",
      sub.phone || "",
      (sub.message || "").replace(/"/g, '""'),
      sub.isRead ? "Read" : "Unread",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const toggleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s: any) => s.id)));
    }
  };

  if (isChecking) {
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
                <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  Forms & Submissions
                </h1>
                <p className="text-stone-500 text-sm">Manage contact forms, fields, and submissions</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    submissionsQuery.refetch();
                    fieldsQuery.refetch();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filteredSubmissions.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Submissions", value: stats.total, icon: Inbox, color: "amber", bg: "from-amber-50 to-amber-100/50" },
              { label: "Unread", value: stats.unread, icon: Mail, color: "red", bg: "from-red-50 to-red-100/50" },
              { label: "Today", value: stats.today, icon: Calendar, color: "blue", bg: "from-blue-50 to-blue-100/50" },
              { label: "This Week", value: stats.thisWeek, icon: TrendingUp, color: "emerald", bg: "from-emerald-50 to-emerald-100/50" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`bg-gradient-to-br ${stat.bg} border-${stat.color}-200/50 hover:shadow-md transition-shadow`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600 uppercase tracking-wide`}>{stat.label}</p>
                        <p className={`text-3xl font-bold text-${stat.color}-900 mt-1`}>
                          <AnimatedCounter value={stat.value} />
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-stone-100/80 p-1">
              <TabsTrigger value="submissions" className="gap-2">
                <Inbox className="w-4 h-4" />
                Submissions
                {stats.unread > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 ml-1">{stats.unread}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="fields" className="gap-2">
                <FormInput className="w-4 h-4" />
                Form Fields
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search by name, email, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                {selectedSubmissions.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedSubmissions.size} selected</Badge>
                    <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Mark Read
                    </Button>
                  </div>
                )}
              </div>

              {/* Submissions List */}
              {submissionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Inbox className="w-12 h-12 mx-auto text-stone-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Submissions</h3>
                    <p className="text-stone-500">
                      {searchQuery || statusFilter !== "all"
                        ? "No submissions match your filters"
                        : "No form submissions yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="divide-y divide-stone-100">
                    {/* Header Row */}
                    <div className="px-4 py-3 bg-stone-50 flex items-center gap-4 text-sm font-medium text-stone-600">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-stone-300"
                      />
                      <div className="flex-1 grid grid-cols-12 gap-4">
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-5">Message</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                    </div>

                    {/* Submission Rows */}
                    <AnimatePresence>
                      {filteredSubmissions.map((sub: any, index: number) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.02 }}
                          className={`px-4 py-3 flex items-center gap-4 hover:bg-stone-50 transition-colors cursor-pointer ${
                            sub.isRead === 0 ? "bg-amber-50/50" : ""
                          }`}
                          onClick={() => {
                            setViewingSubmission(sub);
                            if (sub.isRead === 0) {
                              markReadMutation.mutate({ id: sub.id });
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(sub.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(selectedSubmissions);
                              if (newSet.has(sub.id)) {
                                newSet.delete(sub.id);
                              } else {
                                newSet.add(sub.id);
                              }
                              setSelectedSubmissions(newSet);
                            }}
                            className="rounded border-stone-300"
                          />
                          <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-3">
                              <div className="flex items-center gap-2">
                                {sub.isRead === 0 && (
                                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                                )}
                                <div>
                                  <p className={`font-medium text-stone-900 ${sub.isRead === 0 ? "font-semibold" : ""}`}>
                                    {sub.name || "Anonymous"}
                                  </p>
                                  <p className="text-sm text-stone-500">{sub.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-5">
                              <p className="text-stone-600 truncate">{sub.message || "No message"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-stone-500">
                                {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingSubmission(sub);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `mailto:${sub.email}`;
                                  }}>
                                    <Reply className="w-4 h-4 mr-2" />
                                    Reply via Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    markReadMutation.mutate({ id: sub.id });
                                  }}>
                                    <CheckCheck className="w-4 h-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Form Fields Tab */}
            <TabsContent value="fields" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-stone-600">Configure the fields displayed on your contact form</p>
                <Button onClick={handleCreateField} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {fieldsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                </div>
              ) : fields.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FormInput className="w-12 h-12 mx-auto text-stone-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Form Fields</h3>
                    <p className="text-stone-500 mb-4">Create fields to customize your contact form</p>
                    <Button onClick={handleCreateField} className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Field
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {fields.map((field: any, index: number) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-stone-100">
                                {field.fieldType === "email" ? <Mail className="w-5 h-5 text-stone-600" /> :
                                 field.fieldType === "tel" ? <Phone className="w-5 h-5 text-stone-600" /> :
                                 field.fieldType === "textarea" ? <MessageSquare className="w-5 h-5 text-stone-600" /> :
                                 <FormInput className="w-5 h-5 text-stone-600" />}
                              </div>
                              <div>
                                <p className="font-medium text-stone-900">{field.fieldLabel}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{field.fieldType}</Badge>
                                  <Badge variant="outline" className="text-xs">{field.fieldName}</Badge>
                                  {field.required === 1 && (
                                    <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField(field)}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Delete this field?")) {
                                    deleteFieldMutation.mutate({ id: field.id });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      Submission Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">Today</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (stats.today / Math.max(1, stats.total)) * 100 * 10)}%` }}
                            />
                          </div>
                          <span className="font-medium">{stats.today}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">This Week</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, (stats.thisWeek / Math.max(1, stats.total)) * 100)}%` }}
                            />
                          </div>
                          <span className="font-medium">{stats.thisWeek}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">All Time</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                          </div>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-amber-600" />
                      Response Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full border-8 border-stone-100 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-stone-900">
                              {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                            </p>
                            <p className="text-xs text-stone-500">Read Rate</p>
                          </div>
                        </div>
                        <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="8"
                            strokeDasharray={`${((stats.total - stats.unread) / Math.max(1, stats.total)) * 352} 352`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>Read ({stats.total - stats.unread})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-stone-200" />
                        <span>Unread ({stats.unread})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* View Submission Dialog */}
        <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Submission Details
              </DialogTitle>
            </DialogHeader>
            {viewingSubmission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500 text-xs">Name</Label>
                    <p className="font-medium">{viewingSubmission.name || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs">Date</Label>
                    <p className="font-medium">
                      {format(new Date(viewingSubmission.submittedAt), "PPp")}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-stone-500 text-xs">Email</Label>
                  <p className="font-medium">{viewingSubmission.email}</p>
                </div>
                {viewingSubmission.phone && (
                  <div>
                    <Label className="text-stone-500 text-xs">Phone</Label>
                    <p className="font-medium">{viewingSubmission.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-stone-500 text-xs">Message</Label>
                  <p className="mt-1 p-3 bg-stone-50 rounded-lg whitespace-pre-wrap">
                    {viewingSubmission.message || "No message"}
                  </p>
                </div>
                {viewingSubmission.formData && (
                  <div>
                    <Label className="text-stone-500 text-xs">Additional Data</Label>
                    <pre className="mt-1 p-3 bg-stone-50 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(JSON.parse(viewingSubmission.formData), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingSubmission(null)}>
                Close
              </Button>
              {viewingSubmission?.email && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => window.location.href = `mailto:${viewingSubmission.email}`}
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Field Dialog */}
        <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Name (ID)</Label>
                  <Input
                    value={fieldForm.fieldName}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldName: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                    placeholder="e.g., company_name"
                  />
                </div>
                <div>
                  <Label>Display Label</Label>
                  <Input
                    value={fieldForm.fieldLabel}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldLabel: e.target.value })}
                    placeholder="e.g., Company Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Type</Label>
                  <Select
                    value={fieldForm.fieldType}
                    onValueChange={(v: any) => setFieldForm({ ...fieldForm, fieldType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={fieldForm.order}
                    onChange={(e) => setFieldForm({ ...fieldForm, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  placeholder="Optional placeholder text"
                />
              </div>
              {fieldForm.fieldType === "select" && (
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={fieldForm.options}
                    onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={fieldForm.required === 1}
                  onCheckedChange={(checked) => setFieldForm({ ...fieldForm, required: checked ? 1 : 0 })}
                />
                <Label>Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleSaveField}
                disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
              >
                {editingField ? "Update" : "Create"} Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
