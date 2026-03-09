"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/codex/portal");
    }
  };

  return (
    <div className="min-h-screen bg-codex-deep flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-5xl mb-6 animate-slow-pulse">{"\u{1F702}"}</div>
          <h1 className="font-cormorant text-4xl text-codex-gold mb-2">Enter the Codex</h1>
          <p className="font-cormorant italic text-codex-cream/40">The Living Codex™ Journey</p>
        </div>

        <form onSubmit={handleSubmit} className="codex-card animate-fade-up">
          {error && (
            <div className="mb-6 p-3 bg-codex-ember/10 border border-codex-ember/30 rounded-lg text-sm text-codex-ember-light">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs tracking-widest uppercase text-codex-cream/30 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-codex-deep/50 border border-codex-muted/30 rounded-lg px-4 py-3
                         text-codex-cream font-inter focus:outline-none focus:border-codex-gold/40
                         transition-colors duration-300 placeholder:text-codex-cream/15"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-8">
            <label className="block text-xs tracking-widest uppercase text-codex-cream/30 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-codex-deep/50 border border-codex-muted/30 rounded-lg px-4 py-3
                         text-codex-cream font-inter focus:outline-none focus:border-codex-gold/40
                         transition-colors duration-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="codex-btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Entering..." : "Enter"}
          </button>

          <div className="text-center mt-6">
            <a href="/signup" className="text-sm text-codex-cream/30 hover:text-codex-gold/60 transition-colors">
              Begin your journey &rarr;
            </a>
          </div>
        </form>

        <p className="text-center text-xs text-codex-cream/10 mt-8">
          © {new Date().getFullYear()} Just Empower®
        </p>
      </div>
    </div>
  );
}
