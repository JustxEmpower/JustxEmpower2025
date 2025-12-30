import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Eye, Trash2, Archive, Reply, Clock, User, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';
import { format } from "date-fns";

type ContactSubmission = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  notes: string | null;
  createdAt: Date;
  repliedAt: Date | null;
};

const statusColors: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  read: "bg-blue-100 text-blue-800 border-blue-200",
  replied: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <AlertCircle className="w-3 h-3" />,
  read: <Eye className="w-3 h-3" />,
  replied: <CheckCircle className="w-3 h-3" />,
  archived: <Archive className="w-3 h-3" />,
};

export default function AdminContactMessages() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch contact submissions
  const submissionsQuery = trpc.contact.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    limit: 100,
  });

  // Mutations
  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      submissionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const deleteMutation = trpc.contact.delete.useMutation({
    onSuccess: () => {
      toast.success("Message deleted");
      submissionsQuery.refetch();
      setIsViewDialogOpen(false);
      setSelectedMessage(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete message");
    },
  });

  const handleViewMessage = (submission: ContactSubmission) => {
    setSelectedMessage(submission);
    setNotes(submission.notes || "");
    setIsViewDialogOpen(true);
    
    // Mark as read if new
    if (submission.status === "new") {
      updateStatusMutation.mutate({
        id: submission.id,
        status: "read",
      });
    }
  };

  const handleUpdateStatus = (status: "new" | "read" | "replied" | "archived") => {
    if (!selectedMessage) return;
    updateStatusMutation.mutate({
      id: selectedMessage.id,
      status,
      notes: notes || undefined,
    });
    setSelectedMessage({ ...selectedMessage, status });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    deleteMutation.mutate({ id });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/admin/login');
    return null;
  }

  const submissions = submissionsQuery.data || [];
  const newCount = submissions.filter(s => s.status === "new").length;

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-amber-600" />
              <h1 className="text-4xl font-serif text-stone-900">Contact Messages</h1>
              {newCount > 0 && (
                <Badge className="bg-amber-600 text-white">{newCount} new</Badge>
              )}
            </div>
            <p className="text-stone-600">View and manage contact form submissions</p>
          </div>

          {/* Info Card */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Contact Form Submissions</p>
                  <p className="text-blue-600 text-sm">
                    Messages submitted through the contact form on your website appear here. 
                    You can mark them as read, replied, or archived for organization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label>Filter by status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages Table */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {submissions.length} message{submissions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsQuery.isLoading ? (
                <div className="text-center py-8 text-stone-500">Loading messages...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow 
                        key={submission.id}
                        className={submission.status === "new" ? "bg-amber-50/50" : ""}
                      >
                        <TableCell>
                          <Badge className={`${statusColors[submission.status]} flex items-center gap-1 w-fit`}>
                            {statusIcons[submission.status]}
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{submission.firstName} {submission.lastName}</p>
                            <p className="text-sm text-stone-500">{submission.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate">{submission.subject}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-stone-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(submission.createdAt), "MMM d, yyyy h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMessage(submission)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(submission.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Message Details
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedMessage && format(new Date(selectedMessage.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6 mt-4">
              {/* Sender Info */}
              <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg">
                <User className="w-10 h-10 p-2 bg-stone-200 rounded-full text-stone-600" />
                <div>
                  <p className="font-medium text-lg">{selectedMessage.firstName} {selectedMessage.lastName}</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-amber-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                <Badge className={`${statusColors[selectedMessage.status]} ml-auto`}>
                  {selectedMessage.status}
                </Badge>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-stone-500">Subject</Label>
                <p className="font-medium text-lg">{selectedMessage.subject}</p>
              </div>

              {/* Message */}
              <div>
                <Label className="text-stone-500">Message</Label>
                <div className="mt-2 p-4 bg-stone-50 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("read")}
                  disabled={selectedMessage.status === "read"}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Mark Read
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("replied")}
                  className="text-green-600 hover:text-green-700"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Mark Replied
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("archived")}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="ml-auto"
                >
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
