"use client";

import { useState, useEffect } from "react";

interface SectionData {
  id: number;
  title: string;
  glyph: string;
  subtitle: string;
  questionCount: number;
  answerCount: number;
}

interface QuestionData {
  id: string;
  questionNum: number;
  questionText: string;
  isGhost: boolean;
  isOpenEnded: boolean;
  answers: { code: string; text: string; arPrimary: string; wi: string; mp: string; spectrumDepth: string }[];
}

export default function ContentManagement() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content/sections")
      .then((r) => r.json())
      .then((data) => { setSections(data.sections || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadQuestions = async (sectionNum: number) => {
    setSelectedSection(sectionNum);
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/content/questions?section=${sectionNum}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {}
    setLoadingQuestions(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-black flex items-center justify-center">
        <div className="text-2xl animate-slow-pulse">{"\u{1F702}"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-codex-black text-codex-cream">
      {/* Header */}
      <header className="border-b border-codex-muted/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{"\u{1F702}"}</span>
          <span className="font-cormorant text-lg text-codex-gold">Living Codex™ Journey</span>
          <span className="text-xs bg-codex-wine/50 px-2 py-0.5 rounded text-codex-gold/70 ml-2">ADMIN</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <a href="/admin" className="text-codex-cream/40 hover:text-codex-cream/70">Clients</a>
          <a href="/admin/content" className="text-codex-gold border-b border-codex-gold pb-1">Content</a>
          <a href="/" className="text-codex-cream/40 hover:text-codex-cream/70">View Site</a>
        </nav>
      </header>

      <div className="flex">
        {/* Section List */}
        <div className="w-80 border-r border-codex-muted/20 min-h-[calc(100vh-48px)] bg-codex-deep/30">
          <div className="p-4 border-b border-codex-muted/10">
            <h2 className="font-cormorant text-lg text-codex-gold mb-1">Assessment Content</h2>
            <p className="text-xs text-codex-cream/30">16 sections · 187 questions · 885 answers</p>
          </div>
          <div className="divide-y divide-codex-muted/10">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => loadQuestions(s.id)}
                className={`w-full text-left p-4 hover:bg-codex-parchment/20 transition-colors ${
                  selectedSection === s.id ? "bg-codex-parchment/30" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{s.glyph}</span>
                  <span className="font-cormorant text-sm text-codex-cream/80">S{s.id}: {s.title}</span>
                </div>
                <p className="text-xs text-codex-cream/30 ml-6">
                  {s.questionCount} questions · {s.answerCount} answers
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Question Detail */}
        <div className="flex-1 p-8 overflow-auto max-h-[calc(100vh-48px)]">
          {selectedSection ? (
            loadingQuestions ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-xl animate-slow-pulse">{"\u{1F702}"}</div>
              </div>
            ) : (
              <div>
                <h1 className="font-cormorant text-2xl text-codex-gold mb-6">
                  Section {selectedSection}: {sections.find((s) => s.id === selectedSection)?.title}
                </h1>
                <div className="space-y-6">
                  {questions.map((q) => (
                    <div key={q.id} className="codex-card">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs bg-codex-deep/50 px-2 py-0.5 rounded text-codex-cream/40">
                          Q{q.questionNum}
                        </span>
                        {q.isGhost && (
                          <span className="text-xs bg-codex-muted/30 px-2 py-0.5 rounded text-codex-cream/30">Ghost</span>
                        )}
                        {q.isOpenEnded && (
                          <span className="text-xs bg-codex-wine/30 px-2 py-0.5 rounded text-codex-cream/40">Open-Ended</span>
                        )}
                      </div>
                      <p className="text-sm text-codex-cream/80 mb-4 leading-relaxed">{q.questionText}</p>

                      {q.answers.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-codex-muted/20">
                                <th className="text-left py-2 pr-3 text-codex-cream/30 font-normal">Code</th>
                                <th className="text-left py-2 pr-3 text-codex-cream/30 font-normal">Answer</th>
                                <th className="text-left py-2 pr-3 text-codex-cream/30 font-normal">Spectrum</th>
                                <th className="text-left py-2 pr-3 text-codex-cream/30 font-normal">AR</th>
                                <th className="text-left py-2 pr-3 text-codex-cream/30 font-normal">WI</th>
                                <th className="text-left py-2 text-codex-cream/30 font-normal">MP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {q.answers.map((a) => (
                                <tr key={a.code} className="border-b border-codex-muted/10">
                                  <td className="py-2 pr-3 text-codex-gold/60 font-mono">{a.code}</td>
                                  <td className="py-2 pr-3 text-codex-cream/60 max-w-xs truncate">{a.text}</td>
                                  <td className="py-2 pr-3">
                                    <span className={`px-1.5 py-0.5 rounded ${
                                      a.spectrumDepth === "SHADOW" ? "bg-codex-ember/20 text-codex-ember-light" :
                                      a.spectrumDepth === "THRESHOLD" ? "bg-codex-gold/15 text-codex-gold/70" :
                                      a.spectrumDepth === "GIFT" ? "bg-codex-sage/20 text-codex-sage" :
                                      "bg-codex-muted/20 text-codex-cream/30"
                                    }`}>
                                      {a.spectrumDepth || "?"}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-3 text-codex-cream/50">{a.arPrimary || "—"}</td>
                                  <td className="py-2 pr-3 text-codex-cream/50">{a.wi || "—"}</td>
                                  <td className="py-2 text-codex-cream/50">{a.mp || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-codex-cream/20">
              <p className="font-cormorant text-xl">Select a section to view content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
