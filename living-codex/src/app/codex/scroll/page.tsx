"use client";

import { useState, useEffect, useCallback } from "react";
import { SCROLL_MODULES, type ScrollModule, type ScrollPrompt } from "@/lib/scroll-modules";

interface SavedResponse {
  moduleNum: number;
  promptId: string;
  responseText: string;
}

export default function ScrollPage() {
  const [currentModule, setCurrentModule] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Load saved responses
  useEffect(() => {
    fetch("/api/scroll/responses")
      .then((r) => r.json())
      .then((data) => {
        if (data.responses) {
          const map: Record<string, string> = {};
          data.responses.forEach((r: SavedResponse) => {
            map[r.promptId] = r.responseText;
          });
          setResponses(map);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const mod = SCROLL_MODULES[currentModule];

  const saveResponse = useCallback(
    async (promptId: string, text: string) => {
      const key = promptId;
      setResponses((prev) => ({ ...prev, [key]: text }));

      setSaving(true);
      try {
        await fetch("/api/scroll/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleNum: mod.num,
            promptId,
            responseText: text,
          }),
        });
      } catch {}
      setSaving(false);
    },
    [mod]
  );

  // Debounced auto-save
  const handleTextChange = useCallback(
    (promptId: string, text: string) => {
      setResponses((prev) => ({ ...prev, [promptId]: text }));
      // Auto-save after typing pauses
      const timer = setTimeout(() => saveResponse(promptId, text), 1500);
      return () => clearTimeout(timer);
    },
    [saveResponse]
  );

  const completedPrompts = (m: ScrollModule) =>
    m.prompts.filter((p) => responses[p.id]?.trim()).length;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-slow-pulse">{"\u{1F701}"}</div>
          <p className="font-cormorant text-lg text-codex-gold/60">Opening your Scroll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-deep">
      {/* Scroll sub-header */}
      <div className="relative flex items-center justify-between px-6 py-2 border-b border-codex-muted/10 max-w-5xl mx-auto">
        <span className="font-cormorant text-sm text-codex-gold/60">Codex Scroll</span>
        <div className="flex items-center gap-4">
          {saving && (
            <span className="text-xs text-codex-gold/40 animate-pulse">Saving...</span>
          )}
          <button
            onClick={() => setShowNav(!showNav)}
            className="codex-btn-secondary text-xs"
          >
            Modules
          </button>
        </div>

        {/* Module nav dropdown */}
        {showNav && (
          <div className="absolute right-6 top-10 bg-codex-parchment border border-codex-muted/30 rounded-lg shadow-xl p-4 w-72 z-50">
            {SCROLL_MODULES.map((m, i) => {
              const done = completedPrompts(m);
              const total = m.prompts.length;
              return (
                <button
                  key={m.num}
                  onClick={() => { setCurrentModule(i); setShowNav(false); }}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    i === currentModule
                      ? "bg-codex-wine/40 border border-codex-gold/20"
                      : "hover:bg-codex-wine/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.glyph}</span>
                      <span className="font-cormorant text-sm text-codex-cream/80">{m.title}</span>
                    </div>
                    <span className="text-xs text-codex-cream/30">
                      {done}/{total}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Module content */}
      <main className="pb-24 max-w-3xl mx-auto px-6">
        {/* Module header */}
        <div className="text-center py-16 animate-fade-in">
          <div className="text-5xl mb-6">{mod.glyph}</div>
          <p className="text-xs tracking-[0.3em] uppercase text-codex-cream/30 mb-3">
            Module {mod.num} of 9
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl font-light text-codex-gold mb-4 text-shadow-gold">
            {mod.title}
          </h1>
          <p className="font-cormorant italic text-lg text-codex-cream/50 mb-8">
            {mod.subtitle}
          </p>
          <div className="codex-divider" />
          <p className="codex-body text-sm max-w-xl mx-auto mt-8">
            {mod.description}
          </p>
        </div>

        {/* Prompts */}
        <div className="space-y-12 mt-8">
          {mod.prompts.map((prompt, i) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              index={i}
              value={responses[prompt.id] || ""}
              onChange={(text) => handleTextChange(prompt.id, text)}
              onBlur={(text) => saveResponse(prompt.id, text)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-16 pt-8 border-t border-codex-muted/10">
          <button
            onClick={() => setCurrentModule((c) => Math.max(0, c - 1))}
            disabled={currentModule === 0}
            className="codex-btn-secondary disabled:opacity-20 disabled:cursor-not-allowed"
          >
            &larr; Previous
          </button>
          <div className="flex gap-1.5">
            {SCROLL_MODULES.map((m, i) => (
              <button
                key={i}
                onClick={() => setCurrentModule(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentModule
                    ? "bg-codex-gold w-6"
                    : completedPrompts(m) === m.prompts.length
                    ? "bg-codex-sage/60"
                    : completedPrompts(m) > 0
                    ? "bg-codex-gold/30"
                    : "bg-codex-muted/30"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentModule((c) => Math.min(SCROLL_MODULES.length - 1, c + 1))}
            disabled={currentModule === SCROLL_MODULES.length - 1}
            className="codex-btn-secondary disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Next &rarr;
          </button>
        </div>
      </main>
    </div>
  );
}

function PromptCard({
  prompt,
  index,
  value,
  onChange,
  onBlur,
}: {
  prompt: ScrollPrompt;
  index: number;
  value: string;
  onChange: (text: string) => void;
  onBlur: (text: string) => void;
}) {
  const typeIcon = {
    reflection: "\u2727",
    somatic: "\u25CB",
    ritual: "\u{1F56F}\uFE0F",
    ledger: "\u2610",
    letter: "\u2709",
  }[prompt.type];

  const typeLabel = {
    reflection: "Reflection",
    somatic: "Somatic Practice",
    ritual: "Ritual",
    ledger: "Weekly Ledger",
    letter: "Letter",
  }[prompt.type];

  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{typeIcon}</span>
        <span className="text-xs tracking-widest uppercase text-codex-cream/30">
          {typeLabel}
        </span>
      </div>
      <p className="font-cormorant text-xl text-codex-cream/85 leading-relaxed mb-6">
        {prompt.text}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        placeholder={prompt.placeholder || "Write here..."}
        className="w-full min-h-[140px] bg-codex-parchment/30 border border-codex-muted/20 rounded-lg p-5
                   text-codex-cream/85 font-inter text-base leading-relaxed resize-y
                   focus:outline-none focus:border-codex-gold/30 transition-colors duration-500
                   placeholder:text-codex-cream/15 placeholder:font-cormorant placeholder:italic"
      />
      {value.trim() && (
        <div className="flex justify-end mt-2">
          <span className="text-xs text-codex-sage/60">{"\u2713"} Saved</span>
        </div>
      )}
    </div>
  );
}
