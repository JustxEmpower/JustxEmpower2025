import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Download, Upload, Trash2, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase, Search, Menu, FormInput, Link as LinkIcon, Code, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';

type Backup = {
  id: number;
  backupName: string;
  backupType: string;
  fileSize: number;
  createdAt: Date;
};

export default function AdminBackup() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupName, setBackupName] = useState("");

  const backupsQuery = trpc.admin.backups.list.useQuery();
  
  const createMutation = trpc.admin.backups.create.useMutation({
    onSuccess: () => {
      toast.success("Backup created successfully");
      backupsQuery.refetch();
      setIsCreateDialogOpen(false);
      setBackupName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create backup");
    },
  });
  
  const restoreMutation = trpc.admin.backups.restore.useMutation({
    onSuccess: () => {
      toast.success("Database restored successfully");
      setIsRestoreDialogOpen(false);
      setSelectedBackup(null);
      // Reload page to reflect restored data
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to restore backup");
    },
  });
  
  const deleteMutation = trpc.admin.backups.delete.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      backupsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete backup");
    },
  });

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error("Please enter a backup name");
      return;
    }
    await createMutation.mutateAsync({ backupName: backupName.trim() });
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    await restoreMutation.mutateAsync({ backupId: selectedBackup.id });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      return;
    }
    await deleteMutation.mutateAsync({ backupId: id });
  };

  const downloadMutation = trpc.admin.backups.download.useQuery(
    { backupId: 0 },
    { enabled: false }
  );

  const handleDownload = async (backup: Backup) => {
    try {
      const result = await downloadMutation.refetch({ backupId: backup.id } as any);
      if (result.data) {
        const blob = new Blob([result.data.backupData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${backup.backupName}-${new Date(backup.createdAt).toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Backup downloaded");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to download backup");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Backup & Restore</h1>
            <p className="text-stone-600">Create backups and restore your database to a previous state</p>
          </div>

          {/* Warning Card */}
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important: Backup Best Practices</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Create regular backups before making major changes</li>
                    <li>Download backups to your local machine for safekeeping</li>
                    <li>Restoring a backup will overwrite all current data</li>
                    <li>Test restores in a development environment when possible</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Database Backups</CardTitle>
                  <CardDescription>Manage your database backups and restore points</CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <Database className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Backup</DialogTitle>
                      <DialogDescription>Create a snapshot of your current database</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="backupName">Backup Name *</Label>
                        <Input
                          id="backupName"
                          value={backupName}
                          onChange={(e) => setBackupName(e.target.value)}
                          placeholder="e.g., Before major update"
                        />
                        <p className="text-xs text-stone-500 mt-1">Give this backup a descriptive name</p>
                      </div>
                      <Button
                        onClick={handleCreateBackup}
                        disabled={createMutation.isPending}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Backup...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Create Backup
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {backupsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                </div>
              ) : !backupsQuery.data || backupsQuery.data.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No backups created yet</p>
                  <p className="text-sm">Click "Create Backup" to create your first backup</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backupsQuery.data.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white"
                    >
                      <Database className="w-8 h-8 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{backup.backupName}</div>
                        <div className="text-sm text-stone-500 mt-1">
                          <span className="px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600 mr-2">
                            {backup.backupType}
                          </span>
                          <span className="mr-2">{formatFileSize(backup.fileSize)}</span>
                          <span>{formatDate(backup.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(backup)}
                          title="Download backup"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setIsRestoreDialogOpen(true);
                          }}
                          title="Restore from this backup"
                        >
                          <Upload className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(backup.id)}
                          title="Delete backup"
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

          {/* Restore Confirmation Dialog */}
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Confirm Database Restore
                </DialogTitle>
                <DialogDescription>
                  This action will restore your database to the state captured in this backup.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedBackup && (
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <p className="font-medium mb-2">Backup Details:</p>
                    <ul className="text-sm space-y-1 text-stone-600">
                      <li><strong>Name:</strong> {selectedBackup.backupName}</li>
                      <li><strong>Created:</strong> {formatDate(selectedBackup.createdAt)}</li>
                      <li><strong>Size:</strong> {formatFileSize(selectedBackup.fileSize)}</li>
                    </ul>
                  </div>
                )}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> All current data will be replaced with the backup data. 
                    This action cannot be undone. Consider creating a backup of your current state first.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRestoreDialogOpen(false);
                      setSelectedBackup(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRestore}
                    disabled={restoreMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {restoreMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Restore Backup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
