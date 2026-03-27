import { trpc } from "@/lib/trpc";
import { Orbit, Sparkles } from "lucide-react";
import CodexWeather from "./CodexWeather";
import CodexGrowthWidget from "./CodexGrowthWidget";
import {
  PhaseJourneyMap,
  ContradictionExplorer,
  WeeklyPracticeCard,
  CommunityCircleCard,
} from "./CodexDashboardExpansions";

interface Props {
  onNavigate: (view: string) => void;
}

const STAT_GRADIENTS = [
  "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)",
  "linear-gradient(135deg, #4ACD8D 0%, #22D3EE 100%)",
  "linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)",
];

export default function CodexDashboard({ onNavigate }: Props) {
  const dashQuery = trpc.codex.client.dashboardData.useQuery();
  const growthQuery = trpc.codex.client.getGrowthDashboard.useQuery();
  const celebrateMut = trpc.codex.client.celebrateMilestone.useMutation({
    onSuccess: () => growthQuery.refetch(),
  });
  const d = dashQuery.data;

  if (dashQuery.isLoading || !d) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="cx-slow-pulse" style={{
            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 1rem",
            background: "linear-gradient(135deg, var(--cx-violet), var(--cx-blue))",
            opacity: 0.5,
          }} />
          <p style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.3)" }}>Loading your Codex...</p>
        </div>
      </div>
    );
  }

  const scoring = d.scoring;
  const primary = scoring?.archetypeConstellation?.[0];
  const spectrum = scoring?.spectrumProfile;
  const phase = spectrum?.thresholdPct > 40 ? "Threshold" : spectrum?.giftPct > 30 ? "Integration" : "Discovery";
  const assessmentStatus = d.assessment?.status || "not_started";
  const tierLabel = (d.user.tier || "explorer").replace(/_/g, " ");

  const stats = [
    { label: "Days Active", value: d.daysActive },
    { label: "Journal Entries", value: d.journalCount },
    { label: "Scroll Modules", value: `${d.completedModules.length}/9` },
    { label: "Integration", value: scoring?.integrationIndex != null ? (scoring.integrationIndex * 100).toFixed(0) + "%" : "--" },
  ];

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "72rem", margin: "0 auto" }}>

      {/* ── Welcome Header ── */}
      <div className="cx-fade-in" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cx-cream)", marginBottom: "0.375rem" }}>
              Welcome back, {d.user.name?.split(" ")[0] || "Explorer"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span style={{
                display: "inline-block", padding: "0.2rem 0.625rem", borderRadius: "0.375rem", fontSize: "0.6875rem", fontWeight: 600,
                background: "linear-gradient(135deg, var(--cx-violet), var(--cx-blue))", color: "white", textTransform: "capitalize",
              }}>
                {tierLabel}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.35)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <button className="cx-btn-secondary" onClick={() => onNavigate("guide")} style={{ gap: "0.375rem" }}>
            <Orbit size={14} /> Talk to AI Guide
          </button>
        </div>
      </div>

      {/* ── AI Growth Insight ── */}
      {d.growthInsight && (
        <div className="cx-fade-up cx-widget" style={{ marginBottom: "1.5rem" }}>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "0.75rem", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.1))",
              border: "1px solid rgba(139,92,246,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.875rem",
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cx-moonlight)", marginBottom: "0.375rem" }}>
                AI Insight
              </p>
              <p style={{ fontSize: "0.9375rem", color: "rgba(240,235,245,0.7)", lineHeight: 1.65 }}>
                {d.growthInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards Row ── */}
      <div className="cx-fade-up cx-delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {stats.map((stat, i) => (
          <div key={stat.label} className="cx-stat-card" style={{ background: STAT_GRADIENTS[i] }}>
            <div className="cx-stat-value">{stat.value}</div>
            <div className="cx-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Archetype Constellation Card */}
          {primary && (
            <div className="cx-widget cx-fade-up cx-delay-2" style={{ cursor: "pointer" }} onClick={() => onNavigate("journey")}>
              <div className="cx-widget-header">
                <h3>Archetype Constellation</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--cx-moonlight)" }}>{phase} Phase</span>
              </div>
              <div className="cx-widget-body">
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--cx-cream)", marginBottom: "0.25rem" }}>
                  {primary.archetype.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.4)", marginBottom: "1.25rem" }}>
                  Primary archetype identity
                </p>
                {spectrum && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { label: "Shadow", pct: spectrum.shadowPct, color: "var(--cx-ember)" },
                      { label: "Threshold", pct: spectrum.thresholdPct, color: "var(--cx-violet)" },
                      { label: "Gift", pct: spectrum.giftPct, color: "var(--cx-sage)" },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "rgba(240,235,245,0.5)" }}>{s.label}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: s.color }}>{s.pct}%</span>
                        </div>
                        <div className="cx-progress-track">
                          <div className="cx-progress" style={{ width: `${s.pct}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="cx-widget cx-fade-up cx-delay-3">
            <div className="cx-widget-header">
              <h3>Continue Your Journey</h3>
            </div>
            <div className="cx-widget-body" style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {assessmentStatus !== "complete" && (
                <button className="cx-btn-primary" style={{ width: "100%" }} onClick={() => onNavigate("assessment")}>
                  {assessmentStatus === "not_started" ? "Begin Assessment" : `Continue Assessment -- Section ${d.assessment?.currentSection || 1}/16`}
                </button>
              )}
              {assessmentStatus === "complete" && (
                <>
                  <button className="cx-btn-primary" style={{ width: "100%" }} onClick={() => onNavigate("scroll")}>
                    Codex Scroll -- {d.completedModules.length}/9 modules
                  </button>
                  <button className="cx-btn-secondary" style={{ width: "100%" }} onClick={() => onNavigate("guide")}>
                    Open AI Guide
                  </button>
                </>
              )}
              <button className="cx-btn-secondary" style={{ width: "100%" }} onClick={() => onNavigate("journal")}>
                Journal Vault
              </button>
            </div>
          </div>

          {/* Phase Journey */}
          {scoring && (
            <div className="cx-fade-up cx-delay-4">
              <PhaseJourneyMap
                currentPhase={scoring?.phase || 1}
                completedPhases={(d as any).completedPhases || []}
                primaryArchetype={primary?.archetype || ""}
              />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Growth Tracking Widget (Doc 02) */}
          {growthQuery.data && (
            <div className="cx-fade-up cx-delay-2">
              <CodexGrowthWidget
                streak={growthQuery.data.streak}
                companion={growthQuery.data.companion}
                milestones={growthQuery.data.milestones}
                uncelebrated={growthQuery.data.uncelebrated}
                stats={growthQuery.data.stats}
                onCelebrate={(id) => celebrateMut.mutate({ milestoneId: id })}
              />
            </div>
          )}

          {/* Weather Widget */}
          <div className="cx-fade-up cx-delay-2">
            <CodexWeather />
          </div>

          {/* Mirror Report Status */}
          <div className="cx-widget cx-fade-up cx-delay-3">
            <div className="cx-widget-header">
              <h3>Mirror Report</h3>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: d.reportStatus === "released" ? "var(--cx-sage)" : d.reportStatus === "ready_for_review" ? "var(--cx-gold)" : "rgba(240,235,245,0.15)",
                boxShadow: d.reportStatus === "released" ? "0 0 8px var(--cx-sage)" : d.reportStatus === "ready_for_review" ? "0 0 8px var(--cx-gold)" : "none",
              }} />
            </div>
            <div className="cx-widget-body">
              <p style={{ fontSize: "0.9375rem", color: "rgba(240,235,245,0.6)", lineHeight: 1.6, marginBottom: "1rem" }}>
                {d.reportStatus === "released" ? "Your archetypal portrait has been revealed. The mirror awaits." :
                  d.reportStatus === "ready_for_review" ? "April is reviewing your archetypal portrait." :
                    assessmentStatus === "complete" ? "Assessment complete. Report is being prepared." : "Complete the assessment to unlock your Mirror Report."}
              </p>
              {d.reportStatus === "released" && (
                <button className="cx-btn-primary" onClick={() => onNavigate("mirror-report")}>
                  View Report
                </button>
              )}
            </div>
          </div>

          {/* Integration Index Ring */}
          {scoring?.integrationIndex != null && (
            <div className="cx-widget cx-fade-up cx-delay-4 cx-holo-breathe">
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 1rem" }}>
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="6" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke="url(#ixGrad)" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${scoring.integrationIndex * 327} 327`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                    <defs>
                      <linearGradient id="ixGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cx-cream)" }}>
                      {(scoring.integrationIndex * 100).toFixed(0)}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(240,235,245,0.35)", fontWeight: 500 }}>INDEX</span>
                  </div>
                </div>
                <p className="cx-label" style={{ marginBottom: "0.375rem" }}>Integration Index</p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.4)" }}>
                  {scoring.integrationIndex > 0.6 ? "Deep integration emerging" :
                    scoring.integrationIndex > 0.3 ? "Threshold patterns activating" :
                      "Shadow patterns surfacing"}
                </p>
              </div>
            </div>
          )}

          {/* Weekly Practice */}
          {(d as any).routing && (
            <div className="cx-fade-up cx-delay-5">
              <WeeklyPracticeCard
                weeklyPrompt={(d as any).routing.weeklyPrompt}
                practiceRecommendations={(d as any).routing.practiceRecommendations || []}
                nextRecommendedStep={(d as any).routing.nextRecommendedStep || "Continue Your Journey"}
                primaryArchetype={primary?.archetype || ""}
              />
            </div>
          )}

          {/* Contradiction Patterns */}
          {scoring?.contradictionFlags?.length > 0 && (
            <div className="cx-fade-up cx-delay-5">
              <ContradictionExplorer contradictions={scoring.contradictionFlags} />
            </div>
          )}

          {/* Community Circles */}
          {(d as any).routing?.recommendedCircles && (
            <div className="cx-fade-up cx-delay-6">
              <CommunityCircleCard
                recommendedCircles={(d as any).routing.recommendedCircles}
                communityTier={(d as any).routing.communityTier || "peer"}
                primaryArchetype={primary?.archetype || ""}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
