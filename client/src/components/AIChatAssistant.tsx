import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

interface Message {
  id: string | number;
  role: "user" | "assistant";
  message: string;
  timestamp: Date;
  feedbackGiven?: boolean;
}

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const [visitorId] = useState(() => {
    // Try to get existing visitor ID from localStorage
    const existing = localStorage.getItem("je_visitor_id");
    if (existing) return existing;
    // Create new visitor ID
    const newId = nanoid();
    localStorage.setItem("je_visitor_id", newId);
    return newId;
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();
  const settingsQuery = trpc.ai.getSettings.useQuery();
  const feedbackMutation = trpc.ai.submitFeedback.useMutation();
  const trackVisitorMutation = trpc.ai.trackVisitor.useMutation();
  const visitorProfileQuery = trpc.ai.getVisitorProfile.useQuery(
    { visitorId },
    { enabled: isOpen }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  const historyQuery = trpc.ai.getHistory.useQuery(
    { sessionId },
    { enabled: isOpen }
  );

  useEffect(() => {
    if (historyQuery.data) {
      const loadedMessages: Message[] = historyQuery.data.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        message: msg.message,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(loadedMessages);
    }
  }, [historyQuery.data]);

  // Track visitor on mount
  useEffect(() => {
    if (isOpen) {
      trackVisitorMutation.mutate({ visitorId });
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      message: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: input,
        sessionId,
        visitorId,
        context: window.location.pathname,
      });

      const aiMessage: Message = {
        id: Date.now(), // Use timestamp as temp ID until we get the real ID from DB
        role: "assistant",
        message: response.message,
        timestamp: new Date(),
        feedbackGiven: false,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        message: "I apologize, but I'm experiencing technical difficulties at the moment. Please try again shortly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (messageId: string | number, rating: "positive" | "negative") => {
    try {
      await feedbackMutation.mutateAsync({
        conversationId: typeof messageId === "number" ? messageId : parseInt(messageId),
        visitorId,
        rating,
      });

      // Mark message as feedback given
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedbackGiven: true } : msg
        )
      );

      toast.success(rating === "positive" ? "Thank you for your feedback!" : "We'll work on improving.");
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  // Don't render if chat is disabled
  if (settingsQuery.data && !settingsQuery.data.chatEnabled) {
    return null;
  }

  const bubbleColor = settingsQuery.data?.chatBubbleColor || "#000000";
  const position = settingsQuery.data?.chatBubblePosition || "bottom-right";

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }[position];

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses} z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 overflow-hidden group`}
          style={{
            background: 'linear-gradient(135deg, #EDE5D8 0%, #E8E0D2 50%, #EAE2D5 100%)',
            border: '1px solid rgba(184,123,101,0.2)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
          }}
          aria-label="Open AI Chat Assistant"
        >
          {/* Glow halo */}
          <div style={{
            position: 'absolute', width: 50, height: 50, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,151,106,0.12), transparent 70%)',
            pointerEvents: 'none',
          }} />
          {/* Vesica Piscis — Living Codex emblem */}
          <svg
            width={28} height={28} viewBox="0 0 40 40" fill="none"
            style={{ filter: 'drop-shadow(0 0 4px rgba(184,123,101,0.25))', position: 'relative' }}
          >
            <circle cx="15" cy="20" r="11" stroke="#B87B65" strokeWidth="1.2" fill="none" opacity="0.85" />
            <circle cx="25" cy="20" r="11" stroke="#B87B65" strokeWidth="1.2" fill="none" opacity="0.85" />
            <defs>
              <clipPath id="vesica-fab">
                <circle cx="15" cy="20" r="11" />
              </clipPath>
            </defs>
            <circle cx="25" cy="20" r="11" fill="rgba(184,123,101,0.12)" clipPath="url(#vesica-fab)" />
            <path d="M20 17.5 L21.5 20 L20 22.5 L18.5 20 Z" fill="#B87B65" opacity="0.9" />
            <circle cx="20" cy="12.2" r="0.7" fill="#B87B65" opacity="0.5" />
            <circle cx="20" cy="27.8" r="0.7" fill="#B87B65" opacity="0.5" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses} z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200`}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: bubbleColor }}
          >
            <div>
              <h3 className="font-semibold text-lg">Just Empower® AI</h3>
              <p className="text-xs opacity-90">Sovereign guidance & support</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Welcome. How may I support your journey today?
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        msg.role === "user" ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {msg.role === "assistant" && !msg.feedbackGiven && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(msg.id, "positive")}
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        title="Helpful response"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, "negative")}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Needs improvement"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {msg.role === "assistant" && msg.feedbackGiven && (
                    <p className="text-xs text-gray-400">Thank you for your feedback</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                style={{ backgroundColor: bubbleColor }}
                className="text-white hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by Just Empower® AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}
