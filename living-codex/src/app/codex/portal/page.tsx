"use client";

import { useState, useEffect } from "react";
import { SECTION_META } from "@/lib/utils";

interface PortalData {
  user: { name: string; tier: string; purchaseDate: string };
  assessment: { status: string; currentSection: number; currentQuestion: number } | null;
  scoring: { resultJson: string } | null;
  mirrorReport: { status: string; releasedAt: string | null } | null;
}

export default function PortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-4xl animate-slow-pulse">🜂</div>
      </div>
    );
  }

  const assessmentStatus = data?.assessment?.status || "not_started";
  const scoring = data?.scoring ? JSON.parse(data.scoring.resultJson) : null;

  return (
    <div className="min-h-screen bg-codex-deep">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="codex-heading-lg mb-2">Your Codex Portal</h1>
          <p className="codex-body text-sm">
            Your private space within the Living Codex. Everything you need lives here.
          </p>
        </div>

        {/* Portal sections grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Assessment Card */}
          <div className="codex-card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">◯</span>
              <h2 className="font-cormorant text-xl text-codex-gold">The Assessment</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentStatus === "not_started" && "16 sections of sacred inquiry await you."}
              {assessmentStatus === "in_progress" && `Continue where you left off — Section ${data?.assessment?.currentSection || 1}.`}
              {assessmentStatus === "complete" && "Complete. Your patterns have been received."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentStatus === "complete" ? "bg-codex-sage" :
                assessmentStatus === "in_progress" ? "bg-codex-gold animate-pulse" :
                "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40 capitalize">
                {assessmentStatus.replace("_", " ")}
              </span>
            </div>
            <a
              href="/codex/assessment"
              className="codex-btn-primary block text-center"
            >
              {assessmentStatus === "not_started" ? "Begin Assessment" :
               assessmentStatus === "in_progress" ? "Continue Journey" :
               "Review"}
            </a>
          </div>

          {/* Codex Scroll Card */}
          <div className={`codex-card ${assessmentStatus !== "complete" ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🜁</span>
              <h2 className="font-cormorant text-xl text-codex-gold">Codex Scroll</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentStatus === "complete"
                ? "Your personalized 9-module integration workbook is ready."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentStatus === "complete" ? "bg-codex-gold" : "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {assessmentStatus === "complete" ? "Ready" : "Locked"}
              </span>
            </div>
            {assessmentStatus === "complete" ? (
              <a href="/codex/scroll" className="codex-btn-primary block text-center">
                Enter Scroll
              </a>
            ) : (
              <button disabled className="codex-btn-primary w-full opacity-30 cursor-not-allowed">
                Locked
              </button>
            )}
          </div>

          {/* Mirror Report Card */}
          <div className={`codex-card ${assessmentStatus !== "complete" ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">👁</span>
              <h2 className="font-cormorant text-xl text-codex-gold">Mirror Report</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {scoring
                ? "Your personalized archetypal analysis is ready."
                : "Your deep portrait — generated from your scored results."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                data?.mirrorReport?.status === "released" ? "bg-codex-sage" :
                scoring ? "bg-codex-gold animate-pulse" :
                "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {data?.mirrorReport?.status === "released" ? "Released" :
                 scoring ? "Ready for Review" : "Locked"}
              </span>
            </div>
            {scoring ? (
              <a href="/codex/mirror-report" className="codex-btn-primary block text-center">
                View Report
              </a>
            ) : (
              <button disabled className="codex-btn-primary w-full opacity-30 cursor-not-allowed">
                Locked
              </button>
            )}
          </div>
        </div>

        {/* Quick Results Preview (if scored) */}
        {scoring && (
          <div className="mt-12 codex-card">
            <h2 className="font-cormorant text-2xl text-codex-gold mb-6">
              Your Archetypal Constellation
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Primary Archetype */}
              {scoring.archetypeConstellation?.[0] && (
                <div className="text-center">
                  <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-2">Primary</p>
                  <p className="font-cormorant text-2xl text-codex-gold">
                    {scoring.archetypeConstellation[0].archetype}
                  </p>
                  <p className="text-sm text-codex-cream/50 mt-1">
                    Score: {scoring.archetypeConstellation[0].weightedScore}
                  </p>
                </div>
              )}
              {/* Spectrum Profile */}
              {scoring.spectrumProfile && (
                <div className="text-center">
                  <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-4">Spectrum</p>
                  <div className="flex gap-1 justify-center h-20 items-end">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 bg-codex-ember/60 rounded-t" style={{ height: `${scoring.spectrumProfile.shadowPct}%` }} />
                      <span className="text-xs text-codex-cream/40">Shadow</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 bg-codex-gold/40 rounded-t" style={{ height: `${scoring.spectrumProfile.thresholdPct}%` }} />
                      <span className="text-xs text-codex-cream/40">Threshold</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 bg-codex-sage/60 rounded-t" style={{ height: `${scoring.spectrumProfile.giftPct}%` }} />
                      <span className="text-xs text-codex-cream/40">Gift</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Integration Index */}
              <div className="text-center">
                <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-2">Integration Index</p>
                <p className="font-cormorant text-3xl text-codex-gold">
                  {scoring.integrationIndex?.toFixed(2) || "—"}
                </p>
                <p className="text-xs text-codex-cream/40 mt-1">
                  {scoring.integrationIndex < 0.3 ? "Deep wounding" :
                   scoring.integrationIndex < 0.7 ? "Active healing" :
                   scoring.integrationIndex < 1.2 ? "Balanced" : "High integration"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
