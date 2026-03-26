import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";

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

  // Show character selector on first visit if no guide chosen yet
  useEffect(() => {
    if (settingsQuery.isFetched && !preferredGuideId) {
      setShowCharacterSelector(true);
    }
  }, [settingsQuery.isFetched, preferredGuideId]);

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

  // ── Guide Selection ──
  if (!selectedGuide) {
    return (
      <div style={{ padding: "2rem 2.5rem", maxWidth: "64rem", margin: "0 auto" }}>
        <div className="cx-fade-in" style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cx-cream)", marginBottom: "0.375rem" }}>
            AI Guide
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "rgba(240,235,245,0.4)", maxWidth: "32rem" }}>
            Each guide holds a different mirror. Choose the one that calls to you.
          </p>
          {preferredChar && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: preferredChar.primaryColor, boxShadow: `0 0 8px ${preferredChar.primaryColor}` }} />
              <span style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.5)" }}>Active: <strong style={{ color: preferredChar.primaryColor }}>{preferredChar.name}</strong></span>
              <button onClick={() => setShowCharacterSelector(true)} className="cx-btn-ghost" style={{ fontSize: "0.75rem" }}>
                Change
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(17rem, 1fr))", gap: "1rem" }}>
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
                e.currentTarget.style.borderColor = "var(--cx-border-bright)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(139,92,246,0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--cx-border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "0.75rem", marginBottom: "1rem",
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.08))",
                border: "1px solid rgba(139,92,246,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.125rem",
              }}>{g.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--cx-cream)", letterSpacing: "-0.01em", marginBottom: "0.375rem" }}>
                {g.name}
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "rgba(240,235,245,0.4)", lineHeight: 1.55 }}>
                {g.description}
              </p>
            </button>
          ))}
        </div>
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
          background: "radial-gradient(ellipse at center, rgba(11,11,20,0.97) 0%, rgba(6,6,12,0.99) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <button
            onClick={() => setHolographicMode(false)}
            className="cx-btn-ghost"
            style={{
              position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 70,
              background: "rgba(28,25,48,0.6)", border: "1px solid var(--cx-border)",
              borderRadius: "0.75rem", padding: "0.625rem 1.25rem",
              color: "var(--cx-cream)", backdropFilter: "blur(12px)",
            }}
          >
            Exit Holographic
          </button>
          <div className="cx-avatar-module cx-holo-breathe" style={{ maxWidth: 520 }}>
            <div className="cx-avatar-ring" />
            <Suspense fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", aspectRatio: "1" }}>
                <div className="cx-slow-pulse" style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--cx-violet), var(--cx-blue))", opacity: 0.5,
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
      )}

      {/* Conversation Sidebar */}
      <div style={{
        width: "15rem", flexShrink: 0, borderRight: "1px solid var(--cx-border)",
        display: "flex", flexDirection: "column", background: "var(--cx-sidebar)",
        overflowY: "auto",
      }}>
        <div style={{ padding: "1rem" }}>
          <button onClick={() => setSelectedGuide(null)} className="cx-btn-ghost" style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.75rem", marginBottom: "0.75rem", padding: "0.375rem 0.5rem" }}>
            {"\u2190"} All Guides
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "0.625rem",
              background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))",
              border: "1px solid rgba(139,92,246,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.875rem", flexShrink: 0,
            }}>{activeGuide?.icon}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cx-cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                <span style={{ fontSize: "0.6875rem", color: "rgba(240,235,245,0.2)" }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--cx-deep)" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
          {localMessages.length === 0 && (
            <div className="cx-fade-in" style={{ textAlign: "center", paddingTop: "8rem" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "1.25rem", margin: "0 auto 1.25rem",
                background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.06))",
                border: "1px solid rgba(139,92,246,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem",
              }}>{activeGuide?.icon}</div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--cx-cream)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
                {activeGuide?.name}
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "rgba(240,235,245,0.35)", maxWidth: "28rem", margin: "0 auto", lineHeight: 1.65 }}>
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
                <div className="cx-slow-pulse" style={{ color: "var(--cx-moonlight)", fontSize: "0.875rem" }}>
                  The guide is reflecting...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "1rem 2rem 1.25rem", borderTop: "1px solid var(--cx-border)",
          background: "rgba(11,11,20,0.5)", backdropFilter: "blur(12px)",
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
          <p style={{ fontSize: "0.6875rem", color: "rgba(240,235,245,0.15)", marginTop: "0.625rem", textAlign: "center" }}>
            This guide mirrors your patterns. It is not therapy. For crisis support, contact a professional.
          </p>
        </div>
      </div>
    </div>
  );
}
