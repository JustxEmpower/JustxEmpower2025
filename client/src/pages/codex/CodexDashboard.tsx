import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState, useCallback } from "react";
import { Orbit, Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import CodexWeather from "./CodexWeather";
import CodexGrowthWidget from "./CodexGrowthWidget";
import CodexLogoLoader from "./CodexLogoLoader";
import {
  PhaseJourneyMap,
  ContradictionExplorer,
  WeeklyPracticeCard,
  CommunityCircleCard,
} from "./CodexDashboardExpansions";

interface Props {
  onNavigate: (view: string) => void;
}

// ── Animated Counter Hook ──────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

// ── Intersection Observer Hook ─────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ── Animated Stat Card ─────────────────────────────────────────────
function AnimatedStat({ label, value, tooltip, delay }: { label: string; value: string | number; tooltip?: string; delay: number }) {
  const { ref, inView } = useInView();
  const numericValue = typeof value === "number" ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue) && typeof value === "number";
  const animatedNum = useAnimatedCounter(inView && isNumeric ? numericValue : 0);

  return (
    <div
      ref={ref}
      className="cx-stat-card cx-fade-up"
      data-tooltip={tooltip}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`cx-stat-value ${inView ? "cx-count-animate" : ""}`}>
        {isNumeric ? animatedNum : value}
      </div>
      <div className="cx-stat-label">{label}</div>
    </div>
  );
}

// ── Journey Action Card ────────────────────────────────────────────
function JourneyActionCard({
  label,
  subtitle,
  primary,
  onClick,
  delay,
}: {
  label: string;
  subtitle?: string;
  primary?: boolean;
  onClick: () => void;
  delay: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      className={primary ? "cx-btn-primary" : "cx-btn-secondary"}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        justifyContent: "space-between",
        padding: "14px 20px",
        animationDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <span>{label}</span>
        {subtitle && (
          <span style={{ fontSize: "9px", opacity: 0.6, letterSpacing: "0.08em" }}>{subtitle}</span>
        )}
      </span>
      <ChevronRight
        size={14}
        style={{
          transition: "transform 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms",
          transform: hover ? "translateX(3px)" : "translateX(0)",
          opacity: hover ? 1 : 0.5,
        }}
      />
    </button>
  );
}

