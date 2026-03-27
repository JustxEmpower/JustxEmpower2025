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
        <div className="cx-slow-pulse"><Loader2 size={28} className="animate-spin" style={{ color: "var(--cx-rose)" }} /></div>
      </div>
    );
  }

  const totalCompleted = completedModules.length;
  const progressPct = scrollModules.length > 0 ? (totalCompleted / scrollModules.length) * 100 : 0;

  return (
    <div style={{ padding: "36px 40px", maxWidth: "56rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "8px" }}>
          INTEGRATION WORKBOOK
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--cx-ink)" }}>
          The Codex Scroll
        </h1>
        <div className="cx-divider" style={{ maxWidth: "80px", margin: "14px auto" }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "13px", color: "var(--cx-ink3)", maxWidth: "28rem", margin: "0 auto" }}>
          9 modules of somatic and reflective practice.<br />This is where knowing becomes embodiment.
        </p>
      </div>

      {/* Progress */}
      <div className="cx-card cx-fade-up" style={{ marginBottom: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: "var(--cx-ink)" }}>
            {totalCompleted} / {scrollModules.length}
          </p>
          <p style={{ fontSize: "10px", color: "var(--cx-ink3)", letterSpacing: "0.06em" }}>modules explored</p>
        </div>
        <div className="cx-progress-track">
          <div className="cx-progress" style={{ width: `${progressPct}%` }} />
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {scrollModules.map((m: any, i: number) => {
            const done = completedModules.includes(m.num);
            return (
              <button
                key={m.num}
                onClick={() => onNavigate(`scroll/${m.num}`)}
                className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`}
                style={{
                  textAlign: "center", cursor: "pointer", padding: "20px 14px",
                  background: done ? "rgba(125,142,127,0.06)" : "rgba(255,255,255,0.26)",
                  borderRadius: "16px",
                  border: `1px solid ${done ? "rgba(125,142,127,0.2)" : "rgba(255,255,255,0.52)"}`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(0,0,0,0.03)",
                  transition: "all 300ms",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = done ? "rgba(125,142,127,0.35)" : "rgba(184,123,101,0.2)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = done ? "rgba(125,142,127,0.2)" : "rgba(255,255,255,0.52)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Completion indicator */}
                {done && (
                  <div style={{
                    position: "absolute", top: "8px", right: "8px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "rgba(125,142,127,0.12)", border: "1px solid rgba(125,142,127,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={9} style={{ color: "var(--cx-sage)" }} />
                  </div>
                )}
                <div style={{ fontSize: "1.5rem", lineHeight: 1, marginBottom: "10px" }}>{m.glyph}</div>
                <p style={{
                  fontSize: "8.5px", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "var(--cx-ink3)", marginBottom: "4px",
                }}>
                  Module {m.num}
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "14px",
                  color: done ? "var(--cx-sage)" : "var(--cx-ink)",
                  fontWeight: 300, lineHeight: 1.3,
                }}>
                  {m.title}
                </p>
                {m.subtitle && (
                  <p style={{ fontSize: "10px", color: "var(--cx-ink3)", marginTop: "5px", lineHeight: 1.4 }}>
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
