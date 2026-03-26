import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type Phase = "gateway" | "question" | "transition" | "complete";

export default function CodexAssessment() {
  const [, go] = useLocation();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [openText, setOpenText] = useState("");
  const [phase, setPhase] = useState<Phase>("gateway");
  const [transitioning, setTransitioning] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const totalSections = 16;
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const constantsQuery = trpc.codex.client.constants.useQuery();
  const sectionMeta = constantsQuery.data?.sectionMeta || {};

  const startMutation = trpc.codex.client.startAssessment.useMutation({
    onSuccess: (data) => {
      setAssessmentId(data.assessmentId);
      setCurrentSection(data.currentSection);
      setCurrentQuestionIdx(data.resumed ? 0 : 0);
      setPhase("gateway");
    },
  });

  const questionsQuery = trpc.codex.client.getQuestions.useQuery(
    { sectionNum: currentSection },
    { enabled: !!assessmentId }
  );

  const submitMutation = trpc.codex.client.submitResponse.useMutation();
  const progressMutation = trpc.codex.client.updateProgress.useMutation();
  const completeMutation = trpc.codex.client.completeAssessment.useMutation({
    onSuccess: () => { /* stays on complete screen */ },
  });

  useEffect(() => { startMutation.mutate(); }, []);

  const section = questionsQuery.data?.section;
  const questions = questionsQuery.data?.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const isOpenEnded = currentQ?.isOpenEnded === 1;
  const isGhost = currentQ?.isGhost === 1;
  const meta = section ? sectionMeta[section.num] || section : null;

  const totalQuestions = totalSections * 10;
  const progressPct = totalQuestions > 0 ? Math.min((answeredCount / totalQuestions) * 100, 100) : 0;

  const advance = useCallback(async (code: string | null, text: string | null) => {
    if (!assessmentId || !currentQ || transitioning) return;
    setTransitioning(true);

    try {
      await submitMutation.mutateAsync({
        assessmentId,
        sectionNum: currentSection,
        questionId: currentQ.id,
        answerCode: code,
        openText: text,
        isGhost,
      });
    } catch { /* silent */ }

    setAnsweredCount(c => c + 1);

    settleTimer.current = setTimeout(() => {
      setSelectedAnswer(null);
      setOpenText("");
      setTransitioning(false);

      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(i => i + 1);
      } else if (currentSection < totalSections) {
        setPhase("transition");
      } else {
        setPhase("complete");
      }
    }, 700);
  }, [assessmentId, currentQ, currentSection, currentQuestionIdx, questions.length, transitioning, isGhost, submitMutation]);

  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);

  const handleAnswerSelect = (code: string) => {
    if (transitioning) return;
    setSelectedAnswer(code);
    advance(code, null);
  };

  const handleOpenTextSubmit = () => {
    if (!openText.trim()) return;
    advance(null, openText);
  };

  const enterSection = () => {
    setPhase("question");
    setCurrentQuestionIdx(0);
  };

  const nextSection = () => {
    const next = currentSection + 1;
    setCurrentSection(next);
    setPhase("gateway");
    if (assessmentId) progressMutation.mutate({ assessmentId, currentSection: next, currentQuestion: 1 });
  };

  // ── Loading ──
  if (!assessmentId || startMutation.isPending) {
    return (
      <div className="codex-env">
        <div className="cx-gateway">
          <div className="text-5xl cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u25C8"}</div>
          <p className="cx-invitation mt-6" style={{ opacity: 0.6 }}>Preparing your journey…</p>
        </div>
      </div>
    );
  }

  // ── PHASE: Gateway ──
  if (phase === "gateway" && meta) {
    return (
      <div className="codex-env">
        <ProgressBar pct={progressPct} />
        <div className="cx-gateway cx-fade-in">
          <div className="text-6xl md:text-7xl mb-8 cx-slow-pulse" style={{ lineHeight: 1 }}>{meta.glyph}</div>
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--cx-cream)', opacity: 0.25, letterSpacing: '0.3em' }}>
            Section {currentSection} of 16
          </p>
          <h1 className="cx-heading-xl mb-6">{meta.title}</h1>
          <div className="cx-divider" />
          <p className="cx-invitation max-w-lg mx-auto mb-12">{meta.subtitle}</p>
          <button className="cx-btn-primary" onClick={enterSection}>Enter</button>
        </div>
      </div>
    );
  }

  // ── PHASE: Transition ──
  if (phase === "transition" && meta) {
    return (
      <div className="codex-env">
        <ProgressBar pct={progressPct} />
        <div className="cx-gateway cx-fade-in">
          <div className="text-5xl mb-6" style={{ lineHeight: 1 }}>{meta.glyph}</div>
          <h2 className="cx-heading-lg mb-4" style={{ opacity: 0.7 }}>{meta.title}</h2>
          <p className="cx-invitation mb-12" style={{ opacity: 0.4 }}>Complete</p>
          <div className="cx-divider" />
          <button className="cx-btn-primary mt-8" onClick={nextSection}>Continue</button>
        </div>
      </div>
    );
  }

  // ── PHASE: Complete ──
  if (phase === "complete") {
    return <CompletionScreen assessmentId={assessmentId!} completeMutation={completeMutation} onPortal={() => go("/account/codex")} />;
  }

  // ── PHASE: Question (loading questions) ──
  if (questionsQuery.isLoading || !currentQ) {
    return (
      <div className="codex-env">
        <ProgressBar pct={progressPct} />
        <div className="cx-gateway">
          <div className="text-4xl cx-slow-pulse" style={{ lineHeight: 1 }}>{"\u25C8"}</div>
        </div>
      </div>
    );
  }

  // ── PHASE: Active Question ──
  return (
    <div className="codex-env" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ProgressBar pct={progressPct} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', maxWidth: '48rem', margin: '0 auto', width: '100%' }}>
        {/* Question text */}
        <div className="cx-fade-up" style={{ width: '100%', marginBottom: '3rem' }}>
          <p className="cx-font-heading" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', lineHeight: 1.5, color: 'rgba(245,230,211,0.9)' }}>
            {currentQ.questionText?.split("\n\n")[0]}
          </p>
          {currentQ.invitation && (
            <p className="cx-invitation mt-4">{currentQ.invitation}</p>
          )}
        </div>

        {/* Answers */}
        {isOpenEnded ? (
          <div className="cx-fade-up cx-delay-2" style={{ width: '100%' }}>
            <textarea
              className="cx-textarea"
              value={openText}
              onChange={e => setOpenText(e.target.value)}
              placeholder="Let your words arrive…"
            />
            <button
              className="cx-btn-primary mt-4"
              onClick={handleOpenTextSubmit}
              disabled={!openText.trim()}
            >
              Continue
            </button>
          </div>
        ) : isGhost ? (
          <div className="cx-fade-up cx-delay-2" style={{ width: '100%', textAlign: 'center' }}>
            <p className="cx-invitation mb-8" style={{ opacity: 0.4 }}>
              This is a ghost question — it maps your silence.
            </p>
            <button className="cx-btn-primary" onClick={() => advance(null, null)}>Continue</button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(currentQ.answers || []).map((a: any, i: number) => (
              <button
                key={a.code}
                onClick={() => handleAnswerSelect(a.code)}
                disabled={transitioning}
                className={`cx-answer-card cx-fade-up ${selectedAnswer === a.code ? "cx-selected" : ""}`}
                style={{ animationDelay: `${200 + i * 100}ms`, textAlign: 'left', width: '100%' }}
              >
                <p style={{ color: 'rgba(245,230,211,0.85)', fontSize: '1rem', lineHeight: 1.75 }}>
                  {a.text}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom indicator */}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(245,230,211,0.12)', fontSize: '0.75rem', letterSpacing: '0.15em' }}>
          {meta?.title} · {currentQuestionIdx + 1} of {questions.length}
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 2, background: 'rgba(61,34,51,0.2)' }}>
      <div className="cx-progress" style={{ width: `${pct}%` }} />
    </div>
  );
}

