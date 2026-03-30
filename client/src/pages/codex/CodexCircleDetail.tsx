import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, MessageSquare, Plus, Send, Eye, Waves, Heart, Flame,
  SquareEqual, Gift, Sparkles, Pin, Lock, Users, X,
} from "lucide-react";
import CodexLogoLoader from "./CodexLogoLoader";

// ============================================================================
// CodexCircleDetail — Rich thread list + message view for a circle
// ============================================================================

interface Props {
  circleId: string;
  onBack: () => void;
}

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

function InitialsAvatar({ name, size = 28, isAI = false }: { name: string; size?: number; isAI?: boolean }) {
  const initials = (name || "?")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
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
  );
}

export default function CodexCircleDetail({ circleId, onBack }: Props) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const circleQuery = trpc.codex.community.getCircleDetail.useQuery({ circleId });
  const threadsQuery = trpc.codex.community.getThreads.useQuery({ circleId, limit: 30, offset: 0 });
  const threadQuery = trpc.codex.community.getThread.useQuery(
    { threadId: activeThreadId! },
    { enabled: !!activeThreadId }
  );
  const weeklyPromptQuery = trpc.codex.community.getWeeklyPrompt.useQuery({ circleId });

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

  // Auto-scroll to newest message
  useEffect(() => {
    if (activeThreadId && threadQuery.data) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadQuery.data?.messages?.length]);

  const circle = circleQuery.data;
  const threads = threadsQuery.data || [];
  const activeThread = threadQuery.data;

  if (circleQuery.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CodexLogoLoader size={56} />
      </div>
    );
  }

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "56rem", margin: "0 auto" }}>
      {/* ── Header ── */}
      <div className="cx-fade-up" style={{ marginBottom: "1.5rem" }}>
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

        {circle && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "1.75rem", fontWeight: 300, color: "var(--cx-gold)",
                letterSpacing: "0.02em", marginBottom: "0.35rem",
              }}>
                {circle.name}
              </h1>
              {circle.description && !activeThreadId && (
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
          </div>
        )}
      </div>

      {/* ── Weekly AI Prompt ── */}
      {!activeThreadId && weeklyPromptQuery.data && (
        <div className="cx-widget cx-fade-up cx-delay-1" style={{
          marginBottom: "1.5rem",
          borderLeft: "2px solid rgba(184,151,106,0.25)",
          borderRadius: "0 var(--cx-radius, 8px) var(--cx-radius, 8px) 0",
        }}>
          <div className="cx-widget-body" style={{ padding: "1.25rem 1.25rem" }}>
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

      {/* ════════════ THREAD LIST VIEW ════════════ */}
      {!activeThreadId && (
        <>
          {/* New Thread Button / Composer */}
          {circle?.isMember && (
            <div className="cx-fade-up cx-delay-2" style={{ marginBottom: "1.25rem" }}>
              {!showNewThread ? (
                <button
                  className="cx-btn-secondary"
                  onClick={() => setShowNewThread(true)}
                  style={{
                    fontSize: "0.8rem", gap: "6px", width: "100%",
                    padding: "0.875rem", justifyContent: "center",
                    borderStyle: "dashed",
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
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Give your thread a title..."
                      autoFocus
                      style={{
                        width: "100%", padding: "0.625rem 0.875rem",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "var(--cx-radius, 8px)", color: "var(--cx-cream, #f5e6d3)",
                        fontSize: "0.9rem", fontFamily: "Cormorant Garamond, serif",
                        outline: "none",
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
                      <button
                        className="cx-btn-secondary"
                        onClick={() => { setShowNewThread(false); setNewTitle(""); setNewContent(""); }}
                        style={{ fontSize: "0.8rem" }}
                      >
                        Cancel
                      </button>
                      <button
                        className="cx-btn-primary"
                        onClick={() => createThreadMut.mutate({ circleId, title: newTitle, content: newContent })}
                        disabled={!newTitle.trim() || !newContent.trim() || createThreadMut.isPending}
                        style={{ fontSize: "0.8rem", gap: "6px" }}
                      >
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
                      <InitialsAvatar
                        name={thread.authorName || "Anonymous"}
                        size={32}
                        isAI={thread.aiGenerated === 1}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title row */}
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
                        {/* Meta row */}
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

      {/* ════════════ THREAD DETAIL VIEW ════════════ */}
      {activeThreadId && activeThread && (
        <div className="cx-fade-up cx-delay-1">
          {/* Thread title */}
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

          {/* Messages */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {activeThread.messages.map((msg: any, idx: number) => (
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
                  {/* Author + time */}
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

                  {/* Content */}
                  {msg.moderationStatus === "flagged" ? (
                    <p style={{
                      fontSize: "0.8rem", color: "var(--cx-ink3)", fontStyle: "italic",
                      lineHeight: 1.6, margin: "0 0 0.6rem 0",
                      padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.03)",
                      borderRadius: "6px",
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

                  {/* Reactions Bar */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {REACTION_CONFIG.map(({ type, label, icon: Icon, color }) => {
                      const count = msg.reactions?.[type] || 0;
                      const isActive = msg.myReactions?.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) {
                              removeReactionMut.mutate({ messageId: msg.id, reactionType: type as any });
                            } else {
                              addReactionMut.mutate({ messageId: msg.id, reactionType: type as any });
                            }
                          }}
                          title={label}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "3px 8px", borderRadius: "50px",
                            fontSize: "0.65rem", fontWeight: 500,
                            background: isActive ? `${color}18` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.08)"}`,
                            color: isActive ? color : "var(--cx-ink3)",
                            cursor: "pointer",
                            transition: "all 200ms ease",
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

          {/* Reply Composer */}
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

      {/* Loading state for thread detail */}
      {activeThreadId && !activeThread && threadQuery.isLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
          <CodexLogoLoader size={48} />
        </div>
      )}
    </div>
  );
}
