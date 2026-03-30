import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Send, Check, CheckCheck, Pin, Archive,
  CornerUpLeft, Sparkles, X, Search, Users, Hash,
} from "lucide-react";
import CodexLogoLoader from "./CodexLogoLoader";

// ============================================================================
// CodexMessages — Unified messaging inbox (DMs + circle chats)
// ============================================================================

interface Props {
  onNavigate: (view: string) => void;
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: `${size * 0.36}px`, fontWeight: 600,
      background: "rgba(184,151,106,0.12)", color: "var(--cx-ink)",
      border: "1px solid rgba(200,188,174,0.15)",
    }}>
      {initials}
    </div>
  );
}

export default function CodexMessages({ onNavigate }: Props) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = trpc.codex.messaging.getConversations.useQuery(
    undefined,
    { refetchInterval: 5000, retry: 1, retryDelay: 5000 }
  );

  const messagesQuery = trpc.codex.messaging.getMessages.useQuery(
    { conversationId: activeConversationId!, limit: 80 },
    { enabled: !!activeConversationId, refetchInterval: 3000, retry: 1, retryDelay: 5000 }
  );

  const sendMut = trpc.codex.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
    },
  });

  const markReadMut = trpc.codex.messaging.markAsRead.useMutation({
    onSuccess: () => conversationsQuery.refetch(),
  });

  const unsendMut = trpc.codex.messaging.unsendMessage.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  const togglePinMut = trpc.codex.messaging.togglePin.useMutation({
    onSuccess: () => conversationsQuery.refetch(),
  });

  const archiveMut = trpc.codex.messaging.archiveConversation.useMutation({
    onSuccess: () => {
      conversationsQuery.refetch();
      setActiveConversationId(null);
    },
  });

  // Auto-scroll + mark read when opening a conversation
  useEffect(() => {
    if (messagesQuery.data?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (activeConversationId) markReadMut.mutate({ conversationId: activeConversationId });
    }
  }, [messagesQuery.data?.length, activeConversationId]);

  const conversations = (conversationsQuery.data || []).filter((c: any) =>
    !c.isArchived && (
      !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.otherParticipants?.some((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const messages = messagesQuery.data || [];
  const activeConv = conversations.find((c: any) => c.id === activeConversationId);

  const getConversationName = (conv: any) => {
    if (conv.type === "circle_chat") return conv.name || "Circle Chat";
    if (conv.name) return conv.name;
    return conv.otherParticipants?.map((p: any) => p.name).join(", ") || "Conversation";
  };

  const isLoading = conversationsQuery.isLoading;
  const hasError = conversationsQuery.isError;

  if (isLoading && !hasError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <CodexLogoLoader size={56} />
          <p style={{ fontSize: "0.8rem", color: "var(--cx-ink3)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", marginTop: "1rem" }}>
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "64rem", margin: "0 auto" }}>
        <div className="cx-fade-up" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2rem", fontWeight: 300, color: "var(--cx-gold)", marginBottom: "0.5rem" }}>Messages</h1>
        </div>
        <div className="cx-widget cx-fade-up cx-delay-1" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div className="cx-widget-body">
            <MessageSquare size={32} style={{ color: "var(--cx-gold)", opacity: 0.4, marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.25rem", fontWeight: 400, color: "var(--cx-cream, #f5e6d3)", marginBottom: "0.75rem" }}>
              Messages coming soon
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--cx-ink2)", lineHeight: 1.6 }}>
              Join a circle and start connecting with others to begin messaging.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-up" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "2rem", fontWeight: 300, color: "var(--cx-gold)",
          letterSpacing: "0.02em", marginBottom: "0.5rem",
        }}>
          Messages
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--cx-ink2)", lineHeight: 1.6 }}>
          Conversations between souls on the journey.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="cx-fade-up cx-delay-1" style={{
        display: "grid",
        gridTemplateColumns: activeConversationId ? "300px 1fr" : "1fr",
        gap: "1rem",
        minHeight: "60vh",
      }}>
        {/* ── Conversation List ── */}
        <div style={{
          display: activeConversationId ? undefined : "grid",
          gridTemplateColumns: activeConversationId ? undefined : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "0.5rem",
        }}>
          {/* Search bar */}
          <div style={{
            marginBottom: "0.75rem",
            gridColumn: activeConversationId ? undefined : "1 / -1",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,188,174,0.12)",
              borderRadius: "var(--cx-radius, 8px)", padding: "0.5rem 0.75rem",
            }}>
              <Search size={14} style={{ color: "var(--cx-ink3)", flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "var(--cx-cream, #f5e6d3)", fontSize: "0.82rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="cx-widget" style={{ gridColumn: "1 / -1" }}>
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <MessageSquare size={32} style={{ color: "var(--cx-gold)", opacity: 0.25, marginBottom: "1rem" }} />
                <h3 style={{
                  fontFamily: "Cormorant Garamond, serif", fontSize: "1.15rem",
                  fontWeight: 400, color: "var(--cx-cream, #f5e6d3)", marginBottom: "0.5rem",
                }}>
                  No messages yet
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  Start a conversation from within a circle's member list.
                </p>
                <button className="cx-btn-primary" onClick={() => onNavigate("community")} style={{ gap: "6px" }}>
                  <Users size={14} /> Go to Circles
                </button>
              </div>
            </div>
          ) : (
            conversations.map((conv: any) => {
              const name = getConversationName(conv);
              const isActive = conv.id === activeConversationId;
              const isCircleChat = conv.type === "circle_chat";

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={isActive ? "" : "cx-interactive"}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--cx-radius, 8px)",
                    cursor: "pointer",
                    display: "flex", gap: "10px", alignItems: "center",
                    background: isActive ? "rgba(184,151,106,0.1)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(184,151,106,0.25)" : "1px solid rgba(200,188,174,0.08)",
                    transition: "all 200ms",
                  }}
                >
                  {isCircleChat ? (
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(184,151,106,0.12)", border: "1px solid rgba(200,188,174,0.15)",
                    }}>
                      <Hash size={16} style={{ color: "var(--cx-gold)" }} />
                    </div>
                  ) : (
                    <InitialsAvatar name={name} size={40} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.15rem" }}>
                      <span style={{
                        fontSize: "0.82rem", fontWeight: conv.unreadCount > 0 ? 600 : 500,
                        color: "var(--cx-cream, #f5e6d3)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {conv.isPinned && <Pin size={10} style={{ marginRight: "4px", verticalAlign: "-1px", color: "var(--cx-gold)" }} />}
                        {name}
                      </span>
                      {conv.lastMessageAt && (
                        <span style={{ fontSize: "0.6rem", color: "var(--cx-ink3)", flexShrink: 0, marginLeft: "8px" }}>
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessagePreview && (
                      <p style={{
                        fontSize: "0.72rem",
                        color: conv.unreadCount > 0 ? "var(--cx-ink)" : "var(--cx-ink3)",
                        fontWeight: conv.unreadCount > 0 ? 500 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        margin: 0,
                      }}>
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <div style={{
                      minWidth: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--cx-gold)", color: "var(--cx-bg, #1a1614)",
                      fontSize: "0.6rem", fontWeight: 700, flexShrink: 0, padding: "0 4px",
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Active Conversation Panel ── */}
        {activeConversationId && (
          <div className="cx-widget" style={{
            display: "flex", flexDirection: "column",
            height: "calc(100vh - 280px)", minHeight: "400px",
          }}>
            {/* Conversation header */}
            <div style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid rgba(200,188,174,0.1)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setActiveConversationId(null)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--cx-ink2)", padding: "4px",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--cx-cream, #f5e6d3)" }}>
                  {activeConv ? getConversationName(activeConv) : "Conversation"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => togglePinMut.mutate({ conversationId: activeConversationId })}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: activeConv?.isPinned ? "var(--cx-gold)" : "var(--cx-ink3)",
                    padding: "4px",
                  }}
                  title="Pin"
                >
                  <Pin size={14} />
                </button>
                <button
                  onClick={() => archiveMut.mutate({ conversationId: activeConversationId })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cx-ink3)", padding: "4px" }}
                  title="Archive"
                >
                  <Archive size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "0.75rem",
              display: "flex", flexDirection: "column", gap: "0.2rem",
            }}>
              {messagesQuery.isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <CodexLogoLoader size={32} />
                </div>
              )}

              {messages.map((msg: any, idx: number) => {
                const isMine = activeConv && msg.senderId !== activeConv.otherParticipants?.[0]?.userId;
                const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;
                const [showMenu, setShowMenu] = React.useState(false);

                return (
                  <div key={msg.id} style={{
                    display: "flex", gap: "6px", alignItems: "flex-start",
                    paddingTop: showAvatar ? "0.5rem" : "0.1rem",
                    flexDirection: isMine ? "row-reverse" : "row",
                  }}>
                    {showAvatar && !isMine && <InitialsAvatar name={msg.senderName || "?"} size={26} />}
                    {showAvatar && isMine && <div style={{ width: 26 }} />}
                    <div
                      style={{ maxWidth: "75%", position: "relative" }}
                      onMouseEnter={() => setShowMenu(true)}
                      onMouseLeave={() => setShowMenu(false)}
                    >
                      {showAvatar && !isMine && (
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--cx-cream, #f5e6d3)", display: "block", marginBottom: "2px" }}>
                          {msg.senderName}
                        </span>
                      )}
                      {msg.isUnsent ? (
                        <p style={{
                          fontSize: "0.78rem", color: "var(--cx-ink3)", fontStyle: "italic",
                          padding: "0.4rem 0.65rem", margin: 0,
                          background: "rgba(255,255,255,0.03)", borderRadius: "10px",
                        }}>
                          Message unsent
                        </p>
                      ) : (
                        <>
                          <div style={{
                            padding: "0.45rem 0.7rem",
                            background: isMine ? "rgba(184,151,106,0.15)" : "rgba(255,255,255,0.06)",
                            borderRadius: isMine ? "10px 10px 4px 10px" : "10px 10px 10px 4px",
                            border: isMine ? "1px solid rgba(184,151,106,0.2)" : "1px solid rgba(255,255,255,0.08)",
                          }}>
                            <p style={{
                              fontSize: "0.78rem", color: "var(--cx-cream, #f5e6d3)",
                              lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0,
                            }}>
                              {msg.content}
                            </p>
                          </div>
                          <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            gap: "3px", marginTop: "1px", padding: "0 3px",
                          }}>
                            <span style={{ fontSize: "0.5rem", color: "var(--cx-ink3)" }}>
                              {timeAgo(msg.createdAt)}
                            </span>
                            {isMine && (
                              <span style={{ color: (msg.readReceipts?.length || 0) > 1 ? "#4ade80" : "var(--cx-ink3)" }}>
                                {(msg.readReceipts?.length || 0) > 1 ? <CheckCheck size={10} /> : <Check size={10} />}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {showMenu && isMine && !msg.isUnsent && (
                        <button
                          onClick={() => unsendMut.mutate({ messageId: msg.id })}
                          style={{
                            position: "absolute", top: -6, [isMine ? "left" : "right"]: -6,
                            background: "var(--cx-bg, #1a1614)", border: "1px solid rgba(200,188,174,0.2)",
                            borderRadius: "50%", width: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--cx-ink3)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          }}
                          title="Unsend"
                        >
                          <CornerUpLeft size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid rgba(200,188,174,0.1)" }}>
              <div style={{
                display: "flex", gap: "0.4rem", alignItems: "flex-end",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,188,174,0.12)",
                borderRadius: "var(--cx-radius, 8px)", padding: "0.4rem",
              }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                      e.preventDefault();
                      sendMut.mutate({ conversationId: activeConversationId!, content: message });
                    }
                  }}
                  style={{
                    flex: 1, padding: "0.35rem 0.5rem",
                    background: "transparent", border: "none",
                    color: "var(--cx-cream, #f5e6d3)", fontSize: "0.82rem",
                    fontFamily: "Inter, sans-serif",
                    resize: "none", outline: "none", lineHeight: 1.5,
                  }}
                />
                <button
                  className="cx-btn-primary"
                  onClick={() => {
                    if (message.trim()) sendMut.mutate({ conversationId: activeConversationId!, content: message });
                  }}
                  disabled={!message.trim() || sendMut.isPending}
                  style={{ padding: "0.35rem 0.5rem", minWidth: "auto", flexShrink: 0 }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
