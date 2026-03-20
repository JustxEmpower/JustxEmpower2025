import React, { useState, useMemo } from 'react';
import { Heart, Calendar, Clock, MapPin, Users, Search, Play, Filter, CheckCircle } from 'lucide-react';

/**
 * Events & Our Rooted Network page
 * Displays upcoming circles, past recordings, facilitators, and community directory
 * Powered by SUSTAIN (community weaver) + RECLAIM (engagement architect)
 */

// Types
export interface EventCard {
  id: string;
  title: string;
  date: string;
  time: string;
  facilitator: string;
  type: 'circle' | 'workshop' | 'replay';
  description: string;
  spotsRemaining: number;
  maxSpots: number;
  tags: string[];
  imageUrl?: string;
}

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  registeredAt: string;
  status: 'registered' | 'attended' | 'cancelled';
}

export interface Facilitator {
  id: string;
  name: string;
  photo: string;
  specialties: string[];
  bio: string;
  certifications: string[];
  isVerified: boolean;
  hourlyRate?: number;
  bookingUrl?: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  photo: string;
  archetype: string;
  pathway: string;
  phase: string;
  affinity: string[];
  bio: string;
}

export interface SeasonalThemeData {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  theme: string;
  archetype: string;
  practices: string[];
  color: string;
  description: string;
}

export interface EventsProps {
  events: EventCard[];
  registrations: EventRegistration[];
  facilitators: Facilitator[];
  communityMembers: CommunityMember[];
  userProfile: {
    id: string;
    archetype: string;
    pathway: string;
    phase: string;
  };
  seasonalTheme: SeasonalThemeData;
  onRegister: (eventId: string, userId: string) => void;
  onNavigate: (route: string) => void;
}

