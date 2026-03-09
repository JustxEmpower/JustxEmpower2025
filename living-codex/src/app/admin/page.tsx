"use client";

import { useState, useEffect, useCallback } from "react";

interface Client {
  id: string;
  name: string;
  email: string;
  tier: string;
  assessmentStatus: string;
  currentSection: number;
  topArchetypes: string[];
  mirrorReportStatus: string;
  scrollProgress: number;
  notes: string[];
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseNote, setReleaseNote] = useState("");
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  const loadClients = useCallback(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data.clients || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const saveNote = async () => {
    if (!selectedClient || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedClient.id, content: noteText }),
      });
      setSelectedClient({
        ...selectedClient,
        notes: [...(selectedClient.notes || []), noteText],
      });
      setNoteText("");
    } catch {}
    setSavingNote(false);
  };

  const releaseReport = async () => {
    if (!selectedClient) return;
    setReleasing(true);
    try {
      await fetch("/api/admin/release-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedClient.id, aprilNote: releaseNote }),
      });
      setSelectedClient({ ...selectedClient, mirrorReportStatus: "released" });
      setShowReleaseModal(false);
      setReleaseNote("");
      loadClients();
    } catch {}
    setReleasing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-black flex items-center justify-center">
        <div className="text-2xl animate-slow-pulse">🜂</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-black text-codex-cream">
      {/* Admin Header */}
      <header className="border-b border-codex-muted/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🜂</span>
          <span className="font-cormorant text-lg text-codex-gold">Living Codex™ Journey</span>
          <span className="text-xs bg-codex-wine/50 px-2 py-0.5 rounded text-codex-gold/70 ml-2">ADMIN</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <a href="/admin" className="text-codex-gold border-b border-codex-gold pb-1">Clients</a>
          <a href="/admin/content" className="text-codex-cream/40 hover:text-codex-cream/70">Content</a>
          <a href="/" className="text-codex-cream/40 hover:text-codex-cream/70">View Site</a>
        </nav>
      </header>

      <div className="flex">
        {/* Client List */}
        <div className="w-96 border-r border-codex-muted/20 min-h-[calc(100vh-48px)] bg-codex-deep/30">
          <div className="p-4 border-b border-codex-muted/10">
            <h2 className="font-cormorant text-lg text-codex-gold mb-2">Client Tracker</h2>
            <p className="text-xs text-codex-cream/30">{clients.length} clients</p>
          </div>
          <div className="divide-y divide-codex-muted/10">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`w-full text-left p-4 hover:bg-codex-parchment/20 transition-colors ${
                  selectedClient?.id === client.id ? "bg-codex-parchment/30" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter text-sm">{client.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    client.assessmentStatus === "complete" ? "bg-codex-sage/20 text-codex-sage" :
                    client.assessmentStatus === "in_progress" ? "bg-codex-gold/20 text-codex-gold" :
                    "bg-codex-muted/20 text-codex-cream/40"
                  }`}>
                    {client.assessmentStatus.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-codex-cream/30">{client.email}</p>
                <p className="text-xs text-codex-cream/40 mt-1 capitalize">{client.tier?.replace("_", " ")}</p>
              </button>
            ))}
            {clients.length === 0 && (
              <p className="p-4 text-sm text-codex-cream/30 italic">No clients yet</p>
            )}
          </div>
        </div>

        {/* Client Detail */}
        <div className="flex-1 p-8">
          {selectedClient ? (
            <div>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="font-cormorant text-3xl text-codex-gold mb-1">{selectedClient.name}</h1>
                  <p className="text-sm text-codex-cream/50">{selectedClient.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-codex-wine/30 px-3 py-1 rounded capitalize">
                    {selectedClient.tier?.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Assessment Status */}
                <div className="codex-card">
                  <h3 className="text-xs uppercase tracking-widest text-codex-cream/40 mb-3">Assessment</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedClient.assessmentStatus === "complete" ? "bg-codex-sage" :
                      selectedClient.assessmentStatus === "in_progress" ? "bg-codex-gold animate-pulse" :
                      "bg-codex-muted"
                    }`} />
                    <span className="text-sm capitalize">{selectedClient.assessmentStatus.replace("_", " ")}</span>
                  </div>
                  {selectedClient.assessmentStatus === "in_progress" && (
                    <p className="text-xs text-codex-cream/40 mt-2">Section {selectedClient.currentSection} of 16</p>
                  )}
                </div>

                {/* Mirror Report Status */}
                <div className="codex-card">
                  <h3 className="text-xs uppercase tracking-widest text-codex-cream/40 mb-3">Mirror Report</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedClient.mirrorReportStatus === "released" ? "bg-codex-sage" :
                      selectedClient.mirrorReportStatus === "ready_for_review" ? "bg-codex-gold" :
                      "bg-codex-muted"
                    }`} />
                    <span className="text-sm capitalize">{(selectedClient.mirrorReportStatus || "pending").replace("_", " ")}</span>
                  </div>
                  {selectedClient.assessmentStatus === "complete" && selectedClient.mirrorReportStatus !== "released" && (
                    <button
                      onClick={() => setShowReleaseModal(true)}
                      className="codex-btn-primary text-xs mt-3 px-4 py-1"
                    >
                      Review & Release
                    </button>
                  )}
                </div>

                {/* Top Archetypes */}
                <div className="codex-card">
                  <h3 className="text-xs uppercase tracking-widest text-codex-cream/40 mb-3">Top Archetypes</h3>
                  {selectedClient.topArchetypes?.length > 0 ? (
                    <ul className="space-y-1">
                      {selectedClient.topArchetypes.map((arch, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-codex-gold/60 mr-2">{i + 1}.</span>
                          {arch}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-codex-cream/30 italic">Assessment not complete</p>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="codex-card">
                <h3 className="text-xs uppercase tracking-widest text-codex-cream/40 mb-4">April&apos;s Notes</h3>
                {selectedClient.notes?.map((note, i) => (
                  <p key={i} className="text-sm text-codex-cream/70 mb-2 pl-3 border-l border-codex-muted/30">{note}</p>
                ))}
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full mt-4 bg-codex-parchment/20 border border-codex-muted/20 rounded p-3 text-sm
                             text-codex-cream/80 resize-none h-20 focus:outline-none focus:border-codex-gold/30"
                />
                <button
                  onClick={saveNote}
                  disabled={savingNote || !noteText.trim()}
                  className="codex-btn-secondary text-xs mt-2 disabled:opacity-30"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-codex-cream/20">
              <p className="font-cormorant text-xl">Select a client to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Release Report Modal */}
      {showReleaseModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-codex-deep border border-codex-muted/30 rounded-xl p-8 max-w-lg w-full mx-4">
            <h2 className="font-cormorant text-2xl text-codex-gold mb-2">Release Mirror Report</h2>
            <p className="text-sm text-codex-cream/50 mb-6">
              This will release {selectedClient.name}&apos;s Mirror Report and send them an email notification.
            </p>
            <div className="mb-6">
              <label className="block text-xs tracking-widest uppercase text-codex-cream/30 mb-2">
                Closing note for {selectedClient.name} (optional)
              </label>
              <textarea
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
                placeholder="A personal note that appears at the end of their report..."
                className="w-full h-28 bg-codex-parchment/20 border border-codex-muted/20 rounded-lg p-3
                           text-sm text-codex-cream/80 resize-none focus:outline-none focus:border-codex-gold/30
                           placeholder:text-codex-cream/15 placeholder:italic"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowReleaseModal(false); setReleaseNote(""); }}
                className="codex-btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={releaseReport}
                disabled={releasing}
                className="codex-btn-primary text-sm disabled:opacity-50"
              >
                {releasing ? "Releasing..." : "Release Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
