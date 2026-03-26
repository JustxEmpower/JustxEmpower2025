import { trpc } from "@/lib/trpc";
import { Loader2, Check } from "lucide-react";

interface Props {
  onNavigate: (view: string) => void;
}

export default function CodexModules({ onNavigate }: Props) {
  const constantsQuery = trpc.codex.client.constants.useQuery();
  const dashQuery = trpc.codex.client.dashboardData.useQuery();
  const scrollModules = constantsQuery.data?.scrollModules || [];
  const completedModules = dashQuery.data?.completedModules || [];
  const assessmentComplete = dashQuery.data?.assessment?.status === "complete";

  if (constantsQuery.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="cx-slow-pulse"><Loader2 size={32} className="animate-spin" style={{ color: "var(--cx-violet)" }} /></div>
      </div>
    );
  }

  const totalCompleted = completedModules.length;
  const progressPct = scrollModules.length > 0 ? (totalCompleted / scrollModules.length) * 100 : 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
          Integration Workbook
        </p>
        <h1 className="cx-font-heading" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "var(--cx-gold)" }}>
          The Codex Scroll
        </h1>
        <div className="cx-divider" />
        <p className="cx-invitation" style={{ opacity: 0.5, maxWidth: "28rem", margin: "0 auto" }}>
          9 modules of somatic and reflective practice.<br />This is where knowing becomes embodiment.
        </p>
      </div>

      {/* Progress */}
      <div className="cx-card cx-fade-up" style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", marginBottom: "1rem" }}>
          <p className="cx-font-heading" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--cx-gold)" }}>
            {totalCompleted} / {scrollModules.length}
          </p>
          <p style={{ fontSize: "0.75rem", color: "rgba(245,230,211,0.3)" }}>modules explored</p>
        </div>
        <div style={{ height: "4px", borderRadius: "2px", background: "rgba(61,34,51,0.3)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "2px",
            background: "linear-gradient(to right, var(--cx-gold), var(--cx-sage))",
            width: `${progressPct}%`,
            transition: "width 1.5s ease",
            opacity: 0.7,
          }} />
        </div>
      </div>

      {/* Module Grid */}
      {!assessmentComplete ? (
        <div style={{ textAlign: "center", paddingTop: "2rem" }}>
          <p className="cx-invitation" style={{ opacity: 0.4 }}>
            Complete the assessment to unlock the Codex Scroll.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {scrollModules.map((m: any, i: number) => {
            const done = completedModules.includes(m.num);
            return (
              <button
                key={m.num}
                onClick={() => onNavigate(`scroll/${m.num}`)}
                className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`}
                style={{
                  textAlign: "center", cursor: "pointer", padding: "1.5rem 1rem",
                  background: done ? "rgba(74,107,74,0.06)" : "rgba(44,31,40,0.4)",
                  borderRadius: "0.75rem",
                  border: `1px solid ${done ? "rgba(74,107,74,0.2)" : "rgba(61,34,51,0.2)"}`,
                  transition: "all 400ms",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = done ? "rgba(74,107,74,0.4)" : "rgba(201,168,76,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = done ? "rgba(74,107,74,0.2)" : "rgba(61,34,51,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Completion indicator */}
                {done && (
                  <div style={{
                    position: "absolute", top: "0.5rem", right: "0.5rem",
                    width: "1.25rem", height: "1.25rem", borderRadius: "50%",
                    background: "rgba(74,107,74,0.15)", border: "1px solid rgba(74,107,74,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={10} style={{ color: "var(--cx-sage)" }} />
                  </div>
                )}
                <div style={{ fontSize: "1.75rem", lineHeight: 1, marginBottom: "0.75rem" }}>{m.glyph}</div>
                <p style={{
                  fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(245,230,211,0.2)", marginBottom: "0.35rem",
                }}>
                  Module {m.num}
                </p>
                <p className="cx-font-heading" style={{
                  fontSize: "1rem", color: done ? "var(--cx-sage)" : "var(--cx-gold)",
                  fontWeight: 400, lineHeight: 1.3,
                }}>
                  {m.title}
                </p>
                {m.subtitle && (
                  <p style={{ fontSize: "0.7rem", color: "rgba(245,230,211,0.25)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    {m.subtitle}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
