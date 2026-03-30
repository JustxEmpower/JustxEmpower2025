import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users, Compass, ArrowRight, Sparkles, MessageSquare,
  Crown, Shield, Zap, Circle as CircleIcon, Hash,
} from "lucide-react";
import CodexCircleDetail from "./CodexCircleDetail";
import CodexLogoLoader from "./CodexLogoLoader";

// ============================================================================
// CodexCommunity — Full community hub with My Circles + Discover
// ============================================================================

interface Props {
  onNavigate: (view: string) => void;
  initialCircleId?: string | null;
  onCircleConsumed?: () => void;
}

const CIRCLE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  general:       { label: "Open Circle",       color: "var(--cx-gold)" },
  archetype:     { label: "Archetype Circle",  color: "#c47a8a" },
  phase:         { label: "Phase Circle",      color: "var(--cx-sage)" },
  wound_kinship: { label: "Kinship Circle",    color: "#a67c52" },
  complement:    { label: "Complement Circle",  color: "#7d8e7f" },
  offering:      { label: "Offering Circle",   color: "#c5b8d0" },
  reflection:    { label: "Reflection Circle", color: "var(--cx-gold)" },
  resonance_pod: { label: "Resonance Pod",     color: "#e8a84c" },
  mirror_pair:   { label: "Mirror Pair",       color: "#c5b8d0" },
};

const CIRCLE_TYPE_ICONS: Record<string, React.ReactNode> = {
  general:   <Users size={13} />,
  archetype: <Crown size={13} />,
  offering:  <Shield size={13} />,
  reflection: <Sparkles size={13} />,
};

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

