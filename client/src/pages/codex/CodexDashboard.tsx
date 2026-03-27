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

// Stat cards now use glassmorphic style from CSS, no gradient backgrounds needed
const STAT_GRADIENTS = [
  "transparent",
  "transparent",
  "transparent",
  "transparent",
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
            width: 44, height: 44, borderRadius: "11px", margin: "0 auto 1rem",
            background: "rgba(184,123,101,0.12)",
            transform: "rotate(45deg)",
          }} />
          <p style={{ fontSize: "12px", color: "var(--cx-ink3)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Loading your Codex...</p>
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
    <div style={{ padding: "36px 40px", maxWidth: "72rem", margin: "0 auto" }}>

      {/* ── Welcome Header ── */}
      <div className="cx-fade-in" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "6px" }}>
              YOUR JOURNEY
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "6px", lineHeight: 1.15 }}>
              Welcome back, {d.user.name?.split(" ")[0] || "Explorer"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "50px", fontSize: "9.5px", fontWeight: 400,
                background: "rgba(184,123,101,0.1)", border: "1px solid rgba(184,123,101,0.2)", color: "var(--cx-rose)", textTransform: "capitalize",
                letterSpacing: "0.06em",
              }}>
                {tierLabel}
              </span>
              <span style={{ fontSize: "11px", color: "var(--cx-ink3)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <button className="cx-btn-primary" onClick={() => onNavigate("guide")} style={{ gap: "6px" }}>
            <Orbit size={12} /> Talk to Guide
          </button>
        </div>
      </div>

      {/* ── AI Growth Insight ── */}
      {d.growthInsight && (
        <div className="cx-fade-up cx-widget" style={{ marginBottom: "20px" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "9px", flexShrink: 0,
              background: "rgba(184,123,101,0.08)",
              border: "1px solid rgba(184,123,101,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--cx-rose)",
            }}>
              <Sparkles size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9.5px", fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "5px" }}>
                Today’s Mirror
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontWeight: 300, fontStyle: "italic", color: "var(--cx-ink2)", lineHeight: 1.65 }}>
                {d.growthInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards Row ── */}
      <div className="cx-fade-up cx-delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="cx-stat-card">
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
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "4px" }}>
                  {primary.archetype.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h2>
                <p style={{ fontSize: "11px", color: "var(--cx-ink3)", marginBottom: "16px" }}>
                  Primary archetype identity
                </p>
                {spectrum && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[
                      { label: "Shadow", pct: spectrum.shadowPct, color: "var(--cx-rose)" },
                      { label: "Threshold", pct: spectrum.thresholdPct, color: "var(--cx-gold)" },
                      { label: "Gift", pct: spectrum.giftPct, color: "var(--cx-sage)" },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--cx-ink3)" }}>{s.label}</span>
                          <span style={{ fontSize: "10px", fontWeight: 400, color: s.color }}>{s.pct}%</span>
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
                width: 6, height: 6, borderRadius: "50%",
                background: d.reportStatus === "released" ? "var(--cx-sage)" : d.reportStatus === "ready_for_review" ? "var(--cx-gold)" : "var(--cx-clay)",
              }} />
            </div>
            <div className="cx-widget-body">
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontWeight: 300, fontStyle: "italic", color: "var(--cx-ink2)", lineHeight: 1.6, marginBottom: "14px" }}>
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
            <div className="cx-widget cx-fade-up cx-delay-4">
              <div className="cx-widget-body" style={{ textAlign: "center", padding: "24px 20px" }}>
                <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 12px" }}>
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(200,188,174,0.22)" strokeWidth="3" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="url(#ixGrad)" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${scoring.integrationIndex * 264} 264`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                    <defs>
                      <linearGradient id="ixGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#B87B65" />
                        <stop offset="100%" stopColor="#B8976A" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: "var(--cx-ink)" }}>
                      {(scoring.integrationIndex * 100).toFixed(0)}
                    </span>
                    <span style={{ fontSize: "8px", color: "var(--cx-ink3)", letterSpacing: "0.15em" }}>INDEX</span>
                  </div>
                </div>
                <p className="cx-label" style={{ marginBottom: "4px" }}>Integration Index</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic", color: "var(--cx-ink3)" }}>
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
