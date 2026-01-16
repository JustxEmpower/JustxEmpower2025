import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Bell, X, Check, CheckCheck, Trash2, Mail, MessageSquare, ShoppingCart,
  Calendar, Users, FileText, Image, AlertCircle, AlertTriangle, Info,
  Package, DollarSign, Star, Settings, ExternalLink, Clock, Filter,
  MailOpen, Archive, RefreshCw, Sparkles, Zap, TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "message" | "order" | "event" | "user" | "system" | "alert" | "success";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  icon?: string;
  priority?: "low" | "medium" | "high";
}

const typeConfig = {
  message: { icon: MessageSquare, color: "blue", bg: "bg-blue-500/20", text: "text-blue-400" },
  order: { icon: ShoppingCart, color: "emerald", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  event: { icon: Calendar, color: "purple", bg: "bg-purple-500/20", text: "text-purple-400" },
  user: { icon: Users, color: "cyan", bg: "bg-cyan-500/20", text: "text-cyan-400" },
  system: { icon: Settings, color: "slate", bg: "bg-slate-500/20", text: "text-slate-400" },
  alert: { icon: AlertTriangle, color: "amber", bg: "bg-amber-500/20", text: "text-amber-400" },
  success: { icon: Check, color: "green", bg: "bg-green-500/20", text: "text-green-400" },
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from various sources
  const messagesQuery = trpc.contact.list.useQuery({ limit: 10 });
  const statsQuery = trpc.admin.dashboard.stats.useQuery();

  // Generate notifications from real data
  useEffect(() => {
    const notifs: Notification[] = [];
    
    // Contact messages
    if (messagesQuery.data) {
      messagesQuery.data.forEach((msg: any, i: number) => {
        if (i < 5) {
          notifs.push({
            id: `msg-${msg.id}`,
            type: "message",
            title: `New message from ${msg.firstName} ${msg.lastName}`,
            description: msg.subject || msg.message?.substring(0, 50) + "...",
            timestamp: new Date(msg.createdAt),
            read: msg.status !== "new",
            link: "/admin/messages",
            priority: "medium",
          });
        }
      });
    }

    // Stats-based notifications
    if (statsQuery.data) {
      const stats = statsQuery.data;
      
      if (stats.unreadSubmissions > 0) {
        notifs.push({
          id: "unread-forms",
          type: "alert",
          title: `${stats.unreadSubmissions} unread form submissions`,
          description: "You have new form submissions waiting for review",
          timestamp: new Date(),
          read: false,
          link: "/admin/forms",
          priority: "high",
        });
      }

      if (stats.recentOrders > 0) {
        notifs.push({
          id: "recent-orders",
          type: "order",
          title: `${stats.recentOrders} new orders`,
          description: "Recent orders need your attention",
          timestamp: new Date(),
          read: false,
          link: "/admin/orders",
          priority: "high",
        });
      }

      if (stats.totalSubscribers > 0) {
        notifs.push({
          id: "subscribers",
          type: "success",
          title: `${stats.totalSubscribers} newsletter subscribers`,
          description: "Your community is growing!",
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          link: "/admin/settings",
          priority: "low",
        });
      }
    }

    // Add system notifications
    notifs.push({
      id: "welcome",
      type: "system",
      title: "Welcome to Just Empower Admin",
      description: "Your dashboard is ready. Explore all the features!",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      priority: "low",
    });

    notifs.push({
      id: "ai-training",
      type: "success",
      title: "AI Training Center Available",
      description: "Train your AI assistant with custom Q&A pairs",
      timestamp: new Date(Date.now() - 7200000),
      read: true,
      link: "/admin/ai-training",
      priority: "low",
    });

    // Sort by timestamp (newest first)
    notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(notifs);
    setIsLoading(false);
  }, [messagesQuery.data, statsQuery.data]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-16 right-4 w-[420px] max-h-[calc(100vh-100px)] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Notifications</h2>
                <p className="text-xs text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            <Button 
              variant={filter === "all" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}
            >
              All
            </Button>
            <Button 
              variant={filter === "unread" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}
            >
              Unread {unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white">{unreadCount}</Badge>}
            </Button>
            <div className="flex-1" />
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-purple-400 hover:text-purple-300">
                <CheckCheck className="w-4 h-4 mr-1" />Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">All caught up!</h3>
              <p className="text-slate-400 text-sm text-center">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {filteredNotifications.map((notification, i) => {
                  const config = typeConfig[notification.type];
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group relative p-3 rounded-xl mb-2 transition-all ${
                        notification.read ? "bg-white/5 hover:bg-white/10" : "bg-purple-500/10 hover:bg-purple-500/20"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${config.text}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium text-sm ${notification.read ? "text-slate-300" : "text-white"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                {notification.description}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            
                            {notification.priority === "high" && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">Urgent</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Link overlay */}
                      {notification.link && (
                        <Link href={notification.link}>
                          <a className="absolute inset-0 rounded-xl" onClick={onClose} />
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-400 hover:text-white"
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4 mr-1" />Clear all
            </Button>
            <Link href="/admin/messages">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={onClose}>
                View all messages
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Export the bell button component for easy use
export function NotificationBell({ unreadCount = 0 }: { unreadCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </Button>
      
      <AnimatePresence>
        {isOpen && <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
