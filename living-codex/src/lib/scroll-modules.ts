export interface ScrollModule {
  num: number;
  title: string;
  glyph: string;
  subtitle: string;
  description: string;
  prompts: ScrollPrompt[];
  hasLedger?: boolean;
}

export interface ScrollPrompt {
  id: string;
  text: string;
  type: "reflection" | "somatic" | "ritual" | "ledger" | "letter";
  placeholder?: string;
}

export const SCROLL_MODULES: ScrollModule[] = [
  {
    num: 1,
    title: "The Naming",
    glyph: "\u{1F702}",
    subtitle: "Meeting your archetypal constellation",
    description: "Before anything can shift, it must first be seen. This module invites you to sit with the archetypes that emerged from your assessment \u2014 not as labels, but as living patterns within you.",
    prompts: [
      { id: "1-1", text: "When you read the name of your primary archetype, what was the first sensation in your body? Describe it without editing.", type: "reflection", placeholder: "Let your body speak first..." },
      { id: "1-2", text: "Which archetype surprised you the most \u2014 and what does that surprise tell you about what you have been hiding from yourself?", type: "reflection", placeholder: "The surprise itself is a doorway..." },
      { id: "1-3", text: "Place one hand on your heart and one on your belly. Breathe into the space between your hands. What archetype do you feel most in this moment? Write whatever arrives.", type: "somatic", placeholder: "Breathe, then write..." },
    ],
  },
  {
    num: 2,
    title: "The Wound Map",
    glyph: "\u2696",
    subtitle: "Tracing what was absorbed",
    description: "Your wound imprints are not failures \u2014 they are the precise locations where your system learned to protect you. This module helps you trace each wound to its origin without judgment.",
    prompts: [
      { id: "2-1", text: "Your primary wound imprint is a pattern you have been carrying. When did you first learn this pattern? Write the earliest memory that arises.", type: "reflection", placeholder: "Go back to the first moment..." },
      { id: "2-2", text: "If your wound could speak, what would it say it has been protecting you from?", type: "reflection", placeholder: "Let the wound have a voice..." },
      { id: "2-3", text: "Close your eyes. Scan your body from the crown of your head to the soles of your feet. Where does this wound live in your body? Describe the texture, temperature, or weight.", type: "somatic", placeholder: "Name what your body holds..." },
    ],
  },
  {
    num: 3,
    title: "The Mirror",
    glyph: "\u{1F74A}",
    subtitle: "Recognizing your reflection patterns",
    description: "Mirror patterns are the mechanisms by which you project, deflect, or absorb what you carry. Seeing them is the first step toward choosing differently.",
    prompts: [
      { id: "3-1", text: "Your primary mirror pattern shapes how you relate to others. Describe the last time you caught yourself in this pattern \u2014 what happened?", type: "reflection", placeholder: "Recall the moment..." },
      { id: "3-2", text: "If you could release this pattern entirely, what relationship in your life would change the most? How?", type: "reflection", placeholder: "Imagine the shift..." },
      { id: "3-3", text: "Write a short letter to this pattern \u2014 acknowledging what it gave you and naming what it cost.", type: "letter", placeholder: "Dear pattern that kept me safe..." },
    ],
  },
  {
    num: 4,
    title: "The Descent",
    glyph: "\u{1F703}",
    subtitle: "Moving through shadow",
    description: "Shadow is not darkness to be feared \u2014 it is the part of you that went underground to survive. This module invites you into compassionate dialogue with what has been hidden.",
    prompts: [
      { id: "4-1", text: "Your shadow expression carries gifts that have been inverted. What strength lives inside the shadow pattern your assessment revealed?", type: "reflection", placeholder: "Find the gift within the shadow..." },
      { id: "4-2", text: "What would you need to believe about yourself in order to let this shadow pattern rest?", type: "reflection", placeholder: "Name the belief that would set it free..." },
      { id: "4-3", text: "Light a candle or sit in a dimly lit space. Place your hands palms-up on your thighs. Breathe slowly. Invite the shadow to sit beside you, not as an enemy but as a tired guardian. What does it want you to know?", type: "ritual", placeholder: "What does the guardian whisper..." },
    ],
  },
  {
    num: 5,
    title: "The Threshold",
    glyph: "\u2640",
    subtitle: "Standing at the edge of becoming",
    description: "Threshold is the space between who you were and who you are becoming. It is not comfortable, but it is sacred. This module helps you honor the crossing.",
    prompts: [
      { id: "5-1", text: "What are you being asked to leave behind right now? Name it with honesty.", type: "reflection", placeholder: "What must be released..." },
      { id: "5-2", text: "What quality or way of being is trying to emerge in you? Describe it even if it feels fragile or unclear.", type: "reflection", placeholder: "What is emerging..." },
      { id: "5-3", text: "Stand in a doorway. Feel the threshold beneath your feet. One side is who you were. The other is who you are becoming. Step forward deliberately. Then write what you felt.", type: "somatic", placeholder: "Describe the crossing..." },
    ],
  },
  {
    num: 6,
    title: "The Reclamation",
    glyph: "\u263F",
    subtitle: "Retrieving what was lost",
    description: "Reclamation is the act of returning to yourself the parts that were given away, taken, or buried. This module guides you to name and reclaim them.",
    prompts: [
      { id: "6-1", text: "What part of yourself did you abandon in order to be loved, accepted, or safe? Name her.", type: "reflection", placeholder: "She has been waiting..." },
      { id: "6-2", text: "If you could go back to the moment she was abandoned, what would you say to her now?", type: "letter", placeholder: "Write to her directly..." },
      { id: "6-3", text: "What is one small, concrete act you can do this week to welcome her back into your life?", type: "reflection", placeholder: "One act of return..." },
    ],
  },
  {
    num: 7,
    title: "The Embodiment",
    glyph: "\u26B3",
    subtitle: "Returning to the body",
    description: "The body holds what the mind forgets. This module reconnects you with your somatic intelligence \u2014 the wisdom that lives in your cells, breath, and bones.",
    prompts: [
      { id: "7-1", text: "Where in your body do you feel the most alive right now? Where do you feel the most numb? Map both.", type: "somatic", placeholder: "The alive places... the numb places..." },
      { id: "7-2", text: "Your body has been carrying your story. If your body could cry, rage, or dance right now \u2014 which would it choose? Why?", type: "reflection", placeholder: "Let the body choose..." },
      { id: "7-3", text: "Place both feet flat on the floor. Press down through your heels. Feel the earth hold you. Breathe into your belly for ten breaths. Then write: what does it feel like to be held?", type: "somatic", placeholder: "Being held feels like..." },
    ],
  },
  {
    num: 8,
    title: "The Sovereignty Ledger",
    glyph: "\u{1F76E}",
    subtitle: "Weekly practice of self-witnessing",
    description: "Sovereignty is not declared once \u2014 it is practiced daily. This module provides a weekly ledger for tracking your relationship with your patterns, boundaries, and emerging self.",
    hasLedger: true,
    prompts: [
      { id: "8-1", text: "This week, I noticed my primary pattern surface when...", type: "ledger", placeholder: "Describe the moment..." },
      { id: "8-2", text: "This week, I chose differently by...", type: "ledger", placeholder: "Name your sovereign choice..." },
      { id: "8-3", text: "This week, I honored my body by...", type: "ledger", placeholder: "Name the act of honoring..." },
      { id: "8-4", text: "This week, I am most proud of...", type: "ledger", placeholder: "Acknowledge yourself..." },
    ],
  },
  {
    num: 9,
    title: "The Integration",
    glyph: "\u{1F701}",
    subtitle: "Weaving it all together",
    description: "Integration is not an ending \u2014 it is a way of being. This final module invites you to gather the threads of your journey and weave them into a living commitment to yourself.",
    prompts: [
      { id: "9-1", text: "Looking back at this entire Scroll journey, what is the single most important truth you discovered about yourself?", type: "reflection", placeholder: "The truth that changed everything..." },
      { id: "9-2", text: "Write a letter to yourself from one year in the future. She has fully embodied the gift expression of your primary archetype. What does she want you to know?", type: "letter", placeholder: "Dear present me..." },
      { id: "9-3", text: "Name three commitments you are making to yourself as you close this Scroll. These are not goals \u2014 they are vows of sovereignty.", type: "reflection", placeholder: "I commit to..." },
    ],
  },
];
