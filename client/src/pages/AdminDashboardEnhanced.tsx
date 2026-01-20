import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Files,
  Users,
  FormInput,
  Image,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Clock,
  Palette,
  BarChart3,
  ShoppingCart,
  Calendar,
  DollarSign,
  Mail,
  Database,
  Cloud,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Zap,
  Eye,
  MousePointer,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Settings,
  Search,
  Command,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  Target,
  Award,
  Rocket,
  LayoutDashboard,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationCenter";
import { Sun, Moon, CloudRain, CloudSnow, CloudLightning, Sunrise, Sunset } from "lucide-react";

// Weather Widget Component
function WeatherWidget() {
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    location: string;
    humidity: number;
    windSpeed: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get weather data using browser geolocation + Open-Meteo API (free, no key required)
    const fetchWeather = async () => {
      try {
        // Try to get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
              );
              const data = await response.json();
              
              // Get location name via reverse geocoding
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const geoData = await geoResponse.json();
              
              const weatherCodes: Record<number, string> = {
                0: 'clear', 1: 'clear', 2: 'partly-cloudy', 3: 'cloudy',
                45: 'foggy', 48: 'foggy', 51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
                61: 'rain', 63: 'rain', 65: 'rain', 66: 'rain', 67: 'rain',
                71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
                80: 'rain', 81: 'rain', 82: 'rain',
                85: 'snow', 86: 'snow', 95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
              };

              setWeather({
                temp: Math.round(data.current.temperature_2m),
                condition: weatherCodes[data.current.weather_code] || 'clear',
                location: geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Your Location',
                humidity: data.current.relative_humidity_2m,
                windSpeed: Math.round(data.current.wind_speed_10m),
              });
              setLoading(false);
            },
            () => {
              // Fallback if location denied - use Austin, TX
              setWeather({ temp: 72, condition: 'clear', location: 'Austin, TX', humidity: 45, windSpeed: 8 });
              setLoading(false);
            }
          );
        } else {
          setWeather({ temp: 72, condition: 'clear', location: 'Austin, TX', humidity: 45, windSpeed: 8 });
          setLoading(false);
        }
      } catch (error) {
        setWeather({ temp: 72, condition: 'clear', location: 'Austin, TX', humidity: 45, windSpeed: 8 });
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 15 minutes
    const weatherTimer = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherIcon = (condition: string, isNight: boolean) => {
    const iconClass = "w-8 h-8";
    if (condition === 'thunderstorm') return <CloudLightning className={`${iconClass} text-purple-500`} />;
    if (condition === 'rain' || condition === 'drizzle') return <CloudRain className={`${iconClass} text-blue-500`} />;
    if (condition === 'snow') return <CloudSnow className={`${iconClass} text-sky-300`} />;
    if (condition === 'cloudy' || condition === 'foggy') return <Cloud className={`${iconClass} text-stone-400`} />;
    if (condition === 'partly-cloudy') return <Cloud className={`${iconClass} text-stone-300`} />;
    return isNight ? <Moon className={`${iconClass} text-indigo-400`} /> : <Sun className={`${iconClass} text-amber-500`} />;
  };

  const hour = currentTime.getHours();
  const isNight = hour < 6 || hour >= 20;
  const timeString = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const gradientClass = isNight 
    ? 'from-indigo-900 via-purple-900 to-slate-900' 
    : hour < 8 
      ? 'from-orange-400 via-rose-400 to-pink-500'
      : hour < 17
        ? 'from-sky-400 via-blue-500 to-indigo-500'
        : 'from-orange-500 via-rose-500 to-purple-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-xl`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {!isNight && (
          <>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          </>
        )}
        {isNight && (
          <>
            <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute top-12 right-20 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse delay-100" />
            <div className="absolute top-8 right-32 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200" />
          </>
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">{dateString}</p>
            <p className="text-4xl font-bold tracking-tight">{timeString}</p>
            {weather && (
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <span>📍</span> {weather.location}
              </p>
            )}
          </div>
          <div className="text-right">
            {loading ? (
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : weather && (
              <>
                {getWeatherIcon(weather.condition, isNight)}
                <p className="text-3xl font-bold mt-1">{weather.temp}°F</p>
              </>
            )}
          </div>
        </div>
        {weather && !loading && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-1 text-sm text-white/80">
              <span>💧</span> {weather.humidity}%
            </div>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <span>💨</span> {weather.windSpeed} mph
            </div>
            <div className="flex items-center gap-1 text-sm text-white/80">
              {isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isNight ? 'Night' : 'Day'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Animated counter component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
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

// Stat card with trend indicator
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "blue",
  href 
}: { 
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
  href?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", icon: "text-pink-500" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "text-cyan-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 ${href ? 'hover:border-primary' : ''}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-150 transition-transform duration-500`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-stone-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-stone-900">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {trend && trendValue && (
              <Badge variant="secondary" className={`${trend === 'up' ? 'bg-green-100 text-green-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-700'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                {trendValue}
              </Badge>
            )}
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </CardContent>
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-stone-400" />
          </div>
        )}
      </Card>
    </motion.div>
  );
  
  return href ? <Link href={href}>{content}</Link> : content;
}