function CompletionScreen({ assessmentId, completeMutation, onPortal }: {
  assessmentId: string;
  completeMutation: any;
  onPortal: () => void;
}) {
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setScoring(true);
      try {
        await completeMutation.mutateAsync({ assessmentId });
        if (!cancelled) setScored(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Scoring encountered an issue.");
      }
      if (!cancelled) setScoring(false);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="codex-env">
      <ProgressBar pct={100} />
      <div className="cx-gateway cx-fade-in">
        <div className="text-6xl mb-8 cx-gold-glow" style={{ lineHeight: 1, borderRadius: '50%', padding: '1rem' }}>{"\u25C8"}</div>

        {scoring && (
          <>
            <p className="cx-heading-md mb-4">The Codex is weaving your map…</p>
            <p className="cx-invitation max-w-md mx-auto mb-12" style={{ opacity: 0.4, animation: 'cx-slow-pulse 4s infinite' }}>
              Your answers are being scored across all three dimensions.
            </p>
          </>
        )}

        {scored && (
          <>
            <p className="cx-heading-md mb-4">The Codex has received you.</p>
            <p className="cx-invitation max-w-md mx-auto mb-12" style={{ opacity: 0.6 }}>
              Your Scroll is ready. Your Mirror Report is being prepared for review.
            </p>
            <div className="cx-divider" />
            <button className="cx-btn-primary mt-8" onClick={onPortal}>Enter Your Portal</button>
          </>
        )}

        {error && (
          <>
            <p className="cx-heading-md mb-4">The Codex has received you.</p>
            <p className="cx-invitation max-w-md mx-auto mb-4" style={{ opacity: 0.5 }}>
              Your responses are saved. Scoring will be completed shortly.
            </p>
            <p className="text-xs mb-12" style={{ color: 'var(--cx-ember-light)', opacity: 0.5 }}>{error}</p>
            <div className="cx-divider" />
            <button className="cx-btn-primary mt-8" onClick={onPortal}>Enter Your Portal</button>
          </>
        )}
      </div>
    </div>
  );
}
