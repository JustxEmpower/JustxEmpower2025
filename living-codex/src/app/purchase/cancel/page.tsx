"use client";

export default function PurchaseCancelPage() {
  return (
    <div className="min-h-screen bg-codex-deep flex items-center justify-center px-6">
      <div className="text-center max-w-lg animate-fade-in">
        <div className="text-5xl mb-8">{"\u{1F702}"}</div>
        <h1 className="font-cormorant text-3xl text-codex-gold mb-4">
          No Rush. The Codex Waits.
        </h1>
        <div className="codex-divider" />
        <p className="codex-body mt-8 mb-12">
          Your purchase was not completed. If you changed your mind or encountered an issue,
          you can return to choose your path whenever you are ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/purchase" className="codex-btn-primary">Return to Paths</a>
          <a href="/" className="codex-btn-secondary">Return Home</a>
        </div>
      </div>
    </div>
  );
}
