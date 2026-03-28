/**
 * CODEX ONBOARDING CEREMONY — Doc 05 Implementation
 * ===================================================
 * A guided first-time experience when a user enters the Codex portal.
 * Multi-step ceremony: Welcome → Intention Setting → Guide Introduction → Begin.
 * Shows once per user, persisted via localStorage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, Heart, BookHeart, Orbit } from 'lucide-react';
import { GuideCharacterSelector } from './GuideCharacterSelector';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = 'codex-onboarding-complete';

interface OnboardingCeremonyProps {
  userName: string;
  onComplete: () => void;
  onNavigateToGuide: () => void;
  onNavigateToJournal: () => void;
}

type CeremonyStep = 'welcome' | 'intention' | 'avatar' | 'paths' | 'begin';

const STEP_ORDER: CeremonyStep[] = ['welcome', 'intention', 'avatar', 'paths', 'begin'];

export function useOnboardingState() {
  const [complete, setComplete] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const markComplete = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setComplete(true);
  }, []);
  return { onboardingComplete: complete, markOnboardingComplete: markComplete };
}

export default function CodexOnboardingCeremony({
  userName,
  onComplete,
  onNavigateToGuide,
  onNavigateToJournal,
}: OnboardingCeremonyProps) {
  const [step, setStep] = useState<CeremonyStep>('welcome');
  const [intention, setIntention] = useState('');
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [avatarSelected, setAvatarSelected] = useState(false);
  const updateSettingsMut = trpc.codex.client.updateSettings.useMutation();
  const stepIndex = STEP_ORDER.indexOf(step);

  const transitionTo = (next: CeremonyStep) => {
    setFadeState('out');
    setTimeout(() => {
      setStep(next);
      setFadeState('in');
    }, 400);
  };

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      transitionTo(STEP_ORDER[nextIndex]);
    }
  };

  const handleComplete = (action: 'guide' | 'journal' | 'explore') => {
    onComplete();
    if (action === 'guide') onNavigateToGuide();
    else if (action === 'journal') onNavigateToJournal();
  };

  const fadeStyle: React.CSSProperties = {
    opacity: fadeState === 'in' ? 1 : 0,
    transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 400ms ease, transform 400ms ease',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'var(--cx-deep, #EDE5D8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'auto',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60vw',
        height: '60vw',
        maxWidth: 600,
        maxHeight: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'cx-slow-pulse 4s ease-in-out infinite',
      }} />

      {/* Progress dots */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        display: 'flex',
        gap: 8,
      }}>
        {STEP_ORDER.map((s, i) => (
          <div key={s} style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i <= stepIndex ? 'var(--cx-violet, #8B5CF6)' : 'rgba(255,255,255,0.1)',
            transition: 'background 400ms ease',
          }} />
        ))}
      </div>

      <div style={{ ...fadeStyle, maxWidth: 520, textAlign: 'center', position: 'relative' }}>

        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <Sparkles size={28} style={{ color: 'var(--cx-violet, #8B5CF6)', opacity: 0.8 }} />
            </div>

            <p style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.5)',
              marginBottom: '0.75rem',
            }}>
              The Living Codex
            </p>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 300,
              color: 'var(--cx-cream, #F0EBF5)',
              marginBottom: '1.25rem',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>
              Welcome, {userName}
            </h1>

            <p style={{
              fontSize: '1rem',
              color: 'rgba(240,235,245,0.5)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: 420,
              margin: '0 auto 2.5rem',
            }}>
              You have entered a space designed to meet you exactly where you are.
              This is not a course to complete — it is a living mirror that evolves with you.
            </p>

            <button
              onClick={handleNext}
              className="cx-btn-primary"
              style={{ padding: '0.75rem 2rem', gap: '0.5rem' }}
            >
              <span>I'm Ready</span>
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 2: Intention Setting ── */}
        {step === 'intention' && (
          <>
            <Heart size={24} style={{ color: 'var(--cx-rose, #F472B6)', opacity: 0.6, marginBottom: '1.5rem' }} />

            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 400,
              color: 'var(--cx-cream, #F0EBF5)',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
            }}>
              Set Your Intention
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(240,235,245,0.45)',
              lineHeight: 1.7,
              marginBottom: '1.75rem',
            }}>
              What brings you here? There are no wrong answers.
              Your intention anchors the journey ahead.
            </p>

            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="I'm here because..."
              className="cx-textarea"
              style={{
                minHeight: '6rem',
                maxHeight: '10rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={handleNext}
                className="cx-btn-ghost"
                style={{ fontSize: '0.8125rem' }}
              >
                Skip for now
              </button>
              <button
                onClick={handleNext}
                className="cx-btn-primary"
                disabled={!intention.trim()}
                style={{ padding: '0.625rem 1.75rem', gap: '0.5rem' }}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Choose Your Avatar ── */}
        {step === 'avatar' && (
          <div style={{ width: '100vw', maxWidth: '100vw', position: 'fixed', inset: 0, zIndex: 310 }}>
            <GuideCharacterSelector
              currentGuideId={null}
              isFirstTime={true}
              onSelect={(guideId, voiceId) => {
                updateSettingsMut.mutate({ preferredGuideId: guideId, preferredVoiceId: voiceId });
                setAvatarSelected(true);
                transitionTo('paths');
              }}
              onClose={() => transitionTo('paths')}
            />
          </div>
        )}

        {/* ── Step 4: Paths Overview ── */}
        {step === 'paths' && (
          <>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 400,
              color: 'var(--cx-cream, #F0EBF5)',
              marginBottom: '0.5rem',
              lineHeight: 1.3,
            }}>
              Three Paths Await
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(240,235,245,0.4)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}>
              Your Codex offers multiple ways to explore and grow.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', textAlign: 'left' }}>
              {[
                {
                  icon: <Orbit size={18} />,
                  title: 'AI Guides',
                  desc: 'Six unique guides — each with their own voice, wisdom, and approach. Talk freely, be heard deeply.',
                  color: '#8B5CF6',
                },
                {
                  icon: <BookHeart size={18} />,
                  title: 'Journal Vault',
                  desc: 'AI-prompted reflections that weave your words into patterns of self-understanding.',
                  color: '#22D3EE',
                },
                {
                  icon: <Sparkles size={18} />,
                  title: 'Codex Scroll',
                  desc: 'Guided modules that unlock as you progress — shadow work, archetype exploration, and integration.',
                  color: '#C9A84C',
                },
              ].map(path => (
                <div
                  key={path.title}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${path.color}12`,
                    border: `1px solid ${path.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: path.color,
                    flexShrink: 0,
                  }}>
                    {path.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cx-cream)', marginBottom: 2 }}>
                      {path.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, margin: 0 }}>
                      {path.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="cx-btn-primary"
              style={{ padding: '0.75rem 2rem', gap: '0.5rem' }}
            >
              <span>Show Me</span>
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 4: Begin ── */}
        {step === 'begin' && (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,205,141,0.12) 0%, transparent 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              animation: 'cx-float 4s ease-in-out infinite',
            }}>
              <Sparkles size={24} style={{ color: '#4ACD8D' }} />
            </div>

            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 400,
              color: 'var(--cx-cream, #F0EBF5)',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
            }}>
              Your Journey Begins Now
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(240,235,245,0.45)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}>
              Where would you like to start?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <button
                onClick={() => handleComplete('guide')}
                className="cx-btn-primary"
                style={{ width: '100%', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
              >
                <Orbit size={16} />
                <span>Meet Your AI Guide</span>
              </button>
              <button
                onClick={() => handleComplete('journal')}
                className="cx-btn-secondary"
                style={{ width: '100%', padding: '0.625rem 1.5rem', gap: '0.5rem' }}
              >
                <BookHeart size={14} />
                <span>Open Journal Vault</span>
              </button>
              <button
                onClick={() => handleComplete('explore')}
                className="cx-btn-ghost"
                style={{ width: '100%', padding: '0.5rem 1rem' }}
              >
                Explore the Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
