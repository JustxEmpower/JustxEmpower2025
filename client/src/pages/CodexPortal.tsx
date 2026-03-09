import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function CodexPortal() {
  const [, go] = useLocation();
  const portalQuery = trpc.codex.client.portal.useQuery();
  const constantsQuery = trpc.codex.client.constants.useQuery();

  const portal = portalQuery.data;
  const tiers = constantsQuery.data?.journeyTiers || [];
  const scrollModules = constantsQuery.data?.scrollModules || [];

  if (portalQuery.isLoading) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <div className="text-5xl cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u{1F702}"}</div>
          <p className="cx-invitation mt-6" style={{ opacity: 0.6 }}>Preparing your journey…</p>
        </div>
      </div>
    );
  }

  // ── No tier purchased — show tier selection ──
  if (!portal?.user?.tier) {
    return (
      <div className="codex-env">
        <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
          <div className="text-center cx-fade-in mb-16">
            <div className="text-6xl mb-6 cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u{1F702}"}</div>
            <h1 className="cx-heading-xl mb-4">The Living Codex™</h1>
            <div className="cx-divider" />
            <p className="cx-invitation max-w-xl mx-auto">
              A sacred diagnostic and transformational journey for women ready to meet their archetypal truth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((t: any, i: number) => (
              <div key={t.id} className={`cx-card cx-fade-up cx-delay-${i + 1}`} style={{ borderColor: i === 2 ? 'rgba(201,168,76,0.3)' : undefined }}>
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--cx-cream)', opacity: 0.3 }}>{t.sessions}</p>
                <h3 className="cx-heading-md mb-2">{t.name}</h3>
                <p className="cx-body text-sm mb-6" style={{ opacity: 0.6 }}>{t.description}</p>
                <p className="cx-font-heading text-3xl mb-6" style={{ color: 'var(--cx-gold)' }}>{t.priceDisplay}</p>
                <ul className="space-y-2 mb-8">
                  {(t.includes || []).map((inc: string) => (
                    <li key={inc} className="flex items-start gap-2 text-sm" style={{ color: 'var(--cx-cream)', opacity: 0.7 }}>
                      <span style={{ color: 'var(--cx-sage)', marginTop: 2 }}>✓</span>
                      {inc}
                    </li>
                  ))}
                </ul>
                <button className="cx-btn-primary w-full" onClick={() => window.open(`mailto:april@justxempower.com?subject=Living Codex — ${t.name}&body=I would like to begin the ${t.name} journey (${t.priceDisplay}).`, '_blank')}>
                  Begin Journey
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Portal dashboard ──
  const assessmentStatus = portal.assessment?.status || "not_started";
  const hasScoring = !!portal.scoring;
  const reportStatus = portal.mirrorReport?.status || "none";
  const completedModules = portal.scrollProgress || [];
  const scoring = portal.scoring?.resultJson;
  const tierLabel = (portal.user.tier || "").replace(/_/g, " ");

  return (
    <div className="codex-env">
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-10">
        {/* ── Welcome ── */}
        <div className="text-center mb-16 cx-fade-in">
          <div className="text-5xl mb-6 cx-float" style={{ lineHeight: 1 }}>{"\u{1F702}"}</div>
          <h1 className="cx-heading-lg mb-2">Your Codex Portal</h1>
          <p className="cx-body text-sm" style={{ opacity: 0.5 }}>
            Welcome back, {portal.user.name || "Sacred One"}
          </p>
          <span className="inline-block mt-3 px-4 py-1 rounded-full text-xs tracking-widest uppercase"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--cx-gold)' }}>
            {tierLabel} Journey
          </span>
        </div>

        {/* ── Three journey cards ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Assessment */}
          <div className="cx-card cx-fade-up">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">◯</span>
              <h2 className="cx-heading-md" style={{ fontSize: '1.25rem' }}>The Assessment</h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--cx-cream)', opacity: 0.5 }}>
              {assessmentStatus === "not_started" && "16 sections of sacred inquiry await you."}
              {assessmentStatus === "in_progress" && `Continue where you left off — Section ${portal.assessment?.currentSection || 1}.`}
              {assessmentStatus === "complete" && "Complete. Your patterns have been received."}
            </p>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full" style={{
                background: assessmentStatus === "complete" ? 'var(--cx-sage)' :
                  assessmentStatus === "in_progress" ? 'var(--cx-gold)' : 'var(--cx-muted)'
              }} />
              <span className="text-xs capitalize" style={{ color: 'var(--cx-cream)', opacity: 0.35 }}>
                {assessmentStatus.replace("_", " ")}
              </span>
            </div>
            {assessmentStatus === "in_progress" && (
              <div className="mb-4">
                <div className="h-px w-full rounded" style={{ background: 'var(--cx-muted)' }}>
                  <div className="cx-progress rounded" style={{ width: `${((portal.assessment?.currentSection || 1) / 16) * 100}%` }} />
                </div>
              </div>
            )}
            <button className="cx-btn-primary w-full" onClick={() => go("/account/codex/assessment")}>
              {assessmentStatus === "not_started" ? "Begin Assessment" :
                assessmentStatus === "in_progress" ? "Continue Journey" : "Review"}
            </button>
          </div>

          {/* Codex Scroll */}
          <div className={`cx-card cx-fade-up cx-delay-2 ${assessmentStatus !== "complete" ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{"\u{1F701}"}</span>
              <h2 className="cx-heading-md" style={{ fontSize: '1.25rem' }}>Codex Scroll</h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--cx-cream)', opacity: 0.5 }}>
              {assessmentStatus === "complete"
                ? "Your personalized 9-module integration workbook is ready."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full" style={{
                background: assessmentStatus === "complete" ? 'var(--cx-gold)' : 'var(--cx-muted)'
              }} />
              <span className="text-xs" style={{ color: 'var(--cx-cream)', opacity: 0.35 }}>
                {assessmentStatus === "complete" ? `${completedModules.length}/9 modules` : "Locked"}
              </span>
            </div>
            {assessmentStatus === "complete" ? (
              <button className="cx-btn-primary w-full" onClick={() => go("/account/codex/scroll/1")}>
                Enter Scroll
              </button>
            ) : (
              <button className="cx-btn-primary w-full" disabled>Locked</button>
            )}
          </div>

          {/* Mirror Report */}
          <div className={`cx-card cx-fade-up cx-delay-3 ${assessmentStatus !== "complete" ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">👁</span>
              <h2 className="cx-heading-md" style={{ fontSize: '1.25rem' }}>Mirror Report</h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--cx-cream)', opacity: 0.5 }}>
              {reportStatus === "released" ? "Your archetypal reflection has been released." :
                hasScoring ? "April is reviewing your report…" :
                  "Your deep portrait — generated from your scored results."}
            </p>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full" style={{
                background: reportStatus === "released" ? 'var(--cx-sage)' :
                  hasScoring ? 'var(--cx-gold)' : 'var(--cx-muted)',
                animation: (reportStatus === "ready_for_review" || reportStatus === "generating") ? 'cx-slow-pulse 4s infinite' : undefined,
              }} />
              <span className="text-xs" style={{ color: 'var(--cx-cream)', opacity: 0.35 }}>
                {reportStatus === "released" ? "Released" :
                  hasScoring ? "Ready for Review" : "Locked"}
              </span>
            </div>
            {reportStatus === "released" ? (
              <button className="cx-btn-primary w-full" onClick={() => go("/account/codex/mirror-report")}>
                View Report
              </button>
            ) : (
              <button className="cx-btn-primary w-full" disabled>
                {hasScoring ? "Awaiting Review" : "Locked"}
              </button>
            )}
          </div>
        </div>

        {/* ── Scroll Module Grid (if unlocked) ── */}
        {hasScoring && scrollModules.length > 0 && (
          <div className="cx-card cx-fade-up cx-delay-4 mb-12">
            <h2 className="cx-heading-md mb-6" style={{ fontSize: '1.25rem' }}>Scroll Modules</h2>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
              {scrollModules.map((m: any) => {
                const done = completedModules.includes(m.num);
                return (
                  <button key={m.num} onClick={() => go(`/account/codex/scroll/${m.num}`)}
                    className="p-3 rounded-lg text-center transition-all"
                    style={{
                      background: done ? 'rgba(74,107,74,0.15)' : 'rgba(44,31,40,0.4)',
                      border: `1px solid ${done ? 'rgba(74,107,74,0.3)' : 'rgba(61,34,51,0.2)'}`,
                    }}>
                    <span className="text-lg block">{m.glyph}</span>
                    <span className="text-xs block mt-1" style={{ color: 'var(--cx-cream)', opacity: 0.4 }}>{m.num}</span>
                    {done && <span className="text-xs block mt-1" style={{ color: 'var(--cx-sage)' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scoring Preview (if scored) ── */}
        {scoring && (
          <div className="cx-card cx-fade-up cx-delay-5">
            <h2 className="cx-heading-md mb-8" style={{ fontSize: '1.25rem' }}>Your Archetypal Constellation</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {scoring.archetypeConstellation?.[0] && (
                <div className="text-center">
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--cx-cream)', opacity: 0.3 }}>Primary</p>
                  <p className="cx-font-heading text-2xl" style={{ color: 'var(--cx-gold)' }}>
                    {scoring.archetypeConstellation[0].archetype}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--cx-cream)', opacity: 0.4 }}>
                    Score: {scoring.archetypeConstellation[0].weightedScore}
                  </p>
                </div>
              )}
              {scoring.spectrumProfile && (
                <div className="text-center">
                  <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--cx-cream)', opacity: 0.3 }}>Spectrum</p>
                  <div className="flex gap-2 justify-center items-end h-20">
                    {[
                      { label: "Shadow", pct: scoring.spectrumProfile.shadowPct, color: 'var(--cx-ember)' },
                      { label: "Threshold", pct: scoring.spectrumProfile.thresholdPct, color: 'var(--cx-gold)' },
                      { label: "Gift", pct: scoring.spectrumProfile.giftPct, color: 'var(--cx-sage)' },
                    ].map(b => (
                      <div key={b.label} className="flex flex-col items-center gap-1 w-16">
                        <span className="text-xs cx-font-heading" style={{ color: b.color }}>{b.pct}%</span>
                        <div className="w-full rounded-t" style={{ height: `${Math.max(b.pct, 5)}%`, background: b.color, opacity: 0.6 }} />
                        <span className="text-[10px]" style={{ color: 'var(--cx-cream)', opacity: 0.3 }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--cx-cream)', opacity: 0.3 }}>Integration Index</p>
                <p className="cx-font-heading text-4xl" style={{ color: 'var(--cx-gold)' }}>
                  {scoring.integrationIndex?.toFixed(2) || "—"}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--cx-cream)', opacity: 0.35 }}>
                  {(scoring.integrationIndex || 0) < 0.3 ? "Deep wounding" :
                    (scoring.integrationIndex || 0) < 0.7 ? "Active healing" :
                      (scoring.integrationIndex || 0) < 1.2 ? "Balanced" : "High integration"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="cx-divider" />
          <p className="text-xs mt-4" style={{ color: 'var(--cx-cream)', opacity: 0.15 }}>
            © {new Date().getFullYear()} Just Empower®. The Living Codex™ is proprietary.
          </p>
        </div>
      </main>
    </div>
  );
}
