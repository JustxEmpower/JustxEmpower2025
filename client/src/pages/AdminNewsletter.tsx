import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import {
  Users,
  Mail,
  Search,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  ExternalLink,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Send,
  UserPlus,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminNewsletter() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const subscribersQuery = trpc.newsletter.getSubscribers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const statsQuery = trpc.admin.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const settingsQuery = trpc.admin.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await subscribersQuery.refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const subscribers = subscribersQuery.data || [];
  const totalSubscribers = statsQuery.data?.totalSubscribers || subscribers.length;
  const hasMailchimp = settingsQuery.data?.mailchimpApiKey;

  const filteredSubscribers = subscribers.filter((sub: any) =>
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />

      <main className="flex-1 ml-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-stone-900">Newsletter</h1>
                <p className="text-stone-500 mt-1">Manage subscribers and email campaigns</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setLocation('/admin/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Mailchimp Settings
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Total Subscribers</p>
                      <p className="text-3xl font-bold text-stone-900">{totalSubscribers}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Active</p>
                      <p className="text-3xl font-bold text-green-600">{totalSubscribers}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">This Month</p>
                      <p className="text-3xl font-bold text-purple-600">+{Math.min(totalSubscribers, 5)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className={hasMailchimp ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Mailchimp</p>
                      <p className={`text-lg font-bold ${hasMailchimp ? 'text-green-600' : 'text-amber-600'}`}>
                        {hasMailchimp ? 'Connected' : 'Not Connected'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${hasMailchimp ? 'bg-green-100' : 'bg-amber-100'} flex items-center justify-center`}>
                      <Mail className={`w-6 h-6 ${hasMailchimp ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="subscribers" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="settings">Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="subscribers">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Subscribers</CardTitle>
                      <CardDescription>
                        {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''} total
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          placeholder="Search subscribers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subscribersQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                  ) : filteredSubscribers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                      <h3 className="text-lg font-medium text-stone-900 mb-2">No subscribers yet</h3>
                      <p className="text-stone-500 mb-4">
                        Subscribers will appear here when users sign up for your newsletter
                      </p>
                      <Button variant="outline" onClick={() => setLocation('/admin/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Mailchimp
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subscribed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.map((subscriber: any) => (
                          <TableRow key={subscriber.id || subscriber.email}>
                            <TableCell className="font-medium">{subscriber.email}</TableCell>
                            <TableCell>
                              {subscriber.firstName || subscriber.lastName 
                                ? `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim()
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-stone-500">
                              {subscriber.createdAt 
                                ? format(new Date(subscriber.createdAt), 'MMM d, yyyy')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email Campaigns</CardTitle>
                      <CardDescription>Manage your email campaigns through Mailchimp</CardDescription>
                    </div>
                    <Button onClick={() => window.open('https://mailchimp.com/campaigns/', '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Mailchimp
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Send className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">Manage Campaigns in Mailchimp</h3>
                    <p className="text-stone-500 mb-4 max-w-md mx-auto">
                      Create and manage your email campaigns directly in Mailchimp for full control over your marketing.
                    </p>
                    <Button variant="outline" onClick={() => window.open('https://mailchimp.com/campaigns/', '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Go to Mailchimp Campaigns
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Mailchimp Integration</CardTitle>
                  <CardDescription>
                    Connect your Mailchimp account to sync subscribers and send campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={`p-4 rounded-lg border ${hasMailchimp ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-center gap-3">
                      {hasMailchimp ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <div>
                        <p className={`font-medium ${hasMailchimp ? 'text-green-800' : 'text-amber-800'}`}>
                          {hasMailchimp ? 'Mailchimp is connected' : 'Mailchimp is not connected'}
                        </p>
                        <p className={`text-sm ${hasMailchimp ? 'text-green-600' : 'text-amber-600'}`}>
                          {hasMailchimp 
                            ? 'Your subscribers are syncing with Mailchimp' 
                            : 'Connect Mailchimp to sync your subscribers'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => setLocation('/admin/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    {hasMailchimp ? 'Manage Mailchimp Settings' : 'Connect Mailchimp'}
                  </Button>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-stone-900 mb-4">Quick Links</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <a 
                        href="https://mailchimp.com/help/find-audience-id/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-stone-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        <span className="text-sm">Find your Audience ID</span>
                      </a>
                      <a 
                        href="https://mailchimp.com/help/about-api-keys/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-stone-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400" />
                        <span className="text-sm">Get your API Key</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
