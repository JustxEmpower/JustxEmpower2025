"use client";

import { useState, useEffect } from "react";

interface CheckInData {
  id: string;
  type: string;
  questionsData: string[];
  responsesData: string[] | null;
  completedAt: string | null;
  createdAt: string;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | null;
}

interface Pattern {
  id: string;
  pattern: string;
  frequency: number;
  trend: string;
  relatedArchetype: string | null;
}

export default function CheckInPage() {
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/check-in")
      .then((r) => r.json())
      .then((d) => {
        setCheckIns(d.checkIns || []);
        setPatterns(d.patterns || []);
        setStreak(d.streak || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startCheckIn = async (type: "daily" | "weekly") => {
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", type }),
    });
    const data = await res.json();
    setActiveCheckIn(data);
    setCurrentQ(0);
    setResponses([]);
    setCurrentResponse("");
  };

  const submitResponse = () => {
    const updated = [...responses, currentResponse];
    setResponses(updated);
    setCurrentResponse("");

    if (activeCheckIn && currentQ < activeCheckIn.questionsData.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitCheckIn(updated);
    }
  };

  const submitCheckIn = async (allResponses: string[]) => {
    if (!activeCheckIn) return;
    setSubmitting(true);
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        checkInId: activeCheckIn.id,
        responses: allResponses,
      }),
    });
    const data = await res.json();
    setCheckIns([data, ...checkIns]);
    setActiveCheckIn(null);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-4xl animate-slow-pulse">☽</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-deep">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header with streak */}
        <div className="mb-10 animate-fade-up">
          <h1 className="codex-heading-lg mb-2">Daily Rituals</h1>
          <p className="codex-body text-sm">
            Tend to the garden of your inner world. Each check-in deepens the pattern.
          </p>
          {streak && (
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🕯</span>
                <div>
                  <div className="text-codex-gold font-cormorant text-xl">{streak.currentStreak} days</div>
                  <div className="text-xs text-codex-cream/40">current streak</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-codex-cream/60 font-cormorant text-lg">{streak.longestStreak}</div>
                <div className="text-xs text-codex-cream/30">longest</div>
              </div>
              <div className="text-center">
                <div className="text-codex-cream/60 font-cormorant text-lg">{streak.totalActiveDays}</div>
                <div className="text-xs text-codex-cream/30">total days</div>
              </div>
            </div>
          )}
        </div>

        {/* Active check-in */}
        {activeCheckIn && (
          <div className="codex-card mb-8 animate-fade-up">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg text-codex-gold">☽</span>
              <h2 className="font-cormorant text-xl text-codex-gold capitalize">
                {activeCheckIn.type} Check-In
              </h2>
              <span className="text-xs text-codex-cream/30 ml-auto">
                {currentQ + 1} of {activeCheckIn.questionsData.length}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 mb-6">
              {activeCheckIn.questionsData.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentQ ? "bg-codex-sage" : i === currentQ ? "bg-codex-gold" : "bg-codex-muted/30"
                  }`}
                />
              ))}
            </div>

            <p className="text-codex-cream/80 font-cormorant text-lg mb-6 italic">
              {activeCheckIn.questionsData[currentQ]}
            </p>

            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Let your reflection flow..."
              className="w-full bg-codex-wine/30 border border-codex-muted/20 rounded-lg p-4 text-codex-cream/80 placeholder:text-codex-cream/20 focus:border-codex-gold/40 focus:outline-none resize-none min-h-[120px]"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={submitResponse}
                disabled={!currentResponse.trim() || submitting}
                className="codex-btn-primary disabled:opacity-30"
              >
                {currentQ < activeCheckIn.questionsData.length - 1 ? "Continue" : "Complete Ritual"}
              </button>
            </div>
          </div>
        )}

        {/* Start buttons (when no active check-in) */}
        {!activeCheckIn && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <button
              onClick={() => startCheckIn("daily")}
              className="codex-card text-left hover:border-codex-gold/30 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl group-hover:animate-slow-pulse">☽</span>
                <h2 className="font-cormorant text-xl text-codex-gold">Daily Check-In</h2>
              </div>
              <p className="text-sm text-codex-cream/50">
                Three questions to ground you in your present truth. Takes 5 minutes.
              </p>
            </button>

            <button
              onClick={() => startCheckIn("weekly")}
              className="codex-card text-left hover:border-codex-gold/30 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl group-hover:animate-slow-pulse">◯</span>
                <h2 className="font-cormorant text-xl text-codex-gold">Weekly Reflection</h2>
              </div>
              <p className="text-sm text-codex-cream/50">
                Four deeper questions to trace your week&apos;s arc. Takes 10 minutes.
              </p>
            </button>
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div className="mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="font-cormorant text-lg text-codex-gold mb-4">Emerging Patterns</h2>
            <div className="flex flex-wrap gap-2">
              {patterns.map((p) => (
                <div
                  key={p.id}
                  className="px-3 py-1.5 rounded-full border border-codex-muted/20 text-xs text-codex-cream/60"
                >
                  {p.pattern}
                  <span className="ml-2 text-codex-gold/60">{p.trend === "rising" ? "↑" : p.trend === "fading" ? "↓" : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {checkIns.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-cormorant text-lg text-codex-gold mb-4">Recent Rituals</h2>
            <div className="space-y-3">
              {checkIns.map((ci) => (
                <div key={ci.id} className="codex-card">
                  <button
                    onClick={() => setExpandedId(expandedId === ci.id ? null : ci.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${ci.completedAt ? "bg-codex-sage" : "bg-codex-gold animate-pulse"}`} />
                      <span className="text-sm text-codex-cream/60 capitalize">{ci.type}</span>
                    </div>
                    <span className="text-xs text-codex-cream/30">
                      {new Date(ci.createdAt).toLocaleDateString()}
                    </span>
                  </button>

                  {expandedId === ci.id && ci.responsesData && (
                    <div className="mt-4 pt-4 border-t border-codex-muted/10 space-y-3">
                      {ci.questionsData.map((q: string, i: number) => (
                        <div key={i}>
                          <p className="text-xs text-codex-cream/40 italic mb-1">{q}</p>
                          <p className="text-sm text-codex-cream/70">{ci.responsesData?.[i] || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
