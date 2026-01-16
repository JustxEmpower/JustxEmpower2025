import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Bot, Send, X, Minimize2, Maximize2, Sparkles, Brain, Lightbulb,
  TrendingUp, BarChart3, FileText, Users, ShoppingCart, Calendar,
  CheckCircle, AlertTriangle, Clock, Target, Zap, RefreshCw,
  MessageSquare, Wand2, ChevronRight, ArrowRight, Copy, Check,
  Settings, Layout, Image, Tag, Star, PenLine, Rocket, Activity,
  ListTodo, Clipboard, Eye, Edit, Trash2, Plus, Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: Suggestion[];
  actions?: QuickAction[];
}

interface Suggestion {
  type: "content" | "seo" | "engagement" | "task";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: { label: string; href: string };
}

interface QuickAction {
  label: string;
  href: string;
  icon: string;
}

interface SiteInsight {
  category: string;
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  suggestion?: string;
}

// AI System Prompts for different contexts
const SYSTEM_CONTEXTS = {
  general: `You are Aria, an elite AI Site Manager for Just Empower - a transformational platform for women's empowerment. You have deep expertise in:
- Content strategy and optimization
- SEO best practices
- User engagement and conversion
- E-commerce and event management
- Brand consistency and messaging
- Analytics interpretation
- Social media strategy

You speak with confidence, provide actionable insights, and always think strategically about growing the platform. You understand the brand's mission of "catalyzing the rise of her" and align all suggestions with this vision.`,
  
  content: `Focus on content strategy. Analyze content gaps, suggest new topics, recommend updates to existing content, and ensure messaging aligns with the brand voice.`,
  
  analytics: `Focus on analytics and metrics. Interpret data, identify trends, suggest optimizations, and provide actionable insights based on performance data.`,
  
  tasks: `Focus on task management. Help prioritize work, create action plans, track progress, and ensure nothing falls through the cracks.`,
};

// Quick prompts for common tasks
const QUICK_PROMPTS = [
  { icon: FileText, label: "Content ideas", prompt: "Suggest 5 new blog post ideas that align with the Just Empower brand mission of women's empowerment" },
  { icon: TrendingUp, label: "Growth tips", prompt: "What are the top 3 things I should focus on to grow my audience this week?" },
  { icon: Search, label: "SEO audit", prompt: "Do a quick SEO audit and suggest improvements for my site" },
  { icon: Calendar, label: "Content calendar", prompt: "Create a content calendar for the next 2 weeks with specific post ideas" },
  { icon: Users, label: "Engagement", prompt: "How can I increase user engagement on my site?" },
  { icon: ShoppingCart, label: "Sales boost", prompt: "Suggest strategies to increase product sales and event registrations" },
  { icon: Star, label: "Brand audit", prompt: "Review my brand consistency and suggest improvements" },
  { icon: Rocket, label: "Quick wins", prompt: "What are 3 quick wins I can implement today to improve my site?" },
];

