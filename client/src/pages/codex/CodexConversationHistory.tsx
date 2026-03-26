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
    <div style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
          Memory & Continuity
        </p>
        <h1 className="cx-font-heading" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 300, color: "var(--cx-gold)" }}>
          Conversation History
        </h1>
        <div className="cx-divider" />
        <p className="cx-invitation" style={{ opacity: 0.5, maxWidth: "32rem", margin: "0 auto", fontSize: "0.85rem", lineHeight: 1.6 }}>
          Your guide remembers. Download past conversations as trajectory files, or upload one to pick up exactly where you left off — no matter how long ago.
        </p>
      </div>

      {/* Upload Button */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={handleImportClick}
          disabled={importing}
          style={{
            padding: "0.7rem 1.5rem", borderRadius: "0.5rem",
            background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
            color: "var(--cx-gold)", fontSize: "0.8rem", cursor: importing ? "wait" : "pointer",
            letterSpacing: "0.05em", transition: "all 300ms",
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
        <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(200,50,50,0.1)", border: "1px solid rgba(200,50,50,0.2)" }}>
          <p style={{ fontSize: "0.8rem", color: "#e87070" }}>{importError}</p>
        </div>
      )}
      {importSuccess && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--cx-gold)" }}>{importSuccess}</p>
        </div>
      )}

      {/* Conversation List */}
      {allConvosQuery.isLoading ? (
        <div className="cx-slow-pulse" style={{ textAlign: "center", color: "var(--cx-gold)", opacity: 0.5, padding: "3rem" }}>
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "1.5rem", opacity: 0.3, marginBottom: "0.75rem" }}>◇</p>
          <p style={{ fontSize: "0.85rem", color: "rgba(245,230,211,0.3)", lineHeight: 1.6 }}>
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
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1rem 1.25rem", borderRadius: "0.75rem",
                background: "rgba(44,31,40,0.4)", border: "1px solid rgba(61,34,51,0.2)",
                transition: "all 300ms",
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "0.85rem", color: "var(--cx-gold)", fontWeight: 400,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {c.title || "Untitled conversation"}
                </p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "rgba(245,230,211,0.3)" }}>
                    {GUIDE_LABELS[c.guideId] || c.guideId}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "rgba(245,230,211,0.2)" }}>
                    {c.messageCount} messages
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "rgba(245,230,211,0.15)" }}>
                    {new Date(c.updatedAt).toLocaleDateString()} {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {onResumeConversation && (
                  <button
                    onClick={() => onResumeConversation(c.guideId, c.id)}
                    style={{
                      padding: "0.4rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.7rem",
                      background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                      color: "var(--cx-gold)", cursor: "pointer", transition: "all 200ms",
                    }}
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleExport(c.id)}
                  disabled={exporting === c.id}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.7rem",
                    background: "rgba(44,31,40,0.6)", border: "1px solid rgba(61,34,51,0.3)",
                    color: "rgba(245,230,211,0.5)", cursor: "pointer", transition: "all 200ms",
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
