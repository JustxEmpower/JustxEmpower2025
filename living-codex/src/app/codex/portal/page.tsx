"use client";

import { useState, useEffect } from "react";
import { SECTION_META } from "@/lib/utils";

interface PortalData {
  user: { name: string; tier: string; purchaseDate: string };
  assessment: { status: string; currentSection: number; currentQuestion: number } | null;
  scoring: { resultJson: string } | null;
  mirrorReport: { status: string; releasedAt: string | null } | null;
}

interface GrowthData {
  streak: { currentStreak: number; longestStreak: number; lastCheckIn: string } | null;
  milestones: { id: string; label: string; glyph: string; earnedAt: string }[];
  companion: { mood: string; energy: number; evolvedForm: string } | null;
  prediction: { insight: string; createdAt: string } | null;
  recentEvents: { id: string; type: string; payload: string; emittedAt: string }[];
  patternShifts: { id: string; fromPattern: string; toPattern: string; detectedAt: string }[];
  checkInCount: number;
  dialogueCount: number;
}

export default function PortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal").then((r) => r.json()),
      fetch("/api/growth-dashboard").then((r) => r.json()).catch(() => null),
    ])
      .then(([portalData, growthData]) => {
        setData(portalData);
        setGrowth(growthData);
        setLoading(false);
      })
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
  const assessmentComplete = assessmentStatus === "complete";
  const streakDays = growth?.streak?.currentStreak || 0;

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
          <div className={`codex-card ${!assessmentComplete ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🜁</span>
              <h2 className="font-cormorant text-xl text-codex-gold">Codex Scroll</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentComplete
                ? "Your personalized 9-module integration workbook is ready."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentComplete ? "bg-codex-gold" : "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {assessmentComplete ? "Ready" : "Locked"}
              </span>
            </div>
            {assessmentComplete ? (
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
          <div className={`codex-card ${!assessmentComplete ? "opacity-50" : ""}`}>
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

          {/* Check-In Ritual Card */}
          <div className={`codex-card ${!assessmentComplete ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">☽</span>
              <h2 className="font-cormorant text-xl text-codex-gold">Daily Rituals</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentComplete
                ? streakDays > 0
                  ? `Your flame burns for ${streakDays} day${streakDays !== 1 ? "s" : ""}.`
                  : "Begin your daily ritual."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentComplete
                  ? streakDays > 0
                    ? "bg-codex-sage"
                    : "bg-codex-gold animate-pulse"
                  : "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {assessmentComplete
                  ? streakDays > 0
                    ? `${streakDays}-day streak`
                    : "Ready"
                  : "Locked"}
              </span>
            </div>
            {assessmentComplete ? (
              <a href="/codex/check-in" className="codex-btn-primary block text-center">
                Enter Ritual
              </a>
            ) : (
              <button disabled className="codex-btn-primary w-full opacity-30 cursor-not-allowed">
                Locked
              </button>
            )}
          </div>

          {/* Sealed Scroll Card */}
          <div className={`codex-card ${!assessmentComplete ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🜁</span>
              <h2 className="font-cormorant text-xl text-codex-gold">The Sealed Scroll</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentComplete
                ? "Five layers of deeper knowing await."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentComplete ? "bg-codex-gold animate-pulse" : "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {assessmentComplete ? "0/5 unsealed" : "Locked"}
              </span>
            </div>
            {assessmentComplete ? (
              <a href="/codex/sealed-scroll" className="codex-btn-primary block text-center">
                Approach the Scroll
              </a>
            ) : (
              <button disabled className="codex-btn-primary w-full opacity-30 cursor-not-allowed">
                Locked
              </button>
            )}
          </div>

          {/* Guided Dialogue Card */}
          <div className={`codex-card ${!assessmentComplete ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">◇</span>
              <h2 className="font-cormorant text-xl text-codex-gold">Sacred Dialogue</h2>
            </div>
            <p className="text-sm text-codex-cream/60 mb-6">
              {assessmentComplete
                ? "Deepen your understanding through guided reflection."
                : "Unlocks after assessment completion."}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                assessmentComplete
                  ? (growth?.dialogueCount || 0) > 0
                    ? "bg-codex-sage"
                    : "bg-codex-gold animate-pulse"
                  : "bg-codex-muted"
              }`} />
              <span className="text-xs text-codex-cream/40">
                {assessmentComplete
                  ? (growth?.dialogueCount || 0) > 0
                    ? `${growth?.dialogueCount} session${(growth?.dialogueCount || 0) !== 1 ? "s" : ""}`
                    : "Ready"
                  : "Locked"}
              </span>
            </div>
            {assessmentComplete ? (
              <a href="/codex/dialogue" className="codex-btn-primary block text-center">
                Begin Dialogue
              </a>
            ) : (
              <button disabled className="codex-btn-primary w-full opacity-30 cursor-not-allowed">
                Locked
              </button>
            )}
          </div>
        </div>

        {/* Growth Dashboard (full width below grid) */}
        {assessmentComplete && growth && (
          <div className="mt-8 codex-card">
            <h2 className="font-cormorant text-2xl text-codex-gold mb-6">
              Growth Dashboard
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Streak Fire */}
              <div className="text-center">
                <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-2">Streak</p>
                <div className="text-4xl mb-1 animate-slow-pulse">
                  {streakDays > 0 ? "🔥" : "○"}
                </div>
                <p className="font-cormorant text-2xl text-codex-gold">
                  {streakDays} day{streakDays !== 1 ? "s" : ""}
                </p>
                {growth.streak?.longestStreak && growth.streak.longestStreak > streakDays && (
                  <p className="text-xs text-codex-cream/40 mt-1">
                    Best: {growth.streak.longestStreak} days
                  </p>
                )}
              </div>

              {/* Recent Milestones */}
              <div className="text-center">
                <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-3">Milestones</p>
                {growth.milestones.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {growth.milestones.slice(0, 6).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-codex-gold/10 text-xs text-codex-gold"
                        title={m.label}
                      >
                        {m.glyph || "★"} {m.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-codex-cream/40">No milestones yet</p>
                )}
              </div>

              {/* Companion Mood / Energy */}
              <div className="text-center">
                <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-2">Companion</p>
                {growth.companion ? (
                  <>
                    <p className="font-cormorant text-lg text-codex-gold capitalize">
                      {growth.companion.mood}
                    </p>
                    <div className="mt-2 mx-auto w-24 h-2 rounded-full bg-codex-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-codex-sage transition-all duration-500"
                        style={{ width: `${Math.min(100, (growth.companion.energy / 100) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-codex-cream/40 mt-1">
                      Energy: {growth.companion.energy}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-codex-cream/40">Not yet awakened</p>
                )}
              </div>

              {/* Pattern Shifts Timeline */}
              <div className="text-center">
                <p className="text-xs text-codex-cream/40 uppercase tracking-widest mb-3">Pattern Shifts</p>
                {growth.patternShifts.length > 0 ? (
                  <div className="space-y-2">
                    {growth.patternShifts.slice(0, 3).map((ps) => (
                      <div key={ps.id} className="text-xs">
                        <span className="text-codex-ember/70">{ps.fromPattern}</span>
                        <span className="text-codex-cream/30 mx-1">→</span>
                        <span className="text-codex-sage/70">{ps.toPattern}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-codex-cream/40">No shifts detected yet</p>
                )}
              </div>
            </div>

            {/* Summary counts */}
            <div className="mt-6 pt-4 border-t border-codex-cream/10 flex justify-center gap-8">
              <div className="text-center">
                <p className="font-cormorant text-xl text-codex-gold">{growth.checkInCount}</p>
                <p className="text-xs text-codex-cream/40">Check-ins</p>
              </div>
              <div className="text-center">
                <p className="font-cormorant text-xl text-codex-gold">{growth.dialogueCount}</p>
                <p className="text-xs text-codex-cream/40">Dialogues</p>
              </div>
              <div className="text-center">
                <p className="font-cormorant text-xl text-codex-gold">{growth.milestones.length}</p>
                <p className="text-xs text-codex-cream/40">Milestones</p>
              </div>
            </div>
          </div>
        )}

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
