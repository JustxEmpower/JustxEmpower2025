import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { MessageSquare, Orbit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CodexConversationHistory from "./CodexConversationHistory";
import CodexLogoLoader from "./CodexLogoLoader";

// Map character IDs back to guide type IDs for sidebar selection
const CHAR_TO_GUIDE: Record<string, string> = {
  kore: "orientation",
  aoede: "archetype",
  leda: "wound",
  theia: "embodiment",
  selene: "sovereignty",
  zephyr: "sovereignty",
};

const HolographicAvatar = lazy(() => import("./HolographicAvatar"));
import { GuideCharacterSelector } from "./GuideCharacterSelector";
import { getGuideCharacter } from "./GuideCharacters";

// Map our guide IDs to the HolographicAvatar GuideType keys
const GUIDE_TYPE_MAP: Record<string, string> = {
  orientation: "codex_orientation",
  archetype: "archetype_reflection",
  wound: "journal_companion",
  shadow: "archetype_reflection",
  embodiment: "ns_support",
  sovereignty: "community_concierge",
};

interface CodexGuideProps {
  resumeConversationId?: string | null;
  resumeGuideId?: string | null;
  onResumeHandled?: () => void;
}

export default function CodexGuide({ resumeConversationId, resumeGuideId, onResumeHandled }: CodexGuideProps = {}) {
  const [guideTab, setGuideTab] = useState<"guide" | "history">("guide");
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const importMutation = trpc.codex.client.guideImportTrajectory.useMutation();

  // Load user settings (preferred guide character + voice)
  const settingsQuery = trpc.codex.client.getSettings.useQuery();
  const updateSettingsMut = trpc.codex.client.updateSettings.useMutation();
  const preferredGuideId = settingsQuery.data?.preferredGuideId || null;
  const preferredVoiceId = settingsQuery.data?.preferredVoiceId || null;

  // Avatar selection is handled during the onboarding ceremony (Doc 05).
  // The character selector is only shown when user explicitly clicks "Change".

  // Handle resume from conversation history page
  useEffect(() => {
    if (resumeConversationId && resumeGuideId) {
      const guideType = CHAR_TO_GUIDE[resumeGuideId] || "orientation";
      setSelectedGuide(guideType);
      setConversationId(resumeConversationId);
      setLocalMessages([]);
      onResumeHandled?.();
    }
  }, [resumeConversationId, resumeGuideId]);

  const constantsQuery = trpc.codex.client.constants.useQuery();
  const guides = constantsQuery.data?.guides || [];
  const sendMutation = trpc.codex.client.guideSend.useMutation();
  const conversationsQuery = trpc.codex.client.guideConversations.useQuery(
    { guideId: selectedGuide || "" },
    { enabled: !!selectedGuide }
  );
  const messagesQuery = trpc.codex.client.guideMessages.useQuery(
    { conversationId: conversationId || "" },
    { enabled: !!conversationId }
  );

  // Export query — enabled only when exportingId is set
  const exportQueryResult = trpc.codex.client.guideExportConversation.useQuery(
    { conversationId: exportingId || "" },
    { enabled: !!exportingId, refetchOnWindowFocus: false }
  );

  // Trigger download when export data arrives
  useEffect(() => {
    if (exportingId && exportQueryResult.data) {
      const trajectory = exportQueryResult.data.trajectory;
      const blob = new Blob([JSON.stringify(trajectory, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codex-trajectory-${trajectory.conversation?.guideId || "conversation"}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportingId(null);
    }
  }, [exportingId, exportQueryResult.data]);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGuide) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.messages) throw new Error("Invalid format");
      const result = await importMutation.mutateAsync({
        guideId: data.conversation?.guideId || preferredGuideId || selectedGuide,
        title: data.conversation?.title || "Imported conversation",
        messages: data.messages.map((m: any) => ({ role: m.role, content: m.content })),
      });
      setConversationId(result.conversationId);
      setLocalMessages([]);
      conversationsQuery.refetch();
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedGuide, preferredGuideId, importMutation, conversationsQuery]);

  const handleGuideSelect = useCallback((guideId: string, voiceId: string) => {
    updateSettingsMut.mutate({ preferredGuideId: guideId, preferredVoiceId: voiceId }, {
      onSuccess: () => settingsQuery.refetch(),
    });
    setShowCharacterSelector(false);
  }, [updateSettingsMut, settingsQuery]);

  // Sync messages from query
  useEffect(() => {
    if (messagesQuery.data) {
      setLocalMessages(messagesQuery.data.map(m => ({ role: m.role, content: m.content })));
    }
  }, [messagesQuery.data]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedGuide || sending) return;
    const userMsg = message.trim();
    setMessage("");
    setSending(true);

    setLocalMessages(prev => [...prev, { role: "user", content: userMsg }]);

    try {
      const result = await sendMutation.mutateAsync({
        guideId: selectedGuide,
        conversationId: conversationId || undefined,
        message: userMsg,
      });
      if (!conversationId) setConversationId(result.conversationId);
      setLocalMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      conversationsQuery.refetch();
    } catch {
      setLocalMessages(prev => [...prev, { role: "assistant", content: "I was unable to respond. Please try again." }]);
    }
    setSending(false);
  };

  const startNewConversation = () => {
    setConversationId(null);
    setLocalMessages([]);
  };

  const loadConversation = (id: string) => {
    setConversationId(id);
    setLocalMessages([]);
  };

  const [holographicMode, setHolographicMode] = useState(false);
  const activeGuide = guides.find((g: any) => g.id === selectedGuide);
  const preferredChar = preferredGuideId ? getGuideCharacter(preferredGuideId) : null;

  // ── Character Selector Overlay ──
  if (showCharacterSelector) {
    return (
      <GuideCharacterSelector
        currentGuideId={preferredGuideId}
        isFirstTime={!preferredGuideId}
        onSelect={handleGuideSelect}
        onClose={() => setShowCharacterSelector(false)}
      />
    );
  }

  // ── Guide Selection / Conversation History ──
  if (!selectedGuide) {
    return (
      <div style={{ padding: "36px 40px", maxWidth: "64rem", margin: "0 auto" }}>
        <div className="cx-fade-in" style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "6px" }}>YOUR GUIDES</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "6px" }}>
            AI Guide
          </h1>
          <p style={{ fontSize: "12px", color: "var(--cx-ink3)", maxWidth: "32rem" }}>
            Each guide holds a different mirror. Choose the one that calls to you.
          </p>
          {preferredChar && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: preferredChar.primaryColor }} />
              <span style={{ fontSize: "11px", color: "var(--cx-ink3)" }}>Active: <strong style={{ color: "var(--cx-ink)" }}>{preferredChar.name}</strong></span>
              <button onClick={() => setShowCharacterSelector(true)} className="cx-btn-ghost" style={{ fontSize: "10px" }}>
                Change
              </button>
            </div>
          )}
        </div>

        {/* Tab toggle: Guides / Conversations */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[
            { key: "guide" as const, label: "Guides", icon: <Orbit size={12} /> },
            { key: "history" as const, label: "Conversations", icon: <MessageSquare size={12} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setGuideTab(tab.key)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "50px",
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.04em",
                border: `1px solid ${guideTab === tab.key ? "rgba(184,151,106,0.4)" : "rgba(255,255,255,0.15)"}`,
                background: guideTab === tab.key ? "rgba(184,151,106,0.1)" : "transparent",
                color: guideTab === tab.key ? "var(--cx-gold)" : "var(--cx-ink2)",
                cursor: "pointer",
                transition: "all 300ms ease",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {guideTab === "history" ? (
          <CodexConversationHistory
            onResumeConversation={(guideId, convId) => {
              const guideType = CHAR_TO_GUIDE[guideId] || "orientation";
              setSelectedGuide(guideType);
              setConversationId(convId);
              setLocalMessages([]);
              setGuideTab("guide");
            }}
          />
        ) : (
          <div style={{ position: "relative" }}>
            {/* Large background logo animation — fixed center */}
            <div style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 0,
              pointerEvents: "none",
              opacity: 0.3,
            }}>
              <CodexLogoLoader size={520} />
            </div>

            <div style={{
              position: "relative", zIndex: 1,
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(17rem, 1fr))", gap: "1rem",
            }}>
              {guides.map((g: any, i: number) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuide(g.id)}
                  className={`cx-widget cx-fade-up cx-delay-${Math.min(i + 1, 6)}`}
                  style={{
                    textAlign: "left", cursor: "pointer", padding: "1.5rem",
                    transition: "all 300ms cubic-bezier(0.4,0,0.2,1)",
                    border: "1px solid var(--cx-border)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(184,123,101,0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--cx-border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: "10px", marginBottom: "12px",
                    background: "rgba(184,123,101,0.06)",
                    border: "1px solid rgba(184,123,101,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem",
                  }}>{g.icon}</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "4px" }}>
                    {g.name}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--cx-ink3)", lineHeight: 1.55 }}>
                    {g.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Chat Interface ──
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Holographic Avatar Mode — production-ready wrapper */}
      {holographicMode && selectedGuide && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "linear-gradient(170deg, #1A1510 0%, #1E1A14 40%, #16120E 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <button
            onClick={() => setHolographicMode(false)}
            style={{
              position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 70,
              background: "rgba(255,255,255,0.10)", border: "none",
              borderRadius: "50px", padding: "0.5rem 1.25rem",
              color: "rgba(220,205,185,0.85)", backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              fontSize: "11px", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          >
            ✕ Exit
          </button>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="cx-avatar-module cx-holo-breathe" style={{ maxWidth: 754 }}>
            <Suspense fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", aspectRatio: "1" }}>
                <div className="cx-slow-pulse" style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(184,123,101,0.3), rgba(184,151,106,0.1))", opacity: 0.6,
                }} />
              </div>
            }>
              <HolographicAvatar
                guideType={(GUIDE_TYPE_MAP[selectedGuide] || "codex_orientation") as any}
                preferredGuideId={preferredGuideId || undefined}
                preferredVoiceId={preferredVoiceId || undefined}
                onChangeGuide={(guideId, voiceId) => {
                  handleGuideSelect(guideId, voiceId);
                  setConversationId(null);
                  setLocalMessages([]);
                }}
                userProfile={{ userId: "", phase: 1, primaryArchetype: "", shadowArchetype: "", woundPrioritySet: [], nsDominant: "ventral", pathway: "discovery" }}
                systemPrompt=""
                onMessage={(msg: any) => {
                  setLocalMessages(prev => [...prev, { role: msg.role === "guide" ? "assistant" : "user", content: msg.content }]);
                }}
                onEscalation={() => {}}
                onSessionEnd={() => setHolographicMode(false)}
                isActive={holographicMode}
                onSendMessage={async (text: string) => {
                  const result = await sendMutation.mutateAsync({
                    guideId: preferredGuideId || selectedGuide,
                    conversationId: conversationId || undefined,
                    message: text,
                  });
                  if (!conversationId) setConversationId(result.conversationId);
                  return result.response;
                }}
              />
            </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Sidebar */}
      <div style={{
        width: "15rem", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.44)",
        display: "flex", flexDirection: "column", background: "rgba(236,228,218,0.35)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        overflowY: "auto",
      }}>
        <div style={{ padding: "14px" }}>
          <button onClick={() => setSelectedGuide(null)} className="cx-btn-ghost" style={{ width: "100%", justifyContent: "flex-start", fontSize: "10px", marginBottom: "10px", padding: "5px 8px" }}>
            {"\u2190"} All Guides
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "8px",
              background: "rgba(184,123,101,0.08)",
              border: "1px solid rgba(184,123,101,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.8rem", flexShrink: 0,
            }}>{activeGuide?.icon}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--cx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeGuide?.name?.split(" ").slice(0, -1).join(" ") || activeGuide?.name}
              </p>
            </div>
          </div>
          <button onClick={startNewConversation} className="cx-btn-primary" style={{ width: "100%", fontSize: "0.8125rem", padding: "0.5rem", marginBottom: "0.5rem" }}>
            + New Conversation
          </button>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button onClick={() => setHolographicMode(true)} className="cx-btn-ghost" style={{ flex: 1, fontSize: "0.6875rem", padding: "0.4rem", border: "1px solid var(--cx-border)", borderRadius: "0.5rem" }}>
              Holographic
            </button>
            <button onClick={() => setShowCharacterSelector(true)} className="cx-btn-ghost" style={{ flex: 1, fontSize: "0.6875rem", padding: "0.4rem", border: "1px solid var(--cx-border)", borderRadius: "0.5rem" }}>
              Avatar
            </button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="cx-btn-ghost" style={{ width: "100%", fontSize: "0.6875rem", marginTop: "0.375rem", border: "1px solid var(--cx-border)", borderRadius: "0.5rem", padding: "0.4rem" }}>
            Upload Trajectory
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportFile} />
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, padding: "0 0.625rem", overflowY: "auto" }}>
          {(conversationsQuery.data || []).map((c: any) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.125rem" }}>
              <button
                onClick={() => loadConversation(c.id)}
                className={`cx-nav-item ${conversationId === c.id ? "active" : ""}`}
                style={{ flex: 1, padding: "0.5rem 0.625rem", flexDirection: "column", alignItems: "flex-start", gap: "0.125rem" }}
              >
                <span style={{ fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", display: "block" }}>
                  {c.title || "Untitled"}
                </span>
                <span style={{ fontSize: "10px", color: "var(--cx-ink3)" }}>
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setExportingId(c.id); }}
                title="Export trajectory"
                className="cx-btn-ghost"
                style={{ padding: "0.25rem 0.375rem", fontSize: "0.6875rem", flexShrink: 0 }}
              >
                {"\u2193"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {localMessages.length === 0 && (
            <div className="cx-fade-in" style={{ textAlign: "center", paddingTop: "8rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "14px", margin: "0 auto 16px",
                background: "rgba(184,123,101,0.06)",
                border: "1px solid rgba(184,123,101,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem",
              }}>{activeGuide?.icon}</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--cx-ink)", marginBottom: "6px" }}>
                {activeGuide?.name}
              </h2>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", fontWeight: 300, color: "var(--cx-ink3)", maxWidth: "28rem", margin: "0 auto", lineHeight: 1.65 }}>
                {activeGuide?.description}. Begin by sharing what is present for you.
              </p>
            </div>
          )}
          {localMessages.map((m, i) => (
            <div key={i} style={{
              marginBottom: "1rem",
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div className={`cx-chat-bubble ${m.role}`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
              <div className="cx-chat-bubble assistant">
                <div className="cx-slow-pulse" style={{ color: "var(--cx-ink3)", fontSize: "12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
                  The guide is reflecting...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "14px 32px 18px", borderTop: "1px solid rgba(255,255,255,0.44)",
          background: "rgba(236,228,218,0.3)", backdropFilter: "blur(16px)",
        }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <textarea
              className="cx-chat-input"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Share what is present for you..."
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="cx-btn-primary"
              style={{ padding: "0.625rem 1.25rem", flexShrink: 0 }}
            >
              Send
            </button>
          </div>
          <p style={{ fontSize: "9.5px", color: "var(--cx-clay)", marginTop: "8px", textAlign: "center" }}>
            This guide mirrors your patterns. It is not therapy. For crisis support, contact a professional.
          </p>
        </div>
      </div>
    </div>
  );
}
