import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventCalendar from '@/components/EventCalendar';
import { Link } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';
import AutoplayVideo from '@/components/AutoplayVideo';
import {
  Calendar,
  List,
  MapPin,
  Clock,
  Users,
  Video,
  ArrowRight,
  CalendarDays,
  Filter,
} from 'lucide-react';

// Event type colors
const eventTypeColors: Record<string, { bg: string; text: string }> = {
  workshop: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-800 dark:text-amber-300' },
  retreat: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-800 dark:text-emerald-300' },
  webinar: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300' },
  meetup: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300' },
  conference: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-800 dark:text-pink-300' },
  other: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
};

interface CommunityEventsProps {
  slug?: string;
}

export default function CommunityEvents({ slug = 'community-events' }: CommunityEventsProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  
  // Get hero content from CMS - use dynamic slug
  const { getContent, getInlineStyles, isLoading: contentLoading } = usePageContent(slug);
  
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Get overview content from CMS
  const overviewTitle = getContent('overview', 'title');
  const overviewParagraph1 = getContent('overview', 'paragraph1');
  const overviewParagraph2 = getContent('overview', 'paragraph2');
  
  // Determine which media to use (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;
  
  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Fetch events for list view
  const eventsQuery = trpc.events.list.useQuery({
    status: statusFilter,
    limit: 20,
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Hero Section - Now reads from CMS */}
      <section className="relative overflow-hidden text-white py-20">
        {/* Background Media */}
        <div className="absolute inset-0">
          {heroMediaUrl && isVideo ? (
            <AutoplayVideo
              src={getProperMediaUrl(heroMediaUrl)}
              className="w-full h-full object-cover"
            />
          ) : heroMediaUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-6" style={getInlineStyles('hero', 'title')}>{heroTitle}</h1>
            <p className="text-xl text-white/70 mb-8" style={getInlineStyles('hero', 'subtitle')}>
              {heroSubtitle}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
              >
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {viewMode === 'calendar' ? (
          /* Calendar View */
          <EventCalendar showFilters={true} linkToDetail={true} />
        ) : (
          /* List View */
          <div className="space-y-6">
            {/* Status Filter Tabs */}
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="all">All Events</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Events List */}
            {eventsQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : eventsQuery.data?.events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'upcoming' 
                      ? 'Check back soon for upcoming events'
                      : 'No events to display'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventsQuery.data?.events.map((event) => {
                  const colors = eventTypeColors[event.eventType] || eventTypeColors.other;
                  
                  return (
                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Event Image */}
                      {event.featuredImage && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={event.featuredImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className={`${colors.bg} ${colors.text}`}>
                              {event.eventType}
                            </Badge>
                          </div>
                          {event.isFree === 1 && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500 text-white">Free</Badge>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CardHeader className={event.featuredImage ? 'pt-4' : ''}>
                        {!event.featuredImage && (
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${colors.bg} ${colors.text}`}>
                              {event.eventType}
                            </Badge>
                            {event.isFree === 1 && (
                              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">Free</Badge>
                            )}
                          </div>
                        )}
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        {event.shortDescription && (
                          <CardDescription className="line-clamp-2">
                            {event.shortDescription}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(event.startDate)}</span>
                          <span>•</span>
                          <span>{formatTime(event.startDate)}</span>
                        </div>
                        
                        {/* Location */}
                        {(event.venue || event.city || event.locationType === 'virtual') && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {event.locationType === 'virtual' ? (
                              <>
                                <Video className="w-4 h-4" />
                                <span>Virtual Event</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4" />
                                <span>{event.venue || event.city}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Capacity */}
                        {event.capacity && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>
                              {event.spotsRemaining !== null 
                                ? `${event.spotsRemaining} spots left`
                                : `${event.capacity} capacity`
                              }
                            </span>
                          </div>
                        )}
                        
                        {/* Price & CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          {event.isFree !== 1 && (
                            <span className="font-semibold text-foreground">
                              {event.formattedPrice}
                            </span>
                          )}
                          {event.isFree === 1 && <span />}
                          <Link href={`/events/${event.slug}`}>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                              {event.isPast ? 'View Details' : 'Register'}
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Load More */}
            {eventsQuery.data?.hasMore && (
              <div className="text-center pt-6">
                <Button variant="outline" size="lg">
                  Load More Events
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-stone-100 dark:bg-stone-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif text-foreground mb-4">
            Want to host an event with us?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We're always looking for collaborators and partners to create meaningful experiences for our community.
          </p>
          <Link href="/contact">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