// Quick action button
function QuickAction({ icon: Icon, label, href, color, badge }: { icon: any; label: string; href: string; color: string; badge?: string }) {
  const [, setLocation] = useLocation();
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLocation(href)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:shadow-md transition-all cursor-pointer relative`}
    >
      {badge && (
        <Badge className="absolute -top-1 -right-1 text-xs px-1.5">{badge}</Badge>
      )}
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium text-center">{label}</span>
    </motion.div>
  );
}

// System status indicator
function SystemStatus({ name, status, icon: Icon }: { name: string; status: boolean; icon: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
      <div className={`p-2 rounded-full ${status ? 'bg-green-100' : 'bg-red-100'}`}>
        <Icon className={`w-4 h-4 ${status ? 'text-green-600' : 'text-red-600'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-900">{name}</p>
        <p className={`text-xs ${status ? 'text-green-600' : 'text-red-600'}`}>
          {status ? 'Operational' : 'Issues Detected'}
        </p>
      </div>
      <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
    </div>
  );
}

export default function AdminDashboardEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username } = useAdminAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const statsQuery = trpc.admin.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const activityQuery = trpc.admin.dashboard.recentActivity.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const healthQuery = trpc.admin.dashboard.health.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      statsQuery.refetch(),
      activityQuery.refetch(),
      healthQuery.refetch(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 font-medium">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const stats = statsQuery.data || {
    totalPages: 0, publishedPages: 0, totalArticles: 0, publishedArticles: 0,
    totalMedia: 0, totalFormSubmissions: 0, unreadSubmissions: 0, totalUsers: 0,
    totalProducts: 0, totalEvents: 0, totalOrders: 0, recentOrders: 0,
    totalRevenue: 0, totalSubscribers: 0, totalResources: 0,
  };

  const health = healthQuery.data;
  const activities = activityQuery.data || [];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{greeting}, {username}!</h1>
                <p className="text-stone-500 text-sm">Here's what's happening with your site today</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <NotificationBell unreadCount={stats.unreadSubmissions} />
                <Link href="/admin/settings">
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Weather & Time Widget */}
          <div className="mb-6">
            <WeatherWidget />
          </div>

          {/* System Health Banner */}
          <AnimatePresence>
            {health && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-xl border-2 ${
                  health.status === 'healthy' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {health.status === 'healthy' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${health.status === 'healthy' ? 'text-green-800' : 'text-amber-800'}`}>
                        All Systems {health.status === 'healthy' ? 'Operational' : 'Experiencing Issues'}
                      </p>
                      <p className="text-sm text-stone-600">
                        Uptime: {Math.floor(health.uptime / 86400)}d {Math.floor((health.uptime % 86400) / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <SystemStatus name="Database" status={health.checks.database} icon={Database} />
                    <SystemStatus name="Storage" status={health.checks.storage} icon={Cloud} />
                    <SystemStatus name="Email" status={health.checks.email} icon={Mail} />
                    <SystemStatus name="AI" status={health.checks.ai} icon={Sparkles} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Quick Actions</h2>
              <Button variant="ghost" size="sm" className="text-stone-500" onClick={() => setLocation('/admin/settings')}>
                Customize <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              <QuickAction icon={Plus} label="New Page" href="/admin/pages" color="bg-blue-50 text-blue-600" />
              <QuickAction icon={FileText} label="New Article" href="/admin/articles" color="bg-purple-50 text-purple-600" />
              <QuickAction icon={Image} label="Upload Media" href="/admin/media" color="bg-green-50 text-green-600" />
              <QuickAction icon={Package} label="Add Product" href="/admin/products" color="bg-orange-50 text-orange-600" />
              <QuickAction icon={Calendar} label="Create Event" href="/admin/events" color="bg-pink-50 text-pink-600" />
              <QuickAction icon={Layers} label="Page Builder" href="/admin/pages" color="bg-indigo-50 text-indigo-600" />
              <QuickAction icon={Palette} label="Theme" href="/admin/theme" color="bg-rose-50 text-rose-600" />
              <QuickAction icon={FormInput} label="Forms" href="/admin/forms" color="bg-amber-50 text-amber-600" badge={stats.unreadSubmissions > 0 ? String(stats.unreadSubmissions) : undefined} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Pages"
                value={stats.totalPages}
                subtitle={`${stats.publishedPages} published`}
                icon={Files}
                color="blue"
                trend="up"
                trendValue="+2 this week"
                href="/admin/pages"
              />
              <StatCard
                title="Articles"
                value={stats.totalArticles}
                subtitle={`${stats.publishedArticles} published`}
                icon={FileText}
                color="purple"
                href="/admin/articles"
              />
              <StatCard
                title="Media Files"
                value={stats.totalMedia}
                subtitle="Images & videos"
                icon={Image}
                color="green"
                href="/admin/media"
              />
              <StatCard
                title="Resources"
                value={stats.totalResources}
                subtitle="Documents & files"
                icon={Package}
                color="cyan"
                href="/admin/resources"
              />
            </div>
          </div>

          {/* Commerce & Engagement Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Commerce Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-orange-500" />
                      Commerce
                    </CardTitle>
                    <CardDescription>Shop & order statistics</CardDescription>
                  </div>
                  <Link href="/admin/revenue">
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                    <p className="text-sm text-orange-600 font-medium">Products</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.totalProducts}</p>
                    <p className="text-xs text-orange-600">In catalog</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                    <p className="text-sm text-emerald-600 font-medium">Orders</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.totalOrders}</p>
                    <p className="text-xs text-emerald-600">+{stats.recentOrders} this week</p>
                  </div>
                  <div className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200">
                    <p className="text-sm text-amber-700 font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-amber-900">
                      ${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-2">
                      <Progress value={65} className="h-2" />
                      <p className="text-xs text-amber-600 mt-1">65% of monthly goal</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      Engagement
                    </CardTitle>
                    <CardDescription>User activity & submissions</CardDescription>
                  </div>
                  <Link href="/admin/analytics">
                    <Button variant="outline" size="sm">View Analytics</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <p className="text-sm text-indigo-600 font-medium">Events</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.totalEvents}</p>
                    <p className="text-xs text-indigo-600">Scheduled</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                    <p className="text-sm text-sky-600 font-medium">Subscribers</p>
                    <p className="text-2xl font-bold text-sky-900">{stats.totalSubscribers}</p>
                    <p className="text-xs text-sky-600">Newsletter</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                    <p className="text-sm text-rose-600 font-medium">Submissions</p>
                    <p className="text-2xl font-bold text-rose-900">{stats.totalFormSubmissions}</p>
                    {stats.unreadSubmissions > 0 && (
                      <Badge className="mt-1 bg-rose-500">{stats.unreadSubmissions} unread</Badge>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <p className="text-sm text-violet-600 font-medium">Admin Users</p>
                    <p className="text-2xl font-bold text-violet-900">{stats.totalUsers}</p>
                    <p className="text-xs text-violet-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-2 border-emerald-100 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-900">Recent Activity</CardTitle>
                    <CardDescription className="text-emerald-600">Latest changes and updates</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation('/admin/activity')}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activityQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-700 font-medium">No recent activity</p>
                  <p className="text-sm text-emerald-500 mt-1">Start creating content to see activity here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 8).map((activity: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 group cursor-pointer border border-transparent hover:border-emerald-200"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md"
                      >
                        <Activity className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-900 font-semibold truncate group-hover:text-emerald-700 transition-colors">{activity.description}</p>
                        <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.timestamp}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                        onClick={(e) => { e.stopPropagation(); setSelectedActivity(activity); }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-md border-2 border-emerald-200 overflow-hidden p-0">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/30">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent text-xl">
                  Activity Details
                </span>
              </DialogTitle>
              <DialogDescription className="text-emerald-600">
                Information about this activity
              </DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4 pt-4">
                <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Badge className="capitalize bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-md">
                      {selectedActivity.type || 'Activity'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    {selectedActivity.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-emerald-700">
                    {selectedActivity.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Created</p>
                    <p className="text-sm font-medium text-stone-900 mt-1">{selectedActivity.timestamp}</p>
                  </div>
                  {selectedActivity.slug && (
                    <div>
                      <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Slug</p>
                      <p className="text-sm font-medium text-stone-900 truncate mt-1">{selectedActivity.slug}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedActivity.link && (
                    <Button 
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      onClick={() => {
                        setLocation(selectedActivity.link);
                        setSelectedActivity(null);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Go to {selectedActivity.type || 'page'}
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedActivity(null)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
