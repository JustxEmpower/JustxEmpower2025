import { useState, useEffect, useRef, useMemo } from "react";
import { LayoutDashboard, Orbit, MessageSquare, Compass, ScrollText, BookHeart, ChevronLeft, ChevronRight, ArrowLeft, Menu } from "lucide-react";
import CodexDashboard from "./CodexDashboard";
import CodexJourney from "./CodexJourney";
import CodexGuide from "./CodexGuide";
import CodexJournal from "./CodexJournal";
import CodexModules from "./CodexModules";
import CodexConversationHistory from "./CodexConversationHistory";
import CodexJournalBridge from "./CodexJournalBridge";
import CodexOnboardingCeremony, { useOnboardingState } from "./CodexOnboardingCeremony";
import { Link } from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "CORE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { id: "guide", label: "AI Guide", icon: <Orbit size={16} /> },
      { id: "history", label: "Conversations", icon: <MessageSquare size={16} /> },
    ],
  },
  {
    label: "JOURNEY",
    items: [
      { id: "journey", label: "My Journey", icon: <Compass size={16} /> },
      { id: "codex", label: "Codex Scroll", icon: <ScrollText size={16} /> },
      { id: "journal", label: "Journal Vault", icon: <BookHeart size={16} /> },
      { id: "bridge", label: "Journal Bridge", icon: <Link size={16} /> },
    ],
  },
];

const SIDEBAR_W = 240;
const SIDEBAR_COLLAPSED_W = 64;

interface Props {
  portal: any;
  onNavigateExternal: (path: string) => void;
}

// Phase class mapping for CSS theming
function getPhaseClass(phase?: string | number): string {
  const p = typeof phase === 'number' ? phase : parseInt(String(phase) || '1');
  if (p <= 3) return 'cx-phase-discovery';
  if (p <= 5) return 'cx-phase-threshold';
  if (p <= 7) return 'cx-phase-deepening';
  if (p <= 9) return 'cx-phase-sovereignty';
  return 'cx-phase-integration';
}

