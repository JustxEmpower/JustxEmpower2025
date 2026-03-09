"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-4xl animate-slow-pulse">{"\u2727"}</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/checkout/verify?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setVerified(true);
        })
        .catch(() => {});
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-codex-deep flex items-center justify-center px-6">
      <div className="text-center max-w-lg animate-fade-in">
        <div className="text-6xl mb-8 animate-gold-glow">{"\u2727"}</div>
        <h1 className="font-cormorant text-4xl md:text-5xl text-codex-gold mb-6 text-shadow-gold">
          Your Journey Has Begun
        </h1>
        <div className="codex-divider" />
        <p className="codex-body mt-8 mb-4">
          Thank you for choosing the Living Codex™ Journey. Your purchase has been received.
        </p>
        <p className="codex-body text-sm text-codex-cream/50 mb-12">
          A welcome email is on its way with your next steps. You can now create your
          account and begin the assessment when you are ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="codex-btn-primary">Create Your Account</a>
          <a href="/" className="codex-btn-secondary">Return Home</a>
        </div>
        <p className="text-xs text-codex-cream/15 mt-12">
          &copy; {new Date().getFullYear()} Just Empower&reg;
        </p>
      </div>
    </div>
  );
}

