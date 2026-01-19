import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
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
  Sparkles,
  Zap,
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
  const colors: Record<string, { bg: string; text: string; gradient: string; border: string }> = {
    article: { bg: "bg-blue-100", text: "text-blue-600", gradient: "from-blue-500 to-cyan-500", border: "border-blue-200" },
    page: { bg: "bg-purple-100", text: "text-purple-600", gradient: "from-purple-500 to-pink-500", border: "border-purple-200" },
    media: { bg: "bg-green-100", text: "text-green-600", gradient: "from-green-500 to-emerald-500", border: "border-green-200" },
    event: { bg: "bg-indigo-100", text: "text-indigo-600", gradient: "from-indigo-500 to-violet-500", border: "border-indigo-200" },
    product: { bg: "bg-orange-100", text: "text-orange-600", gradient: "from-orange-500 to-amber-500", border: "border-orange-200" },
    user: { bg: "bg-violet-100", text: "text-violet-600", gradient: "from-violet-500 to-purple-500", border: "border-violet-200" },
    form: { bg: "bg-rose-100", text: "text-rose-600", gradient: "from-rose-500 to-pink-500", border: "border-rose-200" },
    default: { bg: "bg-stone-100", text: "text-stone-600", gradient: "from-stone-500 to-gray-500", border: "border-stone-200" },
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900">
      <AdminSidebar />
      
      <main className="lg:pl-64 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/dashboard')} className="mb-4 hover:bg-emerald-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white flex items-center gap-3">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <Activity className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Activity Center
                  </span>
                </h1>
                <p className="text-stone-500 mt-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Track all changes and updates across your site in real-time
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => activityQuery.refetch()}
                  disabled={activityQuery.isRefetching}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${activityQuery.isRefetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 border-2 border-emerald-100 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-48 border-emerald-200">
                      <Filter className="w-4 h-4 mr-2 text-emerald-500" />
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
          </motion.div>

          {/* Activity List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-emerald-100 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-900">All Activity</CardTitle>
                    <CardDescription className="text-emerald-600">
                      {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'} found
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activityQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">No activity found</h3>
                    <p className="text-emerald-600">
                      {searchTerm || filterType !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "Start creating content to see activity here"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-emerald-100">
                    {filteredActivities.map((activity: any, index: number) => {
                      const Icon = getActivityIcon(activity.type);
                      const colors = getActivityColor(activity.type);
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-start gap-4 p-4 hover:bg-gradient-to-r hover:from-${activity.type === 'page' ? 'purple' : activity.type === 'article' ? 'blue' : 'emerald'}-50/50 hover:to-transparent transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-l-4 hover:${colors.border}`}
                          onClick={() => {
                            if (activity.link) {
                              setLocation(activity.link);
                            }
                          }}
                        >
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-900 dark:text-white font-semibold group-hover:text-emerald-700 transition-colors">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-xs text-stone-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.timestamp}
                              </p>
                              {activity.type && (
                                <Badge className={`text-xs ${colors.bg} ${colors.text} border-0`}>
                                  {activity.type}
                                </Badge>
                              )}
                              {activity.user && (
                                <span className="text-xs text-stone-400 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {activity.user}
                                </span>
                              )}
                            </div>
                          </div>
                          {activity.link && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              whileHover={{ opacity: 1, x: 0 }}
                              className="flex items-center"
                            >
                              <ChevronRight className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