export const Events: React.FC<EventsProps> = ({
  events,
  registrations,
  facilitators,
  communityMembers,
  userProfile,
  seasonalTheme,
  onRegister,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'circles' | 'library' | 'facilitators' | 'directory'>('circles');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'circle' | 'workshop' | 'replay'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [facilitatorFilter, setFacilitatorFilter] = useState<string | null>(null);

  // Filter upcoming circles
  const upcomingCircles = useMemo(() => {
    return events
      .filter(e => e.type !== 'replay')
      .filter(e => eventTypeFilter === 'all' || e.type === eventTypeFilter)
      .filter(e => !tagFilter || e.tags.includes(tagFilter))
      .filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.facilitator.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [events, eventTypeFilter, tagFilter, searchQuery]);

  // Filter replay library
  const replays = useMemo(() => {
    return events
      .filter(e => e.type === 'replay')
      .filter(e => !facilitatorFilter || e.facilitator === facilitatorFilter)
      .filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [events, facilitatorFilter, searchQuery]);

  // Filter community members by affinity
  const compatibleMembers = useMemo(() => {
    return communityMembers
      .filter(m => m.id !== userProfile.id)
      .sort((a, b) => {
        // Sort by matching archetype/pathway affinity
        const aMatches = a.affinity.includes(userProfile.archetype) ? 1 : 0;
        const bMatches = b.affinity.includes(userProfile.archetype) ? 1 : 0;
        return bMatches - aMatches;
      })
      .slice(0, 12);
  }, [communityMembers, userProfile]);

  const allTags = useMemo(() => {
    return Array.from(new Set(events.flatMap(e => e.tags))).sort();
  }, [events]);

  const isRegistered = (eventId: string) => {
    return registrations.some(r => r.eventId === eventId && r.status === 'registered');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Seasonal Theme Banner */}
      <SeasonalThemeBanner theme={seasonalTheme} />

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-300 overflow-x-auto">
        {[
          { id: 'circles', label: 'Upcoming Circles' },
          { id: 'library', label: 'Replay Library' },
          { id: 'facilitators', label: 'Facilitators' },
          { id: 'directory', label: 'Community' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 whitespace-nowrap font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-rose-400 text-rose-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* UPCOMING CIRCLES TAB */}
      {activeTab === 'circles' && (
        <UpcomingCircles
          circles={upcomingCircles}
          registrations={registrations}
          allTags={allTags}
          eventTypeFilter={eventTypeFilter}
          tagFilter={tagFilter}
          searchQuery={searchQuery}
          onEventTypeFilterChange={setEventTypeFilter}
          onTagFilterChange={setTagFilter}
          onSearchChange={setSearchQuery}
          onRegister={onRegister}
          userProfile={userProfile}
          isRegistered={isRegistered}
        />
      )}

      {/* REPLAY LIBRARY TAB */}
      {activeTab === 'library' && (
        <ReplayLibrary
          replays={replays}
          facilitators={facilitators}
          facilitatorFilter={facilitatorFilter}
          searchQuery={searchQuery}
          onFacilitatorFilterChange={setFacilitatorFilter}
          onSearchChange={setSearchQuery}
          onNavigate={onNavigate}
        />
      )}

      {/* FACILITATORS TAB */}
      {activeTab === 'facilitators' && (
        <FacilitatorProfiles
          facilitators={facilitators}
          onNavigate={onNavigate}
        />
      )}

      {/* COMMUNITY DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <CommunityDirectory
          members={compatibleMembers}
          userProfile={userProfile}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

// ============ SUBCOMPONENTS ============

const SeasonalThemeBanner: React.FC<{ theme: SeasonalThemeData }> = ({ theme }) => {
  const seasonEmojis = {
    spring: '🌱',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
  };

  return (
    <div
      className="mb-8 p-6 rounded-lg text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.color}cc 0%, ${theme.color}88 100%)`,
      }}
    >
      <div className="relative z-10">
        <div className="text-sm font-semibold opacity-90 mb-2">
          {seasonEmojis[theme.season]} Neuroseasonal Woman™ Framework
        </div>
        <h3 className="text-2xl font-bold mb-2">{theme.theme}</h3>
        <p className="text-sm mb-4 opacity-95">{theme.description}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {theme.practices.map((practice, idx) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 bg-white bg-opacity-25 rounded-full"
            >
              {practice}
            </span>
          ))}
        </div>
        <div className="text-xs opacity-90">
          <strong>Archetype in focus:</strong> {theme.archetype}
        </div>
      </div>
    </div>
  );
};

const UpcomingCircles: React.FC<{
  circles: EventCard[];
  registrations: EventRegistration[];
  allTags: string[];
  eventTypeFilter: string;
  tagFilter: string | null;
  searchQuery: string;
  onEventTypeFilterChange: (type: any) => void;
  onTagFilterChange: (tag: string | null) => void;
  onSearchChange: (query: string) => void;
  onRegister: (eventId: string, userId: string) => void;
  userProfile: any;
  isRegistered: (eventId: string) => boolean;
}> = ({
  circles,
  allTags,
  eventTypeFilter,
  tagFilter,
  searchQuery,
  onEventTypeFilterChange,
  onTagFilterChange,
  onSearchChange,
  onRegister,
  userProfile,
  isRegistered,
}) => {
  return (
    <div>
      {/* Search & Filters */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2 border border-slate-200">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search events, facilitators..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="flex-1 outline-none text-slate-700"
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Type Filter */}
          {['all', 'circle', 'workshop', 'replay'].map(type => (
            <button
              key={type}
              onClick={() => onEventTypeFilterChange(type === 'all' ? 'all' : type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                eventTypeFilter === type
                  ? 'bg-rose-400 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}

          {/* Tag Filter */}
          <div className="flex gap-2 flex-wrap">
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => onTagFilterChange(tagFilter === tag ? null : tag)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  tagFilter === tag
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Cards Grid */}
      {circles.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No circles match your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map(event => (
            <EventCardComponent
              key={event.id}
              event={event}
              onRegister={() => onRegister(event.id, userProfile.id)}
              isRegistered={isRegistered(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EventCardComponent: React.FC<{
  event: EventCard;
  onRegister: () => void;
  isRegistered: boolean;
}> = ({ event, onRegister, isRegistered }) => {
  const typeColors = {
    circle: 'bg-rose-50 border-rose-200',
    workshop: 'bg-amber-50 border-amber-200',
    replay: 'bg-blue-50 border-blue-200',
  };

  const typeLabels = {
    circle: 'Circle',
    workshop: 'Workshop',
    replay: 'Replay',
  };

  return (
    <div className={`rounded-lg border-2 p-6 flex flex-col ${typeColors[event.type]}`}>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-40 object-cover rounded-lg mb-4"
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          event.type === 'circle'
            ? 'bg-rose-200 text-rose-800'
            : event.type === 'workshop'
            ? 'bg-amber-200 text-amber-800'
            : 'bg-blue-200 text-blue-800'
        }`}>
          {typeLabels[event.type]}
        </span>
        {isRegistered && <CheckCircle className="w-5 h-5 text-green-600" />}
      </div>

      <h4 className="font-bold text-slate-800 mb-3 text-lg">{event.title}</h4>

      <div className="space-y-2 mb-4 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          {event.date}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          {event.time}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          Facilitated by <strong>{event.facilitator}</strong>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          {event.spotsRemaining} of {event.maxSpots} spots available
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {event.tags.map(tag => (
          <span key={tag} className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <button
          onClick={onRegister}
          disabled={isRegistered || event.spotsRemaining === 0}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
            isRegistered
              ? 'bg-green-100 text-green-700 cursor-default'
              : event.spotsRemaining === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-rose-400 text-white hover:bg-rose-500 cursor-pointer'
          }`}
        >
          {isRegistered ? 'Registered' : event.spotsRemaining === 0 ? 'Full' : 'Register'}
        </button>
      </div>
    </div>
  );
};

const ReplayLibrary: React.FC<{
  replays: EventCard[];
  facilitators: Facilitator[];
  facilitatorFilter: string | null;
  searchQuery: string;
  onFacilitatorFilterChange: (facilitator: string | null) => void;
  onSearchChange: (query: string) => void;
  onNavigate: (route: string) => void;
}> = ({
  replays,
  facilitators,
  facilitatorFilter,
  searchQuery,
  onFacilitatorFilterChange,
  onSearchChange,
  onNavigate,
}) => {
  const facilitatorNames = Array.from(
    new Set(replays.map(r => r.facilitator))
  ).sort();

  return (
    <div>
      {/* Search & Filter */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2 border border-slate-200">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="flex-1 outline-none text-slate-700"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onFacilitatorFilterChange(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              facilitatorFilter === null
                ? 'bg-blue-400 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            All Facilitators
          </button>
          {facilitatorNames.map(name => (
            <button
              key={name}
              onClick={() => onFacilitatorFilterChange(facilitatorFilter === name ? null : name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                facilitatorFilter === name
                  ? 'bg-blue-400 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Replay List */}
      {replays.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No recordings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replays.map(replay => (
            <div
              key={replay.id}
              className="flex gap-4 bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              {replay.imageUrl && (
                <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 flex items-center justify-center">
                  <img src={replay.imageUrl} alt={replay.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 mb-1">{replay.title}</h4>
                <p className="text-sm text-slate-600 mb-2">{replay.description}</p>
                <div className="text-xs text-slate-500">
                  Facilitated by <strong>{replay.facilitator}</strong>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onNavigate(`/replay/${replay.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                  >
                    <Play className="w-4 h-4" />
                    Watch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FacilitatorProfiles: React.FC<{
  facilitators: Facilitator[];
  onNavigate: (route: string) => void;
}> = ({ facilitators, onNavigate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {facilitators.map(facilitator => (
        <div
          key={facilitator.id}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {facilitator.photo && (
            <img
              src={facilitator.photo}
              alt={facilitator.name}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-slate-800">{facilitator.name}</h3>
              {facilitator.isVerified && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-sm text-slate-600 mb-4">{facilitator.bio}</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Specialties:</p>
              <div className="flex flex-wrap gap-1">
                {facilitator.specialties.map(spec => (
                  <span key={spec} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Certifications:</p>
              <div className="text-xs text-slate-600">
                {facilitator.certifications.join(', ')}
              </div>
            </div>

            {facilitator.bookingUrl && (
              <button
                onClick={() => onNavigate(facilitator.bookingUrl || '#')}
                className="w-full py-2 px-4 bg-rose-400 text-white rounded-lg font-semibold hover:bg-rose-500 transition-colors"
              >
                Book Session
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CommunityDirectory: React.FC<{
  members: CommunityMember[];
  userProfile: any;
  onNavigate: (route: string) => void;
}> = ({ members, userProfile, onNavigate }) => {
  return (
    <div>
      <p className="text-slate-700 mb-6 text-sm">
        Connected by archetype affinity, pathway alignment, and phase proximity
      </p>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No compatible members found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {member.photo && (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-bold text-slate-800 mb-1">{member.name}</h4>
                <div className="text-xs text-slate-600 mb-3 space-y-1">
                  <p><strong>Archetype:</strong> {member.archetype}</p>
                  <p><strong>Pathway:</strong> {member.pathway}</p>
                  <p><strong>Phase:</strong> {member.phase}</p>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.affinity.slice(0, 2).map(aff => (
                    <span key={aff} className="text-xs px-2 py-1 bg-rose-50 text-rose-700 rounded">
                      {aff}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onNavigate(`/member/${member.id}`)}
                  className="w-full py-2 px-3 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
