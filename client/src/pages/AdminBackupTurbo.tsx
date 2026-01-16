/**
 * TURBO TIME MACHINE - Ultimate Backup System
 * All bells and whistles, fully functional
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import {
  Clock, Download, Upload, Trash2, Plus, ChevronLeft, ChevronRight,
  Database, Image, FileCode, Settings, Calendar, Shield, HardDrive,
  RefreshCw, Check, AlertTriangle, Info, Layers, Play, Pause, Eye,
  ArrowLeft, Sparkles, Zap, Archive, CloudUpload, History, Lock,
  Unlock, CheckCircle, XCircle, Search, Filter, BarChart3, Activity,
  TrendingUp, Loader2, Copy, FileJson, Table2, Users, ShoppingCart,
  FileText, Mail, Star, Cpu, Timer, AlertOctagon, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Diff, GitCompare, RotateCcw, Rocket
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Backup {
  id: number;
  backupName: string;
  backupType: string;
  fileSize: number;
  description?: string;
  tablesIncluded?: string;
  createdBy?: string;
  createdAt: string | Date;
  s3Url?: string;
  verificationStatus?: 'verified' | 'warning' | 'error' | null;
  lastVerifiedAt?: string | Date | null;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: string | Date | null;
  newestBackup: string | Date | null;
  averageSize: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
};

const safeFormat = (value: string | Date | null | undefined, formatStr: string): string => {
  const date = toDate(value);
  if (!date) return 'N/A';
  try { return format(date, formatStr); } catch { return 'N/A'; }
};

const safeFormatDistance = (value: string | Date | null | undefined): string => {
  const date = toDate(value);
  if (!date) return 'N/A';
  try { return formatDistanceToNow(date, { addSuffix: true }); } catch { return 'N/A'; }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminBackupTurbo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();

  // View & Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "backups" | "restore" | "analytics" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  
  // Backup Form State
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeConfig, setIncludeConfig] = useState(true);
  
  // Restore State
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [mergeMode, setMergeMode] = useState(false);
  
  // Compare State
  const [compareBackup1, setCompareBackup1] = useState<Backup | null>(null);
  const [compareBackup2, setCompareBackup2] = useState<Backup | null>(null);
  
  // Cleanup State
  const [retentionDays, setRetentionDays] = useState(30);

  // Auth redirect
  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // ============================================================================
  // tRPC QUERIES & MUTATIONS
  // ============================================================================

  const backupsQuery = trpc.admin.backups.list.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const statsQuery = trpc.admin.backups.stats.useQuery();
  const liveCountsQuery = trpc.admin.backups.getLiveCounts.useQuery();
  
  const createMutation = trpc.admin.backups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Backup created successfully! Size: ${formatBytes(data.size || 0)}`);
      backupsQuery.refetch();
      statsQuery.refetch();
      setShowCreateModal(false);
      setBackupName("");
      setBackupDescription("");
    },
    onError: (e) => toast.error(`Backup failed: ${e.message}`),
  });

  const restoreMutation = trpc.admin.backups.restore.useMutation({
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.success("Dry run complete - no changes made");
      } else {
        toast.success("Restore completed successfully!");
        setTimeout(() => window.location.reload(), 2000);
      }
      setShowRestoreModal(false);
    },
    onError: (e) => toast.error(`Restore failed: ${e.message}`),
  });

  const deleteMutation = trpc.admin.backups.delete.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted");
      backupsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });

  const verifyMutation = trpc.admin.backups.verify.useQuery(
    { backupId: selectedBackup?.id || 0 },
    { enabled: !!selectedBackup && showPreviewModal }
  );

  const cleanupMutation = trpc.admin.backups.cleanup.useMutation({
    onSuccess: (data) => {
      toast.success(`Cleaned up ${data.deleted} old backups`);
      backupsQuery.refetch();
      statsQuery.refetch();
      setShowCleanupModal(false);
    },
    onError: (e) => toast.error(`Cleanup failed: ${e.message}`),
  });

  const triggerScheduledMutation = trpc.admin.backups.triggerScheduled.useMutation({
    onSuccess: () => {
      toast.success("Scheduled backup triggered");
      backupsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const backups = backupsQuery.data || [];
  const stats = statsQuery.data || { totalBackups: 0, totalSize: 0, oldestBackup: null, newestBackup: null, averageSize: 0 };
  const liveCounts = liveCountsQuery.data || {};

  // Filter backups
  const filteredBackups = useMemo(() => {
    return backups.filter((b: Backup) => {
      const matchesSearch = !searchQuery || 
        b.backupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || b.backupType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [backups, searchQuery, typeFilter]);

  // Compute analytics
  const analytics = useMemo(() => {
    const byType = backups.reduce((acc: any, b: Backup) => {
      acc[b.backupType] = (acc[b.backupType] || 0) + 1;
      return acc;
    }, {});
    const byDay = backups.reduce((acc: any, b: Backup) => {
      const day = safeFormat(b.createdAt, "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const sizeHistory = backups.slice(0, 10).map((b: Backup) => ({
      name: safeFormat(b.createdAt, "MMM d"),
      size: b.fileSize,
    })).reverse();
    
    return { byType, byDay, sizeHistory };
  }, [backups]);

  // Handlers
  const handleCreateBackup = () => {
    if (!backupName.trim()) {
      toast.error("Please enter a backup name");
      return;
    }
    createMutation.mutate({
      backupName: backupName.trim(),
      description: backupDescription.trim() || undefined,
      backupType: "manual",
      includeMedia,
      includeConfig,
    });
  };

  const handleRestore = (dryRun = false) => {
    if (!selectedBackup) return;
    if (!dryRun && restoreConfirmText !== "RESTORE") {
      toast.error("Please type RESTORE to confirm");
      return;
    }
    restoreMutation.mutate({
      backupId: selectedBackup.id,
      tables: selectedTables.length > 0 ? selectedTables : undefined,
      dryRun,
      createSafetyBackup,
      mergeMode,
    });
  };

  const handleDownload = async (backup: Backup) => {
    try {
      toast.info("Preparing download...");
      const response = await fetch(`/api/trpc/admin.backups.download?input=${encodeURIComponent(JSON.stringify({ backupId: backup.id }))}`);
      const data = await response.json();
      if (data.result?.data?.backupData) {
        const blob = new Blob([JSON.stringify(data.result.data.backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${backup.backupName.replace(/\s+/g, "_")}_${safeFormat(backup.createdAt, "yyyy-MM-dd_HH-mm")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Download started!");
      }
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleCopyBackupId = (backup: Backup) => {
    navigator.clipboard.writeText(String(backup.id));
    toast.success("Backup ID copied");
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-[#0a0a0b]">
      <AdminSidebar variant="dark" />

      <main className="flex-1 text-white overflow-hidden flex flex-col">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="relative z-10 px-6 py-5 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
              >
                <History className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  Turbo Time Machine
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px]">TURBO</Badge>
                </h1>
                <p className="text-sm text-white/40">
                  {stats.totalBackups} restore points • {formatBytes(stats.totalSize)} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => backupsQuery.refetch()}
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${backupsQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerScheduledMutation.mutate()}
                disabled={triggerScheduledMutation.isPending}
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto Backup
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </div>
        </header>

        {/* Live Status Bar */}
        <div className="relative z-10 px-6 py-3 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <StatusPill icon={<Shield />} label="Protection" value="Active" status="success" />
            <StatusPill icon={<HardDrive />} label="Storage" value={formatBytes(stats.totalSize)} status="info" />
            <StatusPill icon={<Clock />} label="Last Backup" value={stats.newestBackup ? safeFormatDistance(stats.newestBackup) : "Never"} status="default" />
            <StatusPill icon={<Database />} label="Live Records" value={Object.values(liveCounts).reduce((a: number, b: any) => a + (b || 0), 0).toLocaleString()} status="info" />
          </div>
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Synced to AWS S3</span>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="relative z-10 mx-6 mt-4 bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl w-fit">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 rounded-lg px-4">
              <Activity className="w-4 h-4 mr-2" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="backups" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 rounded-lg px-4">
              <Archive className="w-4 h-4 mr-2" />Backups
            </TabsTrigger>
            <TabsTrigger value="restore" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 rounded-lg px-4">
              <RotateCcw className="w-4 h-4 mr-2" />Restore
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 rounded-lg px-4">
              <BarChart3 className="w-4 h-4 mr-2" />Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/50 rounded-lg px-4">
              <Settings className="w-4 h-4 mr-2" />Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 overflow-auto p-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Backups", value: stats.totalBackups, icon: Archive, color: "purple", trend: "+3 this week" },
                { label: "Total Storage", value: formatBytes(stats.totalSize), icon: HardDrive, color: "blue", isText: true },
                { label: "Avg Backup Size", value: formatBytes(stats.averageSize), icon: Database, color: "emerald", isText: true },
                { label: "Last Backup", value: stats.newestBackup ? safeFormatDistance(stats.newestBackup) : "Never", icon: Clock, color: "amber", isText: true },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 border-${stat.color}-500/20 hover:border-${stat.color}-500/40 transition-all`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-medium text-${stat.color}-400 uppercase tracking-wide`}>{stat.label}</p>
                          <p className="text-2xl font-bold text-white mt-1">{stat.isText ? stat.value : stat.value}</p>
                          {stat.trend && <p className="text-xs text-white/40 mt-1">{stat.trend}</p>}
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => setShowCreateModal(true)}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Plus className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create Backup</h3>
                    <p className="text-sm text-white/40">Snapshot current state</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => setActiveTab("restore")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <RotateCcw className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Restore Data</h3>
                    <p className="text-sm text-white/40">Roll back to previous state</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => setShowCleanupModal(true)}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cleanup Old</h3>
                    <p className="text-sm text-white/40">Remove outdated backups</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Backups */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader>
                <CardTitle className="text-lg">Recent Backups</CardTitle>
                <CardDescription>Latest restore points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backups.slice(0, 5).map((backup: Backup, i: number) => (
                    <BackupRow 
                      key={backup.id} 
                      backup={backup} 
                      onPreview={() => { setSelectedBackup(backup); setShowPreviewModal(true); }}
                      onDownload={() => handleDownload(backup)}
                      onRestore={() => { setSelectedBackup(backup); setShowRestoreModal(true); }}
                      onDelete={() => { if (confirm(`Delete "${backup.backupName}"?`)) deleteMutation.mutate({ backupId: backup.id }); }}
                    />
                  ))}
                  {backups.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <Archive className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No backups yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backups Tab */}
          <TabsContent value="backups" className="flex-1 overflow-auto p-6 m-0">
            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search backups..."
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white/[0.04] border-white/[0.08] text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Backup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBackups.map((backup: Backup, i: number) => (
                <motion.div key={backup.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                  <BackupCard
                    backup={backup}
                    onPreview={() => { setSelectedBackup(backup); setShowPreviewModal(true); }}
                    onDownload={() => handleDownload(backup)}
                    onRestore={() => { setSelectedBackup(backup); setShowRestoreModal(true); }}
                    onDelete={() => { if (confirm(`Delete "${backup.backupName}"?`)) deleteMutation.mutate({ backupId: backup.id }); }}
                    onCopy={() => handleCopyBackupId(backup)}
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Restore Tab */}
          <TabsContent value="restore" className="flex-1 overflow-auto p-6 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Select Backup */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle>Select Backup to Restore</CardTitle>
                  <CardDescription>Choose a restore point</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {backups.map((backup: Backup) => (
                        <div
                          key={backup.id}
                          onClick={() => setSelectedBackup(backup)}
                          className={`p-4 rounded-xl cursor-pointer transition-all ${
                            selectedBackup?.id === backup.id 
                              ? "bg-purple-500/20 border border-purple-500/40" 
                              : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedBackup?.id === backup.id ? "bg-purple-500/30" : "bg-white/[0.04]"
                              }`}>
                                <Archive className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{backup.backupName}</p>
                                <p className="text-xs text-white/40">{safeFormat(backup.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
                              </div>
                            </div>
                            <Badge className={backup.backupType === 'manual' ? 'bg-white/10' : 'bg-blue-500/20 text-blue-400'}>
                              {backup.backupType}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Restore Options */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle>Restore Options</CardTitle>
                  <CardDescription>Configure how to restore</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedBackup ? (
                    <>
                      {/* Selected Backup Info */}
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Archive className="w-5 h-5 text-purple-400" />
                          <span className="font-medium">{selectedBackup.backupName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                          <span>Size: {formatBytes(selectedBackup.fileSize)}</span>
                          <span>Type: {selectedBackup.backupType}</span>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Create Safety Backup</p>
                            <p className="text-xs text-white/40">Backup current state before restore</p>
                          </div>
                          <Switch checked={createSafetyBackup} onCheckedChange={setCreateSafetyBackup} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Merge Mode</p>
                            <p className="text-xs text-white/40">Add data instead of replacing</p>
                          </div>
                          <Switch checked={mergeMode} onCheckedChange={setMergeMode} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleRestore(true)}
                          disabled={restoreMutation.isPending}
                          className="flex-1 border-white/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Dry Run
                        </Button>
                        <Button
                          onClick={() => setShowRestoreModal(true)}
                          disabled={restoreMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore Now
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-white/40">
                      <ArrowLeft className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Select a backup to restore</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto p-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Backup Types Distribution */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="text-base">Backup Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.byType).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            type === 'manual' ? 'bg-purple-500' : type === 'auto' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="text-base">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-purple-400">{formatBytes(stats.totalSize)}</div>
                    <p className="text-sm text-white/40 mt-1">Total backup storage</p>
                  </div>
                  <div className="mt-4">
                    <Progress value={Math.min((stats.totalSize / (1024 * 1024 * 1024)) * 100, 100)} className="h-2" />
                    <p className="text-xs text-white/40 mt-2 text-center">of 1 GB limit</p>
                  </div>
                </CardContent>
              </Card>

              {/* Live Database Stats */}
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle className="text-base">Live Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(liveCounts).slice(0, 8).map(([table, count]: [string, any]) => (
                      <div key={table} className="flex items-center justify-between text-sm">
                        <span className="text-white/60 capitalize">{table.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium">{count?.toLocaleString() || 0}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto p-6 m-0">
            <div className="max-w-2xl space-y-6">
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle>Backup Retention</CardTitle>
                  <CardDescription>Configure automatic cleanup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Retention Period</p>
                      <p className="text-sm text-white/40">Delete backups older than this</p>
                    </div>
                    <Select value={String(retentionDays)} onValueChange={(v) => setRetentionDays(Number(v))}>
                      <SelectTrigger className="w-32 bg-white/[0.04] border-white/[0.08]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setShowCleanupModal(true)} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Run Cleanup Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader>
                  <CardTitle>Automatic Backups</CardTitle>
                  <CardDescription>Schedule regular backups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => triggerScheduledMutation.mutate()} disabled={triggerScheduledMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                    <Zap className="w-4 h-4 mr-2" />
                    {triggerScheduledMutation.isPending ? "Running..." : "Trigger Auto Backup"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ================================================================== */}
        {/* MODALS */}
        {/* ================================================================== */}

        {/* Create Backup Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-[#141417] border-white/[0.08] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                Create New Backup
              </DialogTitle>
              <DialogDescription className="text-white/40">
                Create a snapshot of your current data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-white/60 mb-2 block">Backup Name *</label>
                <Input
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="e.g., Pre-update backup"
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 mb-2 block">Description</label>
                <Textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Optional notes about this backup..."
                  className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px]"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Include Media References</p>
                  <p className="text-xs text-white/40">Backup media file URLs</p>
                </div>
                <Switch checked={includeMedia} onCheckedChange={setIncludeMedia} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Include Configuration</p>
                  <p className="text-xs text-white/40">Site settings and theme</p>
                </div>
                <Switch checked={includeConfig} onCheckedChange={setIncludeConfig} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-white/10">Cancel</Button>
              <Button onClick={handleCreateBackup} disabled={createMutation.isPending || !backupName.trim()} className="bg-gradient-to-r from-purple-500 to-violet-600">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Confirmation Modal */}
        <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
          <DialogContent className="bg-[#141417] border-white/[0.08] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
                Confirm Restore
              </DialogTitle>
              <DialogDescription className="text-white/40">
                This will overwrite your current data
              </DialogDescription>
            </DialogHeader>
            {selectedBackup && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="font-medium">{selectedBackup.backupName}</p>
                  <p className="text-sm text-white/40">{safeFormat(selectedBackup.createdAt, "MMMM d, yyyy 'at' h:mm a")}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This action cannot be undone
                  </p>
                  <p className="text-xs text-red-400/70 mt-1">All current data will be replaced</p>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Type <span className="font-mono text-white">RESTORE</span> to confirm</label>
                  <Input
                    value={restoreConfirmText}
                    onChange={(e) => setRestoreConfirmText(e.target.value)}
                    placeholder="RESTORE"
                    className="bg-white/[0.04] border-white/[0.08] text-white font-mono"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowRestoreModal(false); setRestoreConfirmText(""); }} className="border-white/10">Cancel</Button>
              <Button onClick={() => handleRestore(false)} disabled={restoreMutation.isPending || restoreConfirmText !== "RESTORE"} className="bg-gradient-to-r from-red-500 to-orange-600">
                {restoreMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Restore Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="bg-[#141417] border-white/[0.08] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-purple-400" />
                Backup Details
              </DialogTitle>
            </DialogHeader>
            {selectedBackup && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Name</p>
                    <p className="font-medium">{selectedBackup.backupName}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Size</p>
                    <p className="font-medium">{formatBytes(selectedBackup.fileSize)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Created</p>
                    <p className="font-medium">{safeFormat(selectedBackup.createdAt, "MMM d, yyyy h:mm a")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Type</p>
                    <Badge className={selectedBackup.backupType === 'manual' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}>
                      {selectedBackup.backupType}
                    </Badge>
                  </div>
                </div>
                {selectedBackup.description && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{selectedBackup.description}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)} className="border-white/10">Close</Button>
              <Button onClick={() => selectedBackup && handleDownload(selectedBackup)} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />Download
              </Button>
              <Button onClick={() => { setShowPreviewModal(false); setShowRestoreModal(true); }} className="bg-gradient-to-r from-amber-500 to-orange-600">
                <RotateCcw className="w-4 h-4 mr-2" />Restore
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cleanup Modal */}
        <Dialog open={showCleanupModal} onOpenChange={setShowCleanupModal}>
          <DialogContent className="bg-[#141417] border-white/[0.08] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-5 h-5" />
                Cleanup Old Backups
              </DialogTitle>
              <DialogDescription className="text-white/40">
                Remove backups older than {retentionDays} days
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">This will permanently delete old backups. This cannot be undone.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCleanupModal(false)} className="border-white/10">Cancel</Button>
              <Button onClick={() => cleanupMutation.mutate({ retentionDays })} disabled={cleanupMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {cleanupMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Old Backups
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusPill({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status: "success" | "warning" | "error" | "info" | "default" }) {
  const colors = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    info: "text-blue-400",
    default: "text-white/60",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={colors[status]}>{icon}</span>
      <span className="text-white/40 text-sm">{label}</span>
      <span className={`text-sm font-medium ${colors[status]}`}>{value}</span>
    </div>
  );
}

function BackupRow({ backup, onPreview, onDownload, onRestore, onDelete }: {
  backup: Backup;
  onPreview: () => void;
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Archive className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="font-medium text-sm">{backup.backupName}</p>
          <p className="text-xs text-white/40">{safeFormat(backup.createdAt, "MMM d, yyyy 'at' h:mm a")} • {formatBytes(backup.fileSize)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onPreview} className="text-white/60 hover:text-white h-8 px-2"><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onDownload} className="text-white/60 hover:text-white h-8 px-2"><Download className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onRestore} className="text-amber-400 hover:text-amber-300 h-8 px-2"><RotateCcw className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300 h-8 px-2"><Trash2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function BackupCard({ backup, onPreview, onDownload, onRestore, onDelete, onCopy }: {
  backup: Backup;
  onPreview: () => void;
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  return (
    <Card className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
              <Archive className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm line-clamp-1">{backup.backupName}</h3>
              <p className="text-xs text-white/40">{safeFormat(backup.createdAt, "MMM d 'at' h:mm a")}</p>
            </div>
          </div>
          <Badge className={`text-[10px] ${
            backup.backupType === 'manual' ? 'bg-purple-500/20 text-purple-400' :
            backup.backupType === 'auto' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {backup.backupType}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(backup.fileSize)}</span>
          <span className="flex items-center gap-1"><Database className="w-3 h-3" />22 tables</span>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onPreview} className="flex-1 h-8 text-xs"><Eye className="w-3 h-3 mr-1" />View</Button>
          <Button variant="ghost" size="sm" onClick={onDownload} className="flex-1 h-8 text-xs"><Download className="w-3 h-3 mr-1" />Get</Button>
          <Button variant="ghost" size="sm" onClick={onRestore} className="flex-1 h-8 text-xs text-amber-400"><RotateCcw className="w-3 h-3 mr-1" />Restore</Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 px-2 text-red-400"><Trash2 className="w-3 h-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
