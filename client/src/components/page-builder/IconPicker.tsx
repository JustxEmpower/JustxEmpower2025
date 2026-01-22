import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart, Sparkles, Crown, Star, Sun, Moon, Flower2, Leaf, TreePine,
  Mountain, Waves, Wind, Cloud, Flame, Droplet, Gem, Diamond,
  Feather, Bird, Shell, Eye, Hand, Footprints, Brain,
  Lightbulb, Zap, Target, Compass, Map, Globe, Home, Building,
  Users, User, UserCircle, Baby, PersonStanding,
  Book, BookOpen, Scroll, Pen, Pencil, Palette, Music, Mic,
  Camera, Film, Video, Image, Frame, Layers, Grid, Layout,
  Circle, Square, Triangle, Hexagon, Pentagon, Octagon,
  ArrowRight, ArrowUp, Check, Plus, Minus, X, Menu,
  Settings, Cog, Wrench, Hammer, Key, Lock, Unlock, Shield,
  Award, Trophy, Medal, Gift, Package, Box, Archive,
  Calendar, Clock, Timer, Hourglass, Bell, AlarmClock,
  Phone, Mail, MessageCircle, Send, Share, Link, Bookmark,
  Search, Filter, Download, Upload, RefreshCw, Repeat,
  Play, Pause, StopCircle, SkipForward, SkipBack, Volume2,
  Wifi, Bluetooth, Signal, Battery, Power, Plug,
  Coffee, Wine, UtensilsCrossed, Apple, Cherry, Grape,
  Car, Plane, Train, Ship, Bike, Rocket,
  Shirt, Glasses, Watch, Umbrella, Briefcase, Wallet,
  CreditCard, DollarSign, PiggyBank, TrendingUp, BarChart, PieChart,
  Activity, Thermometer, Stethoscope, Pill, Syringe, Bandage,
  Dumbbell, Bike as Bicycle, Trophy as TrophyIcon,
  Gamepad2, Puzzle, Dice1, Dice5, Joystick,
  Code, Terminal, Database, Server, Cpu, HardDrive,
  Smartphone, Tablet, Laptop, Monitor, Tv, Radio,
  Printer, Keyboard, Mouse, Headphones, Speaker,
  LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// LocalStorage key for favorite icons
const FAVORITE_ICONS_KEY = 'je-favorite-icons';

// Icon registry with categories
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  // Nature & Elements
  heart: Heart,
  sparkles: Sparkles,
  crown: Crown,
  star: Star,
  sun: Sun,
  moon: Moon,
  flower: Flower2,
  leaf: Leaf,
  tree: TreePine,
  mountain: Mountain,
  waves: Waves,
  wind: Wind,
  cloud: Cloud,
  flame: Flame,
  droplet: Droplet,
  gem: Gem,
  diamond: Diamond,
  feather: Feather,
  bird: Bird,
  butterfly: Bird, // Butterfly not available, using Bird as fallback
  shell: Shell,
  
  // Body & Mind
  eye: Eye,
  hand: Hand,
  footprints: Footprints,
  brain: Brain,
  lightbulb: Lightbulb,
  zap: Zap,
  target: Target,
  compass: Compass,
  
  // Places
  map: Map,
  globe: Globe,
  home: Home,
  building: Building,
  
  // People
  users: Users,
  user: User,
  'user-circle': UserCircle,
  baby: Baby,
  person: PersonStanding,
  
  // Creative
  book: Book,
  'book-open': BookOpen,
  scroll: Scroll,
  pen: Pen,
  pencil: Pencil,
  palette: Palette,
  music: Music,
  mic: Mic,
  camera: Camera,
  film: Film,
  video: Video,
  image: Image,
  frame: Frame,
  layers: Layers,
  grid: Grid,
  layout: Layout,
  
  // Shapes
  circle: Circle,
  square: Square,
  triangle: Triangle,
  hexagon: Hexagon,
  pentagon: Pentagon,
  octagon: Octagon,
  
  // Actions
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  check: Check,
  plus: Plus,
  minus: Minus,
  x: X,
  menu: Menu,
  
  // Tools
  settings: Settings,
  cog: Cog,
  wrench: Wrench,
  hammer: Hammer,
  key: Key,
  lock: Lock,
  unlock: Unlock,
  shield: Shield,
  
  // Rewards
  award: Award,
  trophy: Trophy,
  medal: Medal,
  gift: Gift,
  package: Package,
  box: Box,
  archive: Archive,
  
  // Time
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  hourglass: Hourglass,
  bell: Bell,
  alarm: AlarmClock,
  
  // Communication
  phone: Phone,
  mail: Mail,
  message: MessageCircle,
  send: Send,
  share: Share,
  link: Link,
  bookmark: Bookmark,
  
  // Interface
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  repeat: Repeat,
  
  // Media
  play: Play,
  pause: Pause,
  stop: StopCircle,
  'skip-forward': SkipForward,
  'skip-back': SkipBack,
  volume: Volume2,
  
  // Tech
  wifi: Wifi,
  bluetooth: Bluetooth,
  signal: Signal,
  battery: Battery,
  power: Power,
  plug: Plug,
  code: Code,
  terminal: Terminal,
  database: Database,
  server: Server,
  cpu: Cpu,
  'hard-drive': HardDrive,
  
  // Devices
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
  tv: Tv,
  radio: Radio,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  headphones: Headphones,
  speaker: Speaker,
  
  // Food & Drink
  coffee: Coffee,
  wine: Wine,
  utensils: UtensilsCrossed,
  apple: Apple,
  cherry: Cherry,
  grape: Grape,
  
  // Transport
  car: Car,
  plane: Plane,
  train: Train,
  ship: Ship,
  bike: Bike,
  rocket: Rocket,
  
  // Fashion
  shirt: Shirt,
  glasses: Glasses,
  watch: Watch,
  umbrella: Umbrella,
  briefcase: Briefcase,
  wallet: Wallet,
  
  // Finance
  'credit-card': CreditCard,
  dollar: DollarSign,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  
  // Health
  activity: Activity,
  thermometer: Thermometer,
  stethoscope: Stethoscope,
  pill: Pill,
  syringe: Syringe,
  bandage: Bandage,
  dumbbell: Dumbbell,
  
  // Games
  gamepad: Gamepad2,
  puzzle: Puzzle,
  dice: Dice5,
  joystick: Joystick,
};

