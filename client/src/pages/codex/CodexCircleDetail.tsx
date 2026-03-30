import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, MessageSquare, Plus, Send, Eye, Waves, Heart, Flame,
  SquareEqual, Gift, Sparkles, Pin, Lock, Users, X, Hash,
  Check, CheckCheck, CornerUpLeft, MoreHorizontal, Archive,
} from "lucide-react";
import CodexLogoLoader from "./CodexLogoLoader";

// ============================================================================
// CodexCircleDetail — Threads + Live Chat + Members + DMs
// ============================================================================

interface Props {
  circleId: string;
  onBack: () => void;
}

type CircleTab = "discussions" | "chat" | "members";

const REACTION_CONFIG = [
  { type: "witnessed", label: "Witnessed", icon: Eye, color: "#b89769" },
  { type: "resonates", label: "Resonates", icon: Waves, color: "#c47a8a" },
  { type: "holding_space", label: "Holding Space", icon: Heart, color: "#7d8e7f" },
  { type: "flame", label: "Flame", icon: Flame, color: "#e8a84c" },
  { type: "mirror", label: "Mirror", icon: SquareEqual, color: "#c5b8d0" },
  { type: "offering", label: "Offering", icon: Gift, color: "#b89769" },
] as const;

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
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function InitialsAvatar({ name, size = 28, isAI = false, isOnline }: {
  name: string; size?: number; isAI?: boolean; isOnline?: boolean;
}) {
  const initials = (name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `${size * 0.38}px`, fontWeight: 600, letterSpacing: "0.02em",
        background: isAI
          ? "linear-gradient(135deg, rgba(184,151,106,0.25), rgba(184,123,101,0.2))"
          : "rgba(184,151,106,0.12)",
        color: isAI ? "var(--cx-gold)" : "var(--cx-ink)",
        border: isAI ? "1px solid rgba(184,151,106,0.3)" : "1px solid rgba(200,188,174,0.15)",
      }}>
        {isAI ? <Sparkles size={size * 0.45} /> : initials}
      </div>
      {isOnline !== undefined && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.32, height: size * 0.32, borderRadius: "50%",
          background: isOnline ? "#4ade80" : "var(--cx-ink3)",
          border: "2px solid var(--cx-bg, #1a1614)",
        }} />
      )}
    </div>
  );
}

// ── Read receipt indicator ─────────────────────────────────────────
function ReadReceipt({ sent, read }: { sent: boolean; read: boolean }) {
  if (!sent) return null;
  return (
    <span style={{ display: "inline-flex", color: read ? "#4ade80" : "var(--cx-ink3)", marginLeft: "4px" }}>
      {read ? <CheckCheck size={12} /> : <Check size={12} />}
    </span>
  );
}

