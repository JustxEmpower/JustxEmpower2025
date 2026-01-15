import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from '@/components/AdminSidebar';
import { UserCheck, Users, Calendar, Mail, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  waitlisted: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  attended: "bg-emerald-100 text-emerald-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default function AdminAttendees() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  // Fetch all events
  const eventsQuery = trpc.admin.events.list.useQuery({});
  
  // Fetch registrations for selected event
  const registrationsQuery = trpc.admin.events.getRegistrations.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId }
  );

  // Update registration status mutation
  const updateStatus = trpc.admin.events.updateRegistrationStatus.useMutation({
    onSuccess: () => {
      toast.success("Registration status updated");
      registrationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  // Auto-select first event with registrations
  useEffect(() => {
    if (eventsQuery.data?.events && eventsQuery.data.events.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsQuery.data.events[0].id);
    }
  }, [eventsQuery.data, selectedEventId]);

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
  const registrations = registrationsQuery.data?.registrations || [];
  const totalRegistrations = registrationsQuery.data?.total || 0;

  // Calculate stats
  const confirmedCount = registrations.filter(r => r.status === "confirmed").length;
  const pendingCount = registrations.filter(r => r.status === "pending").length;
  const upcomingEventsWithRegs = events.filter(e => 
    new Date(e.startDate) > new Date() && (e.registrationCount || 0) > 0
  ).length;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number) => {
    return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <AdminSidebar variant="light" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Attendees</h1>
              <p className="text-neutral-500 mt-1">Manage event registrations and attendees</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRegistrations}</div>
                <p className="text-xs text-muted-foreground">For selected event</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedCount}</div>
                <p className="text-xs text-muted-foreground">Confirmed registrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingEventsWithRegs}</div>
                <p className="text-xs text-muted-foreground">With registrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
          </div>

          {/* Event Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEventId?.toString() || ""}
                onValueChange={(value) => setSelectedEventId(parseInt(value))}
              >
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Select an event to view registrations" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title} ({event.registrationCount || 0} registrations)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Registrations Table */}
          {selectedEventId ? (
            registrations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Confirmation #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg: any) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-mono text-sm">{reg.confirmationNumber}</TableCell>
                          <TableCell>{reg.firstName} {reg.lastName}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.quantity}</TableCell>
                          <TableCell>{formatPrice(reg.total)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[reg.status] || "bg-gray-100"}>
                              {reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {formatDate(reg.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRegistration(reg)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {reg.status !== "confirmed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ id: reg.id, status: "confirmed" })}
                                  title="Confirm"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              {reg.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ id: reg.id, status: "cancelled" })}
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Registrations Yet</h3>
                  <p className="text-neutral-500">
                    No one has registered for this event yet. Registrations will appear here once people sign up.
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Event</h3>
                <p className="text-neutral-500">
                  Choose an event from the dropdown above to view its registrations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Registration Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Confirmation #</p>
                  <p className="font-mono">{selectedRegistration.confirmationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Status</p>
                  <Badge className={statusColors[selectedRegistration.status]}>
                    {selectedRegistration.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Name</p>
                <p>{selectedRegistration.firstName} {selectedRegistration.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p>{selectedRegistration.email}</p>
              </div>
              {selectedRegistration.phone && (
                <div>
                  <p className="text-sm text-neutral-500">Phone</p>
                  <p>{selectedRegistration.phone}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Quantity</p>
                  <p>{selectedRegistration.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total Paid</p>
                  <p className="font-semibold">{formatPrice(selectedRegistration.total)}</p>
                </div>
              </div>
              {selectedRegistration.dietaryRestrictions && (
                <div>
                  <p className="text-sm text-neutral-500">Dietary Restrictions</p>
                  <p>{selectedRegistration.dietaryRestrictions}</p>
                </div>
              )}
              {selectedRegistration.specialRequests && (
                <div>
                  <p className="text-sm text-neutral-500">Special Requests</p>
                  <p>{selectedRegistration.specialRequests}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-neutral-500">Registered On</p>
                <p>{formatDate(selectedRegistration.createdAt)}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Select
                  value={selectedRegistration.status}
                  onValueChange={(value) => {
                    updateStatus.mutate({ id: selectedRegistration.id, status: value as any });
                    setSelectedRegistration({ ...selectedRegistration, status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
