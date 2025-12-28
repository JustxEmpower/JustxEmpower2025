import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  Video,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Link } from 'wouter';

interface EventCalendarProps {
  onEventClick?: (event: any) => void;
  showFilters?: boolean;
  linkToDetail?: boolean;
}

// Event type colors
const eventTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  workshop: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  retreat: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  webinar: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  meetup: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  conference: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EventCalendar({ 
  onEventClick, 
  showFilters = true,
  linkToDetail = true 
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Get the first and last day of the current month view (including padding days)
  const { startDate, endDate, days } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday of the first week
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    
    // End on the Saturday of the last week
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));
    
    // Generate all days in the view
    const daysArray: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      daysArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days: daysArray,
    };
  }, [currentDate]);

  // Fetch events for the current view
  const eventsQuery = trpc.events.calendar.useQuery({
    startDate,
    endDate,
    eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
  });

  // Fetch event types for filter
  const eventTypesQuery = trpc.events.eventTypes.useQuery();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    eventsQuery.data?.forEach(event => {
      const dateKey = new Date(event.startDate).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [eventsQuery.data]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
  };

  const toggleEventType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200">
      {/* Calendar Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-stone-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={selectedTypes.length > 0 ? 'border-amber-500 text-amber-700' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {selectedTypes.length > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{selectedTypes.length}</Badge>
              )}
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="mt-4 p-4 bg-stone-50 rounded-lg">
            <p className="text-sm font-medium text-stone-700 mb-3">Event Types</p>
            <div className="flex flex-wrap gap-3">
              {eventTypesQuery.data?.map(type => (
                <label 
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleEventType(type.value)}
                  />
                  <span 
                    className={`px-2 py-1 rounded text-sm ${eventTypeColors[type.value]?.bg} ${eventTypeColors[type.value]?.text}`}
                  >
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setSelectedTypes([])}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(day => (
            <div 
              key={day} 
              className="text-center text-sm font-medium text-stone-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const dateKey = date.toDateString();
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isInCurrentMonth = isCurrentMonth(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border rounded-lg transition-colors ${
                  isInCurrentMonth 
                    ? 'bg-white border-stone-200' 
                    : 'bg-stone-50 border-stone-100'
                } ${isTodayDate ? 'ring-2 ring-amber-500' : ''}`}
              >
                <div className={`text-right text-sm mb-1 ${
                  isInCurrentMonth ? 'text-stone-900' : 'text-stone-400'
                } ${isTodayDate ? 'font-bold text-amber-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = eventTypeColors[event.eventType] || eventTypeColors.other;
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-stone-500 px-1">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Legend */}
      <div className="px-4 pb-4 border-t border-stone-100 pt-4">
        <div className="flex flex-wrap gap-3">
          {eventTypesQuery.data?.map(type => {
            const colors = eventTypeColors[type.value] || eventTypeColors.other;
            return (
              <div key={type.value} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
                <span className="text-xs text-stone-600">{type.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <Badge className={`${eventTypeColors[selectedEvent.eventType]?.bg} ${eventTypeColors[selectedEvent.eventType]?.text}`}>
                    {selectedEvent.eventType}
                  </Badge>
                  {selectedEvent.isFree && (
                    <Badge className="bg-green-100 text-green-700">Free</Badge>
                  )}
                </div>
                <DialogTitle className="text-xl mt-2">{selectedEvent.title}</DialogTitle>
                {selectedEvent.description && (
                  <DialogDescription className="mt-2">
                    {selectedEvent.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{formatDate(selectedEvent.startDate)}</p>
                    <p className="text-sm text-stone-500">
                      {formatTime(selectedEvent.startDate)}
                      {selectedEvent.endDate && ` - ${formatTime(selectedEvent.endDate)}`}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(selectedEvent.venue || selectedEvent.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-stone-400 mt-0.5" />
                    <div>
                      {selectedEvent.venue && <p className="font-medium">{selectedEvent.venue}</p>}
                      {selectedEvent.city && (
                        <p className="text-sm text-stone-500">{selectedEvent.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Virtual */}
                {selectedEvent.locationType === 'virtual' && (
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-stone-400" />
                    <p className="text-stone-600">Virtual Event</p>
                  </div>
                )}

                {/* Capacity */}
                {selectedEvent.capacity && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-stone-400" />
                    <p className="text-stone-600">
                      {selectedEvent.spotsRemaining !== null 
                        ? `${selectedEvent.spotsRemaining} spots remaining`
                        : `${selectedEvent.capacity} capacity`
                      }
                    </p>
                  </div>
                )}

                {/* Price */}
                {!selectedEvent.isFree && (
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-lg font-semibold text-stone-900">
                      {selectedEvent.formattedPrice}
                    </p>
                  </div>
                )}
              </div>

              {linkToDetail && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                  <Link href={`/events/${selectedEvent.slug}`}>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      View Details
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
