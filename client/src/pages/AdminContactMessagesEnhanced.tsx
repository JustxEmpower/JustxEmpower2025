import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Eye, Trash2, Archive, Reply, Clock, User, MessageSquare, AlertCircle, CheckCircle, Search, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import AdminSidebar from '@/components/AdminSidebar';

function AnimatedCounter({ value }: { value: number }) {
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
  return <span>{displayValue.toLocaleString()}</span>;
}

const statusColors: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-blue-100 text-blue-700",
  replied: "bg-emerald-100 text-emerald-700",
  archived: "bg-stone-100 text-stone-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <AlertCircle className="w-3 h-3" />,
  read: <Eye className="w-3 h-3" />,
  replied: <CheckCircle className="w-3 h-3" />,
  archived: <Archive className="w-3 h-3" />,
};

export default function AdminContactMessagesEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const submissionsQuery = trpc.contact.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 100,
  });

  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); submissionsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.contact.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); submissionsQuery.refetch(); setIsViewDialogOpen(false); setSelectedMessage(null); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation('/admin/login');
  }, [isAuthenticated, isChecking, setLocation]);

  const submissions = submissionsQuery.data || [];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s: any) => {
      const matchesSearch = searchQuery === "" ||
        s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [submissions, searchQuery]);

  const stats = useMemo(() => ({
    total: submissions.length,
    new: submissions.filter((s: any) => s.status === "new").length,
    read: submissions.filter((s: any) => s.status === "read").length,
    replied: submissions.filter((s: any) => s.status === "replied").length,
  }), [submissions]);

  const handleViewMessage = (submission: any) => {
    setSelectedMessage(submission);
    setNotes(submission.notes || "");
    setIsViewDialogOpen(true);
    if (submission.status === "new") {
      updateStatusMutation.mutate({ id: submission.id, status: "read" });
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedMessage) return;
    updateStatusMutation.mutate({ id: selectedMessage.id, status: status as any, notes: notes || undefined });
    setSelectedMessage({ ...selectedMessage, status });
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

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
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Contact Messages</h1>
                <p className="text-stone-500 text-sm">Manage contact form submissions</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => submissionsQuery.refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Messages", value: stats.total, icon: MessageSquare, color: "amber" },
              { label: "New", value: stats.new, icon: AlertCircle, color: "red" },
              { label: "Read", value: stats.read, icon: Eye, color: "blue" },
              { label: "Replied", value: stats.replied, icon: CheckCircle, color: "emerald" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-stone-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Messages</h3>
                <p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "No contact messages yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((msg: any, i: number) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`hover:shadow-md transition-shadow cursor-pointer ${msg.status === "new" ? "border-l-4 border-l-amber-500" : ""}`} onClick={() => handleViewMessage(msg)}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-stone-600">{msg.firstName?.[0]}{msg.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{msg.firstName} {msg.lastName}</h3>
                          <Badge className={statusColors[msg.status] || "bg-stone-100"}>
                            {statusIcons[msg.status]} {msg.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-stone-700 truncate">{msg.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{msg.email}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(msg.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewMessage(msg); }}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteMutation.mutate({ id: msg.id }); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Message Details</DialogTitle></DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-stone-500">From</p><p className="font-medium">{selectedMessage.firstName} {selectedMessage.lastName}</p></div>
                  <div><p className="text-sm text-stone-500">Email</p><p className="font-medium">{selectedMessage.email}</p></div>
                  <div><p className="text-sm text-stone-500">Subject</p><p className="font-medium">{selectedMessage.subject}</p></div>
                  <div><p className="text-sm text-stone-500">Received</p><p className="font-medium">{formatDate(selectedMessage.createdAt)}</p></div>
                </div>
                <div>
                  <p className="text-sm text-stone-500 mb-2">Message</p>
                  <div className="bg-stone-50 rounded-lg p-4 text-stone-700 whitespace-pre-wrap">{selectedMessage.message}</div>
                </div>
                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this message..." rows={3} />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Update Status:</Label>
                  <Select value={selectedMessage.status} onValueChange={handleUpdateStatus}>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              <Button onClick={() => window.open(`mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`, "_blank")} className="bg-amber-600 hover:bg-amber-700">
                <Reply className="w-4 h-4 mr-2" />Reply via Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
