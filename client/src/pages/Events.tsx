import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, DollarSign } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";

interface EventsProps {
  slug?: string;
}

export default function Events({ slug = 'events' }: EventsProps) {
  const [location] = useLocation();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  
  // Get hero content from CMS - use dynamic slug
  const { getContent, isLoading: contentLoading } = usePageContent(slug);
  
  const { data: upcomingData, isLoading: loadingUpcoming } = trpc.events.list.useQuery({
    status: "upcoming",
    limit: 20,
  });
  
  const { data: pastData, isLoading: loadingPast } = trpc.events.list.useQuery({
    status: "past",
    limit: 20,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const upcomingEvents = upcomingData?.events || [];
  const pastEvents = pastData?.events || [];
  const isLoading = tab === "upcoming" ? loadingUpcoming : loadingPast;
  const events = tab === "upcoming" ? upcomingEvents : pastEvents;

  // Get hero content from CMS with fallbacks
  const heroTitle = getContent('hero', 'title') || 'Events';
  const heroSubtitle = getContent('hero', 'subtitle') || '';
  const heroDescription = getContent('hero', 'description') || 'Join us for transformative experiences designed to empower and inspire your journey.';

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-black to-stone-900">
        <div className="container mx-auto px-4 text-center">
          {heroSubtitle && (
            <p className="text-sm uppercase tracking-widest text-white/60 mb-4">{heroSubtitle}</p>
          )}
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">{heroTitle}</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Events Tabs */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "upcoming" | "past")}>
            <TabsList className="mb-8">
              <TabsTrigger value="upcoming">
                Upcoming Events
                {upcomingEvents.length > 0 && (
                  <Badge className="ml-2" variant="secondary">{upcomingEvents.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {isLoading ? (
                <EventsLoading />
              ) : events.length === 0 ? (
                <EmptyState message="No upcoming events at the moment. Check back soon!" />
              ) : (
                <EventsGrid events={events} isPast={false} />
              )}
            </TabsContent>

            <TabsContent value="past">
              {isLoading ? (
                <EventsLoading />
              ) : events.length === 0 ? (
                <EmptyState message="No past events to display." />
              ) : (
                <EventsGrid events={events} isPast={true} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EventsGrid({ events, isPast }: { events: any[]; isPast: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isPast={isPast} />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EventCard({ event, isPast }: { event: any; isPast: boolean }) {
  const isFree = event.isFree === 1 || event.price === 0;
  const isSoldOut = event.spotsRemaining !== null && event.spotsRemaining <= 0;
  const location = event.venue || event.city || (event.locationType === "virtual" ? "Online" : "TBA");

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {event.featuredImage ? (
            <img
              src={event.featuredImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {isPast && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white/90">Event Ended</Badge>
            </div>
          )}
          {!isPast && isSoldOut && (
            <Badge className="absolute top-2 right-2 bg-red-500">Sold Out</Badge>
          )}
          {!isPast && isFree && (
            <Badge className="absolute top-2 left-2 bg-green-500">Free</Badge>
          )}
          {event.locationType === "virtual" && (
            <Badge className="absolute top-2 left-2 bg-blue-500">Virtual</Badge>
          )}
        </div>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
          
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{event.formattedPrice}</span>
            </div>
            {event.capacity && !isPast && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {event.spotsRemaining !== null ? `${event.spotsRemaining} spots left` : `${event.capacity} capacity`}
                </span>
              </div>
            )}
          </div>

          {!isPast && (
            <Button className="w-full mt-4" disabled={isSoldOut}>
              {isSoldOut ? "Sold Out" : isFree ? "Register Free" : "Register Now"}
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function EventsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-video" />
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium text-foreground mb-2">No Events</h3>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
