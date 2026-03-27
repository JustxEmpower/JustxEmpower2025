import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Hexagon, Scale, Diamond, Sun, Zap, ChevronRight, Loader2 } from "lucide-react";

export default function CodexJourney() {
  const [expandedSection, setExpandedSection] = useState<string | null>("archetype");
  const dashQuery = trpc.codex.client.dashboardData.useQuery();
  const constantsQuery = trpc.codex.client.constants.useQuery();
  const d = dashQuery.data;
  const archetypes = constantsQuery.data?.archetypes;

  if (dashQuery.isLoading || !d) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="cx-slow-pulse"><Loader2 size={28} className="animate-spin" style={{ color: "var(--cx-rose)" }} /></div>
      </div>
    );
  }

  const scoring = d.scoring;
  const constellation = scoring?.archetypeConstellation || [];
  const primary = constellation[0];
  const secondary = constellation[1];
  const latent = constellation.slice(2, 5);
  const wounds = scoring?.activeWounds || [];
  const mirrors = scoring?.activeMirrors || [];
  const spectrum = scoring?.spectrumProfile;
  const integrationIndex = scoring?.integrationIndex;
  const contradictions = scoring?.contradictionFlags || [];

  // Find archetype details from constants
  const allArchetypes = [...(archetypes?.core || []), ...(archetypes?.expansion || [])];
  const primaryDetail = primary ? allArchetypes.find((a: any) => a.name === primary.archetype) : null;

  const phase = spectrum?.thresholdPct > 40 ? "Threshold" : spectrum?.giftPct > 30 ? "Integration" : "Discovery";

  const sections = [
    { id: "archetype", label: "Archetype Constellation", glyph: <Hexagon size={20} /> },
    { id: "wounds", label: "Wound Constellation", glyph: <Scale size={20} /> },
    { id: "mirrors", label: "Mirror Patterns", glyph: <Diamond size={20} /> },
    { id: "spectrum", label: "Spectrum Profile", glyph: <Sun size={20} /> },
    { id: "contradictions", label: "Contradiction Flags", glyph: <Zap size={20} /> },
  ];

  if (!scoring) {
    return (
      <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div className="mb-6"><Hexagon size={40} style={{ color: "var(--cx-rose)", opacity: 0.4 }} /></div>
        <h1 className="cx-heading-lg mb-4">Your Journey Awaits</h1>
        <p className="cx-invitation">
          Complete the assessment to reveal your archetypal constellation,<br />wound imprints, and integration pathway.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px", maxWidth: "56rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "8px" }}>
          YOUR LIVING MAP
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--cx-ink)" }}>
          My Journey
        </h1>
        <div className="cx-divider" style={{ maxWidth: "80px", margin: "14px auto" }} />
      </div>

      {/* Accordion Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {sections.map(sec => {
          const isOpen = expandedSection === sec.id;
          return (
            <div key={sec.id}>
              <button
                onClick={() => setExpandedSection(isOpen ? null : sec.id)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  background: isOpen ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.22)",
                  border: `1px solid ${isOpen ? "rgba(184,123,101,0.16)" : "rgba(255,255,255,0.52)"}`,
                  borderRadius: isOpen ? "16px 16px 0 0" : "16px",
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 300ms",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1rem", color: "var(--cx-rose)", opacity: 0.6 }}>{sec.glyph}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "var(--cx-ink)", fontWeight: 300 }}>{sec.label}</span>
                </div>
                <span style={{ color: "var(--cx-ink3)", fontSize: "0.8rem", transition: "transform 300ms", transform: isOpen ? "rotate(90deg)" : "none" }}>
                  <ChevronRight size={12} />
                </span>
              </button>

              {/* Content */}
              <div style={{
                maxHeight: isOpen ? "60rem" : "0",
                opacity: isOpen ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 500ms ease, opacity 400ms ease",
                background: "rgba(255,255,255,0.22)",
                border: isOpen ? "1px solid rgba(255,255,255,0.52)" : "none",
                borderTop: "none",
                borderRadius: "0 0 16px 16px",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}>
                <div style={{ padding: "20px" }}>

                  {/* ARCHETYPE CONSTELLATION */}
                  {sec.id === "archetype" && (
                    <div>
                      {/* Primary */}
                      {primary && (
                        <div style={{ marginBottom: "20px", padding: "20px", background: "rgba(184,123,101,0.04)", borderRadius: "14px", border: "1px solid rgba(184,123,101,0.1)" }}>
                          <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "6px" }}>Primary Archetype</p>
                          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "4px" }}>
                            {primaryDetail?.glyph || ""} {primary.archetype}
                          </h3>
                          {primaryDetail?.tagline && (
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", fontWeight: 300, color: "var(--cx-ink3)", marginTop: "6px" }}>
                              {primaryDetail.tagline}
                            </p>
                          )}
                          <p style={{ fontSize: "11px", color: "var(--cx-ink3)", marginTop: "10px" }}>
                            Score: {primary.score?.toFixed(2)} · {phase} Phase
                          </p>
                        </div>
                      )}
                      {/* Secondary */}
                      {secondary && (
                        <div style={{ marginBottom: "16px", padding: "14px 18px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.4)" }}>
                          <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "4px" }}>Secondary</p>
                          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "var(--cx-ink2)", fontWeight: 300 }}>
                            {secondary.archetype}
                          </p>
                          <p style={{ fontSize: "10px", color: "var(--cx-ink3)" }}>Score: {secondary.score?.toFixed(2)}</p>
                        </div>
                      )}
                      {/* Latent */}
                      {latent.length > 0 && (
                        <div>
                          <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "10px" }}>Latent Patterns</p>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {latent.map((a: any, i: number) => (
                              <span key={i} style={{
                                padding: "4px 10px", borderRadius: "50px", fontSize: "11px",
                                background: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.5)",
                                color: "var(--cx-ink2)",
                              }}>
                                {a.archetype}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WOUND CONSTELLATION */}
                  {sec.id === "wounds" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {wounds.length === 0 && <p style={{ color: "var(--cx-ink3)", fontSize: "12px" }}>No wound data yet.</p>}
                      {wounds.map((w: any, i: number) => (
                        <div key={i} style={{ paddingBottom: "12px", borderBottom: i < wounds.length - 1 ? "1px solid rgba(200,188,174,0.16)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <div>
                              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "var(--cx-ink)", fontWeight: 300 }}>{w.wound}</h4>
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--cx-ink3)", letterSpacing: "0.1em" }}>
                              Priority {i + 1}
                            </span>
                          </div>
                          <div className="cx-progress-track" style={{ marginTop: "6px" }}>
                            <div className="cx-progress" style={{
                              width: `${Math.min((w.score / (wounds[0]?.score || 1)) * 100, 100)}%`,
                              background: "var(--cx-rose)",
                            }} />
                          </div>
                          <p style={{ fontSize: "10px", color: "var(--cx-ink3)", marginTop: "4px" }}>
                            Score: {w.score?.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MIRROR PATTERNS */}
                  {sec.id === "mirrors" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {mirrors.length === 0 && <p style={{ color: "var(--cx-ink3)", fontSize: "12px" }}>No mirror data yet.</p>}
                      {mirrors.map((m: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "10px", borderBottom: i < mirrors.length - 1 ? "1px solid rgba(200,188,174,0.16)" : "none" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(184,123,101,0.08)", border: "1px solid rgba(184,123,101,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "10px", color: "var(--cx-rose)" }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "13px", color: "var(--cx-ink2)" }}>{m.mirror}</p>
                            <p style={{ fontSize: "10px", color: "var(--cx-ink3)", marginTop: "2px" }}>Score: {m.score?.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SPECTRUM PROFILE */}
                  {sec.id === "spectrum" && spectrum && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                        {[
                          { label: "Shadow", pct: spectrum.shadowPct, color: "var(--cx-rose)", desc: "Protective patterns still active" },
                          { label: "Threshold", pct: spectrum.thresholdPct, color: "var(--cx-gold)", desc: "Patterns in transition" },
                          { label: "Gift", pct: spectrum.giftPct, color: "var(--cx-sage)", desc: "Integrated strengths" },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: "center" }}>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 300, color: s.color }}>
                              {s.pct}%
                            </p>
                            <p style={{ fontSize: "9px", color: "var(--cx-ink3)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "4px" }}>
                              {s.label}
                            </p>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", fontStyle: "italic", color: "var(--cx-ink3)", marginTop: "4px" }}>
                              {s.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                      {/* Visual bar */}
                      <div style={{ height: "4px", borderRadius: "2px", display: "flex", overflow: "hidden", background: "rgba(200,188,174,0.16)" }}>
                        <div style={{ width: `${spectrum.shadowPct}%`, background: "var(--cx-rose)", transition: "width 1.5s ease" }} />
                        <div style={{ width: `${spectrum.thresholdPct}%`, background: "var(--cx-gold)", transition: "width 1.5s ease" }} />
                        <div style={{ width: `${spectrum.giftPct}%`, background: "var(--cx-sage)", transition: "width 1.5s ease" }} />
                      </div>
                      {integrationIndex != null && (
                        <div style={{ textAlign: "center", marginTop: "24px" }}>
                          <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "6px" }}>Integration Index</p>
                          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "38px", fontWeight: 300, color: "var(--cx-ink)" }}>
                            {integrationIndex.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {sec.id === "spectrum" && !spectrum && (
                    <p style={{ color: "var(--cx-ink3)", fontSize: "12px" }}>Complete the assessment to see your spectrum.</p>
                  )}

                  {/* CONTRADICTIONS */}
                  {sec.id === "contradictions" && (
                    <div>
                      {contradictions.length === 0 ? (
                        <p style={{ color: "var(--cx-ink3)", fontSize: "12px" }}>
                          No contradiction flags detected. Your responses showed internal consistency.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {contradictions.map((c: any, i: number) => (
                            <div key={i} style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(184,123,101,0.04)", border: "1px solid rgba(184,123,101,0.1)" }}>
                              <p style={{ fontSize: "12px", color: "var(--cx-ink2)" }}>{c.description || c}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
