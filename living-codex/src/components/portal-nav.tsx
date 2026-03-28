"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/codex/portal", label: "Portal", icon: "\u{1F702}" },
  { href: "/codex/assessment", label: "Assessment", icon: "\u2727" },
  { href: "/codex/scroll", label: "Scroll", icon: "\u{1F701}" },
  { href: "/codex/sealed-scroll", label: "Sealed Scroll", icon: "\u{1F701}" },
  { href: "/codex/check-in", label: "Rituals", icon: "\u263D" },
  { href: "/codex/dialogue", label: "Dialogue", icon: "\u25C7" },
  { href: "/codex/mirror-report", label: "Mirror Report", icon: "\uD83D\uDC41" },
  { href: "/codex/booking", label: "Book Session", icon: "\u25CB" },
];

export default function PortalNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tier = (session?.user as any)?.tier || "";
  const sessionTiers = ["threshold", "awakening", "reclamation", "legacy"];
  const showBooking = sessionTiers.includes(tier);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-codex-deep/95 backdrop-blur-sm border-b border-codex-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/codex/portal" className="flex items-center gap-2">
            <span className="text-xl">{"\u{1F702}"}</span>
            <span className="font-cormorant text-lg text-codex-gold">Living Codex™</span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              if (item.href === "/codex/booking" && !showBooking) return null;
              const active = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-codex-wine/40 text-codex-gold"
                      : "text-codex-cream/40 hover:text-codex-cream/70 hover:bg-codex-parchment/10"
                  }`}
                >
                  <span className="mr-1.5 text-xs">{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-codex-cream/30 hidden sm:block">
            {session?.user?.name || session?.user?.email || ""}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-codex-cream/20 hover:text-codex-cream/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