// Icon categories for organized display
const ICON_CATEGORIES = {
  'Favorites': [] as string[], // Will be populated from localStorage
  'Popular': ['heart', 'sparkles', 'crown', 'star', 'sun', 'moon', 'gem', 'diamond', 'feather', 'eye', 'lightbulb', 'zap'],
  'Nature': ['flower', 'leaf', 'tree', 'mountain', 'waves', 'wind', 'cloud', 'flame', 'droplet', 'bird', 'butterfly', 'shell'],
  'Body & Mind': ['eye', 'hand', 'footprints', 'brain', 'lightbulb', 'zap', 'target', 'compass'],
  'People': ['users', 'user', 'user-circle', 'baby', 'person'],
  'Creative': ['book', 'book-open', 'scroll', 'pen', 'pencil', 'palette', 'music', 'mic', 'camera', 'film', 'video', 'image'],
  'Rewards': ['award', 'trophy', 'medal', 'gift', 'package', 'box'],
  'Communication': ['phone', 'mail', 'message', 'send', 'share', 'link', 'bookmark'],
};

// Helper to get favorites from localStorage
const getFavoriteIcons = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITE_ICONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save favorites to localStorage
const saveFavoriteIcons = (favorites: string[]) => {
  try {
    localStorage.setItem(FAVORITE_ICONS_KEY, JSON.stringify(favorites));
  } catch {
    console.warn('Failed to save favorite icons');
  }
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavoriteIcons());
  }, []);

  // Get the current icon component
  const CurrentIcon = ICON_REGISTRY[value] || Heart;

  // Toggle favorite status
  const toggleFavorite = (iconName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(iconName)
      ? favorites.filter(f => f !== iconName)
      : [...favorites, iconName];
    setFavorites(newFavorites);
    saveFavoriteIcons(newFavorites);
  };

  // Check if icon is favorited
  const isFavorite = (iconName: string) => favorites.includes(iconName);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    const searchLower = (search || '').toLowerCase();
    
    if (selectedCategory === 'Favorites') {
      return favorites.filter(name => name.includes(searchLower));
    }
    
    if (selectedCategory) {
      const categoryIcons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES] || [];
      return categoryIcons.filter(name => name.includes(searchLower));
    }
    
    return Object.keys(ICON_REGISTRY).filter(name => name.includes(searchLower));
  }, [search, selectedCategory, favorites]);

  // Get categories with favorites count
  const categoriesWithFavorites = useMemo(() => {
    return {
      'Favorites': favorites,
      ...ICON_CATEGORIES,
    };
  }, [favorites]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start gap-2', className)}
        >
          <CurrentIcon className="w-4 h-4" />
          <span className="capitalize">{value.replace(/-/g, ' ')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-neutral-50 dark:bg-neutral-900">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors',
              selectedCategory === null
                ? 'bg-primary text-white'
                : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            All
          </button>
          {/* Favorites category first if there are any */}
          {favorites.length > 0 && (
            <button
              onClick={() => setSelectedCategory('Favorites')}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1',
                selectedCategory === 'Favorites'
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-amber-600'
              )}
            >
              <Star className="w-3 h-3 fill-current" />
              Favorites ({favorites.length})
            </button>
          )}
          {Object.keys(ICON_CATEGORIES).filter(c => c !== 'Favorites').map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Icon grid */}
        <div className="grid grid-cols-8 gap-1 p-2 max-h-64 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const Icon = ICON_REGISTRY[iconName];
            if (!Icon) return null;
            
            const isHovered = hoveredIcon === iconName;
            const isFav = isFavorite(iconName);
            
            return (
              <div
                key={iconName}
                className="relative"
                onMouseEnter={() => setHoveredIcon(iconName)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <button
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
                    value === iconName && 'bg-primary/10 ring-2 ring-primary'
                  )}
                  title={iconName.replace(/-/g, ' ')}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
                
                {/* Favorite star button - show on hover or if favorited */}
                {(isHovered || isFav) && (
                  <button
                    onClick={(e) => toggleFavorite(iconName, e)}
                    className={cn(
                      'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all',
                      isFav 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-amber-500 hover:text-white'
                    )}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={cn('w-2.5 h-2.5', isFav && 'fill-current')} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="p-4 text-center text-sm text-neutral-500">
            {selectedCategory === 'Favorites' ? (
              <>
                <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No favorite icons yet</p>
                <p className="text-xs mt-1">Hover over icons and click the star to add favorites</p>
              </>
            ) : (
              'No icons found'
            )}
          </div>
        )}
        
        {/* Help text */}
        <div className="p-2 border-t bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-500 text-center">
          Hover over icons and click ★ to add to favorites
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default IconPicker;
