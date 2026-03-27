import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  onResumeConversation?: (guideId: string, conversationId: string) => void;
}

const GUIDE_LABELS: Record<string, string> = {
  kore: "Kore — Orientation",
  leda: "Leda — Journal",
  zephyr: "Zephyr — Community",
  aoede: "Aoede — Archetype",
  theia: "Theia — Nervous System",
  selene: "Selene — Resources",
  orientation: "Orientation Guide",
  archetype: "Archetype Guide",
  wound: "Wound Guide",
  shadow: "Shadow Guide",
  embodiment: "Embodiment Guide",
  sovereignty: "Sovereignty Guide",
};

export default function CodexConversationHistory({ onResumeConversation }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allConvosQuery = trpc.codex.client.guideAllConversations.useQuery();
  const exportQuery = trpc.codex.client.guideExportConversation.useQuery(
    { conversationId: exporting || "" },
    { enabled: !!exporting, refetchOnWindowFocus: false }
  );
  const importMutation = trpc.codex.client.guideImportTrajectory.useMutation({
    onSuccess: (data) => {
      setImporting(false);
      setImportSuccess(`Conversation resumed with ${data.messageCount} messages. The AI remembers everything.`);
      allConvosQuery.refetch();
      setTimeout(() => setImportSuccess(null), 5000);
    },
    onError: (err) => {
      setImporting(false);
      setImportError(err.message || "Failed to import trajectory");
      setTimeout(() => setImportError(null), 5000);
    },
  });

  // Trigger download when export data arrives
  const handleExport = useCallback((conversationId: string) => {
    setExporting(conversationId);
  }, []);

  // Watch for export data and trigger download
  if (exporting && exportQuery.data) {
    const trajectory = exportQuery.data.trajectory;
    const blob = new Blob([JSON.stringify(trajectory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codex-trajectory-${trajectory.conversation.guideId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  }

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate trajectory format
      if (!data.version || !data.conversation || !data.messages) {
        throw new Error("Invalid trajectory file format");
      }

      importMutation.mutate({
        guideId: data.conversation.guideId || "kore",
        title: data.conversation.title || "Imported conversation",
        messages: data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (err: any) {
      setImporting(false);
      setImportError(err.message || "Failed to read trajectory file");
      setTimeout(() => setImportError(null), 5000);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const conversations = allConvosQuery.data || [];

  return (
    <div style={{ padding: "36px 40px", maxWidth: "56rem", margin: "0 auto" }}>
      <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cx-ink3)", marginBottom: "8px" }}>
          MEMORY & CONTINUITY
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 300, color: "var(--cx-ink)" }}>
          Conversation History
        </h1>
        <div className="cx-divider" style={{ maxWidth: "80px", margin: "14px auto" }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "13px", color: "var(--cx-ink3)", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.6 }}>
          Your guide remembers. Download past conversations as trajectory files, or upload one to pick up exactly where you left off — no matter how long ago.
        </p>
      </div>

      {/* Upload Button */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="cx-btn-primary"
          style={{
            cursor: importing ? "wait" : "pointer",
            opacity: importing ? 0.5 : 1,
          }}
        >
          {importing ? "Importing..." : "↑ Upload Trajectory File"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Status Messages */}
      {importError && (
        <div style={{ textAlign: "center", marginBottom: "16px", padding: "10px 14px", borderRadius: "12px", background: "rgba(184,123,101,0.06)", border: "1px solid rgba(184,123,101,0.15)" }}>
          <p style={{ fontSize: "12px", color: "var(--cx-rose)" }}>{importError}</p>
        </div>
      )}
      {importSuccess && (
        <div style={{ textAlign: "center", marginBottom: "16px", padding: "10px 14px", borderRadius: "12px", background: "rgba(125,142,127,0.06)", border: "1px solid rgba(125,142,127,0.15)" }}>
          <p style={{ fontSize: "12px", color: "var(--cx-sage)" }}>{importSuccess}</p>
        </div>
      )}

      {/* Conversation List */}
      {allConvosQuery.isLoading ? (
        <div className="cx-slow-pulse" style={{ textAlign: "center", color: "var(--cx-ink3)", padding: "3rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "1.5rem", opacity: 0.3, marginBottom: "0.75rem", color: "var(--cx-rose)" }}>◇</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", color: "var(--cx-ink3)", lineHeight: 1.6 }}>
            No conversations yet. Start talking with your guide and your history will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {conversations.map((c: any, i: number) => (
            <div
              key={c.id}
              className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 18px", borderRadius: "16px",
                background: "rgba(255,255,255,0.26)", border: "1px solid rgba(255,255,255,0.52)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(0,0,0,0.03)",
                transition: "all 300ms",
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "14px", color: "var(--cx-ink)", fontWeight: 300,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {c.title || "Untitled conversation"}
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--cx-ink3)" }}>
                    {GUIDE_LABELS[c.guideId] || c.guideId}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--cx-clay)" }}>
                    {c.messageCount} messages
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--cx-clay)" }}>
                    {new Date(c.updatedAt).toLocaleDateString()} {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {onResumeConversation && (
                  <button
                    onClick={() => onResumeConversation(c.guideId, c.id)}
                    className="cx-btn-primary"
                    style={{ padding: "5px 12px", fontSize: "10px" }}
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleExport(c.id)}
                  disabled={exporting === c.id}
                  className="cx-btn-secondary"
                  style={{
                    padding: "5px 12px", fontSize: "10px",
                    opacity: exporting === c.id ? 0.5 : 1,
                  }}
                >
                  {exporting === c.id ? "..." : "↓ Export"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
