import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Eye, Trash2, Archive, Reply, Clock, User, MessageSquare, AlertCircle, 
  CheckCircle, Search, RefreshCw, Filter, Send, Inbox, MailOpen, CheckCheck,
  ArchiveX, MoreHorizontal, Star, StarOff, Loader2, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from '@/components/AdminSidebar';

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
  return <span>{displayValue.toLocaleString()}</span>;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  new: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <AlertCircle className="w-4 h-4" />, label: "New" },
  read: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <MailOpen className="w-4 h-4" />, label: "Read" },
  replied: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCheck className="w-4 h-4" />, label: "Replied" },
  archived: { color: "text-stone-500", bg: "bg-stone-50 border-stone-200", icon: <Archive className="w-4 h-4" />, label: "Archived" },
};

const replyTemplates = [
  { name: "Thank You", subject: "Thank you for reaching out!", body: "Thank you for contacting Just Empower. We appreciate you taking the time to reach out to us.\n\nWe have received your message and will review it carefully. If you have any additional questions or need further assistance, please don't hesitate to reply to this email.\n\nWarm regards," },
  { name: "More Info Needed", subject: "Re: Your inquiry - Additional information needed", body: "Thank you for reaching out to Just Empower.\n\nTo better assist you with your inquiry, we would need some additional information:\n\n- [Specific detail needed]\n- [Another detail needed]\n\nOnce we have this information, we'll be able to provide you with a more comprehensive response.\n\nBest regards," },
  { name: "Follow Up", subject: "Following up on your inquiry", body: "I hope this message finds you well.\n\nI wanted to follow up on your recent inquiry to ensure all your questions have been answered. Is there anything else we can help you with?\n\nPlease don't hesitate to reach out if you need any further assistance.\n\nWarm regards," },
];