// ── Typing indicator dots ──────────────────────────────────────────
function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "0.5rem 1rem", fontSize: "0.7rem", color: "var(--cx-ink3)",
      fontStyle: "italic",
    }}>
      <div style={{ display: "flex", gap: "3px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 4, height: 4, borderRadius: "50%", background: "var(--cx-gold)",
            animation: `cx-typing-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LIVE CHAT — real-time messaging within the circle
// ════════════════════════════════════════════════════════════════════
function CircleLiveChat({ circleId, currentUserId }: { circleId: string; currentUserId?: string }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create the circle chat conversation
  const circleChatQuery = trpc.codex.messaging.getCircleChat.useQuery({ circleId });
  const conversationId = circleChatQuery.data?.conversationId;

  const messagesQuery = trpc.codex.messaging.getMessages.useQuery(
    { conversationId: conversationId!, limit: 80 },
    { enabled: !!conversationId, refetchInterval: 4000 }
  );

  const sendMut = trpc.codex.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
    },
  });

  const markReadMut = trpc.codex.messaging.markAsRead.useMutation();

  // Auto-scroll + mark as read
  useEffect(() => {
    if (messagesQuery.data?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (conversationId) markReadMut.mutate({ conversationId });
    }
  }, [messagesQuery.data?.length]);

  const messages = messagesQuery.data || [];

  if (circleChatQuery.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
        <CodexLogoLoader size={40} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: "400px" }}>
      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1rem 0",
        display: "flex", flexDirection: "column", gap: "0.25rem",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--cx-ink3)" }}>
            <Hash size={28} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem", fontStyle: "italic", color: "var(--cx-ink2)" }}>
              The circle chat is open. Say hello.
            </p>
          </div>
        )}

        {messages.map((msg: any, idx: number) => {
          const isMine = msg.senderId === currentUserId;
          const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId ||
            new Date(msg.createdAt).getTime() - new Date(messages[idx - 1]?.createdAt).getTime() > 300000;

          return (
            <div key={msg.id} style={{
              display: "flex", gap: "8px", alignItems: "flex-start",
              padding: `${showAvatar ? "0.75rem" : "0.15rem"} 0.75rem`,
              marginLeft: showAvatar ? 0 : "38px",
            }}>
              {showAvatar && (
                <InitialsAvatar name={msg.senderName || "?"} size={28} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {showAvatar && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cx-cream, #f5e6d3)" }}>
                      {msg.senderName}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "var(--cx-ink3)" }}>
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                )}
                {msg.isUnsent ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--cx-ink3)", fontStyle: "italic" }}>
                    Message unsent
                  </p>
                ) : (
                  <p style={{
                    fontSize: "0.82rem", color: "var(--cx-cream, #f5e6d3)",
                    lineHeight: 1.55, whiteSpace: "pre-wrap", margin: 0,
                  }}>
                    {msg.content}
                    {isMine && (
                      <ReadReceipt sent={true} read={(msg.readReceipts?.length || 0) > 1} />
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{
        borderTop: "1px solid rgba(200,188,174,0.1)",
        padding: "0.75rem 0",
      }}>
        <div style={{
          display: "flex", gap: "0.5rem", alignItems: "flex-end",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,188,174,0.12)",
          borderRadius: "var(--cx-radius, 8px)", padding: "0.5rem",
        }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message the circle..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && message.trim() && conversationId) {
                e.preventDefault();
                sendMut.mutate({ conversationId, content: message });
              }
            }}
            style={{
              flex: 1, padding: "0.4rem 0.6rem",
              background: "transparent", border: "none",
              color: "var(--cx-cream, #f5e6d3)",
              fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
              resize: "none", outline: "none", lineHeight: 1.5,
              maxHeight: "120px",
            }}
          />
          <button
            className="cx-btn-primary"
            onClick={() => {
              if (message.trim() && conversationId) {
                sendMut.mutate({ conversationId, content: message });
              }
            }}
            disabled={!message.trim() || sendMut.isPending || !conversationId}
            style={{ padding: "0.4rem 0.6rem", minWidth: "auto", flexShrink: 0 }}
          >
            <Send size={14} />
          </button>
        </div>
        <p style={{ fontSize: "0.6rem", color: "var(--cx-ink3)", marginTop: "0.25rem", textAlign: "right", opacity: 0.5 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MEMBER LIST — circle members with presence + DM initiation
// ════════════════════════════════════════════════════════════════════
function CircleMemberList({ circleId, currentUserId, onOpenDM }: {
  circleId: string; currentUserId?: string;
  onOpenDM: (userId: string, userName: string) => void;
}) {
  const membersQuery = trpc.codex.messaging.getCircleMembers.useQuery({ circleId });
  const members = membersQuery.data || [];

  const online = members.filter((m: any) => m.isOnline);
  const offline = members.filter((m: any) => !m.isOnline);

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    facilitator: { label: "Facilitator", color: "var(--cx-gold)" },
    elder: { label: "Elder", color: "#c5b8d0" },
    observer: { label: "Observer", color: "var(--cx-ink3)" },
  };

  const renderMember = (member: any) => {
    const isMe = member.userId === currentUserId;
    const roleInfo = ROLE_LABELS[member.role];
    return (
      <div
        key={member.userId}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "0.6rem 0.75rem", borderRadius: "var(--cx-radius, 8px)",
          transition: "background 200ms",
          cursor: isMe ? "default" : "pointer",
        }}
        onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        onClick={() => { if (!isMe) onOpenDM(member.userId, member.userName); }}
      >
        <InitialsAvatar name={member.userName} size={32} isOnline={member.isOnline} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontSize: "0.82rem", fontWeight: 500,
              color: "var(--cx-cream, #f5e6d3)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {member.userName} {isMe && <span style={{ color: "var(--cx-ink3)", fontWeight: 400 }}>(you)</span>}
            </span>
            {roleInfo && (
              <span style={{
                fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.06em",
                color: roleInfo.color, textTransform: "uppercase",
              }}>
                {roleInfo.label}
              </span>
            )}
          </div>
          <span style={{ fontSize: "0.65rem", color: "var(--cx-ink3)" }}>
            Trust: {member.trustScore || 50}
          </span>
        </div>
        {!isMe && (
          <MessageSquare size={14} style={{ color: "var(--cx-ink3)", opacity: 0.5, flexShrink: 0 }} />
        )}
      </div>
    );
  };

  if (membersQuery.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "30vh" }}>
        <CodexLogoLoader size={40} />
      </div>
    );
  }

  return (
    <div>
      {/* Online members */}
      {online.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{
            fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#4ade80", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            Online — {online.length}
          </div>
          {online.map(renderMember)}
        </div>
      )}

      {/* Offline members */}
      <div>
        <div style={{
          fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--cx-ink3)", padding: "0.5rem 0.75rem",
        }}>
          {online.length > 0 ? `Offline — ${offline.length}` : `Members — ${members.length}`}
        </div>
        {offline.map(renderMember)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DM PANEL — Direct message conversation
// ════════════════════════════════════════════════════════════════════
function DMPanel({ userId, userName, circleId, currentUserId, onClose }: {
  userId: string; userName: string; circleId: string;
  currentUserId?: string; onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createConvMut = trpc.codex.messaging.createConversation.useMutation();
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesQuery = trpc.codex.messaging.getMessages.useQuery(
    { conversationId: conversationId!, limit: 50 },
    { enabled: !!conversationId, refetchInterval: 3000 }
  );

  const sendMut = trpc.codex.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
    },
  });

  const markReadMut = trpc.codex.messaging.markAsRead.useMutation();
  const unsendMut = trpc.codex.messaging.unsendMessage.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  // Create or find the conversation on mount
  useEffect(() => {
    createConvMut.mutate(
      { participantIds: [userId], circleId, type: "direct" },
      { onSuccess: (data) => setConversationId(data.id) }
    );
  }, [userId]);

  // Auto-scroll + mark read
  useEffect(() => {
    if (messagesQuery.data?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      if (conversationId) markReadMut.mutate({ conversationId });
    }
  }, [messagesQuery.data?.length]);

  const messages = messagesQuery.data || [];

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0,
      width: "min(380px, 90vw)", zIndex: 60,
      background: "var(--cx-bg, #1a1614)",
      borderLeft: "1px solid rgba(200,188,174,0.12)",
      display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem", borderBottom: "1px solid rgba(200,188,174,0.1)",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <InitialsAvatar name={userName} size={32} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--cx-cream, #f5e6d3)" }}>
            {userName}
          </span>
          <p style={{ fontSize: "0.65rem", color: "var(--cx-ink3)", margin: 0 }}>Direct Message</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cx-ink3)", padding: "4px" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1rem 0.75rem",
        display: "flex", flexDirection: "column", gap: "0.2rem",
      }}>
        {!conversationId && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--cx-ink3)" }}>
            <CodexLogoLoader size={32} />
          </div>
        )}

        {conversationId && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--cx-ink3)" }}>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.95rem", fontStyle: "italic", color: "var(--cx-ink2)" }}>
              Start a conversation with {userName}
            </p>
          </div>
        )}

        {messages.map((msg: any, idx: number) => {
          const isMine = msg.senderId === currentUserId;
          const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;
          const [showMenu, setShowMenu] = React.useState(false);

          return (
            <div key={msg.id} style={{
              display: "flex", gap: "6px", alignItems: "flex-start",
              paddingTop: showAvatar ? "0.6rem" : "0.1rem",
              flexDirection: isMine ? "row-reverse" : "row",
            }}>
              {showAvatar && !isMine && (
                <InitialsAvatar name={msg.senderName || "?"} size={24} />
              )}
              {showAvatar && isMine && <div style={{ width: 24 }} />}
              <div
                style={{ maxWidth: "80%", position: "relative" }}
                onMouseEnter={() => setShowMenu(true)}
                onMouseLeave={() => setShowMenu(false)}
              >
                {msg.isUnsent ? (
                  <p style={{
                    fontSize: "0.8rem", color: "var(--cx-ink3)", fontStyle: "italic",
                    padding: "0.5rem 0.75rem", margin: 0,
                    background: "rgba(255,255,255,0.03)", borderRadius: "12px",
                  }}>
                    Message unsent
                  </p>
                ) : (
                  <>
                    <div style={{
                      padding: "0.5rem 0.75rem",
                      background: isMine ? "rgba(184,151,106,0.15)" : "rgba(255,255,255,0.06)",
                      borderRadius: isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                      border: isMine ? "1px solid rgba(184,151,106,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <p style={{
                        fontSize: "0.8rem", color: "var(--cx-cream, #f5e6d3)",
                        lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0,
                      }}>
                        {msg.content}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      gap: "4px", marginTop: "2px", padding: "0 4px",
                    }}>
                      <span style={{ fontSize: "0.55rem", color: "var(--cx-ink3)" }}>
                        {timeAgo(msg.createdAt)}
                      </span>
                      {isMine && <ReadReceipt sent={true} read={(msg.readReceipts?.length || 0) > 1} />}
                    </div>
                  </>
                )}

                {/* Context menu — unsend for own messages */}
                {showMenu && isMine && !msg.isUnsent && (
                  <button
                    onClick={() => unsendMut.mutate({ messageId: msg.id })}
                    style={{
                      position: "absolute", top: -8, [isMine ? "left" : "right"]: -8,
                      background: "var(--cx-bg, #1a1614)", border: "1px solid rgba(200,188,174,0.2)",
                      borderRadius: "50%", width: 24, height: 24,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "var(--cx-ink3)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    title="Unsend"
                  >
                    <CornerUpLeft size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{
        padding: "0.75rem", borderTop: "1px solid rgba(200,188,174,0.1)",
      }}>
        <div style={{
          display: "flex", gap: "0.5rem", alignItems: "flex-end",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,188,174,0.12)",
          borderRadius: "var(--cx-radius, 8px)", padding: "0.4rem",
        }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${userName}...`}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && message.trim() && conversationId) {
                e.preventDefault();
                sendMut.mutate({ conversationId, content: message });
              }
            }}
            style={{
              flex: 1, padding: "0.35rem 0.5rem",
              background: "transparent", border: "none",
              color: "var(--cx-cream, #f5e6d3)",
              fontSize: "0.82rem", fontFamily: "Inter, sans-serif",
              resize: "none", outline: "none", lineHeight: 1.5,
            }}
          />
          <button
            className="cx-btn-primary"
            onClick={() => {
              if (message.trim() && conversationId) {
                sendMut.mutate({ conversationId, content: message });
              }
            }}
            disabled={!message.trim() || sendMut.isPending || !conversationId}
            style={{ padding: "0.35rem 0.5rem", minWidth: "auto", flexShrink: 0 }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════

export default function CodexCircleDetail({ circleId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<CircleTab>("discussions");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [dmTarget, setDmTarget] = useState<{ userId: string; userName: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const circleQuery = trpc.codex.community.getCircleDetail.useQuery({ circleId });
  const threadsQuery = trpc.codex.community.getThreads.useQuery(
    { circleId, limit: 30, offset: 0 },
    { enabled: activeTab === "discussions" }
  );
  const threadQuery = trpc.codex.community.getThread.useQuery(
    { threadId: activeThreadId! },
    { enabled: !!activeThreadId }
  );
  const weeklyPromptQuery = trpc.codex.community.getWeeklyPrompt.useQuery({ circleId });

  // Presence heartbeat — ping every 30s while viewing circle
  const heartbeatMut = trpc.codex.messaging.heartbeat.useMutation();
  useEffect(() => {
    heartbeatMut.mutate({ circleId });
    const interval = setInterval(() => heartbeatMut.mutate({ circleId }), 30000);
    return () => clearInterval(interval);
  }, [circleId]);

  const createThreadMut = trpc.codex.community.createThread.useMutation({
    onSuccess: (data) => {
      setShowNewThread(false);
      setNewTitle("");
      setNewContent("");
      threadsQuery.refetch();
      setActiveThreadId(data.threadId);
    },
  });

  const postMessageMut = trpc.codex.community.postMessage.useMutation({
    onSuccess: () => {
      setReplyContent("");
      threadQuery.refetch();
    },
  });

  const addReactionMut = trpc.codex.community.addReaction.useMutation({
    onSuccess: () => threadQuery.refetch(),
  });

  const removeReactionMut = trpc.codex.community.removeReaction.useMutation({
    onSuccess: () => threadQuery.refetch(),
  });

  // Auto-scroll to newest message in thread view
  useEffect(() => {
    if (activeThreadId && threadQuery.data) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadQuery.data?.messages?.length]);

  const circle = circleQuery.data;
  const threads = threadsQuery.data || [];
  const activeThread = threadQuery.data;
  const currentUserId = (circle as any)?.currentUserId;

  if (circleQuery.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CodexLogoLoader size={56} />
      </div>
    );
  }

  const TAB_CONFIG = [
    { key: "discussions" as const, label: "Discussions", icon: <MessageSquare size={13} />, count: threads.length },
    { key: "chat" as const, label: "Chat", icon: <Hash size={13} /> },
    { key: "members" as const, label: "Members", icon: <Users size={13} />, count: circle?.memberCount },
  ];

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "56rem", margin: "0 auto" }}>
      {/* ── Header ── */}
      <div className="cx-fade-up" style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={activeThreadId ? () => setActiveThreadId(null) : onBack}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", color: "var(--cx-ink2)",
            fontSize: "0.8rem", cursor: "pointer", padding: 0, marginBottom: "1rem",
            transition: "color 200ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--cx-gold)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--cx-ink2)")}
        >
          <ArrowLeft size={14} /> {activeThreadId ? "Back to threads" : "Back to circles"}
        </button>

        {circle && !activeThreadId && (
          <div>
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.75rem", fontWeight: 300, color: "var(--cx-gold)",
              letterSpacing: "0.02em", marginBottom: "0.35rem",
            }}>
              {circle.name}
            </h1>
            {circle.description && (
              <p style={{ fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.6, maxWidth: "36rem", marginBottom: "0.5rem" }}>
                {circle.description}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.7rem", color: "var(--cx-ink3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <Users size={11} /> {circle.memberCount} members
              </span>
              <span>·</span>
              <span>{circle.circleType}</span>
              {circle.isMember && (
                <>
                  <span>·</span>
                  <span style={{ color: "var(--cx-sage, #7d8e7f)", fontWeight: 500 }}>Joined</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      {!activeThreadId && (
        <div className="cx-fade-up cx-delay-1" style={{
          display: "flex", gap: "0.35rem", marginBottom: "1.25rem",
          borderBottom: "1px solid rgba(200,188,174,0.1)", paddingBottom: "0.5rem",
        }}>
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px 8px 0 0",
                fontSize: "0.78rem", fontWeight: 500,
                letterSpacing: "0.03em",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--cx-gold)" : "2px solid transparent",
                background: activeTab === tab.key ? "rgba(184,151,106,0.08)" : "transparent",
                color: activeTab === tab.key ? "var(--cx-gold)" : "var(--cx-ink2)",
                cursor: "pointer",
                transition: "all 250ms ease",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {tab.icon} {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: "0.6rem", fontWeight: 600,
                  background: activeTab === tab.key ? "rgba(184,151,106,0.15)" : "rgba(255,255,255,0.06)",
                  padding: "1px 6px", borderRadius: "50px",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Weekly AI Prompt (discussions tab only) ── */}
      {!activeThreadId && activeTab === "discussions" && weeklyPromptQuery.data && (
        <div className="cx-widget cx-fade-up cx-delay-1" style={{
          marginBottom: "1.25rem",
          borderLeft: "2px solid rgba(184,151,106,0.25)",
          borderRadius: "0 var(--cx-radius, 8px) var(--cx-radius, 8px) 0",
        }}>
          <div className="cx-widget-body" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.75rem" }}>
              <Sparkles size={13} style={{ color: "var(--cx-gold)" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", color: "var(--cx-gold)", textTransform: "uppercase" }}>
                This Week's Invitation
              </span>
            </div>
            <p style={{
              fontSize: "1rem", color: "var(--cx-cream, #f5e6d3)",
              fontFamily: "Cormorant Garamond, serif", fontStyle: "italic",
              lineHeight: 1.7, letterSpacing: "0.01em", margin: 0,
            }}>
              "{weeklyPromptQuery.data.prompt}"
            </p>
          </div>
        </div>
      )}

      {/* ═══════════ DISCUSSIONS TAB ═══════════ */}
      {!activeThreadId && activeTab === "discussions" && (
        <>
          {circle?.isMember && (
            <div className="cx-fade-up cx-delay-2" style={{ marginBottom: "1.25rem" }}>
              {!showNewThread ? (
                <button
                  className="cx-btn-secondary"
                  onClick={() => setShowNewThread(true)}
                  style={{
                    fontSize: "0.8rem", gap: "6px", width: "100%",
                    padding: "0.875rem", justifyContent: "center", borderStyle: "dashed",
                  }}
                >
                  <Plus size={14} /> Start a Thread
                </button>
              ) : (
                <div className="cx-widget" style={{ border: "1px solid rgba(184,151,106,0.2)" }}>
                  <div className="cx-widget-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cx-gold)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        New Thread
                      </span>
                      <button onClick={() => { setShowNewThread(false); setNewTitle(""); setNewContent(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cx-ink3)", padding: "2px" }}>
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="text" value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Give your thread a title..."
                      autoFocus
                      style={{
                        width: "100%", padding: "0.625rem 0.875rem",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "var(--cx-radius, 8px)", color: "var(--cx-cream, #f5e6d3)",
                        fontSize: "0.9rem", fontFamily: "Cormorant Garamond, serif", outline: "none",
                      }}
                    />
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="What's alive in you right now..."
                      rows={4}
                      style={{
                        width: "100%", padding: "0.625rem 0.875rem",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "var(--cx-radius, 8px)", color: "var(--cx-cream, #f5e6d3)",
                        fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
                        resize: "vertical", outline: "none", lineHeight: 1.6,
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button className="cx-btn-secondary"
                        onClick={() => { setShowNewThread(false); setNewTitle(""); setNewContent(""); }}
                        style={{ fontSize: "0.8rem" }}>
                        Cancel
                      </button>
                      <button className="cx-btn-primary"
                        onClick={() => createThreadMut.mutate({ circleId, title: newTitle, content: newContent })}
                        disabled={!newTitle.trim() || !newContent.trim() || createThreadMut.isPending}
                        style={{ fontSize: "0.8rem", gap: "6px" }}>
                        {createThreadMut.isPending ? "Posting..." : <><Send size={12} /> Post Thread</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thread Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {threads.length === 0 ? (
              <div className="cx-widget cx-fade-up cx-delay-3">
                <div className="cx-widget-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                  <MessageSquare size={32} style={{ color: "var(--cx-gold)", opacity: 0.25, marginBottom: "1rem" }} />
                  <h3 style={{
                    fontFamily: "Cormorant Garamond, serif", fontSize: "1.15rem",
                    fontWeight: 400, color: "var(--cx-cream, #f5e6d3)", marginBottom: "0.5rem",
                  }}>
                    The circle is quiet
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.6 }}>
                    Be the first to break the silence. Start a thread to share what's moving through you.
                  </p>
                </div>
              </div>
            ) : (
              threads.map((thread: any, idx: number) => (
                <div
                  key={thread.id}
                  className={`cx-widget cx-interactive cx-fade-up cx-delay-${Math.min(idx + 3, 8)}`}
                  onClick={() => setActiveThreadId(thread.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="cx-widget-body" style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <InitialsAvatar name={thread.authorName || "Anonymous"} size={32} isAI={thread.aiGenerated === 1} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.2rem" }}>
                          {thread.isPinned === 1 && <Pin size={11} style={{ color: "var(--cx-gold)", flexShrink: 0 }} />}
                          {thread.isLocked === 1 && <Lock size={11} style={{ color: "var(--cx-ink3)", flexShrink: 0 }} />}
                          <h4 style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: "1rem", fontWeight: 500, color: "var(--cx-cream, #f5e6d3)",
                            margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {thread.title}
                          </h4>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "var(--cx-ink3)" }}>
                          <span>{thread.authorName || "Anonymous"}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              <MessageSquare size={10} /> {thread.replyCount}
                            </span>
                            <span>{timeAgo(thread.lastActivityAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ═══════════ CHAT TAB ═══════════ */}
      {!activeThreadId && activeTab === "chat" && (
        <div className="cx-fade-up cx-delay-1">
          <CircleLiveChat circleId={circleId} currentUserId={currentUserId} />
        </div>
      )}

      {/* ═══════════ MEMBERS TAB ═══════════ */}
      {!activeThreadId && activeTab === "members" && (
        <div className="cx-fade-up cx-delay-1">
          <CircleMemberList
            circleId={circleId}
            currentUserId={currentUserId}
            onOpenDM={(userId, userName) => setDmTarget({ userId, userName })}
          />
        </div>
      )}

      {/* ═══════════ THREAD DETAIL VIEW ═══════════ */}
      {activeThreadId && activeThread && (
        <div className="cx-fade-up cx-delay-1">
          <div style={{
            marginBottom: "1.5rem", paddingBottom: "1rem",
            borderBottom: "1px solid rgba(200,188,174,0.1)",
          }}>
            <h2 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.35rem", fontWeight: 400, color: "var(--cx-cream, #f5e6d3)",
              lineHeight: 1.4, marginBottom: "0.35rem",
            }}>
              {activeThread.thread.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", color: "var(--cx-ink3)" }}>
              <span>{activeThread.thread.authorName}</span>
              <span>·</span>
              <span>{timeAgo(activeThread.thread.createdAt)}</span>
              <span>·</span>
              <span>{activeThread.messages.length} message{activeThread.messages.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {activeThread.messages.map((msg: any) => (
              <div key={msg.id} style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                padding: "1rem",
                background: msg.isAI ? "rgba(184,151,106,0.04)" : "rgba(255,255,255,0.04)",
                borderRadius: "var(--cx-radius, 8px)",
                borderLeft: msg.isAI ? "2px solid rgba(184,151,106,0.3)" : "2px solid transparent",
                transition: "background 200ms",
              }}>
                <InitialsAvatar name={msg.authorName || "?"} size={30} isAI={!!msg.isAI} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600,
                      color: msg.isAI ? "var(--cx-gold)" : "var(--cx-cream, #f5e6d3)",
                    }}>
                      {msg.isAI && <Sparkles size={10} style={{ marginRight: "4px", verticalAlign: "-1px" }} />}
                      {msg.authorName}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--cx-ink3)" }}>
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  {msg.moderationStatus === "flagged" ? (
                    <p style={{
                      fontSize: "0.8rem", color: "var(--cx-ink3)", fontStyle: "italic",
                      lineHeight: 1.6, margin: "0 0 0.6rem 0",
                      padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.03)", borderRadius: "6px",
                    }}>
                      This message is under review.
                    </p>
                  ) : (
                    <p style={{
                      fontSize: "0.85rem", color: "var(--cx-cream, #f5e6d3)",
                      lineHeight: 1.65, whiteSpace: "pre-wrap", margin: "0 0 0.6rem 0",
                    }}>
                      {msg.content}
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {REACTION_CONFIG.map(({ type, label, icon: Icon, color }) => {
                      const count = msg.reactions?.[type] || 0;
                      const isActive = msg.myReactions?.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) removeReactionMut.mutate({ messageId: msg.id, reactionType: type as any });
                            else addReactionMut.mutate({ messageId: msg.id, reactionType: type as any });
                          }}
                          title={label}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "3px 8px", borderRadius: "50px",
                            fontSize: "0.65rem", fontWeight: 500,
                            background: isActive ? `${color}18` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.08)"}`,
                            color: isActive ? color : "var(--cx-ink3)",
                            cursor: "pointer", transition: "all 200ms ease",
                            opacity: count > 0 || isActive ? 1 : 0.5,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = `${color}12`; }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = (count > 0 || isActive) ? "1" : "0.5";
                            e.currentTarget.style.background = isActive ? `${color}18` : "rgba(255,255,255,0.03)";
                          }}
                        >
                          <Icon size={11} />
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {circle?.isMember && !activeThread.thread.isLocked && (
            <div style={{
              position: "sticky", bottom: 0, paddingTop: "0.75rem", paddingBottom: "0.5rem",
              background: "linear-gradient(to top, var(--cx-bg, #f2ece3) 80%, transparent)",
            }}>
              <div style={{
                display: "flex", gap: "0.5rem", alignItems: "flex-end",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(200,188,174,0.12)",
                borderRadius: "var(--cx-radius, 8px)", padding: "0.625rem",
              }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Respond from the body, not the mind..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && replyContent.trim()) {
                      postMessageMut.mutate({ threadId: activeThreadId!, content: replyContent });
                    }
                  }}
                  style={{
                    flex: 1, padding: "0.5rem 0.75rem",
                    background: "transparent", border: "none",
                    color: "var(--cx-cream, #f5e6d3)",
                    fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
                    resize: "none", outline: "none", lineHeight: 1.5,
                  }}
                />
                <button
                  className="cx-btn-primary"
                  onClick={() => postMessageMut.mutate({ threadId: activeThreadId!, content: replyContent })}
                  disabled={!replyContent.trim() || postMessageMut.isPending}
                  style={{ padding: "0.5rem 0.75rem", minWidth: "auto", flexShrink: 0 }}
                >
                  <Send size={14} />
                </button>
              </div>
              <p style={{ fontSize: "0.6rem", color: "var(--cx-ink3)", marginTop: "0.35rem", textAlign: "right", opacity: 0.6 }}>
                ⌘+Enter to send
              </p>
            </div>
          )}
        </div>
      )}

      {/* Thread loading */}
      {activeThreadId && !activeThread && threadQuery.isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
          <CodexLogoLoader size={48} />
        </div>
      )}

      {/* DM Slide-over Panel */}
      {dmTarget && (
        <>
          <div
            onClick={() => setDmTarget(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              zIndex: 55, backdropFilter: "blur(2px)",
            }}
          />
          <DMPanel
            userId={dmTarget.userId}
            userName={dmTarget.userName}
            circleId={circleId}
            currentUserId={currentUserId}
            onClose={() => setDmTarget(null)}
          />
        </>
      )}
    </div>
  );
}
