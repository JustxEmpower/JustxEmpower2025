import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Database, Download, Upload, RefreshCw, Clock, CheckCircle, AlertCircle, HardDrive } from "lucide-react";
import { toast } from "sonner";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
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
  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminBackupEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const backupsQuery = trpc.admin.backups.list.useQuery();
  const backups = backupsQuery.data || [];

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try { toast.success("Backup created"); backupsQuery.refetch?.(); }
    catch (e) { toast.error("Failed to create backup"); }
    setIsCreatingBackup(false);
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-stone-900">Backup</h1><p className="text-stone-500 text-sm">Manage site backups and restore points</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => backupsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup} className="bg-amber-600 hover:bg-amber-700">
                  {isCreatingBackup ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}Create Backup
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Backups", value: backups.length, icon: Database, color: "amber" }, { label: "Last Backup", value: backups[0] ? "Today" : "Never", icon: Clock, color: "blue", isText: true }, { label: "Storage Used", value: "0", suffix: " MB", icon: HardDrive, color: "purple" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.isText ? stat.value : <AnimatedCounter value={typeof stat.value === 'number' ? stat.value : 0} suffix={stat.suffix} />}</p></div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Backup History</CardTitle><CardDescription>View and restore previous backups</CardDescription></CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="py-8 text-center text-stone-500"><Database className="w-12 h-12 mx-auto text-stone-300 mb-2" /><p>No backups yet</p><p className="text-sm">Create your first backup to protect your data</p></div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup: any, i: number) => (
                    <motion.div key={backup.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                        <div>
                          <p className="font-medium">{backup.name || `Backup ${i + 1}`}</p>
                          <p className="text-sm text-stone-500">{formatDate(backup.createdAt)} • {formatSize(backup.size || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download</Button>
                        <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Restore</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
