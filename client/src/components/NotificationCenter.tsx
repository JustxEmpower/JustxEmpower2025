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
  MailOpen, Archive, RefreshCw, Sparkles, Zap, TrendingUp, Truck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number | string;
  type: "message" | "order" | "event" | "user" | "system" | "alert" | "success" | "payment" | "shipment" | "refund" | "dispute" | "event_registration" | "low_stock";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  source?: "db" | "local";
}

const typeConfig: Record<string, { icon: any; bg: string; text: string }> = {
  message: { icon: MessageSquare, bg: "bg-blue-500/20", text: "text-blue-400" },
  order: { icon: ShoppingCart, bg: "bg-emerald-500/20", text: "text-emerald-400" },
  event: { icon: Calendar, bg: "bg-purple-500/20", text: "text-purple-400" },
  event_registration: { icon: Calendar, bg: "bg-purple-500/20", text: "text-purple-400" },
  user: { icon: Users, bg: "bg-cyan-500/20", text: "text-cyan-400" },
  system: { icon: Settings, bg: "bg-slate-500/20", text: "text-slate-400" },
  alert: { icon: AlertTriangle, bg: "bg-amber-500/20", text: "text-amber-400" },
  success: { icon: Check, bg: "bg-green-500/20", text: "text-green-400" },
  payment: { icon: DollarSign, bg: "bg-green-500/20", text: "text-green-400" },
  shipment: { icon: Truck, bg: "bg-indigo-500/20", text: "text-indigo-400" },
  refund: { icon: DollarSign, bg: "bg-red-500/20", text: "text-red-400" },
  dispute: { icon: AlertTriangle, bg: "bg-red-500/20", text: "text-red-400" },
  low_stock: { icon: Package, bg: "bg-orange-500/20", text: "text-orange-400" },
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [localNotifs, setLocalNotifs] = useState<Notification[]>([]);

  // DB-backed notifications
  const dbNotifsQuery = trpc.adminNotifications.list.useQuery({ limit: 50 }, { enabled: isOpen });
  const markReadMut = trpc.adminNotifications.markRead.useMutation({ onSuccess: () => dbNotifsQuery.refetch() });
  const markAllReadMut = trpc.adminNotifications.markAllRead.useMutation({ onSuccess: () => dbNotifsQuery.refetch() });
  const dismissMut = trpc.adminNotifications.dismiss.useMutation({ onSuccess: () => dbNotifsQuery.refetch() });
  const dismissAllMut = trpc.adminNotifications.dismissAll.useMutation({ onSuccess: () => dbNotifsQuery.refetch() });

  // Legacy data sources
  const messagesQuery = trpc.contact.list.useQuery({ limit: 5 });
  const statsQuery = trpc.admin.dashboard.stats.useQuery();

  useEffect(() => {
    const notifs: Notification[] = [];
    if (messagesQuery.data) {
      messagesQuery.data.forEach((msg: any, i: number) => {
        if (i < 3) {
          notifs.push({
            id: `msg-${msg.id}`, type: "message",
            title: `New message from ${msg.firstName} ${msg.lastName}`,
            description: msg.subject || msg.message?.substring(0, 50) + "...",
            timestamp: new Date(msg.createdAt), read: msg.status !== "new",
            link: "/admin/messages", priority: "medium", source: "local",
          });
        }
      });
    }
    if (statsQuery.data?.unreadSubmissions > 0) {
      notifs.push({
        id: "unread-forms", type: "alert",
        title: `${statsQuery.data.unreadSubmissions} unread form submissions`,
        description: "You have new form submissions waiting for review",
        timestamp: new Date(), read: false, link: "/admin/forms", priority: "high", source: "local",
      });
    }
    setLocalNotifs(notifs);
  }, [messagesQuery.data, statsQuery.data]);

  // Merge DB notifications + local notifications
  const dbNotifs: Notification[] = (dbNotifsQuery.data?.notifications || []).map((n: any) => ({
    id: n.id, type: n.type, title: n.title, description: n.message || "",
    timestamp: new Date(n.createdAt), read: n.read === 1, link: n.link || undefined,
    priority: n.priority, source: "db" as const,
  }));

  const allNotifications = [...dbNotifs, ...localNotifs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const unreadCount = allNotifications.filter(n => !n.read).length;
  const filteredNotifications = filter === "unread" ? allNotifications.filter(n => !n.read) : allNotifications;

  const handleMarkRead = (n: Notification) => {
    if (n.source === "db" && typeof n.id === "number") markReadMut.mutate({ id: n.id });
  };

  const handleDelete = (n: Notification) => {
    if (n.source === "db" && typeof n.id === "number") dismissMut.mutate({ id: n.id });
    else setLocalNotifs(prev => prev.filter(ln => ln.id !== n.id));
  };

  const handleMarkAllRead = () => { markAllReadMut.mutate(); };
  const handleClearAll = () => { dismissAllMut.mutate(); setLocalNotifs([]); };

  if (!isOpen) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
                <p className="text-xs text-slate-400">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={filter === "all" ? "default" : "ghost"} size="sm" onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}>All</Button>
            <Button variant={filter === "unread" ? "default" : "ghost"} size="sm" onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}>
              Unread {unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white">{unreadCount}</Badge>}
            </Button>
            <div className="flex-1" />
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-purple-400 hover:text-purple-300">
                <CheckCheck className="w-4 h-4 mr-1" />Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">All caught up!</h3>
              <p className="text-slate-400 text-sm text-center">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {filteredNotifications.map((notification, i) => {
                  const config = typeConfig[notification.type] || typeConfig.system;
                  const Icon = config.icon;
                  return (
                    <motion.div key={`${notification.source}-${notification.id}`}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group relative p-3 rounded-xl mb-2 transition-all ${notification.read ? "bg-white/5 hover:bg-white/10" : "bg-purple-500/10 hover:bg-purple-500/20"}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${config.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium text-sm ${notification.read ? "text-slate-300" : "text-white"}`}>{notification.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notification.description}</p>
                            </div>
                            {!notification.read && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            {(notification.priority === "high" || notification.priority === "urgent") && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">{notification.priority === "urgent" ? "Urgent" : "High"}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                              onClick={() => handleMarkRead(notification)}><Check className="w-3.5 h-3.5" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(notification)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      {notification.link && (
                        <Link href={notification.link}><a className="absolute inset-0 rounded-xl" onClick={onClose} /></Link>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-1" />Clear all
            </Button>
            <Link href="/admin/orders">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={onClose}>
                View orders <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function NotificationBell({ unreadCount: _externalCount = 0 }: { unreadCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const notifsQuery = trpc.adminNotifications.list.useQuery({ limit: 1, unreadOnly: true }, { refetchInterval: 30000 });
  const dbUnread = notifsQuery.data?.unreadCount || 0;
  const totalUnread = dbUnread + _externalCount;

  return (
    <>
      <Button variant="outline" size="icon" className="relative" onClick={() => setIsOpen(true)}>
        <Bell className="w-4 h-4" />
        {totalUnread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </motion.span>
        )}
      </Button>
      <AnimatePresence>{isOpen && <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />}</AnimatePresence>
    </>
  );
}
