import { trpc } from "@/lib/trpc";
import CodexWeather from "./CodexWeather";
import {
  PhaseJourneyMap,
  ContradictionExplorer,
  WeeklyPracticeCard,
  CommunityCircleCard,
} from "./CodexDashboardExpansions";

interface Props {
  onNavigate: (view: string) => void;
}

export default function CodexDashboard({ onNavigate }: Props) {
  const dashQuery = trpc.codex.client.dashboardData.useQuery();
  const d = dashQuery.data;

  if (dashQuery.isLoading || !d) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="cx-slow-pulse" style={{ fontSize: "2rem" }}>{"\u{1F702}"}</div>
      </div>
    );
  }

  const scoring = d.scoring;
  const primary = scoring?.archetypeConstellation?.[0];
  const spectrum = scoring?.spectrumProfile;
  const phase = spectrum?.thresholdPct > 40 ? "Threshold" : spectrum?.giftPct > 30 ? "Integration" : "Discovery";
  const assessmentStatus = d.assessment?.status || "not_started";
  const tierLabel = (d.user.tier || "").replace(/_/g, " ");

  return (
    <div style={{ padding: "2rem", maxWidth: "64rem", margin: "0 auto" }}>
      {/* Welcome Header */}
      <div className="cx-fade-in" style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
          {tierLabel} journey
        </p>
        <h1 className="cx-font-heading" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "var(--cx-gold)", marginBottom: "0.5rem" }}>
          Welcome back, {d.user.name?.split(" ")[0] || "Sacred One"}
        </h1>
        {d.growthInsight && (
          <p className="cx-invitation" style={{ maxWidth: "36rem", opacity: 0.7, fontSize: "1rem", lineHeight: 1.8 }}>
            {d.growthInsight}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Archetype Card */}
          {primary && (
            <div className="cx-card cx-fade-up" style={{ cursor: "pointer" }} onClick={() => onNavigate("journey")}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.75rem" }}>
                Primary Archetype
              </p>
              <h2 className="cx-font-heading" style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--cx-gold)", marginBottom: "0.25rem" }}>
                {primary.archetype}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "rgba(245,230,211,0.4)" }}>
                {phase} Phase
              </p>
              {spectrum && (
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem" }}>
                  {[
                    { label: "Shadow", pct: spectrum.shadowPct, color: "var(--cx-ember)" },
                    { label: "Threshold", pct: spectrum.thresholdPct, color: "var(--cx-gold)" },
                    { label: "Gift", pct: spectrum.giftPct, color: "var(--cx-sage)" },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
                        <span style={{ fontSize: "0.6rem", color: s.color, opacity: 0.8 }}>{s.pct}%</span>
                      </div>
                      <div style={{ height: "3px", borderRadius: "2px", background: "rgba(61,34,51,0.3)" }}>
                        <div style={{ height: "100%", borderRadius: "2px", background: s.color, width: `${s.pct}%`, transition: "width 1.5s ease", opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="cx-card cx-fade-up cx-delay-1">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "1rem" }}>
              Continue Your Journey
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {assessmentStatus !== "complete" && (
                <button className="cx-btn-primary" style={{ width: "100%", fontSize: "0.9rem" }} onClick={() => onNavigate("assessment")}>
                  {assessmentStatus === "not_started" ? "Begin Assessment" : `Continue Assessment — Section ${d.assessment?.currentSection || 1}/16`}
                </button>
              )}
              {assessmentStatus === "complete" && (
                <>
                  <button className="cx-btn-primary" style={{ width: "100%", fontSize: "0.9rem" }} onClick={() => onNavigate("scroll")}>
                    Enter Codex Scroll — {d.completedModules.length}/9 modules
                  </button>
                  <button className="cx-btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }} onClick={() => onNavigate("guide")}>
                    Open AI Guide
                  </button>
                </>
              )}
              <button className="cx-btn-secondary" style={{ width: "100%", fontSize: "0.85rem" }} onClick={() => onNavigate("journal")}>
                Open Journal Vault
              </button>
            </div>
          </div>

          {/* Phase Journey */}
          {scoring && (
            <PhaseJourneyMap
              currentPhase={scoring?.phase || 1}
              completedPhases={(d as any).completedPhases || []}
              primaryArchetype={primary?.archetype || ""}
            />
          )}

          {/* Stats */}
          <div className="cx-card cx-fade-up cx-delay-2">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Days Active", value: d.daysActive, color: "var(--cx-gold)" },
                { label: "Journal Entries", value: d.journalCount, color: "var(--cx-moonlight)" },
                { label: "Scroll Modules", value: `${d.completedModules.length}/9`, color: "var(--cx-sage)" },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <p className="cx-font-heading" style={{ fontSize: "1.75rem", fontWeight: 300, color: stat.color }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.25rem" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Weather Widget */}
          <div className="cx-fade-up cx-delay-1">
            <CodexWeather />
          </div>

          {/* Mirror Report Status */}
          <div className="cx-card cx-fade-up cx-delay-2" style={{
            borderLeftWidth: "3px",
            borderLeftStyle: "solid",
            borderLeftColor: d.reportStatus === "released" ? "var(--cx-sage)" : d.reportStatus === "ready_for_review" ? "var(--cx-gold)" : "var(--cx-muted)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem", opacity: 0.5 }}>{"\u{1F441}"}</span>
              <p className="cx-font-heading" style={{ fontSize: "1.1rem", color: "var(--cx-gold)", fontWeight: 400 }}>
                Mirror Report
              </p>
            </div>
            <p style={{ fontSize: "0.8rem", color: "rgba(245,230,211,0.4)" }}>
              {d.reportStatus === "released" ? "Your archetypal portrait is ready." :
                d.reportStatus === "ready_for_review" ? "April is reviewing your results." :
                  assessmentStatus === "complete" ? "Scored. Awaiting review." : "Complete the assessment first."}
            </p>
            {d.reportStatus === "released" && (
              <button className="cx-btn-primary mt-3" style={{ fontSize: "0.8rem" }} onClick={() => onNavigate("mirror-report")}>
                View Report
              </button>
            )}
          </div>

          {/* Integration Index */}
          {scoring?.integrationIndex != null && (
            <div className="cx-card cx-fade-up cx-delay-3" style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.75rem" }}>
                Integration Index
              </p>
              <p className="cx-font-heading" style={{ fontSize: "3rem", fontWeight: 300, color: "var(--cx-gold)" }}>
                {scoring.integrationIndex.toFixed(2)}
              </p>
              <p style={{ fontSize: "0.7rem", color: "rgba(245,230,211,0.3)", marginTop: "0.25rem" }}>
                {scoring.integrationIndex > 0.6 ? "Deep integration emerging" :
                  scoring.integrationIndex > 0.3 ? "Threshold patterns activating" :
                    "Shadow patterns surfacing"}
              </p>
            </div>
          )}

          {/* Weekly Practice */}
          {(d as any).routing && (
            <WeeklyPracticeCard
              weeklyPrompt={(d as any).routing.weeklyPrompt}
              practiceRecommendations={(d as any).routing.practiceRecommendations || []}
              nextRecommendedStep={(d as any).routing.nextRecommendedStep || "Continue Your Journey"}
              primaryArchetype={primary?.archetype || ""}
            />
          )}

          {/* Contradiction Patterns */}
          {scoring?.contradictionFlags?.length > 0 && (
            <ContradictionExplorer contradictions={scoring.contradictionFlags} />
          )}

          {/* Community Circles */}
          {(d as any).routing?.recommendedCircles && (
            <CommunityCircleCard
              recommendedCircles={(d as any).routing.recommendedCircles}
              communityTier={(d as any).routing.communityTier || "peer"}
              primaryArchetype={primary?.archetype || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
