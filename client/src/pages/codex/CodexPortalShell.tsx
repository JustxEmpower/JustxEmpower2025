import { useState } from "react";
import CodexDashboard from "./CodexDashboard";
import CodexJourney from "./CodexJourney";
import CodexGuide from "./CodexGuide";
import CodexJournal from "./CodexJournal";
import CodexModules from "./CodexModules";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", glyph: "\u{1F702}" },
  { id: "journey", label: "My Journey", glyph: "\u{1F9ED}" },
  { id: "guide", label: "AI Guide", glyph: "\u{1F74A}" },
  { id: "journal", label: "Journal Vault", glyph: "\u{1F4D6}" },
  { id: "codex", label: "Codex Scroll", glyph: "\u{1F701}" },
];

interface Props {
  portal: any;
  onNavigateExternal: (path: string) => void;
}

export default function CodexPortalShell({ portal, onNavigateExternal }: Props) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const handleNavigate = (view: string) => {
    if (view === "assessment") { onNavigateExternal("/account/codex/assessment"); return; }
    if (view === "mirror-report") { onNavigateExternal("/account/codex/mirror-report"); return; }
    if (view.startsWith("scroll/")) { onNavigateExternal(`/account/codex/${view}`); return; }
    if (view === "scroll") { setActiveView("codex"); return; }
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <CodexDashboard onNavigate={handleNavigate} />;
      case "journey": return <CodexJourney />;
      case "guide": return <CodexGuide />;
      case "journal": return <CodexJournal />;
      case "codex": return <CodexModules onNavigate={handleNavigate} />;
      default: return <CodexDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="codex-env" style={{ display: "flex", minHeight: "calc(100vh - 6rem)", overflow: "hidden", paddingTop: "6rem" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? "4rem" : "13rem", flexShrink: 0,
        background: "rgba(10,10,10,0.7)", borderRight: "1px solid rgba(61,34,51,0.15)",
        display: "flex", flexDirection: "column", transition: "width 400ms ease",
        position: "sticky", top: 0, height: "calc(100vh - 6rem)", overflowY: "auto", overflowX: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "1.25rem 0.5rem" : "1.25rem 1rem",
          borderBottom: "1px solid rgba(61,34,51,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "3.5rem",
        }}>
          {!collapsed && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <p className="cx-font-accent" style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "var(--cx-gold-dim)", textTransform: "uppercase" }}>Living Codex</p>
              <p style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.15)", marginTop: "0.1rem" }}>{portal.user.name?.split(" ")[0] || ""}</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: "none", border: "none", cursor: "pointer", color: "rgba(245,230,211,0.15)",
            fontSize: "0.7rem", padding: "0.25rem", transition: "color 200ms", flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--cx-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,230,211,0.15)")}
          >{collapsed ? "\u25B6" : "\u25C0"}</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: collapsed ? "0.65rem" : "0.65rem 0.85rem", borderRadius: "0.5rem",
                background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(201,168,76,0.15)" : "1px solid transparent",
                cursor: "pointer", transition: "all 250ms", width: "100%",
                justifyContent: collapsed ? "center" : "flex-start", textAlign: "left",
              }}>
                <span style={{ fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}>{item.glyph}</span>
                {!collapsed && (
                  <span style={{
                    fontSize: "0.8rem", color: isActive ? "var(--cx-gold)" : "rgba(245,230,211,0.4)",
                    fontFamily: "'Cormorant Garamond', serif", fontWeight: isActive ? 400 : 300,
                    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  }}>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid rgba(61,34,51,0.1)" }}>
          <button onClick={() => onNavigateExternal("/account")} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: collapsed ? "0.5rem" : "0.5rem 0.85rem", borderRadius: "0.5rem",
            background: "transparent", border: "1px solid transparent",
            cursor: "pointer", transition: "all 250ms", width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
          }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.3 }}>{"\u2190"}</span>
            {!collapsed && <span style={{ fontSize: "0.7rem", color: "rgba(245,230,211,0.2)" }}>Account</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", height: "calc(100vh - 6rem)" }}>
        {renderView()}
      </main>
    </div>
  );
}
