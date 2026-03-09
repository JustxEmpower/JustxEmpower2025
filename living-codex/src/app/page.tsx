"use client";

import { useState, useEffect } from "react";
import { ARCHETYPES, JOURNEY_TIERS } from "@/lib/utils";

function ParticleField() {
  return (
    <div className="codex-ambient">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-codex-gold/5"
          style={{
            width: Math.random() * 4 + 1 + "px",
            height: Math.random() * 4 + 1 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: Math.random() * 5 + "s",
            opacity: Math.random() * 0.4 + 0.1,
          }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <ParticleField />
      <div
        className={`relative z-10 transition-all duration-2000 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-6xl md:text-8xl mb-8 animate-slow-pulse">🜂</div>
        <h1 className="codex-heading-xl mb-6 text-shadow-gold">
          The Living Codex™ Journey
        </h1>
        <p className="font-cormorant text-xl md:text-2xl text-codex-cream/70 tracking-wide max-w-2xl mx-auto mb-4">
          A Woman&apos;s Path of Sovereignty &amp; Embodiment
        </p>
        <div className="codex-divider" />
        <p className="font-inter text-sm text-codex-cream/40 tracking-widest uppercase mt-4">
          Just Empower®
        </p>
      </div>
      <div className="absolute bottom-12 animate-float">
        <svg
          className="w-6 h-6 text-codex-gold/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}

function WhatIsSection() {
  return (
    <section className="relative py-24 px-6 md:px-12 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="codex-heading-lg mb-8">What Is the Living Codex™ Journey?</h2>
          <div className="space-y-6 codex-body">
            <p>
              The Living Codex™ Journey is a guided process of revelation — part mirror,
              part map — designed to illuminate the unseen architecture of your
              inner world.
            </p>
            <p>
              Each journey begins with a private reflection and personalized
              archetypal overview tracing the symbolic patterns most active in
              your personal, ancestral, and collective story.
            </p>
            <p>
              This is not a personality test or fixed model; it is a living
              system that distills years of study in archetypal psychology,
              universal law, and embodied practice into a resonant mirror
              crafted uniquely for you.
            </p>
            <p className="text-codex-gold/80 font-cormorant text-lg italic">
              The Codex guides you to remember your essence — the truth that
              existed before the world told you who to be.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className="absolute inset-0 rounded-full border border-codex-gold/20 animate-slow-pulse" />
            <div className="absolute inset-4 rounded-full border border-codex-gold/10" />
            <div className="absolute inset-8 rounded-full border border-codex-muted/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl md:text-6xl opacity-60">◯</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TransmutationSection() {
  const transmutations = [
    ["Abandonment", "Sovereignty"],
    ["Betrayal", "Discernment"],
    ["Silence", "Voice"],
    ["Shame", "Wholeness"],
    ["Fracture", "Strength"],
  ];

  return (
    <section className="py-24 px-6 bg-codex-deep/50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="codex-heading-lg mb-6">Understanding Archetypes</h2>
        <p className="codex-body max-w-2xl mx-auto mb-12">
          Archetypes are the timeless patterns that shape human experience —
          the universal blueprints through which we live, love, and evolve.
          Here, wounds are not erased — they are transmuted.
        </p>
        <div className="space-y-4">
          {transmutations.map(([from, to]) => (
            <div
              key={from}
              className="flex items-center justify-center gap-4 font-cormorant text-xl md:text-2xl"
            >
              <span className="text-codex-ember-light/70">{from}</span>
              <span className="text-codex-gold/40">→</span>
              <span className="text-codex-gold">{to}</span>
            </div>
          ))}
        </div>
        <p className="mt-12 font-cormorant italic text-lg text-codex-cream/60">
          This is not healing as repair — it is transformation as remembrance.
        </p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { glyph: "🜂", title: "Reflect", desc: "A 16-section immersive assessment maps your archetypal terrain through 160+ sacred questions." },
    { glyph: "◯", title: "Map", desc: "Three-dimensional scoring reveals your archetypal constellation, wound imprints, and mirror patterns." },
    { glyph: "🜁", title: "Remember", desc: "Your personalized Mirror Report and Codex Scroll guide you home to yourself." },
  ];

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <h2 className="codex-heading-lg text-center mb-16">
        How the Codex Works
      </h2>
      <div className="grid md:grid-cols-3 gap-12">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl mb-6">{step.glyph}</div>
            <h3 className="font-cormorant text-2xl text-codex-gold mb-4">
              {step.title}
            </h3>
            <p className="codex-body text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TiersSection() {
  return (
    <section className="py-24 px-6 bg-codex-deep/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="codex-heading-lg text-center mb-4">
          The Five Journey Tiers
        </h2>
        <p className="text-center codex-body text-sm mb-16 max-w-xl mx-auto">
          Each path meets you where you are. The assessment is the same — what
          differs is the depth of facilitation and the deliverables.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {JOURNEY_TIERS.map((tier, i) => (
            <div
              key={tier.id}
              className={`codex-card hover:border-codex-gold/30 transition-all duration-500 ${
                i === 0 ? "border-codex-gold/20" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🜂</span>
                <h3 className="font-cormorant text-xl text-codex-gold">
                  {tier.name}
                </h3>
              </div>
              <p className="text-codex-cream/60 text-sm mb-4 min-h-[3rem]">
                {tier.description}
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-cormorant text-3xl text-codex-gold">
                  {tier.price}
                </span>
                <span className="text-codex-cream/40 text-xs">
                  {tier.sessions}
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {tier.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-codex-cream/70"
                  >
                    <span className="text-codex-gold/60 text-xs">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="codex-btn-primary w-full">
                Begin Your Journey
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisclaimerSection() {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      <p className="text-codex-cream/30 text-xs italic text-center leading-relaxed">
        The Living Codex™ Journey is a field of self-discovery and empowerment, not a
        therapeutic or medical system. It does not replace professional care.
        Each woman&apos;s journey is her own, and participation affirms full
        responsibility for how the work is received and integrated.
      </p>
      <div className="codex-divider mt-8" />
      <p className="text-center text-codex-cream/20 text-xs mt-4">
        © 2025 Just Empower®. All rights reserved. The Living Codex™ and
        related works are proprietary. Unauthorized use is prohibited.
      </p>
    </section>
  );
}

function SiteNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-codex-deep/80 backdrop-blur-sm border-b border-codex-muted/10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-lg">{"\u{1F702}"}</span>
          <span className="font-cormorant text-base text-codex-gold/80">Living Codex™</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/purchase" className="text-xs text-codex-cream/40 hover:text-codex-cream/70 transition-colors">
            Begin Your Journey
          </a>
          <a href="/login" className="text-xs bg-codex-wine/30 border border-codex-gold/20 px-4 py-1.5 rounded-lg text-codex-gold/70 hover:text-codex-gold transition-colors">
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      <SiteNav />
      <HeroSection />
      <WhatIsSection />
      <TransmutationSection />
      <HowItWorksSection />
      <TiersSection />
      <DisclaimerSection />
    </main>
  );
}
