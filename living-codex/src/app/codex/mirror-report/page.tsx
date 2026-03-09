"use client";

import { useState, useEffect } from "react";

interface ArchetypeEntry {
  archetype: string;
  weightedScore: number;
  frequency: number;
  sections: number[];
  spectrumDistribution: { shadow: number; threshold: number; gift: number };
}

interface WoundEntry {
  wiCode: string;
  weightedScore: number;
  frequency: number;
  sections: number[];
}

interface MirrorEntry {
  mpCode: string;
  weightedScore: number;
  frequency: number;
}

interface ScoringResult {
  archetypeConstellation: ArchetypeEntry[];
  activeWounds: WoundEntry[];
  activeMirrors: MirrorEntry[];
  spectrumProfile: { shadowPct: number; thresholdPct: number; giftPct: number; totalScored: number };
  masculineMirror: { mmiCode: string; mmiName: string; frequency: number }[];
  abuseBond: { patterns: { abiCode: string; frequency: number }[]; noneOfAboveCount: number };
  escapeLoops: { epclCode: string; epclName: string; frequency: number }[];
  wombField: { dominantField: string; secondaryField: string | null };
  s12OpenResponses: { promptId: string; responseText: string }[];
  integrationIndex: number;
  contradictionFlags: { pattern: string; interpretation: string; index: number }[];
  scoredAt: string;
}

interface ReportData {
  userName: string;
  scoring: ScoringResult;
  aprilNote: string | null;
}