// ── Integration Ring with Animation ────────────────────────────────
function IntegrationRing({ value }: { value: number }) {
  const { ref, inView } = useInView();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (inView && !animated) {
      const t = setTimeout(() => setAnimated(true), 200);
      return () => clearTimeout(t);
    }
  }, [inView]);

  const circumference = 2 * Math.PI * 42;
  const dashArray = animated ? value * circumference : 0;

  return (
    <div ref={ref} className="cx-widget cx-fade-up cx-delay-4">
      <div className="cx-widget-body" style={{ textAlign: "center", padding: "28px 20px" }}>
        <div
          className="cx-ring-glow"
          style={{ position: "relative", width: 110, height: 110, margin: "0 auto 14px" }}
        >
          <svg viewBox="0 0 100 100" width="110" height="110">
            {/* Track */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(200,188,174,0.18)" strokeWidth="2.5" />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="url(#ixGrad)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dashArray} ${circumference}`}
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 2s cubic-bezier(0.4,0,0.2,1)" }}
            />
            {/* Glow dot at end of arc */}
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
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px", fontWeight: 300, color: "var(--cx-ink)" }}>
              {(value * 100).toFixed(0)}
            </span>
            <span style={{ fontSize: "8px", color: "var(--cx-ink3)", letterSpacing: "0.15em" }}>INDEX</span>
          </div>
        </div>
        <p className="cx-label" style={{ marginBottom: "4px" }}>Integration Index</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "12px", fontStyle: "italic", color: "var(--cx-ink3)" }}>
          {value > 0.6 ? "Deep integration emerging" :
            value > 0.3 ? "Threshold patterns activating" :
              "Shadow patterns surfacing"}
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════════════

export default function CodexDashboard({ onNavigate }: Props) {
  const dashQuery = trpc.codex.client.dashboardData.useQuery();
  const growthQuery = trpc.codex.client.getGrowthDashboard.useQuery();
  const celebrateMut = trpc.codex.client.celebrateMilestone.useMutation({
    onSuccess: () => growthQuery.refetch(),
  });
  const d = dashQuery.data;

  // ── Loading State ──
  if (dashQuery.isLoading || !d) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ margin: "0 auto 1rem" }}>
            <CodexLogoLoader size={64} />
          </div>
          <p style={{ fontSize: "12px", color: "var(--cx-ink3)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
            Loading your Codex...
          </p>
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
    { label: "Days Active", value: d.daysActive as number, tooltip: "Total days you've engaged with your Codex" },
    { label: "Journal Entries", value: d.journalCount as number, tooltip: "Reflections captured in your vault" },
    { label: "Scroll Modules", value: `${d.completedModules.length}/9`, tooltip: "Integration workbook modules completed" },
    { label: "Integration", value: scoring?.integrationIndex != null ? (scoring.integrationIndex * 100).toFixed(0) + "%" : "--", tooltip: "Shadow-gift integration balance" },
  ];

  return (
    <div className="cx-page-enter" style={{ padding: "36px 40px", maxWidth: "72rem", margin: "0 auto", position: "relative" }}>

      {/* Background logo animation — fixed center */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.18,
      }}>
        <CodexLogoLoader size={520} />
      </div>

      {/* ── Welcome Header ── */}
      <div className="cx-fade-up" style={{ marginBottom: "28px" }}>
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
                transition: "all 300ms ease",
              }}>
                {tierLabel}
              </span>
              <span style={{ fontSize: "11px", color: "var(--cx-ink3)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <button className="cx-btn-primary" onClick={() => onNavigate("guide")} style={{ gap: "8px" }}>
            <Orbit size={13} /> Talk to Guide
            <ArrowRight size={12} style={{ marginLeft: 2, opacity: 0.6 }} />
          </button>
        </div>
      </div>

      {/* ── AI Growth Insight ── */}
      {d.growthInsight && (
        <div className="cx-fade-up cx-widget cx-interactive cx-delay-1" style={{ marginBottom: "20px", cursor: "pointer" }} onClick={() => onNavigate("guide")}>
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
                Today's Mirror
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontWeight: 300, fontStyle: "italic", color: "var(--cx-ink2)", lineHeight: 1.65 }}>
                {d.growthInsight}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: "var(--cx-ink3)", flexShrink: 0, marginTop: 10, opacity: 0.4 }} />
          </div>
        </div>
      )}

      {/* ── Stat Cards Row (animated counters) ── */}
      <div className="cx-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {stats.map((stat, i) => (
          <AnimatedStat key={stat.label} label={stat.label} value={stat.value} tooltip={stat.tooltip} delay={i * 80} />
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Archetype Constellation Card */}
          {primary && (
            <div
              className="cx-widget cx-interactive cx-fade-up cx-delay-2"
              onClick={() => onNavigate("journey")}
            >
              <div className="cx-widget-header">
                <h3>Archetype Constellation</h3>
                <span style={{
                  fontSize: "0.7rem",
                  color: "var(--cx-moonlight)",
                  padding: "2px 8px",
                  borderRadius: "50px",
                  background: "rgba(184,151,106,0.08)",
                  border: "1px solid rgba(184,151,106,0.15)",
                }}>
                  {phase} Phase
                </span>
              </div>
              <div className="cx-widget-body">
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "4px" }}>
                  {primary.archetype.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h2>
                <p style={{ fontSize: "11px", color: "var(--cx-ink3)", marginBottom: "16px" }}>
                  Primary archetype identity
                </p>
                {spectrum && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {[
                      { label: "Shadow", pct: spectrum.shadowPct, color: "var(--cx-rose)" },
                      { label: "Threshold", pct: spectrum.thresholdPct, color: "var(--cx-gold)" },
                      { label: "Gift", pct: spectrum.giftPct, color: "var(--cx-sage)" },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--cx-ink3)" }}>{s.label}</span>
                          <span style={{ fontSize: "10px", fontWeight: 500, color: s.color }}>{s.pct}%</span>
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
                <JourneyActionCard
                  label={assessmentStatus === "not_started" ? "Begin Assessment" : "Continue Assessment"}
                  subtitle={assessmentStatus !== "not_started" ? `Section ${d.assessment?.currentSection || 1}/16` : undefined}
                  primary
                  onClick={() => onNavigate("assessment")}
                  delay={0}
                />
              )}
              {assessmentStatus === "complete" && (
                <>
                  <JourneyActionCard
                    label="Codex Scroll"
                    subtitle={`${d.completedModules.length}/9 modules`}
                    primary
                    onClick={() => onNavigate("scroll")}
                    delay={0}
                  />
                  <JourneyActionCard
                    label="Open AI Guide"
                    onClick={() => onNavigate("guide")}
                    delay={60}
                  />
                </>
              )}
              <JourneyActionCard
                label="Journal Vault"
                onClick={() => onNavigate("journal")}
                delay={120}
              />
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
          {/* Growth Tracking Widget */}
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
          <div
            className={`cx-widget cx-fade-up cx-delay-3 ${d.reportStatus === "released" ? "cx-interactive" : ""}`}
            onClick={() => d.reportStatus === "released" && onNavigate("mirror-report")}
          >
            <div className="cx-widget-header">
              <h3>Mirror Report</h3>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: d.reportStatus === "released" ? "var(--cx-sage)" : d.reportStatus === "ready_for_review" ? "var(--cx-gold)" : "var(--cx-clay)",
                boxShadow: d.reportStatus === "released"
                  ? "0 0 8px rgba(125,142,127,0.5)"
                  : d.reportStatus === "ready_for_review"
                    ? "0 0 8px rgba(184,151,106,0.5)"
                    : "none",
                transition: "box-shadow 600ms ease",
              }} />
            </div>
            <div className="cx-widget-body">
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", fontWeight: 300, fontStyle: "italic", color: "var(--cx-ink2)", lineHeight: 1.6, marginBottom: "14px" }}>
                {d.reportStatus === "released" ? "Your archetypal portrait has been revealed. The mirror awaits." :
                  d.reportStatus === "ready_for_review" ? "April is reviewing your archetypal portrait." :
                    assessmentStatus === "complete" ? "Assessment complete. Report is being prepared." : "Complete the assessment to unlock your Mirror Report."}
              </p>
              {d.reportStatus === "released" && (
                <button className="cx-btn-primary" onClick={() => onNavigate("mirror-report")} style={{ gap: "6px" }}>
                  View Report <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Integration Index Ring */}
          {scoring?.integrationIndex != null && (
            <IntegrationRing value={scoring.integrationIndex} />
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
                onNavigate={onNavigate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
