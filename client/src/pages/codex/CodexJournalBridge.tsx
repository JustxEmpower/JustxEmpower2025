/**
 * CODEX JOURNAL BRIDGE — Doc 07 Full Implementation
 * ====================================================
 * Two-layer experience:
 *   Layer 1: Ownership verification (ISBN, self-declare, purchase)
 *   Layer 2: Bridge writing, chapter exploration, resonance view
 *
 * The bridge principle:
 *   Journals ask "who was she?"
 *   Codex asks "who did that make me?"
 *   Bridge asks "how does knowing her change how I carry what she gave me?"
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { BookHeart, Hash, Heart, ShoppingBag, Check, ChevronRight, Sparkles, ArrowLeft, PenLine, Waves, Send, ChevronDown } from 'lucide-react';

const BOOKS = [
  {
    id: '1a' as const,
    title: "Her Mother's Wounds",
    subtitle: 'Book 1A — The Naming',
    isbn: '979-8-9993334-0-7',
    color: '#C9A84C',
    description: 'Naming the patterns inherited. The first act of reclamation.',
    chapters: [
      { num: 1, title: 'The First Memory' },
      { num: 2, title: 'Her Voice in Your Head' },
      { num: 3, title: 'The Naming' },
      { num: 4, title: "What She Couldn't Say" },
      { num: 5, title: 'Her Mother Before Her' },
      { num: 6, title: 'The Gift Inside the Wound' },
    ],
  },
  {
    id: '1b' as const,
    title: "Her Mother's Wounds",
    subtitle: 'Book 1B — The Reckoning',
    isbn: '979-8-9993334-1-4',
    color: '#E88B8B',
    description: 'Facing what was given and what was withheld.',
    chapters: [
      { num: 1, title: 'The Absence' },
      { num: 2, title: 'Motherless Daughters' },
      { num: 3, title: 'The Reckoning' },
      { num: 4, title: 'Anger as Portal' },
      { num: 5, title: 'What You Mothered in Yourself' },
      { num: 6, title: 'The Reckoning Completes' },
    ],
  },
  {
    id: '1c' as const,
    title: "Her Mother's Wounds",
    subtitle: 'Book 1C — The Becoming',
    isbn: '979-8-9993334-2-1',
    color: '#A78BFA',
    description: 'Integrating the lineage. Choosing what to carry forward.',
    chapters: [
      { num: 1, title: 'The Choice' },
      { num: 2, title: 'Performing Okay' },
      { num: 3, title: 'The Becoming' },
      { num: 4, title: 'Breaking the Chain' },
      { num: 5, title: 'Honoring Without Excusing' },
      { num: 6, title: 'The Integration' },
    ],
  },
];

type MainView = 'ownership' | 'bridge';
type VerifyMode = 'select' | 'isbn' | 'declare' | 'purchase';

interface Props {
  onClose?: () => void;
}

export default function CodexJournalBridge({ onClose }: Props) {
  const [mainView, setMainView] = useState<MainView>('ownership');
  const [mode, setMode] = useState<VerifyMode>('select');
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnError, setIsbnError] = useState('');
  const [declareBook, setDeclareBook] = useState<string | null>(null);
  const [purchaseBooks, setPurchaseBooks] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  // Bridge writing state
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [bridgeText, setBridgeText] = useState('');
  const [lastReflection, setLastReflection] = useState<{ reflection: string; themes: string[] } | null>(null);
  const [showResonance, setShowResonance] = useState(false);

  const ownershipQuery = trpc.codex.client.getJournalOwnership.useQuery();
  const isbnMut = trpc.codex.client.verifyJournalISBN.useMutation({
    onSuccess: (data) => {
      setIsbnError('');
      setIsbnInput('');
      setSuccessMessage(data.alreadyOwned ? 'Already verified!' : `${BOOKS.find(b => b.id === data.bookId)?.subtitle} unlocked!`);
      ownershipQuery.refetch();
      setTimeout(() => { setSuccessMessage(''); setMode('select'); }, 2500);
    },
    onError: (err) => setIsbnError(err.message),
  });
  const declareMut = trpc.codex.client.declareJournalOwnership.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.alreadyOwned ? 'Already declared!' : 'Journal registered!');
      ownershipQuery.refetch();
      setTimeout(() => { setSuccessMessage(''); setDeclareBook(null); setMode('select'); }, 2500);
    },
  });
  const purchaseMut = trpc.codex.client.purchaseJournalBundle.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
  });

  // Handle purchase confirmation from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('journal_purchase') === 'success' && params.get('books')) {
      // Handled by CodexPortal parent — just show success
      setSuccessMessage('Purchase confirmed! Your journals are now linked.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  }, []);

  const submitBridgeMut = trpc.codex.client.submitBridgeEntry.useMutation({
    onSuccess: (data) => {
      setLastReflection({ reflection: data.aiReflection, themes: data.themes });
      setBridgeText('');
      bridgeEntriesQuery.refetch();
    },
  });
  const bridgeEntriesQuery = trpc.codex.client.getBridgeEntries.useQuery(
    selectedBook ? { bookId: selectedBook } : undefined,
    { enabled: !!selectedBook }
  );
  const resonanceQuery = trpc.codex.client.getResonanceAnalysis.useQuery(
    { bookId: (selectedBook || '1a') as any },
    { enabled: showResonance && !!selectedBook }
  );

  const ownedBooks = new Set((ownershipQuery.data || []).map(o => o.bookId));
  const hasAnyOwned = ownedBooks.size > 0;
  const allOwned = BOOKS.every(b => ownedBooks.has(b.id));

  // Auto-switch to bridge view when user has at least one book
  useEffect(() => {
    if (hasAnyOwned && mainView === 'ownership') {
      setMainView('bridge');
    }
  }, [hasAnyOwned]);

  const activeBook = BOOKS.find(b => b.id === selectedBook);

  // ══════════════════════════════════════════════════════════════════
  // BRIDGE WRITING VIEW — Chapter selector + writing + resonance
  // ══════════════════════════════════════════════════════════════════
  if (mainView === 'bridge') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 500, color: 'var(--cx-cream)', margin: 0 }}>
              Journal Bridge
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontStyle: 'italic' }}>
              How does knowing her change how I carry what she gave me?
            </p>
          </div>
          <button onClick={() => setMainView('ownership')} className="cx-btn-ghost" style={{ fontSize: '0.6875rem', padding: '0.375rem 0.75rem' }}>
            Manage Books
          </button>
        </div>

        {/* Book selector tabs */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
          {BOOKS.filter(b => ownedBooks.has(b.id)).map(book => (
            <button
              key={book.id}
              onClick={() => { setSelectedBook(book.id); setSelectedChapter(null); setLastReflection(null); setShowResonance(false); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 8,
                background: selectedBook === book.id ? `${book.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedBook === book.id ? `${book.color}40` : 'rgba(255,255,255,0.06)'}`,
                color: selectedBook === book.id ? book.color : 'rgba(255,255,255,0.4)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {book.id.toUpperCase()}
            </button>
          ))}
        </div>

        {/* No book selected */}
        {!selectedBook && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
            <BookHeart size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Select a journal above to begin bridging</p>
          </div>
        )}

        {/* Book selected — show chapters + writing */}
        {selectedBook && activeBook && !showResonance && (
          <>
            {/* Chapter list */}
            {!selectedChapter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.25rem' }}>
                  {activeBook.subtitle} — Chapters
                </h3>
                {activeBook.chapters.map(ch => {
                  const hasEntry = (bridgeEntriesQuery.data || []).some(e => e.journalSection === `${selectedBook}_ch${ch.num}`);
                  return (
                    <button
                      key={ch.num}
                      onClick={() => { setSelectedChapter(ch.num); setLastReflection(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${hasEntry ? `${activeBook.color}20` : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'inherit',
                        width: '100%',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: hasEntry ? `${activeBook.color}15` : 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: hasEntry ? activeBook.color : 'rgba(255,255,255,0.25)',
                        flexShrink: 0,
                      }}>
                        {hasEntry ? <Check size={12} /> : ch.num}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cx-cream)' }}>{ch.title}</div>
                      </div>
                      <PenLine size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </button>
                  );
                })}

                {/* Resonance button */}
                {(bridgeEntriesQuery.data || []).length >= 2 && (
                  <button
                    onClick={() => setShowResonance(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderRadius: 12,
                      background: 'rgba(139,92,246,0.06)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      width: '100%',
                      marginTop: '0.5rem',
                    }}
                  >
                    <Waves size={18} style={{ color: '#8B5CF6' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A78BFA' }}>Maternal Resonance</div>
                      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
                        See the echoes between your journal and your Codex journey
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Chapter writing view */}
            {selectedChapter && (
              <div className="cx-card" style={{ padding: '1.25rem' }}>
                <button
                  onClick={() => { setSelectedChapter(null); setLastReflection(null); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                >
                  <ArrowLeft size={14} /> Back to chapters
                </button>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: activeBook.color, marginBottom: '0.25rem' }}>
                  Ch. {selectedChapter}: {activeBook.chapters.find(c => c.num === selectedChapter)?.title}
                </h3>
                <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', fontStyle: 'italic' }}>
                  {activeBook.subtitle}
                </p>

                <textarea
                  value={bridgeText}
                  onChange={e => setBridgeText(e.target.value)}
                  placeholder="Write your bridge reflection here... How does this chapter connect to who you are becoming?"
                  className="cx-textarea"
                  style={{ minHeight: '8rem', maxHeight: '14rem', marginBottom: '0.75rem', textAlign: 'left' }}
                />

                <button
                  onClick={() => submitBridgeMut.mutate({ bookId: selectedBook as any, chapterNum: selectedChapter, entryText: bridgeText })}
                  disabled={bridgeText.trim().length < 10 || submitBridgeMut.isPending}
                  className="cx-btn-primary"
                  style={{ width: '100%', gap: '0.5rem' }}
                >
                  {submitBridgeMut.isPending ? (
                    <span>Reflecting...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Bridge Reflection</span>
                    </>
                  )}
                </button>

                {/* AI Reflection */}
                {lastReflection && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    borderRadius: 10,
                    background: `${activeBook.color}06`,
                    border: `1px solid ${activeBook.color}15`,
                  }}>
                    <div style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: activeBook.color, marginBottom: '0.5rem', opacity: 0.6 }}>
                      Bridge Reflection
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--cx-cream)', lineHeight: 1.7, margin: '0 0 0.75rem', fontStyle: 'italic' }}>
                      "{lastReflection.reflection}"
                    </p>
                    {lastReflection.themes.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {lastReflection.themes.map(t => (
                          <span key={t} style={{
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: `${activeBook.color}10`,
                            border: `1px solid ${activeBook.color}20`,
                            fontSize: '0.625rem',
                            color: activeBook.color,
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Previous entries for this chapter */}
                {(bridgeEntriesQuery.data || []).filter(e => e.journalSection === `${selectedBook}_ch${selectedChapter}`).map(entry => (
                  <div key={entry.id} style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                      {entry.entryText.substring(0, 200)}{entry.entryText.length > 200 ? '...' : ''}
                    </p>
                    {entry.aiReflection && (
                      <p style={{ fontSize: '0.6875rem', color: activeBook.color, fontStyle: 'italic', margin: 0, opacity: 0.7 }}>
                        "{entry.aiReflection}"
                      </p>
                    )}
                    <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.375rem' }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Resonance view */}
        {showResonance && selectedBook && (
          <div>
            <button
              onClick={() => setShowResonance(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
            >
              <ArrowLeft size={14} /> Back to chapters
            </button>

            <div style={{
              textAlign: 'center',
              padding: '1.25rem',
              borderRadius: 12,
              background: 'rgba(139,92,246,0.04)',
              border: '1px solid rgba(139,92,246,0.12)',
              marginBottom: '1rem',
            }}>
              <Waves size={24} style={{ color: '#8B5CF6', marginBottom: '0.5rem' }} />
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', color: 'var(--cx-cream)', margin: '0 0 0.25rem' }}>
                Maternal Resonance
              </h3>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Echoes between your journal work and your Codex journey
              </p>
            </div>

            {resonanceQuery.isLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}>
                Analyzing resonance patterns...
              </div>
            )}

            {resonanceQuery.data?.maternalSummary && (
              <div style={{
                padding: '1rem',
                borderRadius: 10,
                background: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.12)',
                marginBottom: '1rem',
              }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--cx-cream)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  "{resonanceQuery.data.maternalSummary}"
                </p>
              </div>
            )}

            {(resonanceQuery.data?.resonances || []).map((r: any, i: number) => {
              const typeColors: Record<string, string> = {
                echo: '#22D3EE',
                mirror: '#A78BFA',
                wound_source: '#E88B8B',
                gift: '#C9A84C',
                unresolved: '#F472B6',
              };
              const color = typeColors[r.resonanceType || r.type] || '#8B5CF6';
              return (
                <div key={r.id || i} style={{
                  padding: '0.875rem',
                  borderRadius: 10,
                  background: `${color}06`,
                  border: `1px solid ${color}15`,
                  marginBottom: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{
                      fontSize: '0.5625rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color,
                      fontWeight: 700,
                    }}>
                      {r.resonanceType || r.type}
                    </span>
                    <div style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: `${r.strength}%`, height: '100%', borderRadius: 2, background: color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 0.25rem' }}>
                    {r.pattern}
                  </p>
                  {(r.aiInsight || r.insight) && (
                    <p style={{ fontSize: '0.6875rem', color, fontStyle: 'italic', margin: 0, opacity: 0.8 }}>
                      {r.aiInsight || r.insight}
                    </p>
                  )}
                </div>
              );
            })}

            {resonanceQuery.data && (resonanceQuery.data.resonances || []).length === 0 && !resonanceQuery.isLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}>
                Write at least 2 bridge reflections to unlock resonance analysis.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // OWNERSHIP VERIFICATION VIEW
  // ══════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {mode !== 'select' ? (
          <button
            onClick={() => setMode('select')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : hasAnyOwned ? (
          <button
            onClick={() => setMainView('bridge')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.5rem',
            fontWeight: 500,
            color: 'var(--cx-cream)',
            margin: 0,
          }}>
            Journal Bridge
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
            Link your physical journals to unlock the digital companion
          </p>
        </div>
      </div>

      {/* Success toast */}
      {successMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 10,
          background: 'rgba(74,205,141,0.1)',
          border: '1px solid rgba(74,205,141,0.2)',
          color: '#4ACD8D',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'cx-fade-in 300ms ease',
        }}>
          <Check size={16} />
          {successMessage}
        </div>
      )}

      {/* Ownership status */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {BOOKS.map(book => (
          <div
            key={book.id}
            style={{
              flex: 1,
              padding: '0.625rem',
              borderRadius: 10,
              background: ownedBooks.has(book.id) ? `${book.color}10` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${ownedBooks.has(book.id) ? `${book.color}30` : 'rgba(255,255,255,0.06)'}`,
              textAlign: 'center',
              transition: 'all 300ms ease',
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              margin: '0 auto 0.375rem',
              background: ownedBooks.has(book.id) ? book.color : 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {ownedBooks.has(book.id) ? (
                <Check size={12} style={{ color: '#000' }} />
              ) : (
                <BookHeart size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.625rem', color: ownedBooks.has(book.id) ? book.color : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {book.id.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {allOwned && (
        <div style={{
          padding: '1rem',
          borderRadius: 12,
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          <Sparkles size={20} style={{ color: '#C9A84C', marginBottom: 6 }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--cx-cream)', fontWeight: 500, margin: '0 0 4px' }}>
            All Journals Linked
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            The full bridge system is active. Your guides now carry your maternal lineage.
          </p>
        </div>
      )}

      {/* ── Mode: Select verification method ── */}
      {mode === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <MethodCard
            icon={<Hash size={18} />}
            title="ISBN Verification"
            desc="Enter the ISBN from the back of your physical journal"
            color="#22D3EE"
            onClick={() => setMode('isbn')}
          />
          <MethodCard
            icon={<Heart size={18} />}
            title="I Own This Journal"
            desc="Honor-system declaration — select which book you have"
            color="#F472B6"
            onClick={() => setMode('declare')}
          />
          <MethodCard
            icon={<ShoppingBag size={18} />}
            title="Purchase Bundle"
            desc="Buy the journals — physical ships to you, digital unlocks now"
            color="#C9A84C"
            onClick={() => setMode('purchase')}
          />
        </div>
      )}

      {/* ── Mode: ISBN entry ── */}
      {mode === 'isbn' && (
        <div className="cx-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cx-cream)', marginBottom: '0.5rem' }}>
            Enter Your ISBN
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Find the ISBN on the back cover or copyright page of your journal.
          </p>
          <input
            type="text"
            value={isbnInput}
            onChange={e => { setIsbnInput(e.target.value); setIsbnError(''); }}
            placeholder="979-8-9993334-0-7"
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              borderRadius: 8,
              border: `1px solid ${isbnError ? 'rgba(224,96,96,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--cx-cream)',
              fontSize: '0.9375rem',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              outline: 'none',
              marginBottom: isbnError ? '0.375rem' : '1rem',
              boxSizing: 'border-box',
            }}
          />
          {isbnError && (
            <p style={{ fontSize: '0.75rem', color: '#E06060', marginBottom: '0.75rem' }}>{isbnError}</p>
          )}
          <div style={{ display: 'flex', gap: 6, fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {BOOKS.map(b => (
              <span key={b.id} style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.04)',
                textDecoration: ownedBooks.has(b.id) ? 'line-through' : 'none',
                opacity: ownedBooks.has(b.id) ? 0.4 : 1,
              }}>
                {b.id.toUpperCase()}: {b.isbn}
              </span>
            ))}
          </div>
          <button
            onClick={() => isbnMut.mutate({ isbn: isbnInput })}
            disabled={isbnInput.replace(/[-\s]/g, '').length < 10 || isbnMut.isPending}
            className="cx-btn-primary"
            style={{ width: '100%' }}
          >
            {isbnMut.isPending ? 'Verifying...' : 'Verify ISBN'}
          </button>
        </div>
      )}

      {/* ── Mode: Self-declaration ── */}
      {mode === 'declare' && (
        <div className="cx-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cx-cream)', marginBottom: '0.5rem' }}>
            Which journal do you own?
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Select the book you have. This is honor-based — we trust you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {BOOKS.map(book => {
              const owned = ownedBooks.has(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => !owned && setDeclareBook(book.id)}
                  disabled={owned || declareMut.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: declareBook === book.id ? `${book.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${declareBook === book.id ? `${book.color}40` : owned ? 'rgba(74,205,141,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: owned ? 'default' : 'pointer',
                    opacity: owned ? 0.5 : 1,
                    textAlign: 'left',
                    color: 'inherit',
                    width: '100%',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${book.color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {owned ? <Check size={14} style={{ color: '#4ACD8D' }} /> : <BookHeart size={14} style={{ color: book.color }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cx-cream)' }}>{book.subtitle}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
                      {owned ? 'Already linked' : book.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {declareBook && (
            <button
              onClick={() => declareMut.mutate({ bookId: declareBook as any })}
              disabled={declareMut.isPending}
              className="cx-btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {declareMut.isPending ? 'Registering...' : `I own ${BOOKS.find(b => b.id === declareBook)?.subtitle}`}
            </button>
          )}
        </div>
      )}

      {/* ── Mode: Purchase bundle ── */}
      {mode === 'purchase' && (
        <div className="cx-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cx-cream)', marginBottom: '0.5rem' }}>
            Purchase Journals
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Physical journal ships to your door. Digital companion access unlocks immediately.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {BOOKS.map(book => {
              const owned = ownedBooks.has(book.id);
              const selected = purchaseBooks.has(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => {
                    if (owned) return;
                    const next = new Set(purchaseBooks);
                    if (selected) next.delete(book.id); else next.add(book.id);
                    setPurchaseBooks(next);
                  }}
                  disabled={owned}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    background: selected ? `${book.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selected ? `${book.color}40` : owned ? 'rgba(74,205,141,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: owned ? 'default' : 'pointer',
                    opacity: owned ? 0.5 : 1,
                    textAlign: 'left',
                    color: 'inherit',
                    width: '100%',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: `2px solid ${selected ? book.color : 'rgba(255,255,255,0.15)'}`,
                    background: selected ? book.color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 200ms ease',
                  }}>
                    {(selected || owned) && <Check size={12} style={{ color: owned ? '#4ACD8D' : '#000' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--cx-cream)' }}>{book.subtitle}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
                      {owned ? 'Already owned' : book.description}
                    </div>
                  </div>
                  {!owned && (
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: book.color }}>
                      $24.97
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pricing */}
          {purchaseBooks.size > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.12)',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  {purchaseBooks.size} book{purchaseBooks.size !== 1 ? 's' : ''}
                  {purchaseBooks.size === 3 && ' (bundle discount!)'}
                </span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#C9A84C' }}>
                  ${purchaseBooks.size === 3 ? '59.97' : (purchaseBooks.size * 24.97).toFixed(2)}
                </span>
              </div>
              {purchaseBooks.size === 3 && (
                <div style={{ fontSize: '0.625rem', color: 'rgba(74,205,141,0.7)', marginTop: 4 }}>
                  You save $14.94 with the complete bundle
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => purchaseMut.mutate({ bookIds: Array.from(purchaseBooks) as any })}
            disabled={purchaseBooks.size === 0 || purchaseMut.isPending}
            className="cx-btn-primary"
            style={{ width: '100%' }}
          >
            {purchaseMut.isPending ? 'Redirecting to checkout...' : `Purchase ${purchaseBooks.size === 3 ? 'Complete Bundle' : `${purchaseBooks.size} Book${purchaseBooks.size !== 1 ? 's' : ''}`}`}
          </button>
        </div>
      )}
    </div>
  );
}

function MethodCard({ icon, title, desc, color, onClick }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit',
        width: '100%',
        transition: 'all 250ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${color}08`;
        e.currentTarget.style.borderColor = `${color}25`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${color}10`,
        border: `1px solid ${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cx-cream)' }}>{title}</div>
        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{desc}</div>
      </div>
      <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
    </button>
  );
}
