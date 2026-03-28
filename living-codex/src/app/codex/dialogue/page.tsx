"use client";

import { useState, useEffect, useRef } from "react";

interface Exchange {
  id: string;
  exchangeIndex: number;
  guidePrompt: string;
  userResponse: string | null;
  guideReflection: string | null;
}

interface Session {
  id: string;
  type: string;
  status: string;
  exchangeCount: number;
  exchanges: Exchange[];
  createdAt: string;
}

interface Revelation {
  id: string;
  content: string;
  type: string;
}

interface Challenge {
  id: string;
  challengeText: string;
  difficulty: string;
  timeframe: string;
  archetypeTarget: string;
}

const DIALOGUE_TYPES = [
  {
    type: "discovery",
    title: "Discovery",
    glyph: "◇",
    description: "Explore the parts of yourself you haven't yet met.",
  },
  {
    type: "integration",
    title: "Integration",
    glyph: "◈",
    description: "Weave together the truths your patterns have revealed.",
  },
  {
    type: "threshold",
    title: "Threshold",
    glyph: "◆",
    description: "Stand at the edge of transformation and step through.",
  },
];

export default function DialoguePage() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [revelations, setRevelations] = useState<Revelation[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dialogue")
      .then((r) => r.json())
      .then((d) => {
        setActiveSession(d.activeSession || null);
        setPastSessions(d.pastSessions || []);
        setRevelations(d.revelations || []);
        setActiveChallenge(d.activeChallenge || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.exchanges]);

  const startDialogue = async (type: string) => {
    setLoading(true);
    const res = await fetch("/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", type }),
    });
    const data = await res.json();
    setActiveSession(data.session);
    setLoading(false);
  };

  const submitResponse = async () => {
    if (!activeSession || !responseText.trim()) return;
    setResponding(true);
    const res = await fetch("/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "respond",
        sessionId: activeSession.id,
        response: responseText,
      }),
    });
    const data = await res.json();
    setActiveSession(data.session);
    setResponseText("");
    setResponding(false);
  };

  const completeDialogue = async () => {
    if (!activeSession) return;
    const res = await fetch("/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sessionId: activeSession.id }),
    });
    const data = await res.json();
    setPastSessions([data.session, ...pastSessions]);
    setActiveSession(null);
  };

  const dismissRevelation = async (id: string) => {
    await fetch("/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRevelationViewed", revelationId: id }),
    });
    setRevelations(revelations.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-4xl animate-slow-pulse">◇</div>
      </div>
    );
  }

  // Active dialogue view
  if (activeSession) {
    const exchanges = activeSession.exchanges || [];
    const lastExchange = exchanges[exchanges.length - 1];
    const awaitingResponse = lastExchange && !lastExchange.userResponse;

    return (
      <div className="min-h-screen bg-codex-deep flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-codex-muted/10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg text-codex-gold">◇</span>
              <h1 className="font-cormorant text-lg text-codex-gold capitalize">
                {activeSession.type} Dialogue
              </h1>
              <span className="text-xs text-codex-cream/30">
                Depth: {exchanges.length}
              </span>
            </div>
            {exchanges.length >= 3 && (
              <button
                onClick={completeDialogue}
                className="text-xs text-codex-cream/40 hover:text-codex-cream/70 transition-colors border border-codex-muted/20 px-3 py-1 rounded"
              >
                Complete Dialogue
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {exchanges.map((ex, i) => (
              <div key={ex.id} className="space-y-4 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Guide prompt */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-codex-wine/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-xs text-codex-gold">◇</span>
                  </div>
                  <div className="border-l-2 border-codex-gold/20 pl-4 py-2">
                    <p className="text-codex-cream/80 font-cormorant text-lg italic">
                      {ex.guidePrompt}
                    </p>
                  </div>
                </div>

                {/* User response */}
                {ex.userResponse && (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-codex-parchment/20 rounded-lg px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-codex-cream/70">{ex.userResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        {awaitingResponse && (
          <div className="px-6 py-4 border-t border-codex-muted/10">
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitResponse();
                  }
                }}
                placeholder="Speak your truth..."
                className="flex-1 bg-codex-wine/30 border border-codex-muted/20 rounded-lg p-3 text-codex-cream/80 placeholder:text-codex-cream/20 focus:border-codex-gold/40 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
              />
              <button
                onClick={submitResponse}
                disabled={!responseText.trim() || responding}
                className="codex-btn-primary self-end disabled:opacity-30"
              >
                {responding ? "..." : "Reflect"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Selection view (no active session)
  return (
    <div className="min-h-screen bg-codex-deep">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-10 animate-fade-up">
          <h1 className="codex-heading-lg mb-2">Sacred Dialogue</h1>
          <p className="codex-body text-sm">
            Enter a guided reflection to deepen your understanding of yourself.
          </p>
        </div>

        {/* Revelations */}
        {revelations.length > 0 && (
          <div className="mb-8 space-y-3 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            {revelations.map((r) => (
              <div key={r.id} className="codex-card border-codex-gold/20 flex items-start gap-3">
                <span className="text-codex-gold text-sm mt-0.5">✧</span>
                <p className="text-sm text-codex-cream/70 flex-1 italic">{r.content}</p>
                <button
                  onClick={() => dismissRevelation(r.id)}
                  className="text-codex-cream/20 hover:text-codex-cream/40 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active challenge */}
        {activeChallenge && (
          <div className="codex-card border-codex-sage/20 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-codex-sage">⚡</span>
              <h3 className="font-cormorant text-lg text-codex-sage">Active Challenge</h3>
            </div>
            <p className="text-sm text-codex-cream/70">{activeChallenge.challengeText}</p>
            <div className="flex gap-4 mt-2 text-xs text-codex-cream/30">
              <span>{activeChallenge.difficulty}</span>
              <span>{activeChallenge.timeframe}</span>
            </div>
          </div>
        )}

        {/* Dialogue type selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {DIALOGUE_TYPES.map((dt, i) => (
            <button
              key={dt.type}
              onClick={() => startDialogue(dt.type)}
              className="codex-card text-left hover:border-codex-gold/30 transition-all group animate-fade-up"
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <span className="text-3xl block mb-3 group-hover:animate-slow-pulse">{dt.glyph}</span>
              <h2 className="font-cormorant text-xl text-codex-gold mb-2">{dt.title}</h2>
              <p className="text-sm text-codex-cream/50">{dt.description}</p>
            </button>
          ))}
        </div>

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="font-cormorant text-lg text-codex-gold mb-4">Past Dialogues</h2>
            <div className="space-y-3">
              {pastSessions.map((s) => (
                <div key={s.id} className="codex-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-codex-sage" />
                    <span className="text-sm text-codex-cream/60 capitalize">{s.type}</span>
                    <span className="text-xs text-codex-cream/30">{s.exchangeCount} exchanges</span>
                  </div>
                  <span className="text-xs text-codex-cream/30">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