export default function CodexCommunity({ onNavigate, initialCircleId, onCircleConsumed }: Props) {
  const [activeCircleId, setActiveCircleId] = useState<string | null>(initialCircleId || null);
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");

  // Consume the initial circle ID so it doesn't persist on re-navigation
  useEffect(() => {
    if (initialCircleId) {
      setActiveCircleId(initialCircleId);
      onCircleConsumed?.();
    }
  }, [initialCircleId]);

  const myCirclesQuery = trpc.codex.community.getMyCircles.useQuery();
  const recommendedQuery = trpc.codex.community.getRecommendedCircles.useQuery();
  const joinMutation = trpc.codex.community.joinCircle.useMutation({
    onSuccess: () => {
      myCirclesQuery.refetch();
      recommendedQuery.refetch();
    },
  });

  // If viewing a specific circle, render the detail page
  if (activeCircleId) {
    return (
      <CodexCircleDetail
        circleId={activeCircleId}
        onBack={() => setActiveCircleId(null)}
      />
    );
  }

  const myCircles = myCirclesQuery.data || [];
  const recommended = recommendedQuery.data || [];
  const isLoading = myCirclesQuery.isLoading || recommendedQuery.isLoading;

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <CodexLogoLoader size={56} />
          <p style={{ fontSize: "0.8rem", color: "var(--cx-ink3)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", marginTop: "1rem" }}>
            Finding your circles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "72rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-up" style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "2rem",
          fontWeight: 300,
          color: "var(--cx-gold)",
          letterSpacing: "0.02em",
          marginBottom: "0.5rem",
        }}>
          Your Circles
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--cx-ink2)", lineHeight: 1.6 }}>
          She found herself. Then she found her people.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="cx-fade-up cx-delay-1" style={{
        display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
      }}>
        {[
          { key: "my" as const, label: `My Circles (${myCircles.length})`, icon: <Users size={12} /> },
          { key: "discover" as const, label: `Discover (${recommended.length})`, icon: <Compass size={12} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "50px",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              border: `1px solid ${activeTab === tab.key ? "rgba(184,151,106,0.4)" : "rgba(255,255,255,0.15)"}`,
              background: activeTab === tab.key ? "rgba(184,151,106,0.1)" : "transparent",
              color: activeTab === tab.key ? "var(--cx-gold)" : "var(--cx-ink2)",
              cursor: "pointer",
              transition: "all 300ms ease",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* MY CIRCLES TAB */}
      {activeTab === "my" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {myCircles.length === 0 ? (
            <div className="cx-widget cx-fade-up cx-delay-2" style={{ gridColumn: "1 / -1" }}>
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ margin: "0 auto 1.5rem" }}>
                  <CodexLogoLoader size={48} />
                </div>
                <h3 style={{
                  fontFamily: "Cormorant Garamond, serif", fontSize: "1.25rem",
                  fontWeight: 400, color: "var(--cx-cream, #f5e6d3)", marginBottom: "0.75rem",
                }}>
                  Your circles are waiting
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--cx-ink2)", lineHeight: 1.6, marginBottom: "1.5rem", maxWidth: "28rem", margin: "0 auto 1.5rem" }}>
                  Every flame burns brighter when witnessed. Discover circles aligned with your archetype and begin connecting with others on a similar path.
                </p>
                <button className="cx-btn-primary" onClick={() => setActiveTab("discover")} style={{ gap: "6px" }}>
                  <Compass size={14} /> Discover Circles
                </button>
              </div>
            </div>
          ) : (
            myCircles.map((circle: any, idx: number) => {
              const typeInfo = CIRCLE_TYPE_LABELS[circle.circleType] || { label: circle.circleType, color: "var(--cx-ink2)" };
              return (
                <div
                  key={circle.id}
                  className={`cx-widget cx-interactive cx-fade-up cx-delay-${Math.min(idx + 2, 8)}`}
                  onClick={() => setActiveCircleId(circle.id)}
                  style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
                >
                  {/* Subtle top accent bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, transparent, ${typeInfo.color}40, transparent)`,
                  }} />

                  <div className="cx-widget-header" style={{ paddingBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: typeInfo.color, opacity: 0.7 }}>
                        {CIRCLE_TYPE_ICONS[circle.circleType] || <CircleIcon size={13} />}
                      </span>
                      <h3 style={{ fontSize: "1rem", fontFamily: "Cormorant Garamond, serif", fontWeight: 500 }}>
                        {circle.name}
                      </h3>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--cx-ink3)", opacity: 0.4 }} />
                  </div>

                  <div className="cx-widget-body" style={{ paddingTop: "0.25rem" }}>
                    {/* Type badge */}
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: "50px",
                      fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.06em",
                      background: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}25`,
                      color: typeInfo.color, marginBottom: "0.625rem",
                    }}>
                      {typeInfo.label}
                    </span>

                    {circle.description && (
                      <p style={{
                        fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.55,
                        marginBottom: "0.75rem",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {circle.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "0.7rem", color: "var(--cx-ink3)",
                      paddingTop: "0.5rem", borderTop: "1px solid rgba(200,188,174,0.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Users size={11} /> {circle.memberCount || 0}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <MessageSquare size={11} /> {circle.threadCount || 0}
                        </span>
                      </div>
                      {circle.lastActivity && (
                        <span style={{ fontStyle: "italic", opacity: 0.8 }}>
                          {timeAgo(circle.lastActivity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DISCOVER TAB */}
      {activeTab === "discover" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {recommended.length === 0 ? (
            <div className="cx-widget cx-fade-up cx-delay-2" style={{ gridColumn: "1 / -1" }}>
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <Sparkles size={32} style={{ color: "var(--cx-gold)", opacity: 0.4, marginBottom: "1rem" }} />
                <h3 style={{
                  fontFamily: "Cormorant Garamond, serif", fontSize: "1.25rem",
                  fontWeight: 400, color: "var(--cx-cream, #f5e6d3)", marginBottom: "0.75rem",
                }}>
                  Unlocking your resonance
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--cx-ink2)", lineHeight: 1.6 }}>
                  Complete your assessment to unlock personalized circle recommendations based on your archetypal profile.
                </p>
              </div>
            </div>
          ) : (
            recommended.map((circle: any, idx: number) => {
              const typeInfo = CIRCLE_TYPE_LABELS[circle.circleType] || { label: circle.circleType, color: "var(--cx-ink2)" };
              return (
                <div
                  key={circle.id}
                  className={`cx-widget cx-fade-up cx-delay-${Math.min(idx + 2, 8)}`}
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {/* Match score accent */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, transparent, var(--cx-gold), transparent)`,
                    opacity: (circle.score || 50) / 100,
                  }} />

                  <div className="cx-widget-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: typeInfo.color, opacity: 0.7 }}>
                        {CIRCLE_TYPE_ICONS[circle.circleType] || <CircleIcon size={13} />}
                      </span>
                      <h3 style={{ fontSize: "1rem", fontFamily: "Cormorant Garamond, serif", fontWeight: 500 }}>
                        {circle.name}
                      </h3>
                    </div>
                    {circle.score && (
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 600, color: "var(--cx-gold)",
                        background: "rgba(184,151,106,0.1)", padding: "3px 10px", borderRadius: "50px",
                        border: "1px solid rgba(184,151,106,0.2)",
                      }}>
                        {circle.score}% match
                      </span>
                    )}
                  </div>
                  <div className="cx-widget-body">
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: "50px",
                      fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.06em",
                      background: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}25`,
                      color: typeInfo.color, marginBottom: "0.5rem",
                    }}>
                      {typeInfo.label}
                    </span>

                    {circle.description && (
                      <p style={{
                        fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.55, marginBottom: "0.5rem",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {circle.description}
                      </p>
                    )}

                    {circle.reason && (
                      <p style={{ fontSize: "0.75rem", color: "var(--cx-sage, #7d8e7f)", fontStyle: "italic", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                        <Zap size={10} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
                        {circle.reason}
                      </p>
                    )}

                    <button
                      className="cx-btn-primary"
                      style={{ width: "100%", fontSize: "0.8rem", gap: "6px" }}
                      onClick={() => {
                        joinMutation.mutate({ circleId: circle.id }, {
                          onSuccess: () => setActiveCircleId(circle.id),
                        });
                      }}
                      disabled={joinMutation.isPending}
                    >
                      {joinMutation.isPending ? "Joining..." : (
                        <><Users size={13} /> Join This Circle</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