export default function AdminAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<SiteInsight[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate a unique session ID for this admin session
  const sessionId = useMemo(() => `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  // Fetch site stats for insights
  const statsQuery = trpc.admin.dashboard.stats.useQuery();
  const messagesQuery = trpc.contact.list.useQuery({ limit: 5 });

  // Real AI chat mutation
  const chatMutation = trpc.ai.adminChat.useMutation({
    onError: (error) => {
      toast.error("AI Error: " + error.message);
      setIsLoading(false);
    },
  });

  // Generate insights from stats
  useEffect(() => {
    if (statsQuery.data) {
      const stats = statsQuery.data;
      const newInsights: SiteInsight[] = [
        {
          category: "Content",
          title: "Total Pages",
          value: stats.totalPages,
          suggestion: stats.publishedPages < stats.totalPages ? `${stats.totalPages - stats.publishedPages} draft pages waiting to publish` : undefined,
        },
        {
          category: "Content",
          title: "Articles",
          value: stats.totalArticles,
          suggestion: stats.totalArticles < 10 ? "Consider adding more blog content for SEO" : undefined,
        },
        {
          category: "Engagement",
          title: "Form Submissions",
          value: stats.totalFormSubmissions,
          change: stats.unreadSubmissions > 0 ? `${stats.unreadSubmissions} unread` : undefined,
          trend: stats.unreadSubmissions > 0 ? "up" : "neutral",
        },
        {
          category: "Commerce",
          title: "Products",
          value: stats.totalProducts,
          suggestion: stats.totalProducts < 5 ? "Add more products to increase revenue opportunities" : undefined,
        },
        {
          category: "Events",
          title: "Total Events",
          value: stats.totalEvents,
          suggestion: stats.totalEvents === 0 ? "Create events to build community engagement" : undefined,
        },
        {
          category: "Revenue",
          title: "Total Orders",
          value: stats.totalOrders,
          change: stats.recentOrders > 0 ? `${stats.recentOrders} recent` : undefined,
          trend: stats.recentOrders > 0 ? "up" : "neutral",
        },
      ];
      setInsights(newInsights);
    }
  }, [statsQuery.data]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm **Aria**, your AI Site Manager. 🚀

I'm here to help you manage Just Empower strategically. I can assist with:

• **Content Strategy** - Ideas, optimization, SEO
• **Analytics Insights** - Understanding your data
• **Task Management** - Prioritizing your work
• **Growth Strategies** - Engagement, conversions, revenue

What would you like to focus on today?`,
        timestamp: new Date(),
        suggestions: [
          { type: "content", title: "Review content gaps", description: "Analyze what topics are missing", priority: "medium", action: { label: "Content Editor", href: "/admin/content" } },
          { type: "engagement", title: "Check messages", description: `${messagesQuery.data?.length || 0} recent messages`, priority: "high", action: { label: "Messages", href: "/admin/messages" } },
        ],
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get current site stats to pass to AI
      const stats = statsQuery.data;
      
      const result = await chatMutation.mutateAsync({
        message: userMessage.content,
        sessionId,
        siteStats: stats ? {
          totalPages: stats.totalPages,
          totalArticles: stats.totalArticles,
          totalProducts: stats.totalProducts,
          totalEvents: stats.totalEvents,
          totalOrders: stats.totalOrders,
          totalSubscribers: stats.totalSubscribers,
          unreadSubmissions: stats.unreadSubmissions,
        } : undefined,
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI response error:", error);
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again or check that the AI service is properly configured.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center z-50 hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed z-50 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${
          isExpanded 
            ? "inset-4" 
            : "bottom-6 right-6 w-[440px] h-[600px]"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white flex items-center gap-2">
                  Aria <Badge className="bg-white/20 text-white text-xs">AI Manager</Badge>
                </h2>
                <p className="text-xs text-white/70">Your strategic site assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-[calc(100%-80px)]">
          <TabsList className="bg-slate-800/50 border-b border-white/10 rounded-none p-1 mx-2 mt-2">
            <TabsTrigger value="chat" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Chat
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Insights
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs">
              <Zap className="w-3.5 h-3.5 mr-1.5" />Quick Actions
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : ""}`}>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs text-slate-400">Aria</span>
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-violet-600 text-white rounded-br-md"
                          : "bg-slate-800 text-slate-200 rounded-bl-md"
                      }`}>
                        <div className="text-sm whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => {
                            // Handle markdown-style bold
                            const parts = line.split(/\*\*(.*?)\*\*/g);
                            return (
                              <p key={i} className="mb-1 last:mb-0">
                                {parts.map((part, j) => 
                                  j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                                )}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-slate-500 hover:text-white"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copied === message.id ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            {copied === message.id ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      )}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, i) => (
                            <div key={i} className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-medium text-slate-300">{suggestion.title}</p>
                                  <p className="text-xs text-slate-500">{suggestion.description}</p>
                                </div>
                                {suggestion.action && (
                                  <Link href={suggestion.action.href}>
                                    <Button size="sm" className="h-6 text-xs bg-violet-600 hover:bg-violet-700">
                                      {suggestion.action.label}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Prompts */}
            <div className="px-4 pb-2">
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="flex gap-2 pb-2">
                  {QUICK_PROMPTS.slice(0, 4).map((item, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 h-7 text-xs border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => handleQuickPrompt(item.prompt)}
                    >
                      <item.icon className="w-3 h-3 mr-1" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-slate-800/30">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Aria anything about managing your site..."
                  className="flex-1 min-h-[44px] max-h-32 bg-slate-800 border-white/10 text-white placeholder:text-slate-500 resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 h-[44px] px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 m-0 p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Site Overview</h3>
                <Button variant="ghost" size="sm" onClick={() => statsQuery.refetch()} className="text-slate-400 hover:text-white h-7">
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <Card key={i} className="bg-slate-800/50 border-white/10">
                    <CardContent className="p-3">
                      <p className="text-xs text-slate-500 mb-1">{insight.category}</p>
                      <p className="text-lg font-bold text-white">{insight.value}</p>
                      <p className="text-xs text-slate-400">{insight.title}</p>
                      {insight.change && (
                        <Badge className={`mt-2 text-xs ${insight.trend === "up" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                          {insight.change}
                        </Badge>
                      )}
                      {insight.suggestion && (
                        <p className="mt-2 text-xs text-amber-400 flex items-start gap-1">
                          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {insight.suggestion}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Wand2 className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white text-sm">AI Recommendation</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Based on your current metrics, focus on creating more blog content and engaging with recent form submissions to build momentum.
                      </p>
                      <Button size="sm" className="mt-3 bg-violet-600 hover:bg-violet-700 h-7 text-xs">
                        Get detailed plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="flex-1 m-0 p-4 overflow-auto">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: FileText, label: "New Article", href: "/admin/articles", color: "bg-blue-500/20 text-blue-400" },
                  { icon: Layout, label: "Edit Content", href: "/admin/content", color: "bg-purple-500/20 text-purple-400" },
                  { icon: Image, label: "Upload Media", href: "/admin/media", color: "bg-pink-500/20 text-pink-400" },
                  { icon: Calendar, label: "Create Event", href: "/admin/events", color: "bg-amber-500/20 text-amber-400" },
                  { icon: ShoppingCart, label: "Add Product", href: "/admin/products", color: "bg-emerald-500/20 text-emerald-400" },
                  { icon: MessageSquare, label: "View Messages", href: "/admin/messages", color: "bg-cyan-500/20 text-cyan-400" },
                  { icon: BarChart3, label: "Analytics", href: "/admin/analytics", color: "bg-orange-500/20 text-orange-400" },
                  { icon: Settings, label: "Settings", href: "/admin/settings", color: "bg-slate-500/20 text-slate-400" },
                ].map((action, i) => (
                  <Link key={i} href={action.href}>
                    <Card className="bg-slate-800/50 border-white/10 hover:bg-slate-800 transition-colors cursor-pointer">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                          <action.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-white">{action.label}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-white mt-6">Ask Aria</h3>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((item, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start h-auto py-2.5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    onClick={() => { setActiveTab("chat"); handleQuickPrompt(item.prompt); }}
                  >
                    <item.icon className="w-4 h-4 mr-3 text-violet-400" />
                    <span className="text-sm">{item.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