export default function MirrorReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mirror-report")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-6 animate-slow-pulse">{"\uD83D\uDC41"}</div>
          <p className="font-cormorant text-xl text-codex-gold/60">Preparing your Mirror...</p>
        </div>
      </div>
    );
  }

  if (!data?.scoring) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-center">
          <p className="font-cormorant text-xl text-codex-cream/50">Your Mirror Report is not yet available.</p>
          <a href="/codex/portal" className="codex-btn-primary mt-6 inline-block">Return to Portal</a>
        </div>
      </div>
    );
  }

  const { scoring, userName, aprilNote } = data;
  const primary = scoring.archetypeConstellation[0];
  const secondary = scoring.archetypeConstellation[1];
  const latent = scoring.archetypeConstellation.slice(2);

  return (
    <div className="min-h-screen bg-codex-deep">
      {/* Print sub-header */}
      <div className="border-b border-codex-muted/10 px-6 py-2 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          <button onClick={() => window.print()} className="codex-btn-secondary text-xs">
            Print / Save PDF
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-8 py-8 print:px-0 print:py-0">
        {/* ─── COVER ─── */}
        <section className="text-center py-20 print:py-12 animate-fade-in">
          <p className="text-xs tracking-[0.4em] uppercase text-codex-cream/25 mb-6">Just Empower®</p>
          <div className="text-6xl mb-8">{"\uD83D\uDC41"}</div>
          <h1 className="font-cormorant text-5xl md:text-6xl font-light text-codex-gold mb-4 text-shadow-gold">
            Your Archetypal Mirror
          </h1>
          <p className="font-cormorant italic text-xl text-codex-cream/50 mb-2">
            A Living Codex™ Journey Report
          </p>
          <div className="codex-divider my-8" />
          <p className="font-cormorant text-2xl text-codex-cream/70">Prepared for {userName || "You"}</p>
          <p className="text-xs text-codex-cream/20 mt-4">
            Generated {new Date(scoring.scoredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>

        {/* ─── SECTION 1: YOUR ARCHETYPAL CONSTELLATION ─── */}
        <ReportSection title="Your Archetypal Constellation" glyph={"\u{1F702}"} num={1}>
          <p className="codex-body mb-8">
            Your archetypal constellation is the unique combination of patterns that emerged from your assessment.
            These are not fixed identities — they are living expressions of who you are becoming.
          </p>

          {/* Primary Archetype */}
          {primary && (
            <div className="codex-card mb-8 border-codex-gold/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs tracking-widest uppercase text-codex-gold/50">Primary Archetype</span>
              </div>
              <h3 className="font-cormorant text-3xl text-codex-gold mb-3">{primary.archetype}</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-cormorant text-codex-ember-light">{primary.spectrumDistribution.shadow}</p>
                  <p className="text-xs text-codex-cream/30">Shadow</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-cormorant text-codex-gold">{primary.spectrumDistribution.threshold}</p>
                  <p className="text-xs text-codex-cream/30">Threshold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-cormorant text-codex-sage">{primary.spectrumDistribution.gift}</p>
                  <p className="text-xs text-codex-cream/30">Gift</p>
                </div>
              </div>
              <p className="text-xs text-codex-cream/30 mt-4">
                Weighted Score: {primary.weightedScore} · Appeared in Sections: {primary.sections.join(", ")}
              </p>
            </div>
          )}

          {/* Secondary */}
          {secondary && (
            <div className="codex-card mb-6">
              <span className="text-xs tracking-widest uppercase text-codex-cream/30">Secondary Archetype</span>
              <h3 className="font-cormorant text-2xl text-codex-gold/80 mt-2">{secondary.archetype}</h3>
              <p className="text-xs text-codex-cream/30 mt-2">Score: {secondary.weightedScore} · Sections: {secondary.sections.join(", ")}</p>
            </div>
          )}

          {/* Latent */}
          {latent.length > 0 && (
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-codex-cream/25 mb-3">Latent Archetypes</p>
              <div className="flex flex-wrap gap-3">
                {latent.map((a) => (
                  <span key={a.archetype} className="text-sm bg-codex-parchment/40 border border-codex-muted/20 px-3 py-1 rounded-full text-codex-cream/50">
                    {a.archetype} ({a.weightedScore})
                  </span>
                ))}
              </div>
            </div>
          )}
        </ReportSection>

        {/* ─── SECTION 2: SPECTRUM PROFILE ─── */}
        <ReportSection title="Your Spectrum Profile" glyph={"\u25CB"} num={2}>
          <p className="codex-body mb-8">
            The spectrum reveals where you stand across the three expressions of archetypal energy.
            Shadow is not negative — it is where your deepest wisdom is still emerging.
          </p>
          <div className="flex gap-2 items-end h-40 mb-4 justify-center">
            <SpectrumBar label="Shadow" pct={scoring.spectrumProfile.shadowPct} color="bg-codex-ember/60" />
            <SpectrumBar label="Threshold" pct={scoring.spectrumProfile.thresholdPct} color="bg-codex-gold/50" />
            <SpectrumBar label="Gift" pct={scoring.spectrumProfile.giftPct} color="bg-codex-sage/60" />
          </div>
          <p className="text-xs text-codex-cream/25 text-center">
            Based on {scoring.spectrumProfile.totalScored} scored responses
          </p>
        </ReportSection>

        {/* ─── SECTION 3: WOUND IMPRINTS ─── */}
        <ReportSection title="Your Core Wound Imprints" glyph={"\u2696"} num={3}>
          <p className="codex-body mb-8">
            Wound imprints are not scars of failure — they are the precise places where your nervous system
            learned to protect you. Each wound carries both a cost and a hidden wisdom.
          </p>
          {scoring.activeWounds.map((w, i) => (
            <div key={w.wiCode} className="mb-6 pl-4 border-l-2 border-codex-ember/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-codex-cream/25">{["Foundational", "Active", "Present"][i]}</span>
              </div>
              <h4 className="font-cormorant text-xl text-codex-cream/80">{w.wiCode}</h4>
              <p className="text-xs text-codex-cream/30 mt-1">Weight: {w.weightedScore} · Sections: {w.sections.join(", ")}</p>
            </div>
          ))}
        </ReportSection>

        {/* ─── SECTION 4: MIRROR PATTERNS ─── */}
        <ReportSection title="Your Mirror Patterns" glyph={"\u{1F74A}"} num={4}>
          <p className="codex-body mb-8">
            Mirror patterns are how you unconsciously project, deflect, or absorb the energy around you.
            They are your relational operating system — and they can be updated.
          </p>
          {scoring.activeMirrors.slice(0, 3).map((m, i) => (
            <div key={m.mpCode} className="mb-4 flex items-center justify-between codex-card">
              <div>
                <span className="text-xs text-codex-cream/25 mr-2">{["Primary", "Secondary", "Background"][i]}</span>
                <span className="font-cormorant text-lg text-codex-cream/75">{m.mpCode}</span>
              </div>
              <span className="text-sm text-codex-gold/50">{m.weightedScore}</span>
            </div>
          ))}
        </ReportSection>

        {/* ─── SECTION 5: INTEGRATION INDEX ─── */}
        <ReportSection title="Your Integration Edge" glyph={"\u2727"} num={5}>
          <div className="text-center mb-8">
            <p className="font-cormorant text-6xl text-codex-gold mb-2">{scoring.integrationIndex.toFixed(2)}</p>
            <p className="text-sm text-codex-cream/40">
              {scoring.integrationIndex < 0.3 ? "Deep wounding — your system is in active survival mode. Be gentle with yourself." :
               scoring.integrationIndex < 0.7 ? "Active healing — you are doing real work. Your patterns are shifting." :
               scoring.integrationIndex < 1.2 ? "Balanced integration — you carry both wounds and resources with increasing wisdom." :
               "High integration — significant inner resources are active. Trust your knowing."}
            </p>
          </div>
        </ReportSection>

        {/* ─── SECTION 6: MASCULINE MIRROR (S13) ─── */}
        {scoring.masculineMirror.length > 0 && (
          <ReportSection title="Your Masculine Mirror" glyph={"\uD83D\uDC41"} num={6}>
            <p className="codex-body mb-6">
              The Masculine Mirror reveals the patterns you have absorbed, internalized, or mirrored
              from masculine-coded relationships and systems.
            </p>
            {scoring.masculineMirror.map((m) => (
              <div key={m.mmiCode} className="mb-3 flex items-center gap-3">
                <span className="text-codex-gold/40">{"\u2727"}</span>
                <span className="font-cormorant text-lg text-codex-cream/70">{m.mmiName}</span>
                <span className="text-xs text-codex-cream/25">({m.frequency}x)</span>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── SECTION 7: WOMB FIELD (S16) ─── */}
        {scoring.wombField.dominantField !== "Unknown" && (
          <ReportSection title="Your Womb Field" glyph={"\u25CB"} num={7}>
            <p className="codex-body mb-6">
              Your Womb Field is the cyclical, creative, and generative dimension of your archetypal landscape.
            </p>
            <div className="codex-card text-center">
              <p className="text-xs tracking-widest uppercase text-codex-cream/25 mb-2">Dominant Field</p>
              <p className="font-cormorant text-2xl text-codex-gold">{scoring.wombField.dominantField}</p>
              {scoring.wombField.secondaryField && (
                <p className="text-sm text-codex-cream/40 mt-2">Secondary: {scoring.wombField.secondaryField}</p>
              )}
            </div>
          </ReportSection>
        )}

        {/* ─── SECTION 8: CONTRADICTIONS ─── */}
        {scoring.contradictionFlags.length > 0 && (
          <ReportSection title="Diagnostic Contradictions" glyph={"\u26A0"} num={8}>
            <p className="codex-body mb-6">
              Contradictions are not errors — they are diagnostic. They reveal where you are simultaneously
              integrated and wounded, a hallmark of active threshold work.
            </p>
            {scoring.contradictionFlags.map((c, i) => (
              <div key={i} className="mb-4 codex-card border-codex-gold/10">
                <p className="font-cormorant text-lg text-codex-gold/70 mb-2">{c.pattern}</p>
                <p className="text-sm text-codex-cream/50">{c.interpretation}</p>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── CLOSING: APRIL'S NOTE ─── */}
        <section className="py-16 text-center print:break-before-page">
          <div className="codex-divider mb-12" />
          <p className="font-cormorant text-2xl text-codex-gold/80 mb-6">A Closing Word</p>
          {aprilNote ? (
            <p className="codex-body max-w-xl mx-auto italic">{aprilNote}</p>
          ) : (
            <p className="codex-body max-w-xl mx-auto italic text-codex-cream/50">
              What you have seen in this mirror is already yours. It was always yours.
              The Codex did not give you anything new — it illuminated what was already
              woven into the fabric of who you are. Trust what you feel. Honor what emerged.
              And know that this is only the beginning.
            </p>
          )}
          <div className="codex-divider mt-12" />
          <p className="text-xs text-codex-cream/15 mt-8">
            © {new Date().getFullYear()} Just Empower®. The Living Codex™ Journey and all associated materials are proprietary.
            Unauthorized reproduction or distribution is prohibited.
          </p>
        </section>
      </article>
    </div>
  );
}

function ReportSection({ title, glyph, num, children }: { title: string; glyph: string; num: number; children: React.ReactNode }) {
  return (
    <section className="py-12 border-t border-codex-muted/10 print:break-before-page">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg">{glyph}</span>
        <span className="text-xs tracking-widest uppercase text-codex-cream/20">Section {num}</span>
      </div>
      <h2 className="font-cormorant text-3xl text-codex-gold mb-6">{title}</h2>
      {children}
    </section>
  );
}

function SpectrumBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      <span className="text-sm font-cormorant text-codex-cream/60">{pct}%</span>
      <div className={`w-full ${color} rounded-t transition-all duration-1000`} style={{ height: `${Math.max(pct, 5)}%` }} />
      <span className="text-xs text-codex-cream/30">{label}</span>
    </div>
  );
}
