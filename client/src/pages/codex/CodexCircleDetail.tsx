import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, MessageSquare, Plus, Send, Eye, Waves, Heart, Flame,
  SquareEqual, Gift, Sparkles, Pin, Lock, ChevronDown, ChevronUp,
} from "lucide-react";

// ============================================================================
// CodexCircleDetail — Thread list + message view for a circle
// ============================================================================

interface Props {
  circleId: string;
  onBack: () => void;
}

const REACTION_CONFIG = [
  { type: "witnessed", label: "Witnessed", icon: Eye, color: "var(--cx-gold)" },
  { type: "resonates", label: "Resonates", icon: Waves, color: "var(--cx-rose, #c47a8a)" },
  { type: "holding_space", label: "Holding Space", icon: Heart, color: "var(--cx-sage)" },
  { type: "flame", label: "Flame", icon: Flame, color: "#e8a84c" },
  { type: "mirror", label: "Mirror", icon: SquareEqual, color: "var(--cx-moonlight, #c5b8d0)" },
  { type: "offering", label: "Offering", icon: Gift, color: "var(--cx-gold)" },
] as const;

export default function CodexCircleDetail({ circleId, onBack }: Props) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");

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

  const circle = circleQuery.data;
  const threads = threadsQuery.data || [];
  const activeThread = threadQuery.data;

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-up" style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={activeThreadId ? () => setActiveThreadId(null) : onBack}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", color: "var(--cx-ink2)",
            fontSize: "0.8rem", cursor: "pointer", padding: 0, marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={14} /> {activeThreadId ? "Back to threads" : "Back to circles"}
        </button>

        {circle && (
          <>
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.75rem", fontWeight: 300, color: "var(--cx-gold)",
              letterSpacing: "0.02em", marginBottom: "0.25rem",
            }}>
              {circle.name}
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--cx-ink3)" }}>
              {circle.memberCount} members · {circle.circleType}
            </p>
          </>
        )}
      </div>

      {/* Weekly AI Prompt */}
      {!activeThreadId && weeklyPromptQuery.data && (
        <div className="cx-widget cx-fade-up cx-delay-1" style={{ marginBottom: "1.5rem" }}>
          <div className="cx-widget-header">
            <h3 style={{ fontSize: "0.85rem" }}>
              <Sparkles size={13} style={{ marginRight: "6px", verticalAlign: "-2px", color: "var(--cx-gold)" }} />
              This Week's Invitation
            </h3>
          </div>
          <div className="cx-widget-body">
            <p style={{
              fontSize: "0.9rem", color: "var(--cx-cream, #f5e6d3)",
              fontFamily: "Cormorant Garamond, serif", fontStyle: "italic",
              lineHeight: 1.7, letterSpacing: "0.01em",
            }}>
              {weeklyPromptQuery.data.prompt}
            </p>
          </div>
        </div>
      )}

      {/* THREAD LIST VIEW */}
      {!activeThreadId && (
        <>
          {/* New Thread Button */}
          {circle?.isMember && (
            <div className="cx-fade-up cx-delay-2" style={{ marginBottom: "1rem" }}>
              {!showNewThread ? (
                <button
                  className="cx-btn-secondary"
                  onClick={() => setShowNewThread(true)}
                  style={{ fontSize: "0.8rem", gap: "6px" }}
                >
                  <Plus size={14} /> Start a Thread
                </button>
              ) : (
                <div className="cx-widget">
                  <div className="cx-widget-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Thread title..."
                      style={{
                        width: "100%", padding: "0.625rem 0.875rem",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "var(--cx-radius, 8px)", color: "var(--cx-cream, #f5e6d3)",
                        fontSize: "0.85rem", fontFamily: "Cormorant Garamond, serif",
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
                        resize: "vertical", outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="cx-btn-primary"
                        onClick={() => createThreadMut.mutate({ circleId, title: newTitle, content: newContent })}
                        disabled={!newTitle.trim() || !newContent.trim() || createThreadMut.isPending}
                        style={{ fontSize: "0.8rem" }}
                      >
                        {createThreadMut.isPending ? "Posting..." : "Post Thread"}
                      </button>
                      <button
                        className="cx-btn-secondary"
                        onClick={() => { setShowNewThread(false); setNewTitle(""); setNewContent(""); }}
                        style={{ fontSize: "0.8rem" }}
                      >
                        Cancel
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
                <div className="cx-widget-body" style={{ textAlign: "center", padding: "2rem" }}>
                  <MessageSquare size={28} style={{ color: "var(--cx-gold)", opacity: 0.3, marginBottom: "0.75rem" }} />
                  <p style={{ fontSize: "0.85rem", color: "var(--cx-ink2)" }}>
                    No threads yet. Be the first to share.
                  </p>
                </div>
              </div>
            ) : (
              threads.map((thread, idx) => (
                <div
                  key={thread.id}
                  className={`cx-widget cx-interactive cx-fade-up cx-delay-${Math.min(idx + 3, 8)}`}
                  onClick={() => setActiveThreadId(thread.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="cx-widget-body" style={{ padding: "0.875rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.25rem" }}>
                      {thread.isPinned === 1 && <Pin size={11} style={{ color: "var(--cx-gold)" }} />}
                      {thread.isLocked === 1 && <Lock size={11} style={{ color: "var(--cx-ink3)" }} />}
                      {thread.aiGenerated === 1 && <Sparkles size={11} style={{ color: "var(--cx-gold)" }} />}
                      <h4 style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "1rem", fontWeight: 500, color: "var(--cx-cream, #f5e6d3)",
                        margin: 0,
                      }}>
                        {thread.title}
                      </h4>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--cx-ink3)" }}>
                      <span>{thread.authorName}</span>
                      <span>
                        {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"} · {new Date(thread.lastActivityAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* THREAD DETAIL VIEW */}
      {activeThreadId && activeThread && (
        <div className="cx-fade-up cx-delay-1">
          <h2 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "1.25rem", fontWeight: 400, color: "var(--cx-cream, #f5e6d3)",
            marginBottom: "1rem",
          }}>
            {activeThread.thread.title}
          </h2>

          {/* Messages */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {activeThread.messages.map((msg) => (
              <div key={msg.id} className="cx-widget" style={{
                borderLeft: msg.isAI ? "2px solid var(--cx-gold)" : "none",
              }}>
                <div className="cx-widget-body" style={{ padding: "0.875rem 1rem" }}>
                  {/* Author line */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cx-gold)" }}>
                      {msg.isAI && <Sparkles size={11} style={{ marginRight: "4px", verticalAlign: "-2px" }} />}
                      {msg.authorName}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--cx-ink3)" }}>
                      {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Content */}
                  <p style={{
                    fontSize: "0.85rem", color: "var(--cx-cream, #f5e6d3)",
                    lineHeight: 1.65, whiteSpace: "pre-wrap", margin: "0 0 0.75rem 0",
                    opacity: msg.moderationStatus === "flagged" ? 0.5 : 1,
                    fontStyle: msg.moderationStatus === "flagged" ? "italic" : "normal",
                  }}>
                    {msg.content}
                  </p>

                  {/* Reactions Bar */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {REACTION_CONFIG.map(({ type, label, icon: Icon, color }) => {
                      const count = msg.reactions[type] || 0;
                      const isActive = msg.myReactions.includes(type);
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
                            background: isActive ? `${color}15` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isActive ? `${color}40` : "rgba(255,255,255,0.1)"}`,
                            color: isActive ? color : "var(--cx-ink3)",
                            cursor: "pointer",
                            transition: "all 250ms ease",
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
          </div>

          {/* Reply Composer */}
          {circle?.isMember && !activeThread.thread.isLocked && (
            <div className="cx-widget">
              <div className="cx-widget-body" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Respond from the body, not the mind..."
                  rows={3}
                  style={{
                    flex: 1, padding: "0.625rem 0.875rem",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "var(--cx-radius, 8px)", color: "var(--cx-cream, #f5e6d3)",
                    fontSize: "0.85rem", fontFamily: "Inter, sans-serif",
                    resize: "vertical", outline: "none",
                  }}
                />
                <button
                  className="cx-btn-primary"
                  onClick={() => postMessageMut.mutate({ threadId: activeThreadId!, content: replyContent })}
                  disabled={!replyContent.trim() || postMessageMut.isPending}
                  style={{ padding: "0.625rem", minWidth: "auto" }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
