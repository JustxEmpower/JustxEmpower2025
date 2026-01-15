import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from '@/components/AdminSidebar';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CalendarDays,
  MapPin,
  Users,
  RefreshCw,
  Search,
  Clock,
  DollarSign,
  Video,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  List,
  LayoutGrid,
  Filter,
} from "lucide-react";

// Animated counter component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminEventsEnhanced() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    eventType: "workshop" as "workshop" | "retreat" | "webinar" | "meetup" | "conference" | "other",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    locationType: "in_person" as "in_person" | "virtual" | "hybrid",
    venue: "",
    address: "",
    city: "",
    state: "",
    country: "",
    virtualUrl: "",
    isFree: false,
    price: "",
    capacity: "",
    featuredImage: "",
    status: "draft" as "draft" | "published" | "cancelled" | "completed",
  });

  const eventsQuery = trpc.admin.events.list.useQuery({});
  
  const createEvent = trpc.admin.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully");
      setIsCreateOpen(false);
      resetForm();
      eventsQuery.refetch();
    },
    onError: (error) => toast.error("Error creating event: " + error.message),
  });
  
  const updateEvent = trpc.admin.events.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully");
      setEditingEvent(null);
      resetForm();
      eventsQuery.refetch();
    },
    onError: (error) => toast.error("Error updating event: " + error.message),
  });
  
  const deleteEvent = trpc.admin.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
      eventsQuery.refetch();
    },
    onError: (error) => toast.error("Error deleting event: " + error.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const events = eventsQuery.data?.events || [];

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return events.filter((event: any) => {
      const matchesSearch = searchQuery === "" ||
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e: any) => new Date(e.startDate) > now && e.status === "published").length;
    const totalRegistrations = events.reduce((sum: number, e: any) => sum + (e.registrationCount || 0), 0);
    const totalRevenue = events.reduce((sum: number, e: any) => {
      if (e.isFree) return sum;
      return sum + ((e.registrationCount || 0) * (e.price || 0));
    }, 0);
    const published = events.filter((e: any) => e.status === "published").length;
    return { total: events.length, upcoming, totalRegistrations, totalRevenue, published };
  }, [events]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((e: any) => {
      const eventDate = new Date(e.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const resetForm = () => {
    setFormData({
      title: "", slug: "", description: "", shortDescription: "",
      eventType: "workshop", startDate: "", startTime: "", endDate: "", endTime: "",
      locationType: "in_person", venue: "", address: "", city: "", state: "", country: "",
      virtualUrl: "", isFree: false, price: "", capacity: "", featuredImage: "", status: "draft",
    });
  };

  const handleSubmit = () => {
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime || "00:00"}`);
    const endDateTime = formData.endDate ? new Date(`${formData.endDate}T${formData.endTime || "23:59"}`) : undefined;
    const data = {
      title: formData.title,
      slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      eventType: formData.eventType,
      startDate: startDateTime,
      endDate: endDateTime,
      locationType: formData.locationType,
      venue: formData.venue || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      country: formData.country || undefined,
      virtualUrl: formData.virtualUrl || undefined,
      isFree: formData.isFree ? 1 : 0,
      price: formData.isFree ? 0 : Math.round(parseFloat(formData.price || "0") * 100),
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      featuredImage: formData.featuredImage || undefined,
      status: formData.status,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...data });
    } else {
      createEvent.mutate(data);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    setFormData({
      title: event.title, slug: event.slug,
      description: event.description || "", shortDescription: event.shortDescription || "",
      eventType: event.eventType,
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : "",
      locationType: event.locationType,
      venue: event.venue || "", address: event.address || "",
      city: event.city || "", state: event.state || "", country: event.country || "",
      virtualUrl: event.virtualUrl || "",
      isFree: event.isFree === 1,
      price: event.price ? String(event.price / 100) : "",
      capacity: event.capacity ? String(event.capacity) : "",
      featuredImage: event.featuredImage || "",
      status: event.status,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent.mutate({ id });
    }
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "draft": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "completed": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-stone-100 text-stone-700";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "workshop": return "bg-amber-500";
      case "retreat": return "bg-emerald-500";
      case "webinar": return "bg-blue-500";
      case "meetup": return "bg-purple-500";
      case "conference": return "bg-pink-500";
      default: return "bg-stone-500";
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

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Events</h1>
                <p className="text-stone-500 text-sm">Manage workshops, retreats, and gatherings</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => eventsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isCreateOpen || !!editingEvent} onOpenChange={(open) => {
                  if (!open) { setIsCreateOpen(false); setEditingEvent(null); resetForm(); }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
                      <DialogDescription>
                        {editingEvent ? "Update the event details below." : "Fill in the details to create a new event."}
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="location">Location</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Event Title</Label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter event title" />
                          </div>
                          <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="event-slug" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Event Type</Label>
                            <Select value={formData.eventType} onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="workshop">Workshop</SelectItem>
                                <SelectItem value="retreat">Retreat</SelectItem>
                                <SelectItem value="webinar">Webinar</SelectItem>
                                <SelectItem value="meetup">Meetup</SelectItem>
                                <SelectItem value="conference">Conference</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Short Description</Label>
                          <Textarea value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Full Description</Label>
                          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                            <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Featured Image URL</Label>
                          <Input value={formData.featuredImage} onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })} placeholder="https://..." />
                        </div>
                      </TabsContent>
                      <TabsContent value="location" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Location Type</Label>
                          <Select value={formData.locationType} onValueChange={(value: any) => setFormData({ ...formData, locationType: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_person">In Person</SelectItem>
                              <SelectItem value="virtual">Virtual</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(formData.locationType === "in_person" || formData.locationType === "hybrid") && (
                          <>
                            <div className="space-y-2">
                              <Label>Venue Name</Label>
                              <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Address</Label>
                              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>State</Label>
                                <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Country</Label>
                                <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                              </div>
                            </div>
                          </>
                        )}
                        {(formData.locationType === "virtual" || formData.locationType === "hybrid") && (
                          <div className="space-y-2">
                            <Label>Virtual Meeting URL</Label>
                            <Input value={formData.virtualUrl} onChange={(e) => setFormData({ ...formData, virtualUrl: e.target.value })} placeholder="https://zoom.us/..." />
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="pricing" className="space-y-4 mt-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="isFree" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="rounded" />
                          <Label htmlFor="isFree">This is a free event</Label>
                        </div>
                        {!formData.isFree && (
                          <div className="space-y-2">
                            <Label>Price ($)</Label>
                            <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="49.99" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Capacity (leave empty for unlimited)</Label>
                          <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="50" />
                        </div>
                      </TabsContent>
                    </Tabs>
                    <DialogFooter className="mt-6">
                      <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingEvent(null); resetForm(); }}>Cancel</Button>
                      <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending} className="bg-amber-600 hover:bg-amber-700">
                        {editingEvent ? "Update" : "Create"} Event
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Total Events</p>
                      <p className="text-3xl font-bold text-amber-900"><AnimatedCounter value={stats.total} /></p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Upcoming</p>
                      <p className="text-3xl font-bold text-emerald-900"><AnimatedCounter value={stats.upcoming} /></p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Registrations</p>
                      <p className="text-3xl font-bold text-blue-900"><AnimatedCounter value={stats.totalRegistrations} /></p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Revenue</p>
                      <p className="text-3xl font-bold text-purple-900"><AnimatedCounter value={stats.totalRevenue / 100} prefix="$" /></p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button variant={viewMode === "calendar" ? "default" : "outline"} size="sm" onClick={() => setViewMode("calendar")}>
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>

          {/* Content */}
          {eventsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
            </div>
          ) : viewMode === "calendar" ? (
            /* Calendar View */
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-stone-500 py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, i) => {
                    if (!date) return <div key={i} className="min-h-[100px] bg-stone-50 rounded" />;
                    const dayEvents = getEventsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={`min-h-[100px] p-2 border rounded-lg ${isToday ? "ring-2 ring-amber-500 bg-amber-50" : "bg-white"}`}>
                        <div className={`text-right text-sm mb-1 ${isToday ? "font-bold text-amber-600" : "text-stone-600"}`}>{date.getDate()}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event: any) => (
                            <button key={event.id} onClick={() => handleEdit(event)} className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate text-white ${getEventTypeColor(event.eventType)}`}>
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 2 && <p className="text-xs text-stone-500 px-1">+{dayEvents.length - 2} more</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="w-12 h-12 text-stone-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-stone-500 mb-4">{searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first event to get started"}</p>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* List View */
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4">
                {filteredEvents.map((event: any, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-20 h-20 bg-stone-100 rounded-xl flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
                          {event.featuredImage ? (
                            <img src={event.featuredImage} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <span className="text-xs text-stone-500 uppercase">{new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}</span>
                              <span className="text-2xl font-bold text-stone-700">{new Date(event.startDate).getDate()}</span>
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-900 truncate">{event.title}</h3>
                            <Badge className={`${getEventTypeColor(event.eventType)} text-white text-xs`}>{event.eventType}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {formatDate(event.startDate)} at {formatTime(event.startDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              {event.locationType === "virtual" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                              {event.locationType === "virtual" ? "Virtual" : event.venue || event.city || "TBD"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-stone-900">{event.isFree ? "Free" : `$${(event.price / 100).toFixed(2)}`}</p>
                          <p className="text-sm text-stone-500 flex items-center gap-1 justify-end">
                            <Users className="w-3 h-3" />
                            {event.registrationCount || 0}{event.capacity ? `/${event.capacity}` : ""} registered
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
