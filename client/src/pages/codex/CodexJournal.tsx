import { useState } from "react";
import { trpc } from "@/lib/trpc";

const MOODS = [
  { id: "contemplative", label: "Contemplative", color: "var(--cx-moonlight)" },
  { id: "activated", label: "Activated", color: "var(--cx-gold)" },
  { id: "heavy", label: "Heavy", color: "var(--cx-ember)" },
  { id: "tender", label: "Tender", color: "var(--cx-sage)" },
  { id: "expansive", label: "Expansive", color: "var(--cx-gold-light)" },
  { id: "uncertain", label: "Uncertain", color: "var(--cx-cream-dark)" },
];

export default function CodexJournal() {
  const [view, setView] = useState<"list" | "write">("list");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);

  const journalQuery = trpc.codex.client.journalList.useQuery();
  const promptQuery = trpc.codex.client.journalPrompt.useQuery(undefined, { enabled: view === "write" });
  const createMutation = trpc.codex.client.journalCreate.useMutation();

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
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,230,211,0.3)", fontSize: "0.8rem" }}
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
            background: "transparent", border: "none", borderBottom: "1px solid rgba(61,34,51,0.2)",
            color: "var(--cx-gold)", fontSize: "1.25rem", outline: "none",
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
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(245,230,211,0.25)", marginBottom: "0.75rem" }}>
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
                  border: `1px solid ${mood === m.id ? m.color : "rgba(61,34,51,0.2)"}`,
                  color: mood === m.id ? m.color : "rgba(245,230,211,0.4)",
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
            border: `1px solid ${!filterMood ? "rgba(201,168,76,0.2)" : "rgba(61,34,51,0.15)"}`,
            color: !filterMood ? "var(--cx-gold)" : "rgba(245,230,211,0.3)",
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
              border: `1px solid ${filterMood === m.id ? m.color : "rgba(61,34,51,0.15)"}`,
              color: filterMood === m.id ? m.color : "rgba(245,230,211,0.3)",
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
          <div style={{ fontSize: "2rem", opacity: 0.3, marginBottom: "1rem" }}>{"\u{1F4D6}"}</div>
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
                  background: isOpen ? "rgba(44,31,40,0.6)" : "rgba(44,31,40,0.3)",
                  border: `1px solid ${isOpen ? "rgba(201,168,76,0.15)" : "rgba(61,34,51,0.15)"}`,
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
                    <span style={{ fontSize: "0.65rem", color: "rgba(245,230,211,0.2)", flexShrink: 0 }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {!isOpen && (
                    <p style={{ fontSize: "0.8rem", color: "rgba(245,230,211,0.3)", marginTop: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "36rem" }}>
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
                      <p style={{ fontSize: "0.9rem", color: "rgba(245,230,211,0.7)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
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
                        <p style={{ fontSize: "0.65rem", color: "rgba(245,230,211,0.15)", marginTop: "0.75rem", fontStyle: "italic" }}>
                          Prompted by: {entry.aiPrompt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
