import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Compass, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import CodexCircleDetail from "./CodexCircleDetail";

// ============================================================================
// CodexCommunity — Main community hub page
// ============================================================================

interface Props {
  onNavigate: (view: string) => void;
}

const CIRCLE_TYPE_LABELS: Record<string, string> = {
  general: "Open Circle",
  archetype: "Archetype Circle",
  phase: "Phase Circle",
  wound_kinship: "Kinship Circle",
  complement: "Complement Circle",
  offering: "Offering Circle",
  reflection: "Reflection Circle",
  resonance_pod: "Resonance Pod",
  mirror_pair: "Mirror Pair",
};

export default function CodexCommunity({ onNavigate }: Props) {
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");

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
        <button
          onClick={() => setActiveTab("my")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "50px",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.04em",
            border: `1px solid ${activeTab === "my" ? "rgba(184,151,106,0.4)" : "rgba(255,255,255,0.15)"}`,
            background: activeTab === "my" ? "rgba(184,151,106,0.1)" : "transparent",
            color: activeTab === "my" ? "var(--cx-gold)" : "var(--cx-ink2)",
            cursor: "pointer",
            transition: "all 300ms ease",
          }}
        >
          <Users size={12} style={{ marginRight: "6px", verticalAlign: "-2px" }} />
          My Circles ({myCircles.length})
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "50px",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.04em",
            border: `1px solid ${activeTab === "discover" ? "rgba(184,151,106,0.4)" : "rgba(255,255,255,0.15)"}`,
            background: activeTab === "discover" ? "rgba(184,151,106,0.1)" : "transparent",
            color: activeTab === "discover" ? "var(--cx-gold)" : "var(--cx-ink2)",
            cursor: "pointer",
            transition: "all 300ms ease",
          }}
        >
          <Compass size={12} style={{ marginRight: "6px", verticalAlign: "-2px" }} />
          Discover
        </button>
      </div>

      {/* MY CIRCLES TAB */}
      {activeTab === "my" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {myCircles.length === 0 ? (
            <div className="cx-widget cx-fade-up cx-delay-2" style={{ gridColumn: "1 / -1" }}>
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <Compass size={32} style={{ color: "var(--cx-gold)", opacity: 0.4, marginBottom: "1rem" }} />
                <p style={{ fontSize: "0.9rem", color: "var(--cx-ink2)", marginBottom: "1rem" }}>
                  You haven't joined any circles yet.
                </p>
                <button className="cx-btn-primary" onClick={() => setActiveTab("discover")}>
                  Find Your Circle
                </button>
              </div>
            </div>
          ) : (
            myCircles.map((circle, idx) => (
              <div
                key={circle.id}
                className={`cx-widget cx-interactive cx-fade-up cx-delay-${Math.min(idx + 2, 8)}`}
                onClick={() => setActiveCircleId(circle.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="cx-widget-header">
                  <h3 style={{ fontSize: "0.95rem" }}>{circle.name}</h3>
                  <ArrowRight size={14} style={{ color: "var(--cx-ink3)", opacity: 0.5 }} />
                </div>
                <div className="cx-widget-body">
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: "50px",
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.06em",
                    background: "rgba(184,151,106,0.08)", border: "1px solid rgba(184,151,106,0.18)",
                    color: "var(--cx-gold)", marginBottom: "0.75rem",
                  }}>
                    {CIRCLE_TYPE_LABELS[circle.circleType] || circle.circleType}
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                    {circle.description?.slice(0, 120)}{circle.description && circle.description.length > 120 ? "..." : ""}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--cx-ink3)" }}>
                    <span><Users size={11} style={{ marginRight: "4px", verticalAlign: "-2px" }} />{circle.memberCount} members</span>
                    {circle.lastActivity && (
                      <span>
                        <MessageSquare size={11} style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                        {new Date(circle.lastActivity).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
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
                <p style={{ fontSize: "0.9rem", color: "var(--cx-ink2)" }}>
                  Complete your assessment to unlock personalized circle recommendations.
                </p>
              </div>
            </div>
          ) : (
            recommended.map((circle, idx) => (
              <div
                key={circle.id}
                className={`cx-widget cx-fade-up cx-delay-${Math.min(idx + 2, 8)}`}
              >
                <div className="cx-widget-header">
                  <h3 style={{ fontSize: "0.95rem" }}>{circle.name}</h3>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 600, color: "var(--cx-gold)",
                    background: "rgba(184,151,106,0.1)", padding: "2px 8px", borderRadius: "50px",
                  }}>
                    {circle.score}% match
                  </span>
                </div>
                <div className="cx-widget-body">
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: "50px",
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.06em",
                    background: "rgba(184,151,106,0.08)", border: "1px solid rgba(184,151,106,0.18)",
                    color: "var(--cx-gold)", marginBottom: "0.5rem",
                  }}>
                    {CIRCLE_TYPE_LABELS[circle.circleType] || circle.circleType}
                  </span>
                  <p style={{ fontSize: "0.8rem", color: "var(--cx-ink2)", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                    {circle.description?.slice(0, 120)}{circle.description && circle.description.length > 120 ? "..." : ""}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--cx-sage)", fontStyle: "italic", marginBottom: "0.75rem" }}>
                    {circle.reason}
                  </p>
                  <button
                    className="cx-btn-primary"
                    style={{ width: "100%", fontSize: "0.8rem" }}
                    onClick={() => joinMutation.mutate({ circleId: circle.id })}
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Joining..." : "Join This Circle"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
