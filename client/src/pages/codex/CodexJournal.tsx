import { useState, useEffect, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { BookHeart, MessageSquare, Download, Share2 } from "lucide-react";

const CodexShareModal = lazy(() => import("./CodexShareModal"));

interface CodexJournalProps {
  onNavigate?: (view: string, params?: any) => void;
}

const MOODS = [
  { id: "contemplative", label: "Contemplative", color: "var(--cx-moonlight)" },
  { id: "activated", label: "Activated", color: "var(--cx-gold)" },
  { id: "heavy", label: "Heavy", color: "var(--cx-ember)" },
  { id: "tender", label: "Tender", color: "var(--cx-sage)" },
  { id: "expansive", label: "Expansive", color: "var(--cx-gold-light)" },
  { id: "uncertain", label: "Uncertain", color: "var(--cx-cream-dark)" },
];

export default function CodexJournal({ onNavigate }: CodexJournalProps = {}) {
  const [view, setView] = useState<"list" | "write">("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [discussingId, setDiscussingId] = useState<string | null>(null);
  const [shareEntryId, setShareEntryId] = useState<string | null>(null);

  const journalQuery = trpc.codex.client.journalList.useQuery();
  const promptQuery = trpc.codex.client.journalPrompt.useQuery(undefined, { enabled: view === "write" });
  const createMutation = trpc.codex.client.journalCreate.useMutation();
  const discussMutation = trpc.codex.client.journalDiscussWithGuide.useMutation();

  // Trajectory export query
  const exportQuery = trpc.codex.client.journalExportTrajectory.useQuery(
    { entryId: exportingId || "" },
    { enabled: !!exportingId, refetchOnWindowFocus: false }
  );

  // Download trajectory when data arrives
  useEffect(() => {
    if (exportingId && exportQuery.data) {
      const trajectory = exportQuery.data.trajectory;
      const blob = new Blob([JSON.stringify(trajectory, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codex-journal-trajectory-${trajectory.entry?.title?.replace(/\s+/g, "-").toLowerCase() || "entry"}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportingId(null);
    }
  }, [exportingId, exportQuery.data]);

  // Discuss with guide handler
  const handleDiscuss = async (entryId: string) => {
    setDiscussingId(entryId);
    try {
      const result = await discussMutation.mutateAsync({ entryId, guideId: "orientation" });
      // Navigate to guide view with the new conversation
      if (onNavigate) {
        onNavigate("guide-journal", { conversationId: result.conversationId, guideId: result.guideId });
      }
    } catch {}
    setDiscussingId(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        mood: mood || undefined,
        aiPrompt: promptQuery.data?.prompt || undefined,
      });
      setTitle("");
      setContent("");
      setMood("");
      setView("list");
      journalQuery.refetch();
    } catch {}
    setSaving(false);
  };

  const entries = journalQuery.data || [];
  const filteredEntries = filterMood
    ? entries.filter((e: any) => e.mood === filterMood)
    : entries;

  // ── Write View ──
  if (view === "write") {
    return (
      <div style={{ padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <button
            onClick={() => setView("list")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cx-ink3)", fontSize: "0.8rem" }}
          >
            {"<"} Back to Vault
          </button>
        </div>

        <div className="cx-fade-in" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="cx-font-heading" style={{ fontSize: "1.75rem", fontWeight: 300, color: "var(--cx-gold)" }}>
            New Entry
          </h1>
        </div>

        {/* AI Prompt */}
        {promptQuery.data?.prompt && (
          <div className="cx-fade-up" style={{
            padding: "1.25rem 1.5rem", borderRadius: "0.75rem", marginBottom: "2rem",
            background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
              Today's Prompt
            </p>
            <p className="cx-invitation" style={{ fontSize: "1rem", opacity: 0.7, lineHeight: 1.8 }}>
              {promptQuery.data.prompt}
            </p>
          </div>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title your reflection..."
          style={{
            width: "100%", padding: "0.75rem 0", marginBottom: "1.5rem",
            background: "transparent", border: "none", borderBottom: "1px solid rgba(61,34,51,0.35)",
            color: "var(--cx-ink)", fontSize: "1.25rem", outline: "none",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
          }}
        />

        {/* Content */}
        <textarea
          className="cx-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Let your words arrive..."
          style={{ minHeight: "16rem", marginBottom: "1.5rem" }}
        />

        {/* Mood */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-ink2)", marginBottom: "0.75rem" }}>
            What is the mood of this entry?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMood(mood === m.id ? "" : m.id)}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "2rem", fontSize: "0.75rem",
                  background: mood === m.id ? "rgba(201,168,76,0.08)" : "transparent",
                  border: `1px solid ${mood === m.id ? m.color : "rgba(61,34,51,0.35)"}`,
                  color: mood === m.id ? m.color : "var(--cx-ink2)",
                  cursor: "pointer", transition: "all 300ms",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || saving}
            className="cx-btn-primary"
            style={{ flex: 1 }}
          >
            {saving ? "Saving..." : "Save & Receive Reflection"}
          </button>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      {/* Header */}
      <div className="cx-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
            Sacred Reflections
          </p>
          <h1 className="cx-font-heading" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "var(--cx-gold)" }}>
            Journal Vault
          </h1>
        </div>
        <button className="cx-btn-primary" style={{ fontSize: "0.85rem" }} onClick={() => setView("write")}>
          + New Entry
        </button>
      </div>

      {/* Mood Filter */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterMood(null)}
          style={{
            padding: "0.3rem 0.7rem", borderRadius: "2rem", fontSize: "0.65rem",
            background: !filterMood ? "rgba(201,168,76,0.08)" : "transparent",
            border: `1px solid ${!filterMood ? "rgba(201,168,76,0.2)" : "rgba(61,34,51,0.3)"}`,
            color: !filterMood ? "var(--cx-gold)" : "var(--cx-ink2)",
            cursor: "pointer", transition: "all 200ms",
          }}
        >
          All
        </button>
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => setFilterMood(filterMood === m.id ? null : m.id)}
            style={{
              padding: "0.3rem 0.7rem", borderRadius: "2rem", fontSize: "0.65rem",
              background: filterMood === m.id ? "rgba(201,168,76,0.08)" : "transparent",
              border: `1px solid ${filterMood === m.id ? m.color : "rgba(61,34,51,0.3)"}`,
              color: filterMood === m.id ? m.color : "var(--cx-ink2)",
              cursor: "pointer", transition: "all 200ms",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ opacity: 0.3, marginBottom: "1rem" }}><BookHeart size={32} /></div>
          <p className="cx-invitation" style={{ opacity: 0.4 }}>
            {entries.length === 0 ? "Your vault is empty. Begin your first reflection." : "No entries match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredEntries.map((entry: any, i: number) => {
            const isOpen = expandedEntry === entry.id;
            const themes = entry.themes ? JSON.parse(entry.themes) : [];
            const moodInfo = MOODS.find(m => m.id === entry.mood);
            return (
              <div
                key={entry.id}
                className={`cx-fade-up cx-delay-${Math.min(i + 1, 5)}`}
                style={{
                  borderRadius: "0.75rem",
                  background: isOpen ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.28)",
                  border: `1px solid ${isOpen ? "rgba(184,151,106,0.3)" : "rgba(255,255,255,0.52)"}`,
                  transition: "all 400ms",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                onClick={() => setExpandedEntry(isOpen ? null : entry.id)}
              >
                {/* Header */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {moodInfo && (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: moodInfo.color, opacity: 0.6, flexShrink: 0 }} />
                      )}
                      <h3 className="cx-font-heading" style={{ fontSize: "1.1rem", color: "var(--cx-gold)", fontWeight: 400 }}>
                        {entry.title}
                      </h3>
                    </div>
                    <span style={{ fontSize: "0.65rem", color: "var(--cx-ink3)", flexShrink: 0 }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {!isOpen && (
                    <p style={{ fontSize: "0.8rem", color: "var(--cx-ink3)", marginTop: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "36rem" }}>
                      {entry.content.substring(0, 120)}...
                    </p>
                  )}
                </div>

                {/* Expanded */}
                <div style={{
                  maxHeight: isOpen ? "80rem" : "0",
                  opacity: isOpen ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 500ms ease, opacity 400ms ease",
                }}>
                  <div style={{ padding: "0 1.5rem 1.5rem" }}>
                    <div style={{ borderTop: "1px solid rgba(61,34,51,0.15)", paddingTop: "1rem" }}>
                      <p style={{ fontSize: "0.9rem", color: "var(--cx-ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {entry.content}
                      </p>

                      {/* Themes */}
                      {themes.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "1rem" }}>
                          {themes.map((t: string, ti: number) => (
                            <span key={ti} style={{
                              padding: "0.25rem 0.6rem", borderRadius: "2rem", fontSize: "0.65rem",
                              background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.08)",
                              color: "var(--cx-gold)", opacity: 0.5,
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Reflection */}
                      {entry.aiSummary && (
                        <div style={{
                          marginTop: "1.25rem", padding: "1rem 1.25rem", borderRadius: "0.5rem",
                          background: "rgba(201,168,76,0.03)", borderLeft: "2px solid rgba(201,168,76,0.15)",
                        }}>
                          <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--cx-gold-dim)", marginBottom: "0.5rem" }}>
                            AI Reflection
                          </p>
                          <p className="cx-invitation" style={{ fontSize: "0.85rem", opacity: 0.6, lineHeight: 1.7 }}>
                            {entry.aiSummary}
                          </p>
                        </div>
                      )}

                      {/* Prompt used */}
                      {entry.aiPrompt && (
                        <p style={{ fontSize: "0.65rem", color: "var(--cx-clay)", marginTop: "0.75rem", fontStyle: "italic" }}>
                          Prompted by: {entry.aiPrompt}
                        </p>
                      )}

                      {/* ── Action Buttons: Discuss / Download / Share ── */}
                      <div style={{
                        display: "flex", gap: "0.5rem", marginTop: "1.25rem",
                        paddingTop: "1rem", borderTop: "1px solid rgba(61,34,51,0.08)",
                      }}>
                        {/* Discuss with Guide */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDiscuss(entry.id); }}
                          disabled={discussingId === entry.id}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            padding: "0.55rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.7rem",
                            background: "rgba(184,123,101,0.06)", border: "1px solid rgba(184,123,101,0.12)",
                            color: "var(--cx-rose)", cursor: "pointer", fontWeight: 500,
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            transition: "all 200ms ease",
                            opacity: discussingId === entry.id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,123,101,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(184,123,101,0.06)"; }}
                        >
                          <MessageSquare size={13} />
                          {discussingId === entry.id ? "Opening..." : "Discuss with Guide"}
                        </button>

                        {/* Download Trajectory */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setExportingId(entry.id); }}
                          disabled={exportingId === entry.id}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            padding: "0.55rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.7rem",
                            background: "rgba(184,151,106,0.06)", border: "1px solid rgba(184,151,106,0.12)",
                            color: "var(--cx-gold)", cursor: "pointer", fontWeight: 500,
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            transition: "all 200ms ease",
                            opacity: exportingId === entry.id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,151,106,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(184,151,106,0.06)"; }}
                        >
                          <Download size={13} />
                          {exportingId === entry.id ? "Exporting..." : "Download Trajectory"}
                        </button>

                        {/* Share to Social */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShareEntryId(entry.id); }}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            padding: "0.55rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.7rem",
                            background: "rgba(125,142,127,0.06)", border: "1px solid rgba(125,142,127,0.12)",
                            color: "var(--cx-sage)", cursor: "pointer", fontWeight: 500,
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            transition: "all 200ms ease",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(125,142,127,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(125,142,127,0.06)"; }}
                        >
                          <Share2 size={13} />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {shareEntryId && (
        <Suspense fallback={null}>
          <CodexShareModal
            entryId={shareEntryId}
            entryTitle={entries.find((e: any) => e.id === shareEntryId)?.title || "Reflection"}
            onClose={() => setShareEntryId(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