export default function AdminMessagesInbox() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  // State
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Queries
  const submissionsQuery = trpc.contact.list.useQuery({ limit: 100 });
  const statsQuery = trpc.contact.stats.useQuery();

  // Mutations
  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); submissionsQuery.refetch(); statsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.contact.delete.useMutation({
    onSuccess: () => { 
      toast.success("Message deleted"); 
      submissionsQuery.refetch(); 
      statsQuery.refetch();
      setIsViewOpen(false); 
      setSelectedMessage(null); 
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDeleteMutation = trpc.contact.bulkDelete.useMutation({
    onSuccess: (data) => { 
      toast.success(`${data.deleted} messages deleted`); 
      submissionsQuery.refetch(); 
      statsQuery.refetch();
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkStatusMutation = trpc.contact.bulkUpdateStatus.useMutation({
    onSuccess: (data) => { 
      toast.success(`${data.updated} messages updated`); 
      submissionsQuery.refetch(); 
      statsQuery.refetch();
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const replyMutation = trpc.contact.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      setIsReplyOpen(false);
      setReplySubject("");
      setReplyMessage("");
      submissionsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation('/admin/login');
  }, [isAuthenticated, isChecking, setLocation]);

  const submissions = submissionsQuery.data || [];
  const stats = statsQuery.data || { total: 0, new: 0, read: 0, replied: 0, archived: 0 };

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s: any) => {
      const matchesTab = activeTab === "all" || s.status === activeTab;
      const matchesSearch = searchQuery === "" ||
        s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.message?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [submissions, activeTab, searchQuery]);

  const handleViewMessage = (msg: any) => {
    setSelectedMessage(msg);
    setIsViewOpen(true);
    if (msg.status === "new") {
      updateStatusMutation.mutate({ id: msg.id, status: "read" });
    }
  };

  const handleReply = (msg: any) => {
    setSelectedMessage(msg);
    setReplySubject(`Re: ${msg.subject}`);
    setReplyMessage("");
    setIsReplyOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replySubject || !replyMessage) {
      toast.error("Please fill in subject and message");
      return;
    }
    setIsSending(true);
    try {
      await replyMutation.mutateAsync({
        id: selectedMessage.id,
        toEmail: selectedMessage.email,
        toName: `${selectedMessage.firstName} ${selectedMessage.lastName}`,
        subject: replySubject,
        message: replyMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s: any) => s.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const applyTemplate = (template: typeof replyTemplates[0]) => {
    setReplySubject(template.subject);
    setReplyMessage(template.body);
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Inbox className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">Messages Inbox</h1>
                  <p className="text-stone-500 text-sm">Manage contact form submissions & inquiries</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { submissionsQuery.refetch(); statsQuery.refetch(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total", value: stats.total, icon: MessageSquare, color: "stone", tab: "all" },
              { label: "New", value: stats.new, icon: AlertCircle, color: "amber", tab: "new" },
              { label: "Read", value: stats.read, icon: MailOpen, color: "blue", tab: "read" },
              { label: "Replied", value: stats.replied, icon: CheckCheck, color: "emerald", tab: "replied" },
              { label: "Archived", value: stats.archived, icon: Archive, color: "stone", tab: "archived" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${activeTab === stat.tab ? 'ring-2 ring-amber-500' : ''}`}
                  onClick={() => setActiveTab(stat.tab)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-stone-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-stone-900"><AnimatedCounter value={stat.value} /></p>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500 opacity-50`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input 
                  placeholder="Search messages..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10" 
                />
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200"
              >
                <span className="text-sm font-medium text-amber-700">{selectedIds.length} selected</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: "read" })}>
                    <MailOpen className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: "archived" })}>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => {
                    if (confirm(`Delete ${selectedIds.length} messages?`)) {
                      bulkDeleteMutation.mutate({ ids: selectedIds });
                    }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Messages List */}
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <Checkbox 
                  checked={selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-xs font-medium text-stone-500 flex-1">
                  {filteredSubmissions.length} message{filteredSubmissions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Messages */}
              {filteredSubmissions.length === 0 ? (
                <div className="py-16 text-center">
                  <Mail className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                  <h3 className="text-lg font-medium text-stone-600 mb-2">No Messages</h3>
                  <p className="text-stone-400">{searchQuery ? "Try adjusting your search" : "Your inbox is empty"}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredSubmissions.map((msg: any, i: number) => {
                    const config = statusConfig[msg.status] || statusConfig.new;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.02 }}
                        className={`flex items-center gap-4 px-4 py-4 border-b border-stone-100 hover:bg-stone-50/50 transition-colors cursor-pointer group ${msg.status === "new" ? "bg-amber-50/30" : ""}`}
                        onClick={() => handleViewMessage(msg)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedIds.includes(msg.id)}
                            onCheckedChange={() => handleSelectOne(msg.id)}
                          />
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-stone-600">
                            {msg.firstName?.[0]}{msg.lastName?.[0]}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${msg.status === "new" ? "text-stone-900" : "text-stone-700"}`}>
                              {msg.firstName} {msg.lastName}
                            </span>
                            <Badge className={`${config.bg} ${config.color} border text-xs`}>
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                          </div>
                          <p className={`text-sm truncate ${msg.status === "new" ? "font-medium text-stone-800" : "text-stone-600"}`}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-stone-400 truncate mt-0.5">{msg.message}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone-400 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleReply(msg)}>
                              <Reply className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                              const newStatus = msg.status === "archived" ? "read" : "archived";
                              updateStatusMutation.mutate({ id: msg.id, status: newStatus });
                            }}>
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => {
                              if (confirm("Delete this message?")) deleteMutation.mutate({ id: msg.id });
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Message Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {selectedMessage?.firstName?.[0]}{selectedMessage?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <span className="block">{selectedMessage?.firstName} {selectedMessage?.lastName}</span>
                  <span className="text-sm font-normal text-stone-500">{selectedMessage?.email}</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedMessage && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Subject</p>
                    <p className="font-semibold text-lg">{selectedMessage.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Received</p>
                    <p className="text-sm">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-stone-50 rounded-xl p-5 border">
                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                </div>

                {selectedMessage.notes && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700 mb-2">Internal Notes / Previous Reply</p>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedMessage.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select 
                    value={selectedMessage.status} 
                    onValueChange={(status) => {
                      updateStatusMutation.mutate({ id: selectedMessage.id, status: status as any });
                      setSelectedMessage({ ...selectedMessage, status });
                    }}
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => window.open(`mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />Open in Mail App
              </Button>
              <Button onClick={() => { setIsViewOpen(false); handleReply(selectedMessage); }} className="bg-amber-600 hover:bg-amber-700">
                <Reply className="w-4 h-4 mr-2" />Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                Reply to {selectedMessage?.firstName}
              </DialogTitle>
              <DialogDescription>
                Send a direct email reply to {selectedMessage?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Quick Templates */}
              <div>
                <Label className="text-sm text-stone-500 mb-2 block">Quick Templates</Label>
                <div className="flex gap-2 flex-wrap">
                  {replyTemplates.map((template) => (
                    <Button 
                      key={template.name}
                      variant="outline" 
                      size="sm"
                      onClick={() => applyTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Input value={`${selectedMessage?.firstName} ${selectedMessage?.lastName} <${selectedMessage?.email}>`} disabled className="bg-stone-50" />
              </div>
              
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} placeholder="Re: Your inquiry" />
              </div>
              
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  value={replyMessage} 
                  onChange={(e) => setReplyMessage(e.target.value)} 
                  placeholder="Write your reply here..."
                  rows={10}
                  className="resize-none"
                />
              </div>

              {/* Original Message Reference */}
              <div className="bg-stone-50 rounded-lg p-4 border">
                <p className="text-xs font-medium text-stone-500 mb-2">Original Message</p>
                <p className="text-sm text-stone-600 line-clamp-3">{selectedMessage?.message}</p>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
              <Button onClick={handleSendReply} disabled={isSending || !replySubject || !replyMessage} className="bg-amber-600 hover:bg-amber-700">
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSending ? "Sending..." : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
