import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Flame, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function CodexAssessment() {
  const [, setLocation] = useLocation();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [openText, setOpenText] = useState("");
  const [completing, setCompleting] = useState(false);

  const startMutation = trpc.codex.client.startAssessment.useMutation({
    onSuccess: (data) => {
      setAssessmentId(data.assessmentId);
      setCurrentSection(data.currentSection);
      setCurrentQuestionIdx(0);
    },
  });

  const questionsQuery = trpc.codex.client.getQuestions.useQuery(
    { sectionNum: currentSection },
    { enabled: !!assessmentId }
  );

  const submitMutation = trpc.codex.client.submitResponse.useMutation();
  const progressMutation = trpc.codex.client.updateProgress.useMutation();
  const completeMutation = trpc.codex.client.completeAssessment.useMutation({
    onSuccess: () => setLocation("/account/codex"),
  });

  useEffect(() => {
    startMutation.mutate();
  }, []);

  const section = questionsQuery.data?.section;
  const questions = questionsQuery.data?.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const isOpenEnded = currentQ?.isOpenEnded === 1;
  const isGhost = currentQ?.isGhost === 1;
  const totalSections = 16;

  const handleNext = async () => {
    if (!assessmentId || !currentQ) return;

    // Submit response
    await submitMutation.mutateAsync({
      assessmentId,
      sectionNum: currentSection,
      questionId: currentQ.id,
      answerCode: isOpenEnded ? null : selectedAnswer,
      openText: isOpenEnded ? openText : null,
      isGhost,
    });

    setSelectedAnswer(null);
    setOpenText("");

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentSection < totalSections) {
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      setCurrentQuestionIdx(0);
      await progressMutation.mutateAsync({ assessmentId, currentSection: nextSection, currentQuestion: 1 });
    } else {
      // Assessment complete
      setCompleting(true);
      await completeMutation.mutateAsync({ assessmentId });
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
      setSelectedAnswer(null);
      setOpenText("");
    } else if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestionIdx(0);
      setSelectedAnswer(null);
      setOpenText("");
    }
  };

  if (!assessmentId || startMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/30">
        <Flame className="w-10 h-10 text-amber-500 animate-pulse" />
      </div>
    );
  }

  if (completing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/30">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-lg font-medium">Scoring your Codex…</p>
          <p className="text-sm text-muted-foreground">The engine is weaving your archetypal constellation</p>
        </div>
      </div>
    );
  }

  if (questionsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/30">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const canProceed = isOpenEnded ? openText.trim().length > 0 : isGhost || !!selectedAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/account/codex")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Portal
            </Button>
            <span className="text-muted-foreground">Section {currentSection} of {totalSections}</span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${((currentSection - 1 + (currentQuestionIdx / Math.max(questions.length, 1))) / totalSections) * 100}%` }}
            />
          </div>
        </div>

        {/* Section Header */}
        {section && (
          <div className="text-center py-4">
            <span className="text-3xl">{section.glyph}</span>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{section.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 italic">{section.subtitle}</p>
          </div>
        )}

        {/* Question */}
        {currentQ && (
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-rose-400" />
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Q{currentQ.questionNum}</Badge>
                {isGhost && <Badge className="bg-stone-100 text-stone-500 text-xs">Ghost Question</Badge>}
              </div>

              <p className="text-lg leading-relaxed">{currentQ.questionText}</p>

              {currentQ.invitation && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-amber-300 pl-3">{currentQ.invitation}</p>
              )}

              {isOpenEnded ? (
                <Textarea
                  value={openText}
                  onChange={e => setOpenText(e.target.value)}
                  placeholder="Write your response here…"
                  className="min-h-[150px] text-base"
                />
              ) : isGhost ? (
                <p className="text-sm text-muted-foreground italic">This is a ghost question — it maps your silence. No response needed.</p>
              ) : (
                <div className="space-y-3">
                  {(currentQ.answers || []).map((a: any) => (
                    <button
                      key={a.code}
                      onClick={() => setSelectedAnswer(a.code)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === a.code
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          selectedAnswer === a.code ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-600"
                        }`}>
                          {a.code}
                        </span>
                        <span className="text-sm leading-relaxed">{a.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentSection === 1 && currentQuestionIdx === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentQuestionIdx + 1} / {questions.length}
          </span>
          <Button
            onClick={handleNext}
            disabled={!canProceed || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentSection === totalSections && currentQuestionIdx === questions.length - 1 ? (
              <>Complete <CheckCircle2 className="w-4 h-4 ml-1" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
