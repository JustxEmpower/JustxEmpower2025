import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import CodexPortalShell from "./codex/CodexPortalShell";

/* ─────────────────────────────────────────────────────────────────────
   Scroll-reveal hook — elements fade in as they enter the viewport
   ───────────────────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 1.2s ease ${delay}ms, transform 1.2s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Portal
   ───────────────────────────────────────────────────────────────────── */
export default function CodexPortal() {
  const [, go] = useLocation();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [gatePassed, setGatePassed] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('purchase') === 'success' && !!params.get('tier');
  });

  const portalQuery = trpc.codex.client.portal.useQuery();
  const constantsQuery = trpc.codex.client.constants.useQuery();
  const purchaseMutation = trpc.codex.client.purchaseTier.useMutation({
    onSuccess: (data) => { if (data.checkoutUrl) window.location.href = data.checkoutUrl; },
    onError: () => setPurchasing(null),
  });
  const confirmMutation = trpc.codex.client.confirmTierPurchase.useMutation({
    onSuccess: () => {
      window.history.replaceState({}, '', window.location.pathname);
      portalQuery.refetch().then(() => setConfirming(false));
    },
    onError: () => {
      window.history.replaceState({}, '', window.location.pathname);
      setConfirming(false);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') === 'success' && params.get('tier')) {
      setConfirming(true);
      confirmMutation.mutate({ tierId: params.get('tier')! });
    }
  }, []);

  // Gate animation timer
  useEffect(() => {
    const t = setTimeout(() => setGatePassed(true), 3200);
    return () => clearTimeout(t);
  }, []);

  const portal = portalQuery.data;
  const tiers = constantsQuery.data?.journeyTiers || [];
  const scrollModules = constantsQuery.data?.scrollModules || [];

  /* ── Loading / Confirming state ── */
  if (portalQuery.isLoading || confirming) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <div className="text-5xl cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u25C8"}</div>
          {confirming && (
            <p className="cx-invitation mt-8" style={{ opacity: 0.6 }}>Activating your journey…</p>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     NO TIER — IMMERSIVE DISCOVERY EXPERIENCE
     ══════════════════════════════════════════════════════════════════════ */
  if (!portal?.user?.tier) {
    return (
      <div className="codex-env" style={{ overflowX: 'hidden' }}>

        {/* ── Section 1: The Gate ── */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
          <div style={{ opacity: gatePassed ? 0 : 1, transition: 'opacity 1.5s ease 2.8s', pointerEvents: gatePassed ? 'none' : 'auto', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div className="text-7xl" style={{ animation: 'cx-slow-pulse 3s ease-in-out', lineHeight: 1 }}>{"\u25C8"}</div>
          </div>
          <div style={{ opacity: gatePassed ? 1 : 0, transform: gatePassed ? 'translateY(0)' : 'translateY(20px)', transition: 'all 2s ease 0.5s' }}>
            <p className="cx-font-accent text-xs tracking-[0.35em] uppercase mb-8" style={{ color: 'var(--cx-gold-dim)' }}>
              Just Empower® presents
            </p>
            <h1 className="cx-heading-xl mb-0" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.1 }}>
              The Living Codex
            </h1>
            <p className="cx-font-heading text-lg mt-2" style={{ color: 'var(--cx-gold)', opacity: 0.4, letterSpacing: '0.2em' }}>™</p>
            <div className="cx-divider" style={{ marginTop: '3rem', marginBottom: '3rem' }} />
            <p className="cx-invitation max-w-lg mx-auto" style={{ fontSize: '1.2rem', lineHeight: 2, opacity: 0.7 }}>
              A sacred diagnostic for women ready<br />to meet their archetypal truth.
            </p>
            <div className="mt-16" style={{ animation: 'cx-float 4s ease-in-out infinite' }}>
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--cx-cream)', opacity: 0.15 }}>
                scroll to descend
              </span>
              <div className="mx-auto mt-3 w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(201,168,76,0.3), transparent)' }} />
            </div>
          </div>
        </section>

        {/* ── Section 2: The Invitation ── */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-2xl mx-auto text-center">
            <RevealSection>
              <p className="cx-font-heading text-2xl md:text-4xl leading-relaxed" style={{ color: 'var(--cx-cream)', fontWeight: 300, lineHeight: 1.8 }}>
                This is not a course.<br />
                <span style={{ opacity: 0.4 }}>This is not a quiz.</span>
              </p>
            </RevealSection>
            <RevealSection delay={400}>
              <div className="cx-divider" style={{ margin: '4rem auto' }} />
            </RevealSection>
            <RevealSection delay={600}>
              <p className="cx-font-heading text-2xl md:text-4xl leading-relaxed" style={{ color: 'var(--cx-cream)', fontWeight: 300, lineHeight: 1.8 }}>
                This is a mirror —<br />
                <span style={{ color: 'var(--cx-gold)' }}>built to show you what you already know.</span>
              </p>
            </RevealSection>
          </div>
        </section>

        {/* ── Section 3: The Architecture ── */}
        <section className="py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-20">
              <p className="cx-font-accent text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--cx-gold-dim)' }}>The Architecture</p>
              <h2 className="cx-heading-lg" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                What lives inside the Codex
              </h2>
            </RevealSection>

            <div className="space-y-16">
              {[
                { glyph: "◯", title: "The Assessment", desc: "16 sections of archetypal inquiry. Each question surfaces a pattern — shadow, threshold, or gift. The Codex listens without judgment." },
                { glyph: "\u25CE", title: "The Mirror Report", desc: "A personalized archetypal portrait generated from your responses. Your primary archetype, wound imprints, spectrum profile, and integration index — reviewed and released by April." },
                { glyph: "\u221E", title: "The Codex Scroll", desc: "A 9-module integration workbook. Somatic prompts, reflection rituals, and letters to the patterns you carry. This is where knowing becomes embodiment." },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 200}>
                  <div className="flex gap-8 items-start">
                    <div className="text-3xl flex-shrink-0 mt-1" style={{ opacity: 0.4 }}>{item.glyph}</div>
                    <div>
                      <h3 className="cx-font-heading text-xl mb-3" style={{ color: 'var(--cx-gold)', fontWeight: 400 }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--cx-cream)', opacity: 0.5, maxWidth: '40ch' }}>{item.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: The Paths ── */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <RevealSection className="text-center mb-24">
              <p className="cx-font-accent text-xs tracking-[0.3em] uppercase mb-6" style={{ color: 'var(--cx-gold-dim)' }}>Choose your depth</p>
              <h2 className="cx-heading-lg" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                Three paths. One truth.
              </h2>
            </RevealSection>

            <div className="space-y-4">
              {tiers.slice(0, 3).map((t: any, i: number) => {
                const isOpen = expandedTier === t.id;
                return (
                  <RevealSection key={t.id} delay={i * 150}>
                    <div
                      className="rounded-xl transition-all duration-700 cursor-pointer"
                      style={{
                        background: isOpen ? 'rgba(44,31,40,0.8)' : 'rgba(44,31,40,0.3)',
                        border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'rgba(61,34,51,0.15)'}`,
                        padding: isOpen ? '2.5rem' : '2rem 2.5rem',
                      }}
                      onClick={() => setExpandedTier(isOpen ? null : t.id)}
                    >
                      {/* Collapsed: name + one line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? 'var(--cx-cream)' : i === 1 ? 'var(--cx-gold)' : 'var(--cx-sage)', opacity: 0.5 }} />
                          <div>
                            <h3 className="cx-font-heading text-xl" style={{ color: 'var(--cx-gold)', fontWeight: 400 }}>
                              {t.name}
                            </h3>
                            {!isOpen && (
                              <p className="text-xs mt-1" style={{ color: 'var(--cx-cream)', opacity: 0.25 }}>
                                {t.description.split('.')[0]}.
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="cx-font-heading text-lg" style={{ color: 'var(--cx-gold)', opacity: isOpen ? 0.8 : 0.25 }}>
                          {t.priceDisplay}
                        </span>
                      </div>

                      {/* Expanded */}
                      <div style={{
                        maxHeight: isOpen ? '400px' : '0',
                        opacity: isOpen ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 700ms ease, opacity 500ms ease 200ms',
                      }}>
                        <div className="pt-6 mt-6" style={{ borderTop: '1px solid rgba(61,34,51,0.2)' }}>
                          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--cx-cream)', opacity: 0.5, maxWidth: '50ch' }}>
                            {t.description}
                          </p>
                          <div className="flex flex-wrap gap-3 mb-8">
                            {(t.includes || []).map((inc: string) => (
                              <span key={inc} className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)', color: 'var(--cx-gold)', opacity: 0.6 }}>
                                {inc}
                              </span>
                            ))}
                          </div>
                          <button
                            className="cx-btn-primary"
                            disabled={purchasing === t.id}
                            onClick={(e) => { e.stopPropagation(); setPurchasing(t.id); purchaseMutation.mutate({ tierId: t.id }); }}
                          >
                            {purchasing === t.id ? "Opening gateway…" : "Enter this path"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>

            {/* More tiers — subtle text link */}
            {tiers.length > 3 && (
              <RevealSection className="text-center mt-12">
                <button className="cx-btn-secondary text-xs" onClick={() => setExpandedTier(expandedTier === '_more' ? null : '_more')}>
                  {expandedTier === '_more' ? 'Show less' : `${tiers.length - 3} deeper paths available`}
                </button>
                {expandedTier === '_more' && (
                  <div className="space-y-4 mt-8">
                    {tiers.slice(3).map((t: any) => (
                      <div key={t.id} className="rounded-xl p-6 text-left" style={{ background: 'rgba(44,31,40,0.3)', border: '1px solid rgba(61,34,51,0.15)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="cx-font-heading text-lg" style={{ color: 'var(--cx-gold)' }}>{t.name}</h3>
                          <span className="cx-font-heading" style={{ color: 'var(--cx-gold)', opacity: 0.4 }}>{t.priceDisplay}</span>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--cx-cream)', opacity: 0.4 }}>{t.description}</p>
                        <button className="cx-btn-primary text-sm" disabled={purchasing === t.id}
                          onClick={() => { setPurchasing(t.id); purchaseMutation.mutate({ tierId: t.id }); }}>
                          {purchasing === t.id ? "Opening gateway…" : "Enter this path"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </RevealSection>
            )}
          </div>
        </section>

        {/* ── Section 5: Closing ── */}
        <section className="py-32 px-6">
          <RevealSection className="text-center">
            <p className="cx-invitation max-w-md mx-auto" style={{ fontSize: '1.1rem', lineHeight: 2, opacity: 0.4 }}>
              The Codex does not fix you.<br />
              It remembers you.
            </p>
            <div className="cx-divider" style={{ margin: '4rem auto' }} />
            <p className="text-xs" style={{ color: 'var(--cx-cream)', opacity: 0.1 }}>
              © {new Date().getFullYear()} Just Empower®. The Living Codex™ is proprietary.
            </p>
          </RevealSection>
        </section>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     HAS TIER — SIDEBAR-NAV PORTAL SHELL
     ══════════════════════════════════════════════════════════════════════ */
  return <CodexPortalShell portal={portal} onNavigateExternal={go} />;
}
