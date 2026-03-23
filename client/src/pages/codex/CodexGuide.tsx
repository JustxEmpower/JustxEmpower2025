import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";

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

export default function CodexGuide() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);

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

  const handleGuideSelect = useCallback((guideId: string, voiceId: string) => {
    updateSettingsMut.mutate({ preferredGuideId: guideId, preferredVoiceId: voiceId }, {
      onSuccess: () => settingsQuery.refetch(),
    });
    setShowCharacterSelector(false);
  }, [updateSettingsMut, settingsQuery]);

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
      <div style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
        <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
            AI-Powered Guidance
          </p>
          <h1 className="cx-font-heading" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "var(--cx-gold)" }}>
            Choose Your Guide
          </h1>
          <div className="cx-divider" />
          <p className="cx-invitation" style={{ opacity: 0.5, maxWidth: "28rem", margin: "0 auto" }}>
            Each guide holds a different mirror. Choose the one that calls to you.
          </p>
          {/* Current avatar indicator + change button */}
          {preferredChar && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: preferredChar.primaryColor, boxShadow: `0 0 8px ${preferredChar.primaryColor}` }} />
              <span style={{ fontSize: "0.75rem", color: "rgba(245,230,211,0.5)" }}>Guide: <strong style={{ color: preferredChar.primaryColor }}>{preferredChar.name}</strong></span>
              <button
                onClick={() => setShowCharacterSelector(true)}
                style={{ fontSize: "0.65rem", color: "rgba(201,168,76,0.5)", background: "none", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.25rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}
              >
                Change Avatar
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem" }}>
          {guides.map((g: any, i: number) => (
            <button
              key={g.id}
              onClick={() => setSelectedGuide(g.id)}
              className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`}
              style={{
                textAlign: "left", cursor: "pointer", padding: "1.5rem",
                background: "rgba(44,31,40,0.4)", borderRadius: "0.75rem",
                border: "1px solid rgba(61,34,51,0.2)",
                transition: "all 400ms",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                e.currentTarget.style.background = "rgba(44,31,40,0.6)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(61,34,51,0.2)";
                e.currentTarget.style.background = "rgba(44,31,40,0.4)";
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{g.icon}</div>
              <h3 className="cx-font-heading" style={{ fontSize: "1.1rem", color: "var(--cx-gold)", fontWeight: 400, marginBottom: "0.35rem" }}>
                {g.name}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "rgba(245,230,211,0.4)", lineHeight: 1.5 }}>
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
    <div style={{ display: "flex", height: "calc(100vh - 3rem)", overflow: "hidden" }}>
      {/* Holographic Avatar Mode */}
      {holographicMode && selectedGuide && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.95)" }}>
          <button
            onClick={() => setHolographicMode(false)}
            style={{
              position: "absolute", top: "1rem", right: "1rem", zIndex: 60,
              padding: "0.5rem 1rem", background: "rgba(44,31,40,0.8)",
              border: "1px solid rgba(201,168,76,0.3)", borderRadius: "0.5rem",
              color: "var(--cx-gold)", fontSize: "0.75rem", cursor: "pointer",
            }}
          >
            Exit Holographic Mode
          </button>
          <div style={{ width: "100%", height: "100%" }}>
          <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--cx-gold)" }}>
              <p className="cx-slow-pulse">Materializing guide...</p>
            </div>
          }>
            <HolographicAvatar
              guideType={(GUIDE_TYPE_MAP[selectedGuide] || "codex_orientation") as any}
              preferredGuideId={preferredGuideId || undefined}
              preferredVoiceId={preferredVoiceId || undefined}
              onChangeGuide={(guideId, voiceId) => handleGuideSelect(guideId, voiceId)}
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
                  guideId: selectedGuide,
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
        width: "14rem", flexShrink: 0, borderRight: "1px solid rgba(61,34,51,0.15)",
        display: "flex", flexDirection: "column", background: "rgba(10,10,10,0.5)",
        overflowY: "auto",
      }}>
        <div style={{ padding: "1rem" }}>
          <button
            onClick={() => setSelectedGuide(null)}
            style={{
              width: "100%", textAlign: "left", padding: "0.5rem",
              color: "rgba(245,230,211,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em",
              background: "none", border: "none", cursor: "pointer",
              marginBottom: "0.75rem",
            }}
          >
            {"<"} All Guides
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{activeGuide?.icon}</span>
            <p className="cx-font-heading" style={{ fontSize: "0.95rem", color: "var(--cx-gold)", fontWeight: 400 }}>
              {activeGuide?.name?.split(" ").slice(0, -1).join(" ")}
            </p>
          </div>
          <button
            onClick={startNewConversation}
            className="cx-btn-primary"
            style={{ width: "100%", fontSize: "0.75rem", padding: "0.5rem", marginBottom: "0.5rem" }}
          >
            + New Conversation
          </button>
          <button
            onClick={() => setHolographicMode(true)}
            style={{
              width: "100%", fontSize: "0.65rem", padding: "0.45rem",
              background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "0.375rem", color: "var(--cx-gold)", cursor: "pointer",
              letterSpacing: "0.05em", transition: "all 300ms",
            }}
          >
            ◇ Holographic Mode
          </button>
          <button
            onClick={() => setShowCharacterSelector(true)}
            style={{
              width: "100%", fontSize: "0.65rem", padding: "0.45rem", marginTop: "0.35rem",
              background: "rgba(201,168,76,0.02)", border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "0.375rem", color: "rgba(201,168,76,0.6)", cursor: "pointer",
              letterSpacing: "0.05em", transition: "all 300ms",
            }}
          >
            ◇ Change Avatar
          </button>
        </div>

        <div style={{ flex: 1, padding: "0 0.75rem", overflowY: "auto" }}>
          {(conversationsQuery.data || []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => loadConversation(c.id)}
              style={{
                width: "100%", textAlign: "left", padding: "0.6rem 0.5rem",
                borderRadius: "0.375rem", marginBottom: "0.25rem",
                background: conversationId === c.id ? "rgba(201,168,76,0.08)" : "transparent",
                border: conversationId === c.id ? "1px solid rgba(201,168,76,0.15)" : "1px solid transparent",
                cursor: "pointer", transition: "all 200ms",
              }}
            >
              <p style={{
                fontSize: "0.75rem", color: conversationId === c.id ? "var(--cx-gold)" : "rgba(245,230,211,0.4)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {c.title || "Untitled"}
              </p>
              <p style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.15)", marginTop: "0.15rem" }}>
                {new Date(c.updatedAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
          {localMessages.length === 0 && (
            <div className="cx-fade-in" style={{ textAlign: "center", paddingTop: "6rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.4 }}>{activeGuide?.icon}</div>
              <h2 className="cx-font-heading" style={{ fontSize: "1.5rem", color: "var(--cx-gold)", fontWeight: 300, marginBottom: "0.5rem" }}>
                {activeGuide?.name}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "rgba(245,230,211,0.35)", maxWidth: "24rem", margin: "0 auto", lineHeight: 1.7 }}>
                {activeGuide?.description}. Begin by sharing what is present for you.
              </p>
            </div>
          )}
          {localMessages.map((m, i) => (
            <div key={i} style={{
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "75%", padding: "1rem 1.25rem", borderRadius: "0.75rem",
                background: m.role === "user" ? "rgba(201,168,76,0.08)" : "rgba(44,31,40,0.5)",
                border: `1px solid ${m.role === "user" ? "rgba(201,168,76,0.15)" : "rgba(61,34,51,0.2)"}`,
              }}>
                <p style={{
                  fontSize: "0.9rem", color: "rgba(245,230,211,0.85)", lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </p>
              </div>
            </div>
          ))}
          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{
                padding: "1rem 1.25rem", borderRadius: "0.75rem",
                background: "rgba(44,31,40,0.5)", border: "1px solid rgba(61,34,51,0.2)",
              }}>
                <div className="cx-slow-pulse" style={{ fontSize: "0.9rem", color: "var(--cx-gold)", opacity: 0.5 }}>
                  The guide is reflecting...
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "1rem 2rem", borderTop: "1px solid rgba(61,34,51,0.15)",
          background: "rgba(10,10,10,0.3)",
        }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Share what is present for you..."
              style={{
                flex: 1, padding: "0.75rem 1rem", borderRadius: "0.5rem",
                background: "rgba(44,31,40,0.3)", border: "1px solid rgba(61,34,51,0.2)",
                color: "var(--cx-cream)", fontSize: "0.9rem", lineHeight: 1.6,
                resize: "none", outline: "none", minHeight: "2.5rem", maxHeight: "8rem",
                fontFamily: "Inter, sans-serif",
              }}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="cx-btn-primary"
              style={{ padding: "0.65rem 1.25rem", fontSize: "0.85rem", flexShrink: 0 }}
            >
              Send
            </button>
          </div>
          <p style={{ fontSize: "0.6rem", color: "rgba(245,230,211,0.12)", marginTop: "0.5rem", textAlign: "center" }}>
            This guide mirrors your patterns. It is not therapy. For crisis support, contact a professional.
          </p>
        </div>
      </div>
    </div>
  );
}
