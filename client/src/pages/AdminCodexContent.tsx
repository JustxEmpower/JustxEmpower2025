import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollText, ChevronRight, Edit, Save, X } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold">Living Codex™ Content CMS</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sections */}
        <div className="lg:col-span-3 space-y-2 max-h-[75vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sections</h3>
          {sections.map(s => (
            <Card
              key={s.id}
              className={`cursor-pointer transition hover:shadow-md ${selectedSection === s.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => { setSelectedSection(s.id); setSelectedQuestionId(null); }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.glyph}</span>
                    <div>
                      <p className="font-semibold text-sm">S{s.id}: {s.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{s.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Questions */}
        <div className="lg:col-span-4 space-y-2 max-h-[75vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {selectedSection ? `Section ${selectedSection} Questions` : "Select a section"}
          </h3>
          {!selectedSection && <p className="text-sm text-muted-foreground p-4">← Select a section to view questions</p>}
          {questions.map(q => (
            <Card
              key={q.id}
              className={`cursor-pointer transition hover:shadow-md ${selectedQuestionId === q.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedQuestionId(q.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">Q{q.questionNum}</Badge>
                  <div className="flex items-center gap-1">
                    {q.isGhost === 1 && <Badge className="bg-stone-100 text-stone-500 text-xs">Ghost</Badge>}
                    {q.isOpenEnded === 1 && <Badge className="bg-blue-100 text-blue-600 text-xs">Open</Badge>}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); setEditingQuestion({ id: q.id, questionText: q.questionText, invitation: q.invitation || "" }); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm line-clamp-2">{q.questionText}</p>
                {q.invitation && <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">{q.invitation}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Answers */}
        <div className="lg:col-span-5 space-y-2 max-h-[75vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {selectedQuestionId ? "Answer Options & Metadata" : "Select a question"}
          </h3>
          {!selectedQuestionId && <p className="text-sm text-muted-foreground p-4">← Select a question to view answers</p>}
          {answers.map(a => (
            <Card key={a.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{a.code}</Badge>
                  <Badge className={spectrumColors[a.spectrumDepth?.toUpperCase()] || "bg-stone-100"}>{a.spectrumDepth}</Badge>
                </div>
                <p className="text-sm">{a.answerText}</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="text-muted-foreground">AR Primary:</span> <span className="font-medium">{a.arPrimary}</span></div>
                  <div><span className="text-muted-foreground">AR Secondary:</span> <span className="font-medium">{a.arSecondary}</span></div>
                  <div><span className="text-muted-foreground">WI:</span> <span className="font-medium">{a.wi}</span></div>
                  <div><span className="text-muted-foreground">MP:</span> <span className="font-medium">{a.mp}</span></div>
                  {a.mmi && <div><span className="text-muted-foreground">MMI:</span> <span className="font-medium">{a.mmi}</span></div>}
                  {a.abi && <div><span className="text-muted-foreground">ABI:</span> <span className="font-medium">{a.abi}</span></div>}
                  {a.epcl && <div><span className="text-muted-foreground">EPCL:</span> <span className="font-medium">{a.epcl}</span></div>}
                  {a.wombField && <div><span className="text-muted-foreground">Womb:</span> <span className="font-medium">{a.wombField}</span></div>}
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
                <label className="text-sm font-medium">Question Text</label>
                <Textarea
                  value={editingQuestion.questionText}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Invitation (ritual/somatic cue)</label>
                <Textarea
                  value={editingQuestion.invitation}
                  onChange={e => setEditingQuestion({ ...editingQuestion, invitation: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                <Button onClick={() => updateQuestionMutation.mutate(editingQuestion)} disabled={updateQuestionMutation.isPending}>
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
