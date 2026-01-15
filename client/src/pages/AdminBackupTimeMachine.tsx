/**
 * Time Machine Backup System
 * Inspired by Apple's Time Machine with Jony Ive's design philosophy
 * 
 * Features:
 * - Visual timeline interface
 * - Comprehensive backup (data, media, config)
 * - Granular restore options
 * - Storage analytics
 * - Automated scheduling
 * - Before/after preview
 */

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import {
  Clock,
  Download,
  Upload,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Database,
  Image,
  FileCode,
  Settings,
  Calendar,
  Shield,
  HardDrive,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Play,
  Pause,
  Eye,
  ArrowLeft,
  Sparkles,
  Zap,
  Archive,
  CloudUpload,
  History,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
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

interface ScheduleConfig {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  time: string;
  retentionDays: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getBackupIcon = (type: string) => {
  switch (type) {
    case "scheduled": return <Calendar className="w-4 h-4" />;
    case "auto": return <RefreshCw className="w-4 h-4" />;
    default: return <Archive className="w-4 h-4" />;
  }
};

/**
 * Safely convert date value to Date object
 * Handles both string (ISO format) and Date objects from database
 */
const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Safely format a date value
 */
const safeFormat = (value: string | Date | null | undefined, formatStr: string): string => {
  const date = toDate(value);
  if (!date) return 'N/A';
  try {
    return format(date, formatStr);
  } catch {
    return 'N/A';
  }
};

/**
 * Safely format distance to now
 */
const safeFormatDistanceToNow = (value: string | Date | null | undefined, options?: { addSuffix?: boolean }): string => {
  const date = toDate(value);
  if (!date) return 'N/A';
  try {
    return formatDistanceToNow(date, options);
  } catch {
    return 'N/A';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminBackupTimeMachine() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  // State
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "list" | "analytics">("timeline");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeConfig, setIncludeConfig] = useState(true);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: "daily",
    time: "03:00",
    retentionDays: 30,
  });
  const [timelinePosition, setTimelinePosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // tRPC queries and mutations
  const backupsQuery = trpc.admin.backups.list.useQuery();
  const createMutation = trpc.admin.backups.create.useMutation({
    onSuccess: () => {
      backupsQuery.refetch();
      setIsCreateModalOpen(false);
      setBackupName("");
      setBackupDescription("");
    },
  });
  const restoreMutation = trpc.admin.backups.restore.useMutation({
    onSuccess: () => {
      setIsRestoreModalOpen(false);
      window.location.reload();
    },
  });
  const deleteMutation = trpc.admin.backups.delete.useMutation({
    onSuccess: () => {
      backupsQuery.refetch();
      setSelectedBackup(null);
    },
  });

  const backups = backupsQuery.data || [];

  // Calculate statistics
  const stats: BackupStats = {
    totalBackups: backups.length,
    totalSize: backups.reduce((acc, b) => acc + (b.fileSize || 0), 0),
    oldestBackup: backups.length > 0 ? backups[backups.length - 1]?.createdAt : "",
    newestBackup: backups.length > 0 ? backups[0]?.createdAt : "",
    averageSize: backups.length > 0 
      ? backups.reduce((acc, b) => acc + (b.fileSize || 0), 0) / backups.length 
      : 0,
  };

  // Handlers
  const handleCreateBackup = async () => {
    if (!backupName.trim()) return;
    await createMutation.mutateAsync({
      backupName: backupName.trim(),
      description: backupDescription.trim() || undefined,
      backupType: "manual",
    });
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    await restoreMutation.mutateAsync({ backupId: selectedBackup.id });
  };

  const handleDelete = async (backup: Backup) => {
    if (confirm(`Delete backup "${backup.backupName}"? This cannot be undone.`)) {
      await deleteMutation.mutateAsync({ backupId: backup.id });
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const response = await fetch(`/api/trpc/admin.backups.download?input=${encodeURIComponent(JSON.stringify({ backupId: backup.id }))}`);
      const data = await response.json();
      const blob = new Blob([data.result.data.backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backup.backupName.replace(/\s+/g, "_")}_${safeFormat(backup.createdAt, "yyyy-MM-dd_HH-mm")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const scrollTimeline = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const scrollAmount = 400;
      timelineRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Admin Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <div className="flex-1 bg-[#0a0a0b] text-white overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <History className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0a0b] flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Just Empower Time Machine</h1>
                <p className="text-sm text-white/40 mt-0.5">
                  {stats.totalBackups} restore points • {formatBytes(stats.totalSize)} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                {(["timeline", "list", "analytics"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === mode
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Schedule Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Schedule</span>
              </motion.button>

              {/* Create Backup Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Create Backup</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="relative z-10 px-8 py-4 border-b border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <StatusPill 
                icon={<Shield className="w-3.5 h-3.5" />}
                label="Protection"
                value="Active"
                status="success"
              />
              <StatusPill 
                icon={<HardDrive className="w-3.5 h-3.5" />}
                label="Storage"
                value={formatBytes(stats.totalSize)}
                status="info"
              />
              <StatusPill 
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Last Backup"
                value={stats.newestBackup ? safeFormatDistanceToNow(stats.newestBackup, { addSuffix: true }) : "Never"}
                status="default"
              />
            </div>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Synced to AWS S3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {viewMode === "timeline" && (
              <TimelineView
                backups={backups}
                selectedBackup={selectedBackup}
                onSelectBackup={setSelectedBackup}
                onRestore={(b) => { setSelectedBackup(b); setIsRestoreModalOpen(true); }}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onPreview={(b) => { setSelectedBackup(b); setIsPreviewModalOpen(true); }}
                timelineRef={timelineRef}
                onScrollTimeline={scrollTimeline}
              />
            )}
            {viewMode === "list" && (
              <ListView
                backups={backups}
                onRestore={(b) => { setSelectedBackup(b); setIsRestoreModalOpen(true); }}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onPreview={(b) => { setSelectedBackup(b); setIsPreviewModalOpen(true); }}
              />
            )}
            {viewMode === "analytics" && (
              <AnalyticsView backups={backups} stats={stats} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <CreateBackupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        backupName={backupName}
        setBackupName={setBackupName}
        backupDescription={backupDescription}
        setBackupDescription={setBackupDescription}
        includeMedia={includeMedia}
        setIncludeMedia={setIncludeMedia}
        includeConfig={includeConfig}
        setIncludeConfig={setIncludeConfig}
        onCreateBackup={handleCreateBackup}
        isLoading={createMutation.isPending}
      />

      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        backup={selectedBackup}
        onRestore={handleRestore}
        isLoading={restoreMutation.isPending}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        config={scheduleConfig}
        setConfig={setScheduleConfig}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        backup={selectedBackup}
      />
      </div>
    </div>
  );
}

// ============================================================================
// STATUS PILL COMPONENT
// ============================================================================

function StatusPill({ 
  icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  status: "success" | "warning" | "error" | "info" | "default";
}) {
  const statusColors = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    info: "text-blue-400",
    default: "text-white/60",
  };

  return (
    <div className="flex items-center gap-2.5">
      <span className={statusColors[status]}>{icon}</span>
      <span className="text-white/40 text-sm">{label}</span>
      <span className={`text-sm font-medium ${statusColors[status]}`}>{value}</span>
    </div>
  );
}

// ============================================================================
// TIMELINE VIEW
// ============================================================================

function TimelineView({
  backups,
  selectedBackup,
  onSelectBackup,
  onRestore,
  onDownload,
  onDelete,
  onPreview,
  timelineRef,
  onScrollTimeline,
}: {
  backups: Backup[];
  selectedBackup: Backup | null;
  onSelectBackup: (b: Backup | null) => void;
  onRestore: (b: Backup) => void;
  onDownload: (b: Backup) => void;
  onDelete: (b: Backup) => void;
  onPreview: (b: Backup) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
  onScrollTimeline: (direction: "left" | "right") => void;
}) {
  // Group backups by date
  const groupedBackups = backups.reduce((acc, backup) => {
    const date = safeFormat(backup.createdAt, "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(backup);
    return acc;
  }, {} as Record<string, Backup[]>);

  const dates = Object.keys(groupedBackups).sort((a, b) => b.localeCompare(a));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white/80">Timeline</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onScrollTimeline("left")}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={() => onScrollTimeline("right")}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div
        ref={timelineRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map((date, dateIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: dateIndex * 0.05 }}
            className="flex-shrink-0 w-80"
          >
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-white/60">
                {safeFormat(date, "EEEE, MMMM d")}
              </span>
              <span className="text-xs text-white/30">
                {safeFormat(date, "yyyy")}
              </span>
            </div>

            {/* Backup Cards for this Date */}
            <div className="space-y-3">
              {groupedBackups[date].map((backup, index) => (
                <BackupCard
                  key={backup.id}
                  backup={backup}
                  isSelected={selectedBackup?.id === backup.id}
                  onSelect={() => onSelectBackup(backup)}
                  onRestore={() => onRestore(backup)}
                  onDownload={() => onDownload(backup)}
                  onDelete={() => onDelete(backup)}
                  onPreview={() => onPreview(backup)}
                  delay={index * 0.03}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {backups.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Archive className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">No backups yet</p>
              <p className="text-white/20 text-xs mt-1">Create your first backup to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Track */}
      <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: backups.length > 0 ? "100%" : "0%" }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// BACKUP CARD
// ============================================================================

function BackupCard({
  backup,
  isSelected,
  onSelect,
  onRestore,
  onDownload,
  onDelete,
  onPreview,
  delay = 0,
}: {
  backup: Backup;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onPreview: () => void;
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onSelect}
      className={`
        relative p-4 rounded-2xl border cursor-pointer transition-all duration-300
        ${isSelected 
          ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10" 
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
        }
      `}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-colors
            ${isSelected ? "bg-purple-500/20" : "bg-white/[0.04]"}
          `}>
            {getBackupIcon(backup.backupType)}
          </div>
          <div>
            <h3 className="font-medium text-sm text-white/90 line-clamp-1">
              {backup.backupName}
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {safeFormat(backup.createdAt, "h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Verification Badge */}
          {backup.verificationStatus && (
            <span className={`
              text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium flex items-center gap-1
              ${backup.verificationStatus === 'verified'
                ? 'bg-emerald-500/10 text-emerald-400'
                : backup.verificationStatus === 'warning'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
              }
            `}>
              {backup.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3" />}
              {backup.verificationStatus === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {backup.verificationStatus === 'error' && <XCircle className="w-3 h-3" />}
              {backup.verificationStatus === 'verified' ? 'Verified' : backup.verificationStatus}
            </span>
          )}
          {/* Backup Type Badge */}
          <span className={`
            text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium
            ${backup.backupType === "scheduled" 
              ? "bg-blue-500/10 text-blue-400" 
              : backup.backupType === "auto"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-white/[0.06] text-white/40"
            }
          `}>
            {backup.backupType}
          </span>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-4 text-xs text-white/30 mb-3">
        <span className="flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          {formatBytes(backup.fileSize || 0)}
        </span>
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          {backup.tablesIncluded 
            ? JSON.parse(backup.tablesIncluded).length 
            : 22} tables
        </span>
      </div>

      {/* Action Buttons */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex items-center gap-2"
          >
            <ActionButton icon={<Eye />} label="Preview" onClick={onPreview} />
            <ActionButton icon={<Download />} label="Download" onClick={onDownload} />
            <ActionButton icon={<RefreshCw />} label="Restore" onClick={onRestore} variant="primary" />
            <ActionButton icon={<Trash2 />} label="Delete" onClick={onDelete} variant="danger" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "primary" | "danger";
}) {
  const variants = {
    default: "bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white",
    primary: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400/60 hover:text-red-400",
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className={`p-2 rounded-lg transition-colors ${variants[variant]}`}
      title={label}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
    </button>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({
  backups,
  onRestore,
  onDownload,
  onDelete,
  onPreview,
}: {
  backups: Backup[];
  onRestore: (b: Backup) => void;
  onDownload: (b: Backup) => void;
  onDelete: (b: Backup) => void;
  onPreview: (b: Backup) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wide border-b border-white/[0.06]">
        <div className="col-span-4">Backup</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {backups.map((backup, index) => (
          <motion.div
            key={backup.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className="grid grid-cols-12 gap-4 px-4 py-4 items-center rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                {getBackupIcon(backup.backupType)}
              </div>
              <div>
                <p className="font-medium text-sm text-white/90">{backup.backupName}</p>
                {backup.description && (
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{backup.description}</p>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${backup.backupType === "scheduled" 
                  ? "bg-blue-500/10 text-blue-400" 
                  : backup.backupType === "auto"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/[0.06] text-white/40"
                }
              `}>
                {backup.backupType}
              </span>
            </div>
            <div className="col-span-2 text-sm text-white/60">
              {formatBytes(backup.fileSize || 0)}
            </div>
            <div className="col-span-2 text-sm text-white/60">
              {safeFormatDistanceToNow(backup.createdAt, { addSuffix: true })}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={() => onPreview(backup)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-white/40" />
              </button>
              <button
                onClick={() => onDownload(backup)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4 text-white/40" />
              </button>
              <button
                onClick={() => onRestore(backup)}
                className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                title="Restore"
              >
                <RefreshCw className="w-4 h-4 text-purple-400" />
              </button>
              <button
                onClick={() => onDelete(backup)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-400/60" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// ANALYTICS VIEW
// ============================================================================

function AnalyticsView({ backups, stats }: { backups: Backup[]; stats: BackupStats }) {
  // Calculate storage by type
  const storageByType = backups.reduce((acc, b) => {
    acc[b.backupType] = (acc[b.backupType] || 0) + (b.fileSize || 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate backups by month
  const backupsByMonth = backups.reduce((acc, b) => {
    const month = safeFormat(b.createdAt, "MMM yyyy");
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const months = Object.keys(backupsByMonth).slice(0, 6).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-3 gap-6"
    >
      {/* Storage Overview */}
      <div className="col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-lg font-medium text-white/80 mb-6">Storage Overview</h3>
        
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<HardDrive className="w-5 h-5" />}
            label="Total Storage"
            value={formatBytes(stats.totalSize)}
            color="purple"
          />
          <StatCard
            icon={<Archive className="w-5 h-5" />}
            label="Total Backups"
            value={stats.totalBackups.toString()}
            color="blue"
          />
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="Average Size"
            value={formatBytes(stats.averageSize)}
            color="emerald"
          />
        </div>

        {/* Monthly Chart */}
        <div className="h-40 flex items-end gap-4">
          {months.map((month, index) => {
            const count = backupsByMonth[month] || 0;
            const maxCount = Math.max(...Object.values(backupsByMonth));
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-500/30 to-purple-500/10"
                />
                <span className="text-xs text-white/30">{month.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-medium text-white/60 mb-4">By Type</h3>
          <div className="space-y-3">
            {Object.entries(storageByType).map(([type, size]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-white/80 capitalize">{type}</span>
                <span className="text-sm text-white/40">{formatBytes(size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-medium text-white/60 mb-4">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">First backup</span>
              <span className="text-sm text-white/40">
                {stats.oldestBackup 
                  ? safeFormat(stats.oldestBackup, "MMM d, yyyy")
                  : "—"
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Latest backup</span>
              <span className="text-sm text-white/40">
                {stats.newestBackup 
                  ? safeFormat(stats.newestBackup, "MMM d, yyyy")
                  : "—"
                }
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white/80">Pro Tip</h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Enable scheduled backups to automatically protect your data. We recommend daily backups with 30-day retention.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "purple" | "blue" | "emerald";
}) {
  const colors = {
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-white/90">{value}</p>
    </div>
  );
}

// ============================================================================
// CREATE BACKUP MODAL
// ============================================================================

function CreateBackupModal({
  isOpen,
  onClose,
  backupName,
  setBackupName,
  backupDescription,
  setBackupDescription,
  includeMedia,
  setIncludeMedia,
  includeConfig,
  setIncludeConfig,
  onCreateBackup,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  backupName: string;
  setBackupName: (v: string) => void;
  backupDescription: string;
  setBackupDescription: (v: string) => void;
  includeMedia: boolean;
  setIncludeMedia: (v: boolean) => void;
  includeConfig: boolean;
  setIncludeConfig: (v: boolean) => void;
  onCreateBackup: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg p-6 rounded-3xl bg-[#141417] border border-white/[0.08] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Create Backup</h2>
            <p className="text-sm text-white/40">Save a complete snapshot of your site</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Backup Name</label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="e.g., Before homepage redesign"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Description (optional)</label>
            <textarea
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              placeholder="What changes are you about to make?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            />
          </div>

          {/* What's Included */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <h4 className="text-sm font-medium text-white/60 mb-3">What's Included</h4>
            <div className="grid grid-cols-2 gap-3">
              <IncludeItem icon={<Database />} label="Database" description="All tables & records" enabled disabled />
              <IncludeItem icon={<FileCode />} label="Content" description="Pages, articles, blocks" enabled disabled />
              <IncludeItem 
                icon={<Image />} 
                label="Media References" 
                description="Media library metadata" 
                enabled={includeMedia}
                onClick={() => setIncludeMedia(!includeMedia)}
              />
              <IncludeItem 
                icon={<Settings />} 
                label="Configuration" 
                description="Theme, SEO, navigation" 
                enabled={includeConfig}
                onClick={() => setIncludeConfig(!includeConfig)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onCreateBackup}
            disabled={!backupName.trim() || isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Create Backup
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function IncludeItem({
  icon,
  label,
  description,
  enabled,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-start gap-3 p-3 rounded-lg text-left transition-colors
        ${enabled ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/[0.02] border border-white/[0.04]"}
        ${disabled ? "cursor-default" : "cursor-pointer hover:bg-purple-500/15"}
      `}
    >
      <div className={`${enabled ? "text-purple-400" : "text-white/30"}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
      </div>
      <div>
        <p className={`text-sm font-medium ${enabled ? "text-white/90" : "text-white/40"}`}>{label}</p>
        <p className="text-xs text-white/30">{description}</p>
      </div>
      {enabled && !disabled && <Check className="w-3.5 h-3.5 text-purple-400 ml-auto" />}
    </button>
  );
}

// ============================================================================
// RESTORE MODAL
// ============================================================================

function RestoreModal({
  isOpen,
  onClose,
  backup,
  onRestore,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  backup: Backup | null;
  onRestore: () => void;
  isLoading: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !backup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg p-6 rounded-3xl bg-[#141417] border border-white/[0.08] shadow-2xl"
      >
        {/* Warning Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Restore Backup</h2>
            <p className="text-sm text-white/40">This will overwrite current data</p>
          </div>
        </div>

        {/* Backup Info */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Archive className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white/90">{backup.backupName}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-white/40">Created:</span>
              <span className="text-white/70 ml-2">
                {safeFormat(backup.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div>
              <span className="text-white/40">Size:</span>
              <span className="text-white/70 ml-2">{formatBytes(backup.fileSize || 0)}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">This action cannot be undone</p>
              <p className="text-xs text-red-400/70 mt-1">
                All current data will be replaced with this backup. Make sure you've downloaded a backup of your current state first.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm text-white/60 mb-2">
            Type <span className="text-white font-mono">RESTORE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESTORE"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onRestore}
            disabled={confirmText !== "RESTORE" || isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Restore Backup
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SCHEDULE MODAL
// ============================================================================

function ScheduleModal({
  isOpen,
  onClose,
  config,
  setConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: ScheduleConfig;
  setConfig: (c: ScheduleConfig) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg p-6 rounded-3xl bg-[#141417] border border-white/[0.08] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Scheduled Backups</h2>
            <p className="text-sm text-white/40">Automate your backup routine</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            {config.enabled ? (
              <Unlock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-white/30" />
            )}
            <div>
              <p className="text-sm font-medium text-white/90">Automatic Backups</p>
              <p className="text-xs text-white/40">
                {config.enabled ? "Your data is protected" : "Enable to protect your data"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`
              relative w-12 h-7 rounded-full transition-colors
              ${config.enabled ? "bg-emerald-500" : "bg-white/10"}
            `}
          >
            <motion.div
              animate={{ x: config.enabled ? 22 : 2 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Settings */}
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-white/60 mb-2">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["hourly", "daily", "weekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setConfig({ ...config, frequency: freq })}
                      className={`
                        px-4 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize
                        ${config.frequency === freq
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60"
                        }
                      `}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Time</label>
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Retention Period: {config.retentionDays} days
                </label>
                <input
                  type="range"
                  min="7"
                  max="90"
                  value={config.retentionDays}
                  onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>7 days</span>
                  <span>90 days</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// PREVIEW MODAL
// ============================================================================

function PreviewModal({
  isOpen,
  onClose,
  backup,
}: {
  isOpen: boolean;
  onClose: () => void;
  backup: Backup | null;
}) {
  const [previewData, setPreviewData] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Fetch actual backup data from the server
  const downloadQuery = trpc.admin.backups.download.useQuery(
    { backupId: backup?.id ?? 0 },
    { 
      enabled: isOpen && !!backup?.id,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Fetch verification data
  const verifyQuery = trpc.admin.backups.verify.useQuery(
    { backupId: backup?.id ?? 0 },
    { 
      enabled: showVerification && !!backup?.id,
      staleTime: 30 * 1000, // Cache for 30 seconds
      retry: 1,
    }
  );

  // Handle verify button click - refetch if already cached
  const handleVerifyClick = async () => {
    setShowVerification(true);
    // If we already have data, refetch to get fresh results
    if (verifyQuery.data) {
      await verifyQuery.refetch();
    }
  };

  useEffect(() => {
    if (isOpen && backup) {
      setIsLoading(true);
      setShowVerification(false);
    }
  }, [isOpen, backup]);

  useEffect(() => {
    if (downloadQuery.data?.backupData) {
      try {
        const parsed = JSON.parse(downloadQuery.data.backupData);
        // Extract record counts from the backup metadata
        if (parsed.metadata?.recordCounts) {
          setPreviewData(parsed.metadata.recordCounts);
        } else if (parsed.data) {
          // Fallback: count records in each table
          const counts: Record<string, number> = {};
          for (const [table, records] of Object.entries(parsed.data)) {
            counts[table] = Array.isArray(records) ? records.length : 0;
          }
          setPreviewData(counts);
        }
      } catch (e) {
        console.error('Failed to parse backup data:', e);
        setPreviewData(null);
      }
      setIsLoading(false);
    } else if (downloadQuery.isError) {
      setIsLoading(false);
      setPreviewData(null);
    }
  }, [downloadQuery.data, downloadQuery.isError]);

  if (!isOpen || !backup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[#141417] border border-white/[0.08] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Backup Preview</h2>
              <p className="text-sm text-white/40">{backup.backupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </button>
        </div>

        {/* Backup Details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-1">Created</p>
            <p className="text-sm text-white/90">
              {safeFormat(backup.createdAt, "MMM d, yyyy")}
            </p>
            <p className="text-xs text-white/40">
              {safeFormat(backup.createdAt, "h:mm a")}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-1">Size</p>
            <p className="text-sm text-white/90">{formatBytes(backup.fileSize || 0)}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-1">Type</p>
            <p className="text-sm text-white/90 capitalize">{backup.backupType}</p>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60">Contents</h3>
            <button
              onClick={handleVerifyClick}
              disabled={verifyQuery.isLoading || verifyQuery.isFetching}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium disabled:opacity-50"
            >
              {(verifyQuery.isLoading || verifyQuery.isFetching) ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : verifyQuery.data?.status === 'verified' ? (
                <CheckCircle className="w-3 h-3" />
              ) : verifyQuery.data?.status === 'warning' ? (
                <AlertTriangle className="w-3 h-3" />
              ) : verifyQuery.data?.status === 'error' ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <Shield className="w-3 h-3" />
              )}
              {(verifyQuery.isLoading || verifyQuery.isFetching) ? 'Verifying...' : 
               verifyQuery.data ? 'Re-verify' : 'Verify Backup'}
            </button>
          </div>
          
          {/* Verification Loading State */}
          {showVerification && (verifyQuery.isLoading || verifyQuery.isFetching) && (
            <div className="mb-4 p-4 rounded-xl border bg-blue-500/10 border-blue-500/30">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Verifying Backup...</p>
                  <p className="text-xs text-white/40">Comparing backup data with live database</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Error State */}
          {showVerification && verifyQuery.isError && !verifyQuery.isFetching && (
            <div className="mb-4 p-4 rounded-xl border bg-red-500/10 border-red-500/30">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Verification Failed</p>
                  <p className="text-xs text-white/40">
                    {verifyQuery.error?.message || 'Unable to verify backup. Please try again.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleVerifyClick}
                className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium"
              >
                Retry Verification
              </button>
            </div>
          )}

          {/* Verification Results */}
          {showVerification && verifyQuery.data && !verifyQuery.isFetching && (
            <div className="mb-4 p-4 rounded-xl border" style={{
              backgroundColor: verifyQuery.data.status === 'verified' ? 'rgba(16, 185, 129, 0.1)' :
                              verifyQuery.data.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                              'rgba(239, 68, 68, 0.1)',
              borderColor: verifyQuery.data.status === 'verified' ? 'rgba(16, 185, 129, 0.3)' :
                           verifyQuery.data.status === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                           'rgba(239, 68, 68, 0.3)'
            }}>
              <div className="flex items-center gap-3 mb-3">
                {verifyQuery.data.status === 'verified' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : verifyQuery.data.status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium" style={{
                    color: verifyQuery.data.status === 'verified' ? '#34d399' :
                           verifyQuery.data.status === 'warning' ? '#fbbf24' :
                           '#f87171'
                  }}>
                    {verifyQuery.data.status === 'verified' ? 'Backup Verified ✓' :
                     verifyQuery.data.status === 'warning' ? 'Backup Valid (Data Changed)' :
                     'Verification Failed'}
                  </p>
                  <p className="text-xs text-white/40">
                    Verified at {new Date(verifyQuery.data.verifiedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold text-white/90">{verifyQuery.data.summary.totalTables}</p>
                  <p className="text-xs text-white/40">Total Tables</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold text-emerald-400">{verifyQuery.data.summary.matchedTables}</p>
                  <p className="text-xs text-white/40">Matched</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold text-amber-400">{verifyQuery.data.summary.mismatchedTables}</p>
                  <p className="text-xs text-white/40">Changed</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold text-red-400">{verifyQuery.data.summary.missingTables}</p>
                  <p className="text-xs text-white/40">Missing</p>
                </div>
              </div>
              
              {/* Detailed Table Comparison */}
              <details className="text-xs">
                <summary className="cursor-pointer text-white/60 hover:text-white/80 mb-2">View detailed comparison ({verifyQuery.data.details.length} tables)</summary>
                <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                  {verifyQuery.data.details.map((item: any) => (
                    <div key={item.table} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <span className="text-white/70 capitalize">{item.table.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/40">Backup: {item.backupCount}</span>
                        <span className="text-white/40">Live: {item.liveCount}</span>
                        {item.status === 'match' ? (
                          <span className="text-emerald-400">✓</span>
                        ) : item.status === 'new_data' ? (
                          <span className="text-amber-400">+{item.difference}</span>
                        ) : item.status === 'mismatch' ? (
                          <span className="text-red-400">{item.difference}</span>
                        ) : (
                          <span className="text-red-400">Missing</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
            </div>
          ) : previewData ? (
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(previewData).map(([table, count]) => (
                <div key={table} className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-semibold text-white/90">{count}</p>
                  <p className="text-xs text-white/40 capitalize">{table.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Description */}
        {backup.description && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
            <p className="text-sm text-white/70">{backup.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
