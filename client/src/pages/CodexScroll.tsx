import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const PROMPT_TYPE_LABELS: Record<string, string> = {
  reflection: "Reflection",
  somatic: "Somatic Practice",
  ritual: "Ritual",
  ledger: "Sovereignty Ledger",
  letter: "Letter",
};

const PROMPT_TYPE_ACCENTS: Record<string, string> = {
  reflection: "var(--cx-moonlight)",
  somatic: "var(--cx-sage)",
  ritual: "var(--cx-gold)",
  ledger: "var(--cx-gold-dim)",
  letter: "var(--cx-ember-light)",
};

export default function CodexScroll() {
  const [, go] = useLocation();
  const [, params] = useRoute("/account/codex/scroll/:moduleNum");
  const moduleNum = parseInt(params?.moduleNum || "1", 10);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved" | "idle">>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const constantsQuery = trpc.codex.client.constants.useQuery();
  const entriesQuery = trpc.codex.client.scrollEntries.useQuery({ moduleNum });
  const saveMutation = trpc.codex.client.saveScrollResponse.useMutation();

  const scrollModules = constantsQuery.data?.scrollModules || [];
  const currentModule = scrollModules.find((m: any) => m.num === moduleNum);

  useEffect(() => {
    if (entriesQuery.data) {
      const loaded: Record<string, string> = {};
      for (const e of entriesQuery.data) loaded[e.promptId] = e.responseText || "";
      setResponses(loaded);
    }
  }, [entriesQuery.data]);

  const debouncedSave = useCallback((promptId: string, text: string) => {
    if (debounceTimers.current[promptId]) clearTimeout(debounceTimers.current[promptId]);
    if (!text.trim()) return;
    setSaveStatus(s => ({ ...s, [promptId]: "saving" }));
    debounceTimers.current[promptId] = setTimeout(async () => {
      try {
        await saveMutation.mutateAsync({ moduleNum, promptId, responseText: text.trim() });
        setSaveStatus(s => ({ ...s, [promptId]: "saved" }));
        setTimeout(() => setSaveStatus(s => ({ ...s, [promptId]: "idle" })), 2000);
      } catch {
        setSaveStatus(s => ({ ...s, [promptId]: "idle" }));
      }
    }, 1200);
  }, [moduleNum, saveMutation]);

  useEffect(() => {
    return () => { Object.values(debounceTimers.current).forEach(clearTimeout); };
  }, []);

  const handleChange = (promptId: string, text: string) => {
    setResponses(prev => ({ ...prev, [promptId]: text }));
    debouncedSave(promptId, text);
  };

  // ── Loading ──
  if (constantsQuery.isLoading) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <div className="text-5xl cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u{1F701}"}</div>
          <p className="cx-invitation mt-6" style={{ opacity: 0.6 }}>Loading the Scroll…</p>
        </div>
      </div>
    );
  }

  if (!currentModule) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <p className="cx-heading-md mb-6">Module not found.</p>
          <button className="cx-btn-primary" onClick={() => go("/account/codex")}>Return to Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="codex-env" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar: Module navigation ── */}
      <aside className="cx-print-hide" style={{
        width: '4.5rem', minHeight: '100vh', background: 'var(--cx-black)',
        borderRight: '1px solid rgba(61,34,51,0.15)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: '1.5rem', gap: '0.25rem', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <button onClick={() => go("/account/codex")} style={{
          fontSize: '0.6rem', color: 'rgba(245,230,211,0.2)', letterSpacing: '0.1em',
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', padding: '0.25rem',
        }}>Portal</button>
        {scrollModules.map((m: any) => (
          <button key={m.num} onClick={() => go(`/account/codex/scroll/${m.num}`)} style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            border: m.num === moduleNum ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
            background: m.num === moduleNum ? 'rgba(201,168,76,0.08)' : 'transparent',
            transition: 'all 300ms',
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{m.glyph}</span>
            <span style={{ fontSize: '0.55rem', color: m.num === moduleNum ? 'var(--cx-gold)' : 'rgba(245,230,211,0.2)' }}>{m.num}</span>
          </button>
        ))}
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', maxWidth: '48rem', margin: '0 auto', width: '100%' }}>
        {/* Module header */}
        <div className="cx-fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="text-5xl mb-4" style={{ lineHeight: 1 }}>{currentModule.glyph}</div>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(245,230,211,0.2)', marginBottom: '0.5rem' }}>
            Module {currentModule.num} of 9
          </p>
          <h1 className="cx-heading-lg mb-3">{currentModule.title}</h1>
          {currentModule.subtitle && (
            <p className="cx-invitation mb-4">{currentModule.subtitle}</p>
          )}
          {currentModule.description && (
            <p className="cx-body text-sm" style={{ maxWidth: '32rem', margin: '0 auto', opacity: 0.5 }}>{currentModule.description}</p>
          )}
          <div className="cx-divider" style={{ marginTop: '2rem' }} />
        </div>

        {/* Prompts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {(currentModule.prompts || []).map((p: any, i: number) => {
            const status = saveStatus[p.id] || "idle";
            const accentColor = PROMPT_TYPE_ACCENTS[p.type] || 'var(--cx-muted)';
            return (
              <div key={p.id} className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`} style={{ borderLeft: `2px solid ${accentColor}`, paddingLeft: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: accentColor, opacity: 0.7 }}>
                    {PROMPT_TYPE_LABELS[p.type] || p.type}
                  </span>
                  {status === "saving" && (
                    <span style={{ fontSize: '0.6rem', color: 'rgba(201,168,76,0.4)' }}>saving…</span>
                  )}
                  {status === "saved" && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--cx-sage)', opacity: 0.7 }}>✓ saved</span>
                  )}
                </div>

                <p className="cx-font-heading" style={{ fontSize: '1.125rem', color: 'rgba(245,230,211,0.85)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {p.text}
                </p>

                <textarea
                  className="cx-textarea"
                  value={responses[p.id] || ""}
                  onChange={e => handleChange(p.id, e.target.value)}
                  placeholder={p.placeholder || "Let your words arrive…"}
                  style={{ minHeight: '8rem' }}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(61,34,51,0.1)' }}>
          {moduleNum > 1 ? (
            <button className="cx-btn-secondary" onClick={() => go(`/account/codex/scroll/${moduleNum - 1}`)}>
              ← Module {moduleNum - 1}
            </button>
          ) : <div />}
          {moduleNum < 9 ? (
            <button className="cx-btn-primary" onClick={() => go(`/account/codex/scroll/${moduleNum + 1}`)}>
              Module {moduleNum + 1} →
            </button>
          ) : (
            <button className="cx-btn-primary" onClick={() => go("/account/codex")}>
              Complete Scroll
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ fontSize: '0.6rem', color: 'rgba(245,230,211,0.1)' }}>
            Your responses are auto-saved as you write.
          </p>
        </div>
      </main>
    </div>
  );
}
