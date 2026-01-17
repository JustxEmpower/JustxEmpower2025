import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Search, RefreshCw, Filter, MessageSquare, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000, steps = 30, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminReviewsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Try to fetch reviews - will gracefully fail if not implemented
  const reviewsQuery = (trpc.admin as any).reviews?.list?.useQuery?.({}) || { data: null, isLoading: false, refetch: () => {} };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Mock data since reviews might not be implemented yet
  const reviews = reviewsQuery?.data || [];
  
  const stats = useMemo(() => {
    const all = reviews as any[];
    const positive = all.filter((r: any) => r.rating >= 4).length;
    const negative = all.filter((r: any) => r.rating <= 2).length;
    const avgRating = all.length > 0 ? all.reduce((sum: number, r: any) => sum + r.rating, 0) / all.length : 0;
    return { total: all.length, positive, negative, avgRating };
  }, [reviews]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Reviews</h1>
                <p className="text-stone-500 text-sm">Manage product and event reviews</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => reviewsQuery?.refetch?.()}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-amber-900"><AnimatedCounter value={stats.total} /></p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600">Positive (4-5★)</p>
                      <p className="text-2xl font-bold text-emerald-900"><AnimatedCounter value={stats.positive} /></p>
                    </div>
                    <ThumbsUp className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-600">Needs Attention (1-2★)</p>
                      <p className="text-2xl font-bold text-red-900"><AnimatedCounter value={stats.negative} /></p>
                    </div>
                    <ThumbsDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600">Average Rating</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.avgRating.toFixed(1)}★</p>
                    </div>
                    <Star className="w-8 h-8 text-purple-500 fill-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input placeholder="Search reviews..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-36"><Star className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          {stats.total === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Star className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
                <p className="text-stone-500 max-w-md mx-auto">
                  Reviews will appear here once customers start leaving feedback on your products and events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(reviews as any[]).map((review: any, i: number) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-stone-600">{review.customerName?.[0] || "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{review.customerName || "Anonymous"}</h3>
                            {renderStars(review.rating)}
                            <Badge className={review.status === "approved" ? "bg-emerald-100 text-emerald-700" : review.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                              {review.status || "pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-stone-600 mb-2">{review.content}</p>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <span>{review.productName || review.eventName || "Product/Event"}</span>
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon"><CheckCircle className="w-4 h-4 text-emerald-500" /></Button>
                          <Button variant="ghost" size="icon"><XCircle className="w-4 h-4 text-red-500" /></Button>
                          <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-stone-400" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
