import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminSidebar from '@/components/AdminSidebar';
import {
  LogOut,
  FileText,
  Settings,
  Layout,
  FolderOpen,
  Palette,
  BarChart3,
  Files,
  ShoppingBag,
  Calendar,
  Plus,
  Edit,
  Trash2,
  CalendarDays,
  MapPin,
  Users,
  ClipboardList,
} from "lucide-react";

export default function AdminEvents() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
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
  const registrationsQuery = trpc.admin.events.getRegistrations.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId }
  );
  
  const createEvent = trpc.admin.events.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully");
      setIsCreateOpen(false);
      resetForm();
      eventsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Error creating event: " + error.message);
    },
  });
  
  const updateEvent = trpc.admin.events.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully");
      setEditingEvent(null);
      resetForm();
      eventsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Error updating event: " + error.message);
    },
  });
  
  const deleteEvent = trpc.admin.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
      eventsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Error deleting event: " + error.message);
    },
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      eventType: "workshop",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      locationType: "in_person",
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
      status: "draft",
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
      title: event.title,
      slug: event.slug,
      description: event.description || "",
      shortDescription: event.shortDescription || "",
      eventType: event.eventType,
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : "",
      locationType: event.locationType,
      venue: event.venue || "",
      address: event.address || "",
      city: event.city || "",
      state: event.state || "",
      country: event.country || "",
      virtualUrl: event.virtualUrl || "",
      isFree: event.isFree === 1,
      price: event.price ? String(event.price / 100) : "",
      capacity: event.capacity ? String(event.capacity) : "",
      featuredImage: event.featuredImage || "",
      status: event.status,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this event? This will also delete all registrations.")) {
      deleteEvent.mutate({ id });
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const events = eventsQuery.data?.events || [];

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Events</h1>
              <p className="text-neutral-500 mt-1">Manage workshops, retreats, and gatherings</p>
            </div>
            <Dialog open={isCreateOpen || !!editingEvent} onOpenChange={(open) => {
              if (!open) {
                setIsCreateOpen(false);
                setEditingEvent(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateOpen(true)}>
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
                    <TabsTrigger value="pricing">Pricing & Capacity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Enter event title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="event-slug"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventType">Event Type</Label>
                        <Select value={formData.eventType} onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
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
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
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
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        placeholder="Brief description for listings"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Full Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed event description"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date (Optional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="featuredImage">Featured Image URL</Label>
                      <Input
                        id="featuredImage"
                        value={formData.featuredImage}
                        onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="location" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationType">Location Type</Label>
                      <Select value={formData.locationType} onValueChange={(value: any) => setFormData({ ...formData, locationType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
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
                          <Label htmlFor="venue">Venue Name</Label>
                          <Input
                            id="venue"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            placeholder="Venue name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Street address"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </>
                    )}
                    {(formData.locationType === "virtual" || formData.locationType === "hybrid") && (
                      <div className="space-y-2">
                        <Label htmlFor="virtualUrl">Virtual Meeting URL</Label>
                        <Input
                          id="virtualUrl"
                          value={formData.virtualUrl}
                          onChange={(e) => setFormData({ ...formData, virtualUrl: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFree"
                        checked={formData.isFree}
                        onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                        className="rounded border-neutral-300"
                      />
                      <Label htmlFor="isFree">This is a free event</Label>
                    </div>
                    {!formData.isFree && (
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="49.99"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity (leave empty for unlimited)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingEvent(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending}>
                    {editingEvent ? "Update" : "Create"} Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {eventsQuery.isLoading ? (
            <div className="text-center py-12">Loading events...</div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="w-12 h-12 text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No events yet</h3>
                <p className="text-neutral-500 mb-4">Create your first event to get started</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event: any) => (
                <Card key={event.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden">
                      {event.featuredImage ? (
                        <img src={event.featuredImage} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <span className="text-xs text-neutral-500 uppercase">
                            {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-2xl font-bold">
                            {new Date(event.startDate).getDate()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(event.startDate)} at {formatTime(event.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.locationType === "virtual" ? "Virtual" : event.venue || event.city || "TBD"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {event.isFree ? "Free" : `$${(event.price / 100).toFixed(2)}`}
                      </p>
                      <p className="text-sm text-neutral-500 flex items-center gap-1 justify-end">
                        <Users className="w-3 h-3" />
                        {event.registrationCount || 0}{event.capacity ? `/${event.capacity}` : ""} registered
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        event.status === "draft" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        event.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}>
                        {event.status}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
