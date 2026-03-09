import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollText, ChevronRight, Pencil, Save } from "lucide-react";

export default function AdminCodexContent() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ id: string; questionText: string; invitation: string } | null>(null);

  const sectionsQuery = trpc.codex.admin.sections.useQuery(undefined, { enabled: isAuthenticated });
  const questionsQuery = trpc.codex.admin.questions.useQuery(
    { sectionNum: selectedSection ?? undefined },
    { enabled: isAuthenticated && selectedSection !== null }
  );
  const answersQuery = trpc.codex.admin.answers.useQuery(
    { questionId: selectedQuestionId! },
    { enabled: !!selectedQuestionId && isAuthenticated }
  );

  const updateQuestionMutation = trpc.codex.admin.updateQuestion.useMutation({
    onSuccess: () => { questionsQuery.refetch(); setEditingQuestion(null); }
  });

  if (isChecking) return null;
  if (!isAuthenticated) { setLocation("/admin/login"); return null; }

  const sections = sectionsQuery.data || [];
  const questions = questionsQuery.data || [];
  const answers = answersQuery.data || [];

  const spectrumColors: Record<string, string> = {
    SHADOW: "bg-red-100 text-red-700",
    THRESHOLD: "bg-amber-100 text-amber-700",
    GIFT: "bg-emerald-100 text-emerald-700",
    GHOST: "bg-stone-100 text-stone-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold">Living Codex — Content CMS</h1>
          <p className="text-sm text-muted-foreground">Browse and edit assessment sections, questions, and answer metadata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: '70vh' }}>
        {/* ── Col 1: Sections ── */}
        <div className="lg:col-span-3 space-y-1 max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">16 Sections</p>
          {sections.map((s: any) => (
            <div
              key={s.id}
              onClick={() => { setSelectedSection(s.id); setSelectedQuestionId(null); }}
              className={`p-2.5 rounded-lg cursor-pointer border transition-all flex items-center gap-2.5 ${selectedSection === s.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}
            >
              <span className="text-base flex-shrink-0">{s.glyph}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.subtitle}</p>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">S{s.id}</span>
            </div>
          ))}
        </div>

        {/* ── Col 2: Questions ── */}
        <div className="lg:col-span-4 space-y-1 max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {selectedSection ? `Section ${selectedSection} — Questions` : "Select a section"}
          </p>
          {!selectedSection && <p className="text-xs text-muted-foreground p-4">← Choose a section to see its questions</p>}
          {questions.map((q: any) => (
            <div
              key={q.id}
              onClick={() => setSelectedQuestionId(q.id)}
              className={`p-2.5 rounded-lg cursor-pointer border transition-all ${selectedQuestionId === q.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Q{q.questionNum}</Badge>
                  {q.isGhost === 1 && <Badge className="bg-stone-100 text-stone-500 text-[10px] px-1.5 py-0">Ghost</Badge>}
                  {q.isOpenEnded === 1 && <Badge className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0">Open</Badge>}
                </div>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); setEditingQuestion({ id: q.id, questionText: q.questionText, invitation: q.invitation || "" }); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm line-clamp-2 leading-snug">{q.questionText}</p>
              {q.invitation && <p className="text-[10px] text-muted-foreground italic mt-1 line-clamp-1">{q.invitation}</p>}
            </div>
          ))}
        </div>

        {/* ── Col 3: Answers + Metadata ── */}
        <div className="lg:col-span-5 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {selectedQuestionId ? "Answers & Scoring Metadata" : "Select a question"}
          </p>
          {!selectedQuestionId && <p className="text-xs text-muted-foreground p-4">← Choose a question to inspect its answers</p>}
          {answers.map((a: any) => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{a.code}</Badge>
                  <Badge className={`text-[10px] px-1.5 py-0 ${spectrumColors[(a.spectrumDepth || "").toUpperCase()] || "bg-stone-100"}`}>
                    {a.spectrumDepth}
                  </Badge>
                </div>
                <p className="text-sm leading-snug">{a.answerText}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-1 border-t border-border/50">
                  <MetaRow label="AR Primary" value={a.arPrimary} />
                  <MetaRow label="AR Secondary" value={a.arSecondary} />
                  <MetaRow label="WI" value={a.wi} />
                  <MetaRow label="MP" value={a.mp} />
                  {a.mmi && <MetaRow label="MMI" value={a.mmi} />}
                  {a.abi && <MetaRow label="ABI" value={a.abi} />}
                  {a.epcl && <MetaRow label="EPCL" value={a.epcl} />}
                  {a.wombField && <MetaRow label="Womb" value={a.wombField} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Question</DialogTitle></DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Question Text</label>
                <Textarea
                  value={editingQuestion.questionText}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="min-h-[100px] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invitation (ritual/somatic cue)</label>
                <Textarea
                  value={editingQuestion.invitation}
                  onChange={e => setEditingQuestion({ ...editingQuestion, invitation: e.target.value })}
                  className="min-h-[60px] mt-1"
                  placeholder="Optional invitation text…"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                <Button onClick={() => updateQuestionMutation.mutate(editingQuestion)} disabled={updateQuestionMutation.isPending}>
                  <Save className="w-4 h-4 mr-1" /> {updateQuestionMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
