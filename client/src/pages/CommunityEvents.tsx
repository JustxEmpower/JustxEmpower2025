import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventCalendar from '@/components/EventCalendar';
import { Link } from 'wouter';
import { usePageSectionContent, getProperMediaUrl } from '@/hooks/usePageSectionContent';
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
  const { sections, getSection, getField, isLoading: contentLoading } = usePageSectionContent('community-events');
  const getContent = (section: string, field: string) => getField(section, field) || '';
  const getInlineStyles = () => ({});
  
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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section - Apple-inspired minimal design */}
      <section className="relative overflow-hidden py-32 md:py-40">
        {/* Background Media */}
        <div className="absolute inset-0">
          {/* Default gradient background (always present as fallback) */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-stone-100 to-white dark:from-stone-900 dark:to-[#0a0a0a]" />
          
          {heroMediaUrl && isVideo && (
            <AutoplayVideo
              key={heroMediaUrl}
              src={getProperMediaUrl(heroMediaUrl)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {heroMediaUrl && !isVideo && (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
            />
          )}
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight"
            style={getInlineStyles('hero', 'title')}
          >
            {heroTitle || 'Community Events'}
          </h1>
          <p 
            className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light tracking-wide"
            style={getInlineStyles('hero', 'subtitle')}
          >
            {heroSubtitle}
          </p>
          {/* Apple-style pill toggle */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-full p-1.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                viewMode === 'calendar' 
                  ? 'bg-white text-stone-900 shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-white text-stone-900 shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 py-16 md:py-24">
        {viewMode === 'calendar' ? (
          /* Calendar View */
          <EventCalendar showFilters={true} linkToDetail={true} />
        ) : (
          /* List View - Apple-style */
          <div className="space-y-12">
            {/* Status Filter - Apple-style pill tabs */}
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-stone-100 dark:bg-stone-800/50 rounded-full p-1">
                {(['upcoming', 'past', 'all'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      statusFilter === status 
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' 
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                  >
                    {status === 'upcoming' ? 'Upcoming' : status === 'past' ? 'Past' : 'All Events'}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            {eventsQuery.isLoading ? (
              <div className="text-center py-20">
                <p className="text-stone-400 dark:text-stone-500">Loading events...</p>
              </div>
            ) : eventsQuery.data?.events.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 dark:bg-stone-900/30 rounded-3xl">
                <CalendarDays className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-4" />
                <h3 className="text-lg font-medium text-stone-900 dark:text-white mb-2">No events found</h3>
                <p className="text-stone-400 dark:text-stone-500">
                  {statusFilter === 'upcoming' 
                    ? 'Check back soon for upcoming events'
                    : 'No events to display'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {eventsQuery.data?.events.map((event) => {
                  const colors = eventTypeColors[event.eventType] || eventTypeColors.other;
                  
                  return (
                    <div 
                      key={event.id} 
                      className="group bg-stone-50 dark:bg-stone-900/30 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                    >
                      {/* Event Image */}
                      {event.featuredImage && (
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={event.featuredImage}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-white/90 font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                              {event.eventType}
                            </span>
                            {event.isFree === 1 && (
                              <span className="text-xs uppercase tracking-wider text-white font-medium bg-emerald-500/80 backdrop-blur-sm px-3 py-1 rounded-full">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6">
                        {!event.featuredImage && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                              {event.eventType}
                            </span>
                            {event.isFree === 1 && (
                              <span className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">• Free</span>
                            )}
                          </div>
                        )}
                        <h3 className="text-xl font-medium text-stone-900 dark:text-white mb-3 leading-snug line-clamp-2">
                          {event.title}
                        </h3>
                        {event.shortDescription && (
                          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed line-clamp-2 mb-5">
                            {event.shortDescription}
                          </p>
                        )}
                        
                        {/* Event Meta */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(event.startDate)} • {formatTime(event.startDate)}</span>
                          </div>
                          
                          {(event.venue || event.city || event.locationType === 'virtual') && (
                            <div className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
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
                          
                          {event.capacity && (
                            <div className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
                              <Users className="w-4 h-4" />
                              <span>
                                {event.spotsRemaining !== null 
                                  ? `${event.spotsRemaining} spots left`
                                  : `${event.capacity} capacity`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Price & CTA */}
                        <div className="flex items-center justify-between pt-5 border-t border-stone-200 dark:border-stone-700">
                          <span className="font-medium text-stone-900 dark:text-white">
                            {event.isFree === 1 ? 'Free' : event.formattedPrice}
                          </span>
                          <Link href={`/events/${event.slug}`}>
                            <button className="flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                              {event.isPast ? 'View Details' : 'Register'}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Load More */}
            {eventsQuery.data?.hasMore && (
              <div className="text-center pt-8">
                <button className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors">
                  Load More Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA Section - Apple-style */}
      <section className="bg-stone-50 dark:bg-stone-900/50 py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mb-4">Collaborate</p>
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-white mb-6">
            Want to host an event with us?
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mb-10 text-lg font-light leading-relaxed">
            We're always looking for collaborators and partners to create meaningful experiences for our community.
          </p>
          <Link href="/contact">
            <button className="px-8 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors">
              Get in Touch
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
