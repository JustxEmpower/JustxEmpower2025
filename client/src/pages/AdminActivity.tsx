import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Activity,
  ArrowLeft,
  Clock,
  Search,
  Filter,
  FileText,
  Image,
  Calendar,
  ShoppingCart,
  Users,
  FormInput,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// Activity type icons mapping
const activityIcons: Record<string, any> = {
  article: FileText,
  page: Layers,
  media: Image,
  event: Calendar,
  product: ShoppingCart,
  user: Users,
  form: FormInput,
  default: Activity,
};

function getActivityIcon(type: string) {
  return activityIcons[type] || activityIcons.default;
}

function getActivityColor(type: string) {
  const colors: Record<string, string> = {
    article: "bg-blue-100 text-blue-600",
    page: "bg-purple-100 text-purple-600",
    media: "bg-green-100 text-green-600",
    event: "bg-indigo-100 text-indigo-600",
    product: "bg-orange-100 text-orange-600",
    user: "bg-violet-100 text-violet-600",
    form: "bg-rose-100 text-rose-600",
    default: "bg-stone-100 text-stone-600",
  };
  return colors[type] || colors.default;
}

export default function AdminActivity() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const activityQuery = trpc.admin.dashboard.recentActivity.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activities = activityQuery.data || [];
  
  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get unique activity types for filter dropdown
  const activityTypes = Array.from(new Set(activities.map((a: any) => a.type).filter(Boolean)));

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <AdminSidebar />
      
      <main className="lg:pl-64 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/dashboard')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  Activity Log
                </h1>
                <p className="text-stone-500 mt-2">View all recent changes and updates across your site</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => activityQuery.refetch()}
                disabled={activityQuery.isRefetching}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${activityQuery.isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {activityTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activity List */}
          <Card>
            <CardHeader>
              <CardTitle>All Activity</CardTitle>
              <CardDescription>
                {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">No activity found</h3>
                  <p className="text-stone-500">
                    {searchTerm || filterType !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Start creating content to see activity here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map((activity: any, index: number) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700 group cursor-pointer"
                        onClick={() => {
                          if (activity.link) {
                            setLocation(activity.link);
                          }
                        }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-900 dark:text-white font-medium">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-stone-500">{activity.timestamp}</p>
                            {activity.type && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.type}
                              </Badge>
                            )}
                            {activity.user && (
                              <span className="text-xs text-stone-400">by {activity.user}</span>
                            )}
                          </div>
                        </div>
                        {activity.link && (
                          <ChevronRight className="w-5 h-5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
