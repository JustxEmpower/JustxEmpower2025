import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Trash2, Loader2, Shield, Search, RefreshCw, Filter, Edit, Crown, Eye, UserCheck } from "lucide-react";
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

const ROLES = [
  { value: "super_admin", label: "Super Admin", color: "bg-purple-100 text-purple-700" },
  { value: "admin", label: "Admin", color: "bg-blue-100 text-blue-700" },
  { value: "editor", label: "Editor", color: "bg-emerald-100 text-emerald-700" },
  { value: "viewer", label: "Viewer", color: "bg-stone-100 text-stone-700" },
];

export default function AdminUsersEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "editor" });

  const usersQuery = trpc.admin.users.list.useQuery();
  const createMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => { toast.success("User created"); usersQuery.refetch(); setIsCreateDialogOpen(false); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => { toast.success("User updated"); usersQuery.refetch(); setSelectedUser(null); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => { toast.success("User deleted"); usersQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const users = usersQuery.data || [];
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchesSearch = searchQuery === "" || u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u: any) => u.role === "admin" || u.role === "super_admin").length,
    editors: users.filter((u: any) => u.role === "editor").length,
    viewers: users.filter((u: any) => u.role === "viewer").length,
  }), [users]);

  const resetForm = () => setFormData({ username: "", email: "", password: "", role: "editor" });
  const handleEdit = (user: any) => { setSelectedUser(user); setFormData({ username: user.username, email: user.email || "", password: "", role: user.role }); };
  const handleSubmit = () => {
    if (!formData.username) { toast.error("Username required"); return; }
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, ...formData, password: formData.password || undefined });
    } else {
      if (!formData.password) { toast.error("Password required"); return; }
      createMutation.mutate(formData);
    }
  };
  const getRoleColor = (role: string) => ROLES.find(r => r.value === role)?.color || "bg-stone-100 text-stone-700";

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
              <div><h1 className="text-2xl font-bold text-stone-900">Users</h1><p className="text-stone-500 text-sm">Manage admin users and permissions</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700"><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ label: "Total Users", value: stats.total, icon: Users, color: "amber" }, { label: "Admins", value: stats.admins, icon: Crown, color: "purple" }, { label: "Editors", value: stats.editors, icon: Edit, color: "emerald" }, { label: "Viewers", value: stats.viewers, icon: Eye, color: "blue" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
          </div>

          {filteredUsers.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Users Found</h3><p className="text-stone-500">{searchQuery || roleFilter !== "all" ? "Try adjusting filters" : "Add your first admin user"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user: any, i: number) => (
                <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0"><span className="text-lg font-bold text-amber-700">{user.username?.[0]?.toUpperCase()}</span></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold">{user.username}</h3><Badge className={getRoleColor(user.role)}>{user.role}</Badge></div>
                        <p className="text-sm text-stone-500">{user.email || "No email"}</p>
                        <p className="text-xs text-stone-400">Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete user?")) deleteMutation.mutate({ id: user.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateDialogOpen || !!selectedUser} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); setSelectedUser(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Username</Label><Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>{selectedUser ? "New Password (leave blank to keep)" : "Password"}</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setSelectedUser(null); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">{selectedUser ? "Update" : "Create"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
