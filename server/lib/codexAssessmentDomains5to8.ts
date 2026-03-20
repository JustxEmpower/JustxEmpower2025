/**
 * Living Codex Assessment Engine — Domains 5-8
 * Soul Resonance, Cyclic Intelligence, Goals + Support, Codex Phase Self-Placement
 *
 * Written in the Just Empower voice: sacred, invitational, poetic.
 * Each question is a mirror, not a test.
 */

export interface AssessmentQuestion {
  id: string;
  section: number;
  questionNumber: number;
  invitationText: string;
  guidanceNote: string;
  answers: AssessmentAnswer[];
  isGhost: boolean;
}

export interface AssessmentAnswer {
  code: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  spectrumDepth: 'shadow' | 'threshold' | 'gift' | 'ghost';
  primaryArchetype: string;
  secondaryArchetype: string;
  woundImprint: string;
  mirrorPattern: string;
  siCode: string | null;
}

// ============================================================================
// DOMAIN 5: ARCHETYPAL RESONANCE (Section 6: Soul Disconnection)
// ============================================================================

export const DOMAIN_5_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'D5Q1',
    section: 6,
    questionNumber: 1,
    invitationText: 'When I hear the phrase "your soul knows," I feel…',
    guidanceNote: 'Let the first internal response register before you choose. This is about what resonates in your deepest knowing, not what you think should be true.',
    answers: [
      {
        code: 'A',
        text: 'A recognition—like something already knows, beneath the noise',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'remembering agency',
        mirrorPattern: 'inner authority restored',
        siCode: 'LA-1'
      },
      {
        code: 'B',
        text: 'A longing—like I\'m reaching toward something distant and true',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'reconnecting to purpose',
        mirrorPattern: 'soul-seeking in motion',
        siCode: 'DR-2'
      },
      {
        code: 'C',
        text: 'A small, quiet voice I can barely hear—if it\'s even there',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Silent Flame',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'silenced inner knowing',
        mirrorPattern: 'voice waiting to be found',
        siCode: 'SF-1'
      },
      {
        code: 'D',
        text: 'Skepticism—my soul? I\'m not sure I have one, or what it would say',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'spiritual disconnection',
        mirrorPattern: 'intellect guarding the sacred',
        siCode: 'RP-1'
      },
      {
        code: 'E',
        text: 'Emptiness—a space where something should be, but isn\'t',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Void',
        woundImprint: 'fundamental abandonment',
        mirrorPattern: 'absence as identity',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q2',
    section: 6,
    questionNumber: 2,
    invitationText: 'The word "belonging" brings to mind…',
    guidanceNote: 'What image, sensation, or feeling surfaces first? Don\'t edit it. That\'s your mirror.',
    answers: [
      {
        code: 'A',
        text: 'A room where I can be fully myself, with others who see me',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'integration of belonging',
        mirrorPattern: 'authentic presence',
        siCode: 'AC-2'
      },
      {
        code: 'B',
        text: 'Something I search for but never quite find',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'seeking external approval',
        mirrorPattern: 'never enough for the room',
        siCode: 'PF-2'
      },
      {
        code: 'C',
        text: 'A place I have to earn by being useful, needed, or compliant',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'conditional love internalized',
        mirrorPattern: 'love as obligation',
        siCode: 'BF-2'
      },
      {
        code: 'D',
        text: 'An illusion—I\'m fundamentally alone, and that\'s just how it is',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Shielded One',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'protective isolation',
        mirrorPattern: 'solitude as safety',
        siCode: 'SO-1'
      },
      {
        code: 'E',
        text: 'Something that happened to others, not to me',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'separation as destiny',
        mirrorPattern: 'exile as identity',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q3',
    section: 6,
    questionNumber: 3,
    invitationText: 'In your body, the feeling of being "seen" registers as…',
    guidanceNote: 'This isn\'t about what you\'ve experienced. This is about what your body remembers or yearns for.',
    answers: [
      {
        code: 'A',
        text: 'A warm expansion—like a door opening inward',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'received recognition',
        mirrorPattern: 'safe visibility',
        siCode: 'RF-3'
      },
      {
        code: 'B',
        text: 'A nervous thrill—exciting and terrifying at once',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'visibility as risk',
        mirrorPattern: 'cautious emergence',
        siCode: 'PF-3'
      },
      {
        code: 'C',
        text: 'A contraction—like I\'m being examined and might be found wanting',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Fault-Bearer',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'judgment internalized',
        mirrorPattern: 'scrutiny as verdict',
        siCode: 'FB-1'
      },
      {
        code: 'D',
        text: 'Discomfort—I don\'t want to be seen. It feels unsafe or intrusive',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'protective invisibility',
        mirrorPattern: 'hidden as defended',
        siCode: 'GM-1'
      },
      {
        code: 'E',
        text: 'Nothing. Numbness. Or like it doesn\'t apply to me',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'perception disconnection',
        mirrorPattern: 'unseen as erased',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q4',
    section: 6,
    questionNumber: 4,
    invitationText: 'The image of "the flame within" speaks to you as…',
    guidanceNote: 'What does this image evoke? Presence? Memory? Longing? Doubt?',
    answers: [
      {
        code: 'A',
        text: 'A living, steady heat I can trust and tend',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'inner authority embodied',
        mirrorPattern: 'agency as truth',
        siCode: 'LF-1'
      },
      {
        code: 'B',
        text: 'Something I\'m learning to trust, after years of doubt',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'reclamation in progress',
        mirrorPattern: 'slow rekindling',
        siCode: 'EM-2'
      },
      {
        code: 'C',
        text: 'A spark I\'m terrified of—it might hurt me or others',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'power as danger',
        mirrorPattern: 'suppression as control',
        siCode: 'BF-3'
      },
      {
        code: 'D',
        text: 'An old myth—inspiring, but not real or achievable for me',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'transcendence denied',
        mirrorPattern: 'idealism as distance',
        siCode: 'RP-2'
      },
      {
        code: 'E',
        text: 'A metaphor for something that died in me long ago',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'extinguished essence',
        mirrorPattern: 'grief as permanence',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q5',
    section: 6,
    questionNumber: 5,
    invitationText: 'When you think of your "shadow," you sense…',
    guidanceNote: 'Not what you\'ve been taught. What you actually feel when you turn toward your own darkness.',
    answers: [
      {
        code: 'A',
        text: 'A teacher—dark gifts and truths I\'ve integrated',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'wholeness through integration',
        mirrorPattern: 'darkness as wisdom',
        siCode: 'AC-5'
      },
      {
        code: 'B',
        text: 'An invitation I\'m slowly accepting, with curiosity',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Integration',
        woundImprint: 'shadow-integration beginning',
        mirrorPattern: 'dialogue emerging',
        siCode: 'SV-2'
      },
      {
        code: 'C',
        text: 'Something dangerous that I must control or hide',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Shielded One',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'disowned power',
        mirrorPattern: 'split as survival',
        siCode: 'SO-2'
      },
      {
        code: 'D',
        text: 'A concept I don\'t relate to—I\'m just trying to be good',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'repression as morality',
        mirrorPattern: 'compliance as identity',
        siCode: 'PF-5'
      },
      {
        code: 'E',
        text: 'A void—I don\'t know if I have a shadow or I am one',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'self-fragmentation',
        mirrorPattern: 'no safe self',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q6',
    section: 6,
    questionNumber: 6,
    invitationText: 'The archetype that most frightens you is…',
    guidanceNote: 'Not which one you dislike. Which one makes you feel most unsafe or exposed?',
    answers: [
      {
        code: 'A',
        text: 'The one who speaks her truth unapologetically',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'voice reclamation needed',
        mirrorPattern: 'permission gap',
        siCode: 'LF-6'
      },
      {
        code: 'B',
        text: 'The one who sets boundaries and says no',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'boundary-fear core',
        mirrorPattern: 'refusal as betrayal',
        siCode: 'PF-6'
      },
      {
        code: 'C',
        text: 'The one who trusts herself more than others\' opinions',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'authority delegation',
        mirrorPattern: 'external permission sought',
        siCode: 'PF-6b'
      },
      {
        code: 'D',
        text: 'The one who is visible, known, and vulnerable',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Shielded One',
        woundImprint: 'exposure-terror',
        mirrorPattern: 'visibility as danger',
        siCode: 'GM-6'
      },
      {
        code: 'E',
        text: 'Any archetype that requires hope or belief in herself',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'self-belief annihilated',
        mirrorPattern: 'cynicism as survival',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q7',
    section: 6,
    questionNumber: 7,
    invitationText: 'In moments when you feel most alive, you\'re being…',
    guidanceNote: 'Not who you think you should be. Who are you when you\'re not trying?',
    answers: [
      {
        code: 'A',
        text: 'Fully yourself—creative, honest, present',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'authentic presence',
        mirrorPattern: 'being as being',
        siCode: 'LF-7'
      },
      {
        code: 'B',
        text: 'Someone others need or appreciate—finally useful',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'utility-based worth',
        mirrorPattern: 'doing over being',
        siCode: 'PF-7'
      },
      {
        code: 'C',
        text: 'A version of myself that\'s acceptable—small, safe, controlled',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Silent Flame',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'contraction as safety',
        mirrorPattern: 'smallness as shield',
        siCode: 'SF-7'
      },
      {
        code: 'D',
        text: 'Rational, clear-minded, untethered from emotion',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'mind-body dissociation',
        mirrorPattern: 'intellect as escape',
        siCode: 'RP-7'
      },
      {
        code: 'E',
        text: 'I\'m not sure I know who that is anymore',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'self-loss',
        mirrorPattern: 'aliveness unfamiliar',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q8',
    section: 6,
    questionNumber: 8,
    invitationText: 'When you imagine stepping into your fullest potential, you feel…',
    guidanceNote: 'Not logically possible or realistic. What does your soul feel?',
    answers: [
      {
        code: 'A',
        text: 'Recognition—this is who I\'ve always been beneath the surface',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'remembrance',
        mirrorPattern: 'return to wholeness',
        siCode: 'SV-8'
      },
      {
        code: 'B',
        text: 'Hope tinged with doubt—maybe possible, if I do it right',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'cautious awakening',
        mirrorPattern: 'belief building',
        siCode: 'EM-8'
      },
      {
        code: 'C',
        text: 'Fear—that kind of power is dangerous, and I\'d hurt someone',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'responsibility-terror',
        mirrorPattern: 'power as peril',
        siCode: 'BF-8'
      },
      {
        code: 'D',
        text: 'Dissonance—it doesn\'t feel authentic or achievable',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'possibility-denial',
        mirrorPattern: 'transcendence as illusion',
        siCode: 'RP-8'
      },
      {
        code: 'E',
        text: 'Nothing. The concept doesn\'t land for me',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'aspiration annihilated',
        mirrorPattern: 'potential as untrue',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q9',
    section: 6,
    questionNumber: 9,
    invitationText: 'The word "reclamation" makes you think of…',
    guidanceNote: 'What does it stir in you—desire, skepticism, longing, fear, numbness?',
    answers: [
      {
        code: 'A',
        text: 'Retrieving what was always mine, buried beneath the noise',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'retrieval of agency',
        mirrorPattern: 'sacred return',
        siCode: 'AC-9'
      },
      {
        code: 'B',
        text: 'A journey I\'m beginning—tentative, but real',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'awakening emergence',
        mirrorPattern: 'becoming conscious',
        siCode: 'EM-9'
      },
      {
        code: 'C',
        text: 'Something impossible—you can\'t get back what\'s gone',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Fault-Bearer',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'permanence of loss',
        mirrorPattern: 'grief as fate',
        siCode: 'FB-9'
      },
      {
        code: 'D',
        text: 'A nice idea, but not practical for someone like me',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'pragmatism-as-despair',
        mirrorPattern: 'realism as limitation',
        siCode: 'RP-9'
      },
      {
        code: 'E',
        text: 'Empty words that don\'t touch what\'s actually broken',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'cynicism-protection',
        mirrorPattern: 'language as inadequate',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q10',
    section: 6,
    questionNumber: 10,
    invitationText: 'If you could describe your relationship to your own power in one image, it would be…',
    guidanceNote: 'Don\'t think. What image rises?',
    answers: [
      {
        code: 'A',
        text: 'A river flowing—constant, clear, alive',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'authority-as-flow',
        mirrorPattern: 'natural expression',
        siCode: 'LF-10'
      },
      {
        code: 'B',
        text: 'An ember I\'m learning to coax back to fire',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'rekindling agency',
        mirrorPattern: 'slow resurrection',
        siCode: 'EM-10'
      },
      {
        code: 'C',
        text: 'A caged bird—it wants to fly, but I\'m afraid to let it',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'self-imprisonment',
        mirrorPattern: 'containment as control',
        siCode: 'BF-10'
      },
      {
        code: 'D',
        text: 'A machine I operate according to external rules',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'tool-like disconnection',
        mirrorPattern: 'mechanism over meaning',
        siCode: 'RP-10'
      },
      {
        code: 'E',
        text: 'A void or absence—I\'m not sure I have power',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'agency-erasure',
        mirrorPattern: 'powerlessness-core',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D5Q11',
    section: 6,
    questionNumber: 11,
    invitationText: 'The archetype you most want to become is…',
    guidanceNote: 'Not who you think you should be. Who does your soul reach toward?',
    answers: [
      {
        code: 'A',
        text: 'The one who is whole, grounded, and fully alive',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'integration-aspiration',
        mirrorPattern: 'wholeness-seeking',
        siCode: 'RF-11'
      },
      {
        code: 'B',
        text: 'The one who speaks her truth with love and clarity',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'voice-reclamation-desired',
        mirrorPattern: 'authentic-becoming',
        siCode: 'AC-11'
      },
      {
        code: 'C',
        text: 'The one who is free from guilt and obligation',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'freedom-longing',
        mirrorPattern: 'liberation-dream',
        siCode: 'PF-11'
      },
      {
        code: 'D',
        text: 'The one who understands herself and isn\'t afraid',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'understanding-need',
        mirrorPattern: 'courage-seeking',
        siCode: 'GM-11'
      },
      {
        code: 'E',
        text: 'I don\'t know—or it feels too far away to imagine',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'vision-absence',
        mirrorPattern: 'becoming-unimaginable',
        siCode: null
      }
    ],
    isGhost: false
  }
];

// ============================================================================
// DOMAIN 6: CYCLIC INTELLIGENCE INDICATORS (Section 7: Somatic Embodiment)
// ============================================================================

export const DOMAIN_6_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'D6Q1',
    section: 7,
    questionNumber: 1,
    invitationText: 'My body\'s rhythms feel…',
    guidanceNote: 'Not what you know about cycles. What your body actually tells you. Not hormones or periods—the felt sense.',
    answers: [
      {
        code: 'A',
        text: 'Like a trusted language I can read and honor',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'somatic wisdom',
        mirrorPattern: 'body-as-teacher',
        siCode: 'RF-1C'
      },
      {
        code: 'B',
        text: 'Real, but still learning to understand them',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'embodied-learning',
        mirrorPattern: 'somatic-awakening',
        siCode: 'EM-1C'
      },
      {
        code: 'C',
        text: 'Like noise I have to push through or manage',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'body-denial',
        mirrorPattern: 'somatic-resistance',
        siCode: 'RP-1C'
      },
      {
        code: 'D',
        text: 'Mostly disconnected—I don\'t really feel my body\'s signals',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'somatic-dissociation',
        mirrorPattern: 'body-absence',
        siCode: 'SD-1C'
      },
      {
        code: 'E',
        text: 'Chaotic and unreliable—nothing I can count on',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'embodied-chaos',
        mirrorPattern: 'body-as-unreliable',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q2',
    section: 7,
    questionNumber: 2,
    invitationText: 'When your energy shifts (whether monthly or throughout a cycle), you typically…',
    guidanceNote: 'Does your body communicate phase changes? Ignore what "should" happen.',
    answers: [
      {
        code: 'A',
        text: 'Notice clearly and adjust your activities accordingly',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'cyclic-attunement',
        mirrorPattern: 'phase-awareness',
        siCode: 'RF-2C'
      },
      {
        code: 'B',
        text: 'Notice, but feel conflicted about honoring the shift',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'cyclic-permission-gap',
        mirrorPattern: 'awareness-without-agency',
        siCode: 'PF-2C'
      },
      {
        code: 'C',
        text: 'Ignore or push through it—my body shouldn\'t control my schedule',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'cyclic-denial',
        mirrorPattern: 'body-overridden',
        siCode: 'RP-2C'
      },
      {
        code: 'D',
        text: 'Don\'t really notice unless I actively track it',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'cyclic-invisibility',
        mirrorPattern: 'rhythm-unmapped',
        siCode: 'SD-2C'
      },
      {
        code: 'E',
        text: 'My rhythms are too chaotic or irregular to predict',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'embodied-dysregulation',
        mirrorPattern: 'body-as-enemy',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q3',
    section: 7,
    questionNumber: 3,
    invitationText: 'The feeling of your luteal phase (second half of cycle if menstruating) is…',
    guidanceNote: 'If you menstruate, this is the phase before your period. What does your body feel like then? If you don\'t, respond to what you know or sense.',
    answers: [
      {
        code: 'A',
        text: 'A time of deep wisdom and clarity—I can see what needs attention',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Luminous Witness',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'luteal-wisdom',
        mirrorPattern: 'inward-clarity',
        siCode: 'LW-3C'
      },
      {
        code: 'B',
        text: 'Quieter and more reflective, if I\'m allowed to slow down',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'luteal-permission-seeking',
        mirrorPattern: 'stillness-as-gift',
        siCode: 'EM-3C'
      },
      {
        code: 'C',
        text: 'A struggle—everything feels heavier, and I don\'t understand why',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'luteal-burden',
        mirrorPattern: 'weight-without-meaning',
        siCode: 'BF-3C'
      },
      {
        code: 'D',
        text: 'I don\'t really distinguish it—it\'s just another week',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'luteal-invisibility',
        mirrorPattern: 'undifferentiated-time',
        siCode: 'RP-3C'
      },
      {
        code: 'E',
        text: 'Dysphoric or chaotic—a time I\'d rather skip',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'luteal-dysregulation',
        mirrorPattern: 'body-as-enemy',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q4',
    section: 7,
    questionNumber: 4,
    invitationText: 'When you feel the impulse to rest or go inward, you typically…',
    guidanceNote: 'How do you respond to your body\'s need for slowness?',
    answers: [
      {
        code: 'A',
        text: 'Honor it—rest is part of my rhythm, and I trust it',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'rest-as-sacred',
        mirrorPattern: 'fallow-honored',
        siCode: 'RF-4C'
      },
      {
        code: 'B',
        text: 'Try to honor it, but feel guilty if I\'m not "productive"',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'rest-guilt',
        mirrorPattern: 'productivity-prison',
        siCode: 'PF-4C'
      },
      {
        code: 'C',
        text: 'Push through it—there\'s too much to do',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'forced-perpetuation',
        mirrorPattern: 'burnout-spiral',
        siCode: 'BF-4C'
      },
      {
        code: 'D',
        text: 'Don\'t really feel the impulse—I function the same most days',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'rest-invisibility',
        mirrorPattern: 'flatline-functioning',
        siCode: 'SD-4C'
      },
      {
        code: 'E',
        text: 'Can\'t rest—my system won\'t let me',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'embodied-hypervigilance',
        mirrorPattern: 'rest-forbidden',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q5',
    section: 7,
    questionNumber: 5,
    invitationText: 'Your experience of pleasure (in any form) is…',
    guidanceNote: 'Movement, sensation, touch, taste, creation—what\'s your relationship with pleasure?',
    answers: [
      {
        code: 'A',
        text: 'Something I can fully receive and enjoy without guilt',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'pleasure-reclaimed',
        mirrorPattern: 'joy-without-cost',
        siCode: 'LF-5C'
      },
      {
        code: 'B',
        text: 'Something I\'m learning to allow myself',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'pleasure-permission',
        mirrorPattern: 'slow-thawing',
        siCode: 'EM-5C'
      },
      {
        code: 'C',
        text: 'Suspect—I feel guilty when I enjoy things',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'pleasure-shame',
        mirrorPattern: 'joy-as-sin',
        siCode: 'PF-5C'
      },
      {
        code: 'D',
        text: 'Mostly numb or distant—I can engage but not really feel it',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'pleasure-disconnection',
        mirrorPattern: 'anhedonia',
        siCode: 'SD-5C'
      },
      {
        code: 'E',
        text: 'Not for people like me—pleasure isn\'t available',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'pleasure-denied',
        mirrorPattern: 'unworthiness-core',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q6',
    section: 7,
    questionNumber: 6,
    invitationText: 'When you notice a seasonal shift (spring emerging, winter approaching), you feel…',
    guidanceNote: 'How does your body respond to the turning year? Not cognitively—somatically.',
    answers: [
      {
        code: 'A',
        text: 'Alive—each season brings different energy that I can dance with',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'seasonal-attunement',
        mirrorPattern: 'year-rhythm-embraced',
        siCode: 'RF-6C'
      },
      {
        code: 'B',
        text: 'Subtle shifts I notice more when I pay attention',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'seasonal-awareness-building',
        mirrorPattern: 'subtle-perception',
        siCode: 'EM-6C'
      },
      {
        code: 'C',
        text: 'Affected, but I push the same pace regardless',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'seasonal-denial',
        mirrorPattern: 'constant-velocity',
        siCode: 'RP-6C'
      },
      {
        code: 'D',
        text: 'Mostly the same—I function without regard to seasons',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'seasonal-invisibility',
        mirrorPattern: 'climate-blind',
        siCode: 'SD-6C'
      },
      {
        code: 'E',
        text: 'Chaos—seasonal changes destabilize me',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'seasonal-dysregulation',
        mirrorPattern: 'time-as-threat',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q7',
    section: 7,
    questionNumber: 7,
    invitationText: 'Your relationship to your menstrual cycle (if you menstruate) feels…',
    guidanceNote: 'Not the medical experience—the felt sense. Honored? Cursed? Invisible? Dysregulated?',
    answers: [
      {
        code: 'A',
        text: 'Sacred—a visible marker of my aliveness and power',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'menstrual-reclamation',
        mirrorPattern: 'cycle-as-gift',
        siCode: 'LF-7C'
      },
      {
        code: 'B',
        text: 'Ambivalent—neutral or mildly positive, when not dysphoric',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'menstrual-neutrality',
        mirrorPattern: 'acceptance-building',
        siCode: 'EM-7C'
      },
      {
        code: 'C',
        text: 'A nuisance—something to manage so it doesn\'t interfere',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'menstrual-denial',
        mirrorPattern: 'cycle-as-obstacle',
        siCode: 'RP-7C'
      },
      {
        code: 'D',
        text: 'Dysphoric or dysregulated—unpredictable and distressing',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'menstrual-dysregulation',
        mirrorPattern: 'body-as-enemy',
        siCode: 'SD-7C'
      },
      {
        code: 'E',
        text: 'Absent or so distant I don\'t feel connected to it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'cycle-erasure',
        mirrorPattern: 'separation-from-body',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q8',
    section: 7,
    questionNumber: 8,
    invitationText: 'When your nervous system is activated (stressed, triggered, or threatened), you typically…',
    guidanceNote: 'Not how you think you should respond. How does your body actually respond?',
    answers: [
      {
        code: 'A',
        text: 'Feel it, process it, and move through it with awareness',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'nervous-system-literacy',
        mirrorPattern: 'activation-as-information',
        siCode: 'RF-8C'
      },
      {
        code: 'B',
        text: 'Feel it and have some tools to help regulate',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'regulation-learning',
        mirrorPattern: 'skill-building',
        siCode: 'EM-8C'
      },
      {
        code: 'C',
        text: 'Become overwhelmed or stuck in the activation',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'nervous-system-dysregulation',
        mirrorPattern: 'activation-as-threat',
        siCode: 'BF-8C'
      },
      {
        code: 'D',
        text: 'Numb out or dissociate—check out rather than feel it',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'somatic-dissociation',
        mirrorPattern: 'escape-as-survival',
        siCode: 'SD-8C'
      },
      {
        code: 'E',
        text: 'Can\'t come down—once triggered, I stay in crisis',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'nervous-system-trauma',
        mirrorPattern: 'activation-as-permanence',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q9',
    section: 7,
    questionNumber: 9,
    invitationText: 'Your body\'s capacity to know what it needs (rest, movement, nourishment, touch) is…',
    guidanceNote: 'Does your body have wisdom? Can you hear it?',
    answers: [
      {
        code: 'A',
        text: 'Clear and trustworthy—I check in and follow what it tells me',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'somatic-trust',
        mirrorPattern: 'body-as-guide',
        siCode: 'LF-9C'
      },
      {
        code: 'B',
        text: 'Awakening—I\'m learning to listen and honor it',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'embodied-awakening',
        mirrorPattern: 'listening-learning',
        siCode: 'EM-9C'
      },
      {
        code: 'C',
        text: 'Confused—I feel many things but don\'t know which to trust',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'somatic-confusion',
        mirrorPattern: 'noise-without-signal',
        siCode: 'DR-9C'
      },
      {
        code: 'D',
        text: 'Mostly silent—I don\'t hear clear signals from my body',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Spirit-Dimmed',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'somatic-silence',
        mirrorPattern: 'body-as-absent',
        siCode: 'SD-9C'
      },
      {
        code: 'E',
        text: 'Unreliable or unsafe—I don\'t trust it to tell me the truth',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'body-mistrust',
        mirrorPattern: 'embodied-betrayal',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q10',
    section: 7,
    questionNumber: 10,
    invitationText: 'The idea of "honoring your cycle" feels…',
    guidanceNote: 'Sacred practice? Impossible luxury? Privilege? Nonsense?',
    answers: [
      {
        code: 'A',
        text: 'Real and possible—I build my life around my rhythm',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'cycle-honored',
        mirrorPattern: 'life-rhythm-aligned',
        siCode: 'RF-10C'
      },
      {
        code: 'B',
        text: 'Aspirational—I\'m moving toward it slowly',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'cycle-honoring-emerging',
        mirrorPattern: 'permission-building',
        siCode: 'EM-10C'
      },
      {
        code: 'C',
        text: 'Impossible—my responsibilities won\'t allow it',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'cycle-impossible',
        mirrorPattern: 'duty-as-prison',
        siCode: 'BF-10C'
      },
      {
        code: 'D',
        text: 'Nice idea, but not practical or realistic',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'cycle-denial',
        mirrorPattern: 'pragmatism-as-limitation',
        siCode: 'RP-10C'
      },
      {
        code: 'E',
        text: 'Meaningless—my body isn\'t trustworthy enough to build around',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'body-untrustworthiness',
        mirrorPattern: 'embodied-despair',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D6Q11',
    section: 7,
    questionNumber: 11,
    invitationText: 'If you could describe your somatic state—the felt sense of living in your body—it would be…',
    guidanceNote: 'Home? Prison? Stranger? Ghost? Alive?',
    answers: [
      {
        code: 'A',
        text: 'Home—a place I inhabit with awareness and ease',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'embodied-home',
        mirrorPattern: 'inhabitation',
        siCode: 'LF-11C'
      },
      {
        code: 'B',
        text: 'Increasingly familiar—I\'m coming back to it',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'embodied-return',
        mirrorPattern: 'homecoming',
        siCode: 'EM-11C'
      },
      {
        code: 'C',
        text: 'A vehicle I move through, but don\'t really inhabit',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'somatic-externality',
        mirrorPattern: 'observer-mode',
        siCode: 'RP-11C'
      },
      {
        code: 'D',
        text: 'Unsafe—a place I need protection from',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Shielded One',
        woundImprint: 'body-as-threat',
        mirrorPattern: 'somatic-danger',
        siCode: 'GM-11C'
      },
      {
        code: 'E',
        text: 'Foreign—like I\'m haunting my own body',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'complete-dissociation',
        mirrorPattern: 'haunting',
        siCode: null
      }
    ],
    isGhost: false
  }
];

// ============================================================================
// DOMAIN 7: GOALS + SUPPORT STYLE (Section 9: Money Survival)
// ============================================================================

export const DOMAIN_7_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'D7Q1',
    section: 9,
    questionNumber: 1,
    invitationText: 'What I most want to move toward in the next phase is…',
    guidanceNote: 'Select the one that makes your soul lean forward. Just one.',
    answers: [
      {
        code: 'A',
        text: 'Finding and speaking my authentic voice',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'voice-reclamation',
        mirrorPattern: 'authentic-expression',
        siCode: 'VR-1'
      },
      {
        code: 'B',
        text: 'Healing relational wounds and learning to receive love',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'relational-repair',
        mirrorPattern: 'belonging-restoration',
        siCode: 'RH-1'
      },
      {
        code: 'C',
        text: 'Regulating my nervous system and feeling safe in my body',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'nervous-system-regulation',
        mirrorPattern: 'somatic-safety',
        siCode: 'NSR-1'
      },
      {
        code: 'D',
        text: 'Understanding and integrating my shadow and archetypes',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'archetypal-integration',
        mirrorPattern: 'wholeness-assembly',
        siCode: 'AI-1'
      },
      {
        code: 'E',
        text: 'Aligning with my natural cycles and reclaiming my body\'s wisdom',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'cyclic-alignment',
        mirrorPattern: 'rhythm-honoring',
        siCode: 'CA-1'
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q2',
    section: 9,
    questionNumber: 2,
    invitationText: 'A second goal that calls to you is…',
    guidanceNote: 'What else? If you could transform one thing, what would it be?',
    answers: [
      {
        code: 'A',
        text: 'Reconnecting with purpose and activating my gifts',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'purpose-activation',
        mirrorPattern: 'gift-expression',
        siCode: 'PA-2'
      },
      {
        code: 'B',
        text: 'Inhabiting my body with presence and aliveness',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'somatic-embodiment',
        mirrorPattern: 'body-presence',
        siCode: 'SE-2'
      },
      {
        code: 'C',
        text: 'Spiritual reconnection and deeper soul knowing',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'spiritual-rekindling',
        mirrorPattern: 'sacred-return',
        siCode: 'SR-2'
      },
      {
        code: 'D',
        text: 'Building confidence and trust in my own knowing',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'inner-authority',
        mirrorPattern: 'self-trust-building',
        siCode: 'ITA-2'
      },
      {
        code: 'E',
        text: 'Anything that gets me out of survival mode',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'survival-transcendence',
        mirrorPattern: 'respiration',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q3',
    section: 9,
    questionNumber: 3,
    invitationText: 'The way I learn best is…',
    guidanceNote: 'Not what you think is "proper" learning. How does *your* soul integrate knowledge?',
    answers: [
      {
        code: 'A',
        text: 'Self-paced and self-directed—I trust my own rhythm',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'autonomous-learning',
        mirrorPattern: 'self-led',
        siCode: 'SLP-3'
      },
      {
        code: 'B',
        text: 'With guided support—someone to hold the frame while I explore',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'guided-safety',
        mirrorPattern: 'supported-discovery',
        siCode: 'GS-3'
      },
      {
        code: 'C',
        text: 'In community—I need witnesses and reflection from others',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'collective-wisdom',
        mirrorPattern: 'shared-journey',
        siCode: 'CM-3'
      },
      {
        code: 'D',
        text: 'A mix—I need structure, support, and some autonomy',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Ember',
        woundImprint: 'balanced-learning',
        mirrorPattern: 'integration-model',
        siCode: 'MX-3'
      },
      {
        code: 'E',
        text: 'I\'m not sure I can learn—my nervous system might not allow it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'learning-terror',
        mirrorPattern: 'capacity-doubt',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q4',
    section: 9,
    questionNumber: 4,
    invitationText: 'The depth of work I\'m ready for is…',
    guidanceNote: 'Honest assessment. Not what you think you *should* do, but what feels true.',
    answers: [
      {
        code: 'A',
        text: 'Exploratory—gentle, curious, no pressure',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'gentle-inquiry',
        mirrorPattern: 'soft-opening',
        siCode: 'EX-4'
      },
      {
        code: 'B',
        text: 'Structured—clear practices and frameworks to follow',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'structured-safety',
        mirrorPattern: 'mapped-terrain',
        siCode: 'ST-4'
      },
      {
        code: 'C',
        text: 'Intensive—I\'m ready to go deep and do the work',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'deep-transformation',
        mirrorPattern: 'radical-honesty',
        siCode: 'IN-4'
      },
      {
        code: 'D',
        text: 'Somatic-first—I need my nervous system resourced before going deeper',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'somatic-foundation',
        mirrorPattern: 'bottom-up-healing',
        siCode: 'SM-4'
      },
      {
        code: 'E',
        text: 'I don\'t know—I\'m overwhelmed just thinking about it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'overwhelm-state',
        mirrorPattern: 'capacity-unknown',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q5',
    section: 9,
    questionNumber: 5,
    invitationText: 'My current time and energy capacity for this work is…',
    guidanceNote: 'Real honest assessment. Not aspirational.',
    answers: [
      {
        code: 'A',
        text: 'Light commitment—15-30 minutes weekly, gentle integration',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'minimal-capacity',
        mirrorPattern: 'time-scarcity',
        siCode: 'LT-5'
      },
      {
        code: 'B',
        text: 'Moderate—1-2 hours weekly, consistent practice',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'sustainable-engagement',
        mirrorPattern: 'regular-commitment',
        siCode: 'MD-5'
      },
      {
        code: 'C',
        text: 'Deep commitment—3+ hours weekly, immersive work',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'full-devotion',
        mirrorPattern: 'radical-commitment',
        siCode: 'DC-5'
      },
      {
        code: 'D',
        text: 'Variable—depends on what\'s happening in my life',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'flexible-capacity',
        mirrorPattern: 'condition-dependent',
        siCode: 'VR-5'
      },
      {
        code: 'E',
        text: 'I\'m at capacity limit—adding anything feels impossible',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'burnout-state',
        mirrorPattern: 'collapse-imminent',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q6',
    section: 9,
    questionNumber: 6,
    invitationText: 'The support style that resonates most deeply with you is…',
    guidanceNote: 'What kind of presence helps you open? Reflective? Directive? Somatic? Creative?',
    answers: [
      {
        code: 'A',
        text: 'Reflective—someone who mirrors back what they see',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Luminous Witness',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'witnessing-healing',
        mirrorPattern: 'seen-by-other',
        siCode: 'REF-6'
      },
      {
        code: 'B',
        text: 'Directive—clear guidance and permission to follow',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'external-direction',
        mirrorPattern: 'authority-needed',
        siCode: 'DIR-6'
      },
      {
        code: 'C',
        text: 'Somatic—presence that helps me feel safe in my body',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'embodied-safety',
        mirrorPattern: 'nervous-system-attunement',
        siCode: 'SOM-6'
      },
      {
        code: 'D',
        text: 'Intellectual—someone who can explain the "why" clearly',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'understanding-needed',
        mirrorPattern: 'sense-making',
        siCode: 'INT-6'
      },
      {
        code: 'E',
        text: 'Creative—through art, movement, metaphor, not just words',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'creative-expression',
        mirrorPattern: 'symbolic-wisdom',
        siCode: 'CRE-6'
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q7',
    section: 9,
    questionNumber: 7,
    invitationText: 'My biggest fear about this work is…',
    guidanceNote: 'What rises when you think about transformation?',
    answers: [
      {
        code: 'A',
        text: 'That I\'ll hurt others with my authenticity',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'relational-harm-fear',
        mirrorPattern: 'responsibility-terror',
        siCode: 'OTH-7'
      },
      {
        code: 'B',
        text: 'That nothing will change and I\'ll still be stuck',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'change-hopelessness',
        mirrorPattern: 'stagnation-fatalism',
        siCode: 'NCH-7'
      },
      {
        code: 'C',
        text: 'That I\'ll discover something in myself I can\'t handle',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Shielded One',
        woundImprint: 'self-discovery-terror',
        mirrorPattern: 'shadow-fear',
        siCode: 'DIS-7'
      },
      {
        code: 'D',
        text: 'That it will require things I can\'t give right now',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Burdened Flame',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'capacity-mismatch',
        mirrorPattern: 'expectation-dread',
        siCode: 'CAP-7'
      },
      {
        code: 'E',
        text: 'That I\'ll fail or be judged for not doing it "right"',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Fault-Bearer',
        secondaryArchetype: 'The Pleaser Flame',
        woundImprint: 'perfectionism-fear',
        mirrorPattern: 'judgment-terror',
        siCode: 'FAL-7'
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q8',
    section: 9,
    questionNumber: 8,
    invitationText: 'What would help you feel most resourced as you move forward?',
    guidanceNote: 'What do you need? Permission? Witnesses? Structure? Softness?',
    answers: [
      {
        code: 'A',
        text: 'Clear permission to prioritize myself',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'self-permission',
        mirrorPattern: 'priority-authorization',
        siCode: 'PRM-8'
      },
      {
        code: 'B',
        text: 'Community—other women on this journey',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'belonging-activation',
        mirrorPattern: 'collective-safety',
        siCode: 'COM-8'
      },
      {
        code: 'C',
        text: 'Consistent, attuned presence and accountability',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'relational-stability',
        mirrorPattern: 'reliable-witness',
        siCode: 'ACC-8'
      },
      {
        code: 'D',
        text: 'Practical tools and practices I can use daily',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Ember',
        woundImprint: 'applied-practice',
        mirrorPattern: 'tangible-support',
        siCode: 'PRC-8'
      },
      {
        code: 'E',
        text: 'Radical acceptance that where I am is enough',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'self-acceptance',
        mirrorPattern: 'enoughness',
        siCode: 'ACC-8b'
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q9',
    section: 9,
    questionNumber: 9,
    invitationText: 'When you imagine yourself 6-12 months into this work, you see…',
    guidanceNote: 'Not logically achievable. What does your soul envision?',
    answers: [
      {
        code: 'A',
        text: 'Myself more embodied, alive, and present',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'embodied-transformation',
        mirrorPattern: 'aliveness-return',
        siCode: 'EMB-9'
      },
      {
        code: 'B',
        text: 'Myself speaking more truth and setting clearer boundaries',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'voice-activation',
        mirrorPattern: 'authentic-standing',
        siCode: 'VOI-9'
      },
      {
        code: 'C',
        text: 'Myself with less shame and more self-compassion',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'shame-release',
        mirrorPattern: 'kindness-toward-self',
        siCode: 'SHA-9'
      },
      {
        code: 'D',
        text: 'Myself making choices from my own knowing, not others\' rules',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'authority-reclamation',
        mirrorPattern: 'self-directed',
        siCode: 'CHO-9'
      },
      {
        code: 'E',
        text: 'I\'m afraid to hope—I can\'t picture it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'hope-deficit',
        mirrorPattern: 'future-unavailable',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q10',
    section: 9,
    questionNumber: 10,
    invitationText: 'The single most important thing that would move you forward is…',
    guidanceNote: 'If you could have one thing, what would it be?',
    answers: [
      {
        code: 'A',
        text: 'Feeling safe enough to stop performing and controlling',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'safety-foundation',
        mirrorPattern: 'trust-emergence',
        siCode: 'SAF-10'
      },
      {
        code: 'B',
        text: 'Having someone who believes in me when I don\'t',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'mirrored-belief',
        mirrorPattern: 'witnessing-healing',
        siCode: 'BEL-10'
      },
      {
        code: 'C',
        text: 'Permission to want things, rest, and take up space',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'desire-legitimacy',
        mirrorPattern: 'right-to-exist',
        siCode: 'PRM-10'
      },
      {
        code: 'D',
        text: 'Understanding the "why" behind my patterns',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'pattern-literacy',
        mirrorPattern: 'sense-making',
        siCode: 'WHY-10'
      },
      {
        code: 'E',
        text: 'Relief from the constant activation and terror',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Burdened Flame',
        woundImprint: 'nervous-system-relief',
        mirrorPattern: 'rest-availability',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D7Q11',
    section: 9,
    questionNumber: 11,
    invitationText: 'If there\'s one thing you want your guide(s) to know about you, it\'s…',
    guidanceNote: 'What\'s important for them to understand?',
    answers: [
      {
        code: 'A',
        text: 'I\'m tougher than I look, and I\'m ready to work',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'strength-recognition',
        mirrorPattern: 'capacity-known',
        siCode: 'STR-11'
      },
      {
        code: 'B',
        text: 'I\'m fragile right now and need gentleness first',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'vulnerability-honesty',
        mirrorPattern: 'fragility-respected',
        siCode: 'GEN-11'
      },
      {
        code: 'C',
        text: 'I\'m terrified but I\'m here—please don\'t give up on me',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Pleaser Flame',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'abandonment-fear',
        mirrorPattern: 'steady-presence-needed',
        siCode: 'TER-11'
      },
      {
        code: 'D',
        text: 'I need evidence and clarity to trust the process',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Rational Pilgrim',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'proof-requirement',
        mirrorPattern: 'earned-trust',
        siCode: 'EVD-11'
      },
      {
        code: 'E',
        text: 'I\'m not sure I deserve this help, but I need it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'unworthiness-core',
        mirrorPattern: 'grace-needed',
        siCode: null
      }
    ],
    isGhost: false
  }
];

// ============================================================================
// DOMAIN 8: CODEX PHASE SELF-PLACEMENT
// ============================================================================

export interface CodexPhase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  keywords: string[];
}

export const CODEX_PHASES: CodexPhase[] = [
  {
    phaseNumber: 1,
    phaseName: 'The Threshold',
    description: 'Standing at the edge, not yet entered. The before moment. Aware something needs to change, but not yet stepping through.',
    keywords: ['hesitation', 'longing', 'edge', 'not-yet', 'sensing', 'waiting']
  },
  {
    phaseNumber: 2,
    phaseName: 'The Descent',
    description: 'Going inward, meeting the shadow. The dark passage. Encountering what\'s been hidden, denied, or forgotten.',
    keywords: ['inward', 'shadow', 'darkness', 'meeting', 'difficult', 'confronting']
  },
  {
    phaseNumber: 3,
    phaseName: 'The Naming',
    description: 'Identifying patterns, wounds, archetypes. Calling things by their true names. Recognition and language.',
    keywords: ['patterns', 'wounds', 'archetypes', 'recognition', 'truth-telling', 'language']
  },
  {
    phaseNumber: 4,
    phaseName: 'The Mirror',
    description: 'Seeing clearly what has been hidden. Reflection and revelation. The truth becomes undeniable.',
    keywords: ['clarity', 'reflection', 'seeing', 'truth', 'undeniable', 'witnessing']
  },
  {
    phaseNumber: 5,
    phaseName: 'The Void',
    description: 'The space between old and new. The dissolution before rebirth. Nothing left to hold onto, but new hasn\'t formed yet.',
    keywords: ['emptiness', 'dissolution', 'between', 'not-knowing', 'surrender', 'space']
  },
  {
    phaseNumber: 6,
    phaseName: 'The Ember',
    description: 'First stirrings of reclamation. Heat beneath the ash. The return of life force, tentative and tender.',
    keywords: ['awakening', 'stirring', 'heat', 'return', 'tender', 'rekindling']
  },
  {
    phaseNumber: 7,
    phaseName: 'The Integration',
    description: 'Weaving shadow and gift together. Holding both darkness and light. The becoming whole.',
    keywords: ['wholeness', 'weaving', 'both-and', 'holding', 'integration', 'synthesis']
  },
  {
    phaseNumber: 8,
    phaseName: 'The Embodiment',
    description: 'Living the reclaimed self. Walking as the integrated woman. Made visible and real in the world.',
    keywords: ['living', 'embodied', 'present', 'real', 'visible', 'authentic']
  },
  {
    phaseNumber: 9,
    phaseName: 'The Offering',
    description: 'Sharing wisdom, becoming guide. The circle widens. Your journey becomes teaching.',
    keywords: ['sharing', 'guide', 'teaching', 'circle', 'wisdom', 'offering']
  }
];

export const DOMAIN_8_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'D8Q1',
    section: 8,
    questionNumber: 1,
    invitationText: 'Which of these phrases resonates most with where you are right now?',
    guidanceNote: 'Select the one that feels true. Not where you want to be. Where you *are*.',
    answers: [
      {
        code: 'A',
        text: 'Standing at the edge, sensing something needs to shift (The Threshold)',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Ember',
        woundImprint: 'threshold-consciousness',
        mirrorPattern: 'edge-awareness',
        siCode: 'TH-1'
      },
      {
        code: 'B',
        text: 'Going deep inward, meeting what\'s been hidden (The Descent)',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Silent Flame',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'shadow-work',
        mirrorPattern: 'inward-journey',
        siCode: 'DE-1'
      },
      {
        code: 'C',
        text: 'Recognizing patterns and naming wounds (The Naming)',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Luminous Witness',
        secondaryArchetype: 'The Rational Pilgrim',
        woundImprint: 'pattern-recognition',
        mirrorPattern: 'truth-articulation',
        siCode: 'NA-1'
      },
      {
        code: 'D',
        text: 'Seeing clearly what\'s been true all along (The Mirror)',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'clarity-emergence',
        mirrorPattern: 'undeniable-truth',
        siCode: 'MI-1'
      },
      {
        code: 'E',
        text: 'In the empty space, not knowing what comes next (The Void)',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'dissolution-space',
        mirrorPattern: 'not-knowing',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q2',
    section: 8,
    questionNumber: 2,
    invitationText: 'Or does this one fit better?',
    guidanceNote: 'These are the later phases. Which resonates, if any?',
    answers: [
      {
        code: 'A',
        text: 'First stirrings of reclamation, heat returning (The Ember)',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'reclamation-beginning',
        mirrorPattern: 'spark-rekindling',
        siCode: 'EM-2'
      },
      {
        code: 'B',
        text: 'Weaving shadow and light together (The Integration)',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'wholeness-assembly',
        mirrorPattern: 'both-and-holding',
        siCode: 'IN-2'
      },
      {
        code: 'C',
        text: 'Living as my reclaimed self, embodied and real (The Embodiment)',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'integrated-living',
        mirrorPattern: 'embodied-presence',
        siCode: 'EM-2b'
      },
      {
        code: 'D',
        text: 'Sharing my journey and becoming guide for others (The Offering)',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'wisdom-sharing',
        mirrorPattern: 'sacred-teaching',
        siCode: 'OF-2'
      },
      {
        code: 'E',
        text: 'I don\'t know any of these—I\'m somewhere else entirely',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'phase-unmap',
        mirrorPattern: 'location-unknown',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q3',
    section: 8,
    questionNumber: 3,
    invitationText: 'Which word best describes your current inner state?',
    guidanceNote: 'Word association. What emerges first?',
    answers: [
      {
        code: 'A',
        text: 'Waiting (sensing but not yet moving)',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Threshold',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'liminal-space',
        mirrorPattern: 'edge-pause',
        siCode: 'WA-3'
      },
      {
        code: 'B',
        text: 'Descending (going down to meet what\'s there)',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Silent Flame',
        secondaryArchetype: 'The Fault-Bearer',
        woundImprint: 'inward-courage',
        mirrorPattern: 'shadow-facing',
        siCode: 'DES-3'
      },
      {
        code: 'C',
        text: 'Awakening (warmth returning, life stirring)',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'vitality-return',
        mirrorPattern: 'emergence',
        siCode: 'AW-3'
      },
      {
        code: 'D',
        text: 'Integrating (holding all the pieces together)',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Sovereign',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'wholeness-making',
        mirrorPattern: 'assembly',
        siCode: 'INT-3'
      },
      {
        code: 'E',
        text: 'Lost (no phrase that fits)',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'orientation-loss',
        mirrorPattern: 'unmapped',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q4',
    section: 8,
    questionNumber: 4,
    invitationText: 'How much of your shadow work feels complete?',
    guidanceNote: 'Not perfect. How much have you met and acknowledged what\'s been hidden?',
    answers: [
      {
        code: 'A',
        text: 'Just beginning—I\'m sensing there\'s more to discover',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Threshold',
        secondaryArchetype: 'The Descent',
        woundImprint: 'shadow-initiation',
        mirrorPattern: 'beginning-awareness',
        siCode: 'SW-4a'
      },
      {
        code: 'B',
        text: 'In progress—I\'ve met some, still discovering more',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Descent',
        secondaryArchetype: 'The Naming',
        woundImprint: 'ongoing-shadow-integration',
        mirrorPattern: 'iterative-discovery',
        siCode: 'SW-4b'
      },
      {
        code: 'C',
        text: 'Mostly named—I understand my patterns and wounds',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Naming',
        secondaryArchetype: 'The Mirror',
        woundImprint: 'shadow-literacy',
        mirrorPattern: 'pattern-clarity',
        siCode: 'SW-4c'
      },
      {
        code: 'D',
        text: 'Deeply integrated—I\'ve woven it into wholeness',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Integration',
        secondaryArchetype: 'The Embodiment',
        woundImprint: 'shadow-reconciliation',
        mirrorPattern: 'wholeness-lived',
        siCode: 'SW-4d'
      },
      {
        code: 'E',
        text: 'I\'m not sure I even want to look—too much terror',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'shadow-fear',
        mirrorPattern: 'avoidance-protection',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q5',
    section: 8,
    questionNumber: 5,
    invitationText: 'How anchored do you feel in your authentic self right now?',
    guidanceNote: 'Not perfect confidence. How grounded are you in who you actually are?',
    answers: [
      {
        code: 'A',
        text: 'Shifting and uncertain—I\'m still discovering who I am',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Descent',
        woundImprint: 'self-discovery-unfolding',
        mirrorPattern: 'becoming',
        siCode: 'AU-5a'
      },
      {
        code: 'B',
        text: 'Clearer—I understand my core truths better',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Mirror',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'self-clarity-building',
        mirrorPattern: 'seeing-myself',
        siCode: 'AU-5b'
      },
      {
        code: 'C',
        text: 'Growing stronger—I can live from my truth more often',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'authentic-expansion',
        mirrorPattern: 'truth-expression',
        siCode: 'AU-5c'
      },
      {
        code: 'D',
        text: 'Solid—I know who I am and can stand in it',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'authentic-grounding',
        mirrorPattern: 'integrated-standing',
        siCode: 'AU-5d'
      },
      {
        code: 'E',
        text: 'I\'ve lost myself or never had a stable sense of self',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'self-fragmentation',
        mirrorPattern: 'identity-absent',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q6',
    section: 8,
    questionNumber: 6,
    invitationText: 'What\'s your relationship to hope and possibility right now?',
    guidanceNote: 'Real check-in. Not optimism. Can you let yourself hope?',
    answers: [
      {
        code: 'A',
        text: 'Cautious—hope is rising, though I\'m still protecting myself',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'hope-emergence',
        mirrorPattern: 'guarded-opening',
        siCode: 'HP-6a'
      },
      {
        code: 'B',
        text: 'Growing—I can feel possibility expanding',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'possibility-activation',
        mirrorPattern: 'opening',
        siCode: 'HP-6b'
      },
      {
        code: 'C',
        text: 'Alive—I believe transformation is real and possible',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'hope-embodied',
        mirrorPattern: 'faith-active',
        siCode: 'HP-6c'
      },
      {
        code: 'D',
        text: 'Worn out—hope feels dangerous or naive',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Drifting One',
        secondaryArchetype: 'The Forsaken Child',
        woundImprint: 'hope-betrayal',
        mirrorPattern: 'possibility-denial',
        siCode: 'HP-6d'
      },
      {
        code: 'E',
        text: 'Dead—I\'ve lost hope and don\'t expect it back',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'hope-extinction',
        mirrorPattern: 'despair-permanence',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q7',
    section: 8,
    questionNumber: 7,
    invitationText: 'How willing are you to be visible as your real self?',
    guidanceNote: 'Dropping the mask. Taking up space. Being known.',
    answers: [
      {
        code: 'A',
        text: 'Terrified but willing—I\'m learning to show myself',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Silent Flame',
        woundImprint: 'courage-emerging',
        mirrorPattern: 'visibility-risk',
        siCode: 'VI-7a'
      },
      {
        code: 'B',
        text: 'Growing willing—it gets easier as I trust myself more',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Ember',
        woundImprint: 'visibility-becoming',
        mirrorPattern: 'authentic-showing',
        siCode: 'VI-7b'
      },
      {
        code: 'C',
        text: 'Yes—I can be visible and it feels right',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'authentic-presence',
        mirrorPattern: 'full-visibility',
        siCode: 'VI-7c'
      },
      {
        code: 'D',
        text: 'Not yet—the cost feels too high',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Guarded Mystic',
        secondaryArchetype: 'The Shielded One',
        woundImprint: 'visibility-protection',
        mirrorPattern: 'safe-hiddenness',
        siCode: 'VI-7d'
      },
      {
        code: 'E',
        text: 'No—visibility feels dangerous and I can\'t risk it',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'visibility-trauma',
        mirrorPattern: 'hiding-survival',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q8',
    section: 8,
    questionNumber: 8,
    invitationText: 'What quality do you most want to cultivate in yourself moving forward?',
    guidanceNote: 'What does your soul want to become?',
    answers: [
      {
        code: 'A',
        text: 'Groundedness and safety in my body',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Rooted Flame',
        woundImprint: 'somatic-rooting',
        mirrorPattern: 'embodied-safety',
        siCode: 'QU-8a'
      },
      {
        code: 'B',
        text: 'Authentic voice and true power',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'voice-power',
        mirrorPattern: 'authentic-agency',
        siCode: 'QU-8b'
      },
      {
        code: 'C',
        text: 'Wholeness—holding all my parts',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'integration-aspiration',
        mirrorPattern: 'wholeness-becoming',
        siCode: 'QU-8c'
      },
      {
        code: 'D',
        text: 'Compassion for myself and others',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Rooted Flame',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'compassion-expansion',
        mirrorPattern: 'kindness-growth',
        siCode: 'QU-8d'
      },
      {
        code: 'E',
        text: 'Just to feel less pain—anything else feels impossible',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'pain-relief-primary',
        mirrorPattern: 'survival-focus',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q9',
    section: 8,
    questionNumber: 9,
    invitationText: 'If you could name the biggest shift you\'ve already made (even small), what is it?',
    guidanceNote: 'What\'s different? What have you already reclaimed or released?',
    answers: [
      {
        code: 'A',
        text: 'I see myself differently now—with more compassion',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Luminous Witness',
        woundImprint: 'self-perception-shift',
        mirrorPattern: 'mirror-kindness',
        siCode: 'SH-9a'
      },
      {
        code: 'B',
        text: 'I trust my voice/intuition more than I used to',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'authority-trust',
        mirrorPattern: 'self-knowing',
        siCode: 'SH-9b'
      },
      {
        code: 'C',
        text: 'I\'m less afraid and more willing to be seen',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'fear-release',
        mirrorPattern: 'visibility-growing',
        siCode: 'SH-9c'
      },
      {
        code: 'D',
        text: 'I understand my patterns now instead of just reacting',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Mirror',
        secondaryArchetype: 'The Naming',
        woundImprint: 'pattern-awareness',
        mirrorPattern: 'consciousness-rise',
        siCode: 'SH-9d'
      },
      {
        code: 'E',
        text: 'I haven\'t shifted yet—everything still feels the same',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'change-absence',
        mirrorPattern: 'stagnation-felt',
        siCode: null
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q10',
    section: 8,
    questionNumber: 10,
    invitationText: 'What phase of the journey feels most real and alive to you right now?',
    guidanceNote: 'Which phase name holds truth for where you are?',
    answers: [
      {
        code: 'A',
        text: 'The Threshold or Descent—meeting what needs to be seen',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Silent Flame',
        secondaryArchetype: 'The Guarded Mystic',
        woundImprint: 'shadow-work-active',
        mirrorPattern: 'inward-journey',
        siCode: 'PH-10a'
      },
      {
        code: 'B',
        text: 'The Naming or Mirror—clarity and recognition',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Luminous Witness',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'truth-emergence',
        mirrorPattern: 'clarity-lived',
        siCode: 'PH-10b'
      },
      {
        code: 'C',
        text: 'The Void—in the unknown, between old and new',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Drifting One',
        woundImprint: 'dissolution-space',
        mirrorPattern: 'not-knowing',
        siCode: null
      },
      {
        code: 'D',
        text: 'The Ember or Integration—reclaiming and weaving together',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'reclamation-integration',
        mirrorPattern: 'wholeness-making',
        siCode: 'PH-10d'
      },
      {
        code: 'E',
        text: 'The Embodiment or Offering—living and sharing my truth',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Awakened Creatrix',
        woundImprint: 'integrated-living',
        mirrorPattern: 'wisdom-embodied',
        siCode: 'PH-10e'
      }
    ],
    isGhost: false
  },
  {
    id: 'D8Q11',
    section: 8,
    questionNumber: 11,
    invitationText: 'Complete this sentence: "Right now, I am…"',
    guidanceNote: 'Let it come. Don\'t think. What\'s true?',
    answers: [
      {
        code: 'A',
        text: 'Waking up to what\'s been hidden',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Awakened Creatrix',
        secondaryArchetype: 'The Mirror',
        woundImprint: 'awakening-phase',
        mirrorPattern: 'consciousness-rise',
        siCode: 'CMP-11a'
      },
      {
        code: 'B',
        text: 'Learning to trust myself again',
        spectrumDepth: 'threshold',
        primaryArchetype: 'The Ember',
        secondaryArchetype: 'The Living Flame',
        woundImprint: 'trust-rebuilding',
        mirrorPattern: 'recovery',
        siCode: 'CMP-11b'
      },
      {
        code: 'C',
        text: 'Becoming who I\'m meant to be',
        spectrumDepth: 'gift',
        primaryArchetype: 'The Living Flame',
        secondaryArchetype: 'The Sovereign',
        woundImprint: 'destiny-alignment',
        mirrorPattern: 'becoming-true',
        siCode: 'CMP-11c'
      },
      {
        code: 'D',
        text: 'Holding the tension between old and new',
        spectrumDepth: 'shadow',
        primaryArchetype: 'The Void',
        secondaryArchetype: 'The Integration',
        woundImprint: 'liminal-holding',
        mirrorPattern: 'both-and-space',
        siCode: 'CMP-11d'
      },
      {
        code: 'E',
        text: 'Lost, broken, or unsure if this is possible',
        spectrumDepth: 'ghost',
        primaryArchetype: 'The Forsaken Child',
        secondaryArchetype: 'The Spirit-Dimmed',
        woundImprint: 'despair-state',
        mirrorPattern: 'hopelessness',
        siCode: null
      }
    ],
    isGhost: false
  }
];
