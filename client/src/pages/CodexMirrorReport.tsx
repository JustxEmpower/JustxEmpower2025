import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import React from "react";

export default function CodexMirrorReport() {
  const [, go] = useLocation();
  const reportQuery = trpc.codex.client.mirrorReport.useQuery();

  if (reportQuery.isLoading) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <div className="text-5xl cx-slow-pulse" style={{ lineHeight: 1 }}>👁</div>
          <p className="cx-invitation mt-6" style={{ opacity: 0.6 }}>Preparing your Mirror…</p>
        </div>
      </div>
    );
  }

  const report = reportQuery.data;
  if (!report) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <p className="cx-heading-md mb-4">Your Mirror Report is not yet available.</p>
          <p className="cx-body text-sm mb-8" style={{ opacity: 0.5 }}>Complete your assessment and wait for April to review and release your report.</p>
          <button className="cx-btn-primary" onClick={() => go("/account/codex")}>Return to Portal</button>
        </div>
      </div>
    );
  }

  const content = report.contentJson as any;
  const archetypes = content?.archetypeConstellation || [];
  const wounds = content?.activeWounds || [];
  const mirrors = content?.activeMirrors || [];
  const spectrum = content?.spectrumProfile || {};
  const integrationIndex = content?.integrationIndex || 0;
  const contradictions = content?.contradictionFlags || [];
  const masculineMirror = content?.masculineMirror || [];
  const wombField = content?.wombField || {};
  const primary = archetypes[0];
  const secondary = archetypes[1];
  const latent = archetypes.slice(2);

  return (
    <div className="codex-env">
      {/* Print button */}
      <div className="cx-print-hide" style={{ borderBottom: '1px solid rgba(61,34,51,0.1)', padding: '0.5rem 1.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="cx-btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => go("/account/codex")}>← Portal</button>
          <button className="cx-btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>

      <article style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem' }}>
        {/* ─── COVER ─── */}
        <section className="cx-fade-in" style={{ textAlign: 'center', padding: '5rem 0 3rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.2)', marginBottom: '1.5rem' }}>Just Empower®</p>
          <div className="text-6xl mb-8" style={{ lineHeight: 1 }}>👁</div>
          <h1 className="cx-heading-xl mb-4">Your Archetypal Mirror</h1>
          <p className="cx-invitation mb-2">A Living Codex™ Journey Report</p>
          <div className="cx-divider" style={{ margin: '2rem auto' }} />
          <p className="cx-font-heading text-2xl" style={{ color: 'rgba(245,230,211,0.7)' }}>
            Prepared for You
          </p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.2)', marginTop: '1rem' }}>
            Generated {new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </section>

        {/* ─── 1: ARCHETYPE CONSTELLATION ─── */}
        <ReportSection title="Your Archetypal Constellation" glyph={"\u{1F702}"} num={1}>
          <p className="cx-body mb-8">
            Your archetypal constellation is the unique combination of patterns that emerged from your assessment.
            These are not fixed identities — they are living expressions of who you are becoming.
          </p>
          {primary && (
            <div className="cx-card mb-8" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', marginBottom: '0.75rem' }}>Primary Archetype</p>
              <h3 className="cx-font-heading" style={{ fontSize: '1.875rem', color: 'var(--cx-gold)', marginBottom: '0.75rem' }}>{primary.archetype}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p className="cx-font-heading text-2xl" style={{ color: 'var(--cx-ember-light)' }}>{primary.spectrumDistribution?.shadow || 0}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.3)' }}>Shadow</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="cx-font-heading text-2xl" style={{ color: 'var(--cx-gold)' }}>{primary.spectrumDistribution?.threshold || 0}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.3)' }}>Threshold</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="cx-font-heading text-2xl" style={{ color: 'var(--cx-sage)' }}>{primary.spectrumDistribution?.gift || 0}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.3)' }}>Gift</p>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.25)', marginTop: '1rem' }}>
                Weighted Score: {primary.weightedScore} · Sections: {(primary.sections || []).join(", ")}
              </p>
            </div>
          )}
          {secondary && (
            <div className="cx-card mb-6">
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.25)' }}>Secondary Archetype</p>
              <h3 className="cx-font-heading" style={{ fontSize: '1.5rem', color: 'rgba(201,168,76,0.8)', marginTop: '0.5rem' }}>{secondary.archetype}</h3>
              <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.25)', marginTop: '0.5rem' }}>Score: {secondary.weightedScore} · Sections: {(secondary.sections || []).join(", ")}</p>
            </div>
          )}
          {latent.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.2)', marginBottom: '0.75rem' }}>Latent Archetypes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {latent.map((a: any) => (
                  <span key={a.archetype} style={{ fontSize: '0.875rem', background: 'rgba(44,31,40,0.4)', border: '1px solid rgba(61,34,51,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', color: 'rgba(245,230,211,0.5)' }}>
                    {a.archetype} ({a.weightedScore})
                  </span>
                ))}
              </div>
            </div>
          )}
        </ReportSection>

        {/* ─── 2: SPECTRUM PROFILE ─── */}
        <ReportSection title="Your Spectrum Profile" glyph="◯" num={2}>
          <p className="cx-body mb-8">
            The spectrum reveals where you stand across the three expressions of archetypal energy.
            Shadow is not negative — it is where your deepest wisdom is still emerging.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '10rem', marginBottom: '1rem', justifyContent: 'center' }}>
            {[
              { label: "Shadow", pct: spectrum.shadowPct || 0, color: 'var(--cx-ember)' },
              { label: "Threshold", pct: spectrum.thresholdPct || 0, color: 'var(--cx-gold)' },
              { label: "Gift", pct: spectrum.giftPct || 0, color: 'var(--cx-sage)' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '6rem' }}>
                <span className="cx-font-heading" style={{ fontSize: '0.875rem', color: b.color }}>{b.pct}%</span>
                <div style={{ width: '100%', borderRadius: '0.25rem 0.25rem 0 0', background: b.color, opacity: 0.6, height: `${Math.max(b.pct, 5)}%`, transition: 'height 1000ms' }} />
                <span style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.3)' }}>{b.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.2)', textAlign: 'center' }}>
            Based on {spectrum.totalScored || 0} scored responses
          </p>
        </ReportSection>

        {/* ─── 3: WOUND IMPRINTS ─── */}
        {wounds.length > 0 && (
          <ReportSection title="Your Core Wound Imprints" glyph="⚖" num={3}>
            <p className="cx-body mb-8">
              Wound imprints are not scars of failure — they are the precise places where your nervous system
              learned to protect you. Each wound carries both a cost and a hidden wisdom.
            </p>
            {wounds.map((w: any, i: number) => (
              <div key={w.wiCode} style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(139,58,58,0.3)' }}>
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.2)' }}>{["Foundational", "Active", "Present"][i] || `Wound ${i + 1}`}</p>
                <h4 className="cx-font-heading" style={{ fontSize: '1.25rem', color: 'rgba(245,230,211,0.8)' }}>{w.wiCode}</h4>
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.25)', marginTop: '0.25rem' }}>Weight: {w.weightedScore} · Sections: {(w.sections || []).join(", ")}</p>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── 4: MIRROR PATTERNS ─── */}
        {mirrors.length > 0 && (
          <ReportSection title="Your Mirror Patterns" glyph="✦" num={4}>
            <p className="cx-body mb-8">
              Mirror patterns are how you unconsciously project, deflect, or absorb the energy around you.
              They are your relational operating system — and they can be updated.
            </p>
            {mirrors.slice(0, 3).map((m: any, i: number) => (
              <div key={m.mpCode} className="cx-card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.2)', marginRight: '0.5rem' }}>{["Primary", "Secondary", "Background"][i]}</span>
                  <span className="cx-font-heading" style={{ fontSize: '1.125rem', color: 'rgba(245,230,211,0.75)' }}>{m.mpCode}</span>
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(201,168,76,0.5)' }}>{m.weightedScore}</span>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── 5: INTEGRATION INDEX ─── */}
        <ReportSection title="Your Integration Edge" glyph="✧" num={5}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p className="cx-font-heading" style={{ fontSize: '3.75rem', color: 'var(--cx-gold)' }}>{integrationIndex.toFixed ? integrationIndex.toFixed(2) : integrationIndex}</p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(245,230,211,0.4)', marginTop: '0.5rem' }}>
              {integrationIndex < 0.3 ? "Deep wounding — your system is in active survival mode. Be gentle with yourself." :
                integrationIndex < 0.7 ? "Active healing — you are doing real work. Your patterns are shifting." :
                  integrationIndex < 1.2 ? "Balanced integration — you carry both wounds and resources with increasing wisdom." :
                    "High integration — significant inner resources are active. Trust your knowing."}
            </p>
          </div>
        </ReportSection>

        {/* ─── 6: MASCULINE MIRROR ─── */}
        {masculineMirror.length > 0 && (
          <ReportSection title="Your Masculine Mirror" glyph="👁" num={6}>
            <p className="cx-body mb-6">
              The Masculine Mirror reveals the patterns you have absorbed, internalized, or mirrored
              from masculine-coded relationships and systems.
            </p>
            {masculineMirror.map((m: any) => (
              <div key={m.mmiCode} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'rgba(201,168,76,0.4)' }}>✧</span>
                <span className="cx-font-heading" style={{ fontSize: '1.125rem', color: 'rgba(245,230,211,0.7)' }}>{m.mmiName || m.mmiCode}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(245,230,211,0.2)' }}>({m.frequency}x)</span>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── 7: WOMB FIELD ─── */}
        {wombField.dominantField && wombField.dominantField !== "Unknown" && (
          <ReportSection title="Your Womb Field" glyph="◯" num={7}>
            <p className="cx-body mb-6">
              Your Womb Field is the cyclical, creative, and generative dimension of your archetypal landscape.
            </p>
            <div className="cx-card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.2)', marginBottom: '0.5rem' }}>Dominant Field</p>
              <p className="cx-font-heading text-2xl" style={{ color: 'var(--cx-gold)' }}>{wombField.dominantField}</p>
              {wombField.secondaryField && (
                <p style={{ fontSize: '0.875rem', color: 'rgba(245,230,211,0.4)', marginTop: '0.5rem' }}>Secondary: {wombField.secondaryField}</p>
              )}
            </div>
          </ReportSection>
        )}

        {/* ─── 8: CONTRADICTIONS ─── */}
        {contradictions.length > 0 && (
          <ReportSection title="Diagnostic Contradictions" glyph="⚠" num={8}>
            <p className="cx-body mb-6">
              Contradictions are not errors — they are diagnostic. They reveal where you are simultaneously
              integrated and wounded, a hallmark of active threshold work.
            </p>
            {contradictions.map((c: any, i: number) => (
              <div key={i} className="cx-card" style={{ marginBottom: '1rem', borderColor: 'rgba(201,168,76,0.1)' }}>
                <p className="cx-font-heading" style={{ fontSize: '1.125rem', color: 'rgba(201,168,76,0.7)', marginBottom: '0.5rem' }}>{c.pattern}</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(245,230,211,0.5)' }}>{c.interpretation}</p>
              </div>
            ))}
          </ReportSection>
        )}

        {/* ─── CLOSING ─── */}
        <section className="cx-print-break" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="cx-divider" style={{ marginBottom: '3rem' }} />
          <p className="cx-font-heading" style={{ fontSize: '1.5rem', color: 'rgba(201,168,76,0.8)', marginBottom: '1.5rem' }}>A Closing Word</p>
          {report.aprilNote ? (
            <p className="cx-body" style={{ maxWidth: '36rem', margin: '0 auto', fontStyle: 'italic' }}>{report.aprilNote}</p>
          ) : (
            <p className="cx-body" style={{ maxWidth: '36rem', margin: '0 auto', fontStyle: 'italic', opacity: 0.5 }}>
              What you have seen in this mirror is already yours. It was always yours.
              The Codex did not give you anything new — it illuminated what was already
              woven into the fabric of who you are. Trust what you feel. Honor what emerged.
              And know that this is only the beginning.
            </p>
          )}
          <div className="cx-divider" style={{ marginTop: '3rem' }} />
          <p style={{ fontSize: '0.65rem', color: 'rgba(245,230,211,0.12)', marginTop: '2rem' }}>
            © {new Date().getFullYear()} Just Empower®. The Living Codex™ Journey and all associated materials are proprietary.
          </p>
        </section>
      </article>
    </div>
  );
}

function ReportSection({ title, glyph, num, children }: { title: string; glyph: string; num: number; children: React.ReactNode }) {
  return (
    <section className="cx-print-break" style={{ padding: '3rem 0', borderTop: '1px solid rgba(61,34,51,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.125rem' }}>{glyph}</span>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.15)' }}>Section {num}</span>
      </div>
      <h2 className="cx-heading-lg" style={{ fontSize: '1.875rem', marginBottom: '1.5rem' }}>{title}</h2>
      {children}
    </section>
  );
}
