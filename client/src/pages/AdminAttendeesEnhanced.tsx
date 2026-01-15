import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { UserCheck, Users, Calendar, Mail, Eye, CheckCircle, XCircle, Clock, Search, RefreshCw, Filter, DollarSign } from "lucide-react";
import { toast } from "sonner";

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
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  waitlisted: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  attended: "bg-teal-100 text-teal-700",
  no_show: "bg-stone-100 text-stone-700",
};

export default function AdminAttendeesEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const eventsQuery = trpc.admin.events.list.useQuery({});
  const registrationsQuery = trpc.admin.events.getRegistrations.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId }
  );

  const updateStatus = trpc.admin.events.updateRegistrationStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); registrationsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (eventsQuery.data?.events?.length && !selectedEventId) {
      setSelectedEventId(eventsQuery.data.events[0].id);
    }
  }, [eventsQuery.data, selectedEventId]);

  const events = eventsQuery.data?.events || [];
  const registrations = registrationsQuery.data?.registrations || [];

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r: any) => {
      const matchesSearch = searchQuery === "" ||
        r.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = registrations.filter((r: any) => r.status === "confirmed").length;
    const pending = registrations.filter((r: any) => r.status === "pending").length;
    const totalRevenue = registrations.reduce((sum: number, r: any) => sum + (r.total || 0), 0);
    return { total: registrations.length, confirmed, pending, totalRevenue };
  }, [registrations]);

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const formatPrice = (cents: number) => cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;

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
                <h1 className="text-2xl font-bold text-stone-900">Attendees</h1>
                <p className="text-stone-500 text-sm">Manage event registrations and attendees</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedEventId?.toString() || ""} onValueChange={(v) => setSelectedEventId(parseInt(v))}>
                  <SelectTrigger className="w-64"><Calendar className="w-4 h-4 mr-2" /><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e: any) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.title} ({e.registrationCount || 0})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => registrationsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Registrations", value: stats.total, icon: Users, color: "amber" },
              { label: "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "emerald" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "blue" },
              { label: "Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "purple", isText: true },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-900`}>
                          {stat.isText ? stat.value : <AnimatedCounter value={stat.value as number} />}
                        </p>
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
              <Input placeholder="Search attendees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees List */}
          {!selectedEventId ? (
            <Card><CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-stone-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an Event</h3>
              <p className="text-stone-500">Choose an event to view its attendees</p>
            </CardContent></Card>
          ) : filteredRegistrations.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-stone-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Attendees</h3>
              <p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "No registrations for this event yet"}</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((reg: any, i: number) => (
                <motion.div key={reg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-stone-600">{reg.firstName?.[0]}{reg.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{reg.firstName} {reg.lastName}</h3>
                          <Badge className={statusColors[reg.status] || "bg-stone-100"}>{reg.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-stone-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{reg.email}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(reg.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">{formatPrice(reg.total || 0)}</p>
                        <p className="text-xs text-stone-500">{reg.quantity} ticket{reg.quantity > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedRegistration(reg)}><Eye className="w-4 h-4" /></Button>
                        <Select value={reg.status} onValueChange={(s) => updateStatus.mutate({ registrationId: reg.id, status: s })}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="attended">Attended</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registration Details</DialogTitle></DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-stone-500">Name</p><p className="font-medium">{selectedRegistration.firstName} {selectedRegistration.lastName}</p></div>
                  <div><p className="text-sm text-stone-500">Email</p><p className="font-medium">{selectedRegistration.email}</p></div>
                  <div><p className="text-sm text-stone-500">Phone</p><p className="font-medium">{selectedRegistration.phone || "N/A"}</p></div>
                  <div><p className="text-sm text-stone-500">Confirmation</p><p className="font-medium">{selectedRegistration.confirmationNumber}</p></div>
                  <div><p className="text-sm text-stone-500">Registered</p><p className="font-medium">{formatDate(selectedRegistration.createdAt)}</p></div>
                  <div><p className="text-sm text-stone-500">Total</p><p className="font-medium">{formatPrice(selectedRegistration.total || 0)}</p></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
