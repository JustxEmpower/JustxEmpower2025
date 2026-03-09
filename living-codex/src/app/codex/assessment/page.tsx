"use client";

import { useState, useEffect, useCallback } from "react";
import { SECTION_META } from "@/lib/utils";

interface Answer {
  code: string;
  text: string;
  spectrum_depth: string;
}

interface Question {
  id: string;
  question_text: string;
  is_ghost: boolean;
  is_open_ended?: boolean;
  answers: Answer[];
}

interface SectionData {
  sectionNum: number;
  title: string;
  glyph: string;
  subtitle: string;
  questions: Question[];
}

type AssessmentPhase = "gateway" | "question" | "transition" | "complete";

export default function AssessmentPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<AssessmentPhase>("gateway");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [openText, setOpenText] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Load assessment data
  useEffect(() => {
    fetch("/api/assessment/questions")
      .then((r) => r.json())
      .then((data) => {
        setSections(data.sections);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const section = sections[currentSection];
  const question = section?.questions[currentQuestion];
  const meta = section ? SECTION_META[section.sectionNum] : null;

  // Total progress
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(responses).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleAnswerSelect = useCallback(
    async (code: string) => {
      if (!section || !question || transitioning) return;
      setSelectedAnswer(code);
      setTransitioning(true);

      // Save response
      const key = `${section.sectionNum}-${question.id}`;
      const newResponses = { ...responses, [key]: code };
      setResponses(newResponses);

      // Auto-save to server
      try {
        await fetch("/api/assessment/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionNum: section.sectionNum,
            questionId: question.id,
            answerCode: code,
            isGhost: question.is_ghost,
          }),
        });
      } catch {
        // Save failed silently — will retry
      }

      // Advance after settle animation
      setTimeout(() => {
        setSelectedAnswer(null);
        setTransitioning(false);

        if (currentQuestion < section.questions.length - 1) {
          // Next question
          setCurrentQuestion((q) => q + 1);
        } else if (currentSection < sections.length - 1) {
          // Section complete — show transition
          setPhase("transition");
        } else {
          // Assessment complete
          setPhase("complete");
        }
      }, 800);
    },
    [section, question, currentSection, currentQuestion, sections, responses, transitioning]
  );

  const handleOpenTextSubmit = useCallback(async () => {
    if (!section || !question || !openText.trim()) return;

    const key = `${section.sectionNum}-${question.id}`;
    const newResponses = { ...responses, [key]: openText };
    setResponses(newResponses);

    try {
      await fetch("/api/assessment/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionNum: section.sectionNum,
          questionId: question.id,
          openText: openText,
          isGhost: question.is_ghost,
        }),
      });
    } catch {}

    setOpenText("");

    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else if (currentSection < sections.length - 1) {
      setPhase("transition");
    } else {
      setPhase("complete");
    }
  }, [section, question, openText, currentSection, currentQuestion, sections, responses]);

  const enterSection = () => {
    setPhase("question");
    setCurrentQuestion(0);
  };

  const nextSection = () => {
    setCurrentSection((s) => s + 1);
    setPhase("gateway");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-slow-pulse">🜂</div>
          <p className="font-cormorant text-lg text-codex-gold/60">
            Preparing your journey...
          </p>
        </div>
      </div>
    );
  }

  // --- GATEWAY: Section entry screen ---
  if (phase === "gateway" && section) {
    return (
      <div className="min-h-screen bg-codex-deep">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-codex-muted/20">
          <div className="codex-progress" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="codex-gateway animate-fade-in">
          <div className="text-6xl md:text-7xl mb-8 animate-slow-pulse">
            {meta?.glyph}
          </div>
          <p className="font-inter text-xs tracking-[0.3em] uppercase text-codex-cream/30 mb-4">
            Section {section.sectionNum} of 16
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light text-codex-gold mb-6 text-shadow-gold">
            {meta?.title}
          </h1>
          <div className="codex-divider" />
          <p className="font-cormorant italic text-lg md:text-xl text-codex-cream/60 max-w-lg mx-auto mb-12">
            {meta?.subtitle}
          </p>
          <button onClick={enterSection} className="codex-btn-primary">
            Enter
          </button>
        </div>
      </div>
    );
  }

  // --- TRANSITION: Between sections ---
  if (phase === "transition" && section) {
    return (
      <div className="min-h-screen bg-codex-deep">
        <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-codex-muted/20">
          <div className="codex-progress" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="codex-gateway animate-fade-in">
          <div className="text-5xl mb-6">{meta?.glyph}</div>
          <h2 className="font-cormorant text-3xl text-codex-gold/70 mb-4">
            {meta?.title}
          </h2>
          <p className="font-cormorant italic text-codex-cream/40 mb-12">
            Complete
          </p>
          <div className="codex-divider" />
          <button onClick={nextSection} className="codex-btn-primary mt-8">
            Continue
          </button>
        </div>
      </div>
    );
  }

  // --- COMPLETE: Assessment finished — trigger scoring ---
  if (phase === "complete") {
    return <CompletionScreen />;
  }

  // --- QUESTION: Active question display ---
  if (!question) return null;

  const isOpenEnded = section.sectionNum === 12;

  return (
    <div className="min-h-screen bg-codex-deep flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-codex-muted/20">
        <div className="codex-progress" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto w-full">
        {/* Question text */}
        <div className="w-full mb-12 animate-fade-up">
          <p className="font-cormorant text-2xl md:text-3xl text-codex-cream/90 leading-relaxed mb-4">
            {question.question_text.split("\n\n")[0]}
          </p>
          {question.question_text.includes("✦") && (
            <p className="codex-invitation mt-4">
              {question.question_text.split("✦")[1]?.trim()}
            </p>
          )}
        </div>

        {/* Answer cards or open text */}
        {isOpenEnded ? (
          <div className="w-full space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <textarea
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder="Let your words arrive..."
              className="w-full h-48 bg-codex-parchment/40 border border-codex-muted/30 rounded-lg p-6 
                         text-codex-cream/90 font-inter text-base leading-relaxed resize-none
                         focus:outline-none focus:border-codex-gold/40 transition-colors duration-500
                         placeholder:text-codex-cream/20 placeholder:font-cormorant placeholder:italic"
            />
            <button
              onClick={handleOpenTextSubmit}
              disabled={!openText.trim()}
              className="codex-btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {question.answers.map((answer, i) => (
              <button
                key={answer.code}
                onClick={() => handleAnswerSelect(answer.code)}
                disabled={transitioning}
                className={`codex-answer-card w-full text-left animate-fade-up ${
                  selectedAnswer === answer.code ? "selected" : ""
                }`}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <p className="text-codex-cream/85 font-inter text-base leading-relaxed">
                  {answer.text}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section indicator */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <p className="text-codex-cream/15 text-xs font-inter tracking-widest">
          {meta?.title} · {currentQuestion + 1} of {section.questions.length}
        </p>
      </div>
    </div>
  );
}

function CompletionScreen() {
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const runScoring = async () => {
      setScoring(true);
      try {
        const res = await fetch("/api/assessment/score", { method: "POST" });
        const data = await res.json();
        if (!cancelled) {
          if (data.success) {
            setScored(true);
          } else {
            setError(data.error || "Scoring encountered an issue.");
          }
        }
      } catch {
        if (!cancelled) setError("Connection error during scoring.");
      }
      if (!cancelled) setScoring(false);
    };
    runScoring();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-codex-deep">
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-codex-muted/20">
        <div className="codex-progress" style={{ width: "100%" }} />
      </div>

      <div className="codex-gateway animate-fade-in">
        <div className="text-6xl mb-8 animate-gold-glow">{"\u{1F701}"}</div>

        {scoring && (
          <>
            <p className="font-cormorant text-2xl text-codex-gold mb-4">
              The Codex is weaving your map...
            </p>
            <p className="font-cormorant text-lg text-codex-cream/40 max-w-md mx-auto mb-12 animate-pulse">
              Your answers are being scored across all three dimensions.
            </p>
          </>
        )}

        {scored && (
          <>
            <p className="font-cormorant text-2xl text-codex-gold mb-4">
              The Codex has received you.
            </p>
            <p className="font-cormorant text-lg text-codex-cream/60 max-w-md mx-auto mb-12">
              Your Scroll is ready. Your Mirror Report is being prepared for review.
            </p>
            <div className="codex-divider" />
            <a href="/codex/portal" className="codex-btn-primary mt-8 inline-block">
              Enter Your Portal
            </a>
          </>
        )}

        {error && (
          <>
            <p className="font-cormorant text-2xl text-codex-gold mb-4">
              The Codex has received you.
            </p>
            <p className="font-cormorant text-lg text-codex-cream/50 max-w-md mx-auto mb-4">
              Your responses are saved. Scoring will be completed shortly.
            </p>
            <p className="text-xs text-codex-ember-light/50 mb-12">{error}</p>
            <div className="codex-divider" />
            <a href="/codex/portal" className="codex-btn-primary mt-8 inline-block">
              Enter Your Portal
            </a>
          </>
        )}
      </div>
    </div>
  );
}
