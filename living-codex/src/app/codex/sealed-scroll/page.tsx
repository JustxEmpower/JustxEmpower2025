"use client";

import { useState, useEffect } from "react";

interface ScrollLayer {
  id: string;
  layer: number;
  sealed: boolean;
  unlockProgress: Record<string, number> | null;
  contentData: { title?: string; body?: string; reflection?: string } | null;
  unlockedAt: string | null;
  viewedAt: string | null;
}

const LAYER_META = [
  { name: "The Threshold Veil", glyph: "🜁", description: "The first boundary between knowing and unknowing." },
  { name: "The Mirror of Wounds", glyph: "🜃", description: "Where your pain reflects your deepest patterns." },
  { name: "The Archetype Awakening", glyph: "🜂", description: "Your archetypes stir and begin to speak." },
  { name: "The Shadow Integration", glyph: "🜄", description: "Embracing what has been hidden in the dark." },
  { name: "The Sacred Reunion", glyph: "✧", description: "All parts return to the whole." },
];

export default function SealedScrollPage() {
  const [layers, setLayers] = useState<ScrollLayer[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/sealed-scroll")
      .then((r) => r.json())
      .then((d) => {
        setLayers(d.layers || []);
        setTotalUnlocked(d.totalUnlocked || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const interact = async (layerId: string, type: string, text?: string) => {
    setSaving(true);
    await fetch("/api/sealed-scroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layerId, interactionType: type, responseText: text }),
    });
    setSaving(false);
    setReflectionText("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-4xl animate-slow-pulse">🜁</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-deep">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <h1 className="codex-heading-lg mb-2">The Sealed Scroll</h1>
          <p className="codex-body text-sm">
            Five layers of deeper knowing, each unsealed through your engagement with the Codex.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const layer = layers.find((l) => l.layer === n);
              const unsealed = layer && !layer.sealed;
              return (
                <div
                  key={n}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all ${
                    unsealed
                      ? "border-codex-gold bg-codex-gold/10 text-codex-gold"
                      : "border-codex-muted/20 text-codex-cream/20"
                  }`}
                >
                  {unsealed ? "✓" : n}
                </div>
              );
            })}
            <span className="text-xs text-codex-cream/30 ml-3">{totalUnlocked}/5 unsealed</span>
          </div>
        </div>

        {/* Layers */}
        <div className="space-y-6">
          {LAYER_META.map((meta, i) => {
            const layerNum = i + 1;
            const layer = layers.find((l) => l.layer === layerNum);
            const sealed = !layer || layer.sealed;
            const expanded = expandedLayer === layerNum;

            return (
              <div
                key={layerNum}
                className={`codex-card transition-all animate-fade-up ${
                  sealed ? "opacity-50" : "border-codex-gold/20"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <button
                  onClick={() => !sealed && setExpandedLayer(expanded ? null : layerNum)}
                  className="w-full text-left"
                  disabled={sealed}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-3xl ${sealed ? "grayscale" : ""}`}>{meta.glyph}</span>
                    <div className="flex-1">
                      <h2 className="font-cormorant text-xl text-codex-gold">{meta.name}</h2>
                      <p className="text-sm text-codex-cream/40 mt-1">{meta.description}</p>
                    </div>
                    {sealed ? (
                      <span className="text-codex-cream/20 text-sm">sealed</span>
                    ) : (
                      <span className="text-codex-sage text-sm">
                        {expanded ? "▾" : "▸"}
                      </span>
                    )}
                  </div>
                </button>

                {/* Unlock progress for sealed layers */}
                {sealed && layer?.unlockProgress && (
                  <div className="mt-4 pt-3 border-t border-codex-muted/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-codex-cream/30">Unlock progress</span>
                    </div>
                    <div className="h-1 bg-codex-muted/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-codex-gold/40 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Object.values(layer.unlockProgress).reduce((a, b) => a + b, 0) /
                              Object.keys(layer.unlockProgress).length * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded content */}
                {expanded && layer?.contentData && (
                  <div className="mt-6 pt-4 border-t border-codex-gold/10">
                    {layer.contentData.title && (
                      <h3 className="font-cormorant text-lg text-codex-cream/80 mb-3">
                        {layer.contentData.title}
                      </h3>
                    )}
                    {layer.contentData.body && (
                      <p className="text-sm text-codex-cream/60 leading-relaxed mb-6">
                        {layer.contentData.body}
                      </p>
                    )}

                    {/* Reflection area */}
                    <div className="mt-6">
                      <label className="text-xs text-codex-cream/40 block mb-2">
                        Your reflection on this layer
                      </label>
                      <textarea
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        placeholder="What does this reveal to you?"
                        className="w-full bg-codex-wine/30 border border-codex-muted/20 rounded-lg p-4 text-codex-cream/80 placeholder:text-codex-cream/20 focus:border-codex-gold/40 focus:outline-none resize-none min-h-[100px]"
                      />
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() => interact(layer.id, "reflect", reflectionText)}
                          disabled={!reflectionText.trim() || saving}
                          className="codex-btn-primary text-sm disabled:opacity-30"
                        >
                          Save Reflection
                        </button>
                        <button
                          onClick={() => interact(layer.id, "acknowledge")}
                          disabled={saving}
                          className="codex-btn-secondary text-sm"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded but no content yet */}
                {expanded && !layer?.contentData && (
                  <div className="mt-6 pt-4 border-t border-codex-gold/10">
                    <p className="text-sm text-codex-cream/40 italic">
                      This layer has been unsealed, but its wisdom is still being prepared...
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