// Ambient floating motes — CSS-only particles
function AmbientMotes({ count = 12 }: { count?: number }) {
  const motes = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${12 + Math.random() * 18}s`,
      delay: `${Math.random() * 12}s`,
      drift: `${-30 + Math.random() * 60}px`,
    })),
  [count]);
  return (
    <div className="cx-ambient-motes">
      {motes.map(m => (
        <div key={m.id} className="cx-mote" style={{
          left: m.left,
          '--mote-duration': m.duration,
          '--mote-delay': m.delay,
          '--mote-drift': m.drift,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default function CodexPortalShell({ portal, onNavigateExternal }: Props) {
  const [activeView, setActiveView] = useState("dashboard");
  const [prevView, setPrevView] = useState("dashboard");
  const [pageKey, setPageKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resumeConversationId, setResumeConversationId] = useState<string | null>(null);
  const [resumeGuideId, setResumeGuideId] = useState<string | null>(null);
  const { onboardingComplete, markOnboardingComplete } = useOnboardingState();

  const userPhase = portal.user.phase || portal.scoring?.phase || '1';
  const phaseClass = getPhaseClass(userPhase);

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;
  const firstName = portal.user.name?.split(" ")[0] || "You";
  const initials = (portal.user.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigate = (view: string) => {
    if (view === "assessment") { onNavigateExternal("/account/codex/assessment"); return; }
    if (view === "mirror-report") { onNavigateExternal("/account/codex/mirror-report"); return; }
    if (view.startsWith("scroll/")) { onNavigateExternal(`/account/codex/${view}`); return; }
    if (view === "scroll") {
      setPrevView(activeView);
      setActiveView("codex");
      setPageKey(k => k + 1);
      return;
    }
    if (view !== activeView) {
      setPrevView(activeView);
      setActiveView(view);
      setPageKey(k => k + 1);
    }
    setMobileOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <CodexDashboard onNavigate={handleNavigate} />;
      case "journey": return <CodexJourney />;
      case "guide": return <CodexGuide resumeConversationId={resumeConversationId} resumeGuideId={resumeGuideId} onResumeHandled={() => { setResumeConversationId(null); setResumeGuideId(null); }} />;
      case "history": return <CodexConversationHistory onResumeConversation={(guideId, convId) => { setResumeGuideId(guideId); setResumeConversationId(convId); setActiveView("guide"); }} />;
      case "journal": return <CodexJournal />;
      case "codex": return <CodexModules onNavigate={handleNavigate} />;
      case "bridge": return <CodexJournalBridge />;
      default: return <CodexDashboard onNavigate={handleNavigate} />;
    }
  };

  // Doc 05: Show onboarding ceremony for first-time users
  if (!onboardingComplete) {
    return (
      <CodexOnboardingCeremony
        userName={firstName}
        onComplete={markOnboardingComplete}
        onNavigateToGuide={() => { markOnboardingComplete(); setActiveView("guide"); }}
        onNavigateToJournal={() => { markOnboardingComplete(); setActiveView("journal"); }}
      />
    );
  }

  return (
    <div className={`codex-env cx-portal-layout ${phaseClass}`} style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      {/* Ambient Environment Engine (Doc 01) */}
      <div className="cx-ambient-layer">
        <div className="cx-ambient-orb cx-ambient-orb-1" />
        <div className="cx-ambient-orb cx-ambient-orb-2" />
        <div className="cx-ambient-orb cx-ambient-orb-3" />
      </div>
      <AmbientMotes count={14} />
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 45, backdropFilter: "blur(4px)" }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`cx-sidebar ${mobileOpen ? "open" : ""}`}
        style={{ width: sidebarW }}
      >
        {/* Logo area */}
        <div className="cx-sidebar-logo" style={{ padding: collapsed ? "24px 12px 18px" : "28px 18px 20px", justifyContent: collapsed ? "center" : "flex-start" }}>
          {/* Gem logo */}
          <div style={{
            width: 26, height: 26, borderRadius: "7px",
            background: "linear-gradient(135deg, rgba(184,123,101,0.6), rgba(184,151,106,0.5))",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transform: "rotate(45deg)",
          }}>
            <span style={{ transform: "rotate(-45deg)", fontSize: "11px", color: "rgba(255,255,255,0.9)", fontWeight: 400 }}>◇</span>
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontWeight: 300, color: "var(--cx-ink)" }}>
                Living Codex
              </span>
            </div>
          )}
        </div>

        {/* Navigation sections */}
        <nav className="cx-sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="cx-sidebar-section-label">{section.label}</div>
              )}
              {collapsed && <div style={{ height: "0.75rem" }} />}
              {section.items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`cx-nav-item ${isActive ? "active" : ""}`}
                    style={{ justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "0.625rem" : undefined }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="cx-nav-icon">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="cx-sidebar-user" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
          <div className="cx-sidebar-user-avatar">{initials}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--cx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {firstName}
              </p>
              <p style={{ fontSize: "9.5px", color: "var(--cx-ink3)", textTransform: "capitalize", letterSpacing: "0.05em" }}>
                {(portal.user.tier || "explorer").replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="cx-sidebar-collapse">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="cx-btn-ghost"
            style={{ width: "100%", justifyContent: "center", padding: "0.5rem", fontSize: "0.75rem" }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Back to account */}
        <div style={{ padding: "0 18px 14px" }}>
          <button
            onClick={() => onNavigateExternal("/account")}
            className="cx-btn-ghost"
            style={{ width: "100%", fontSize: "11px", justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <ArrowLeft size={12} />
            {!collapsed && <span>Account</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="cx-portal-main" style={{ marginLeft: sidebarW }}>
        {/* Mobile header */}
        <div
          className="cx-mobile-header"
          style={{
            padding: "0.75rem 1rem", borderBottom: "1px solid var(--cx-border)",
            alignItems: "center", gap: "0.75rem", background: "var(--cx-sidebar)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="cx-btn-ghost"
            style={{ padding: "0.5rem", fontSize: "1.25rem" }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, color: "var(--cx-ink)" }}>Living Codex</span>
        </div>

        {/* Page content with transition */}
        <div key={pageKey} className="cx-page-enter" style={{ minHeight: '100%' }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}
