"use client";

import { useState } from "react";
import { JOURNEY_TIERS } from "@/lib/utils";

export default function PurchasePage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    if (!selectedTier) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: selectedTier, email }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Unable to start checkout. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-codex-deep">
      <header className="border-b border-codex-muted/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="text-2xl">{"\u{1F702}"}</span>
            <span className="font-cormorant text-xl text-codex-gold">The Living Codex™ Journey</span>
          </a>
          <a href="/login" className="text-sm text-codex-cream/30 hover:text-codex-cream/60">Sign In</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="codex-heading-lg mb-4">Choose Your Path</h1>
          <p className="codex-body text-sm max-w-xl mx-auto">
            Each journey uses the same sacred assessment. What differs is the depth of
            facilitation, the deliverables, and how you are held through the process.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {JOURNEY_TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`codex-card text-left transition-all duration-500 ${
                selectedTier === tier.id
                  ? "border-codex-gold/60 shadow-[0_0_25px_rgba(201,168,76,0.15)]"
                  : "hover:border-codex-gold/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-cormorant text-xl text-codex-gold">{tier.name}</h3>
                {selectedTier === tier.id && (
                  <span className="text-codex-gold text-sm">{"\u2713"}</span>
                )}
              </div>
              <p className="text-sm text-codex-cream/50 mb-4 min-h-[2.5rem]">{tier.description}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-cormorant text-3xl text-codex-gold">{tier.price}</span>
                <span className="text-xs text-codex-cream/30">{tier.sessions}</span>
              </div>
              <ul className="space-y-1.5">
                {tier.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-codex-cream/60">
                    <span className="text-codex-gold/50">{"\u2727"}</span> {item}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Checkout Form */}
        {selectedTier && (
          <div className="max-w-md mx-auto animate-fade-up">
            <div className="codex-card">
              <h2 className="font-cormorant text-2xl text-codex-gold mb-6 text-center">
                Begin: {JOURNEY_TIERS.find((t) => t.id === selectedTier)?.name}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-codex-ember/10 border border-codex-ember/30 rounded-lg text-sm text-codex-ember-light">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-xs tracking-widest uppercase text-codex-cream/30 mb-2">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-codex-deep/50 border border-codex-muted/30 rounded-lg px-4 py-3
                             text-codex-cream font-inter focus:outline-none focus:border-codex-gold/40
                             transition-colors placeholder:text-codex-cream/15"
                  placeholder="your@email.com"
                />
              </div>

              <button
                onClick={handlePurchase}
                disabled={loading || !email}
                className="codex-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecting to payment..." : `Purchase — ${JOURNEY_TIERS.find((t) => t.id === selectedTier)?.price}`}
              </button>

              <p className="text-xs text-codex-cream/20 text-center mt-4">
                Secure payment via Stripe. You will be redirected to complete your purchase.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
