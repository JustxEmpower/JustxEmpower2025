/**
 * Living Codex™ Constants
 * Section metadata, archetypes, journey tiers, and scroll modules
 */

export const SECTION_META: Record<
  number,
  { title: string; glyph: string; subtitle: string; weight: number }
> = {
  1: { title: "Voice & Visibility", glyph: "*", subtitle: "The terrain of your truth — what speaks, what silences, what waits.", weight: 1.0 },
  2: { title: "Relational Patterns", glyph: "+", subtitle: "The mirror of how you love — and how love has shaped you.", weight: 1.0 },
  3: { title: "Wound Imprints", glyph: "=", subtitle: "The archaeology of what was absorbed — what was never yours to carry.", weight: 1.25 },
  4: { title: "Mirror Patterns", glyph: "~", subtitle: "The reflection mechanisms — how you project what you carry.", weight: 1.0 },
  5: { title: "Survival Archetypes", glyph: "^", subtitle: "The strategies that kept you alive — and the cost of keeping them.", weight: 1.25 },
  6: { title: "Soul Disconnection", glyph: "_", subtitle: "The spaces where you lost yourself — and where you begin to return.", weight: 1.0 },
  7: { title: "Somatic Embodiment", glyph: "|", subtitle: "The body's memory — what it holds, what it releases, what it knows.", weight: 1.0 },
  8: { title: "Lineage Imprint", glyph: ">", subtitle: "The inherited patterns — what was passed down through blood and silence.", weight: 1.0 },
  9: { title: "Money & Survival", glyph: "<", subtitle: "The economics of worth — how safety and value became entangled.", weight: 1.0 },
  10: { title: "Longing & Reclamation", glyph: "/", subtitle: "The ache beneath the surface — what you've been reaching toward.", weight: 1.0 },
  11: { title: "Thresholds", glyph: ":", subtitle: "The edges of becoming — where you stand between who you were and who you are.", weight: 1.25 },
  12: { title: "Open-Ended Integration", glyph: ";", subtitle: "Your own words — the Codex listens.", weight: 0 },
  13: { title: "Masculine Mirror", glyph: "!", subtitle: "The masculine imprint — what you've encountered, internalized, and mirrored.", weight: 1.5 },
  14: { title: "Abuse Bond Imprint", glyph: "?", subtitle: "The bonds that bound — with care, with tenderness, with truth.", weight: 2.0 },
  15: { title: "Escape/Power/Control Loops", glyph: "#", subtitle: "The behavioral loops — what you do to manage the unmanageable.", weight: 1.5 },
  16: { title: "Womb Mapping", glyph: "$", subtitle: "The cyclical field — your body's seasons and sacred architecture.", weight: 1.0 },
};

export const ARCHETYPES = {
  core: [
    { id: 1, name: "The Silent Flame", glyph: "◈", tagline: "She who burns unseen — whose depth has been swallowed by survival." },
    { id: 2, name: "The Forsaken Child", glyph: "☽", tagline: "She who learned too early that love was conditional — and built a life around earning it." },
    { id: 3, name: "The Pleaser Flame", glyph: "⚖", tagline: "She who made herself small so the room would stay safe." },
    { id: 4, name: "The Burdened Flame", glyph: "◊", tagline: "She who carries what was never hers — and mistakes the weight for purpose." },
    { id: 5, name: "The Drifting One", glyph: "∼", tagline: "She without an anchor — searching for herself in every horizon." },
    { id: 6, name: "The Guarded Mystic", glyph: "◎", tagline: "She who knows — but has learned to doubt her own knowing." },
    { id: 7, name: "The Spirit-Dimmed", glyph: "⚳", tagline: "She who once burned bright — and forgot how, or why." },
    { id: 8, name: "The Fault-Bearer", glyph: "◇", tagline: "She who absorbs blame like a sponge — turning every wound inward." },
    { id: 9, name: "The Shielded One", glyph: "◆", tagline: "She who built walls so strong she sometimes cannot find the door." },
    { id: 10, name: "The Rational Pilgrim", glyph: "☿", tagline: "She who lives in the mind — and suspects the body cannot be trusted." },
    { id: 11, name: "The Living Flame", glyph: "♀", tagline: "She who is becoming — active in her emergence, alive to her own unfolding." },
    { id: 12, name: "The Rooted Flame", glyph: "∞", tagline: "She who has come home to herself — and tends the fire from the ground." },
  ],
  expansion: [
    { id: 13, name: "The Sovereign", glyph: "◎", tagline: "She who leads not from title or performance — but from the wholeness of who she is." },
    { id: 14, name: "The Threshold Walker", glyph: "○", tagline: "She who lives at the edge of every becoming — and is learning to trust the crossing." },
    { id: 15, name: "The Luminous Witness", glyph: "✦", tagline: "She who has walked through fire and emerged — and now holds the lantern for others." },
  ],
};

export const JOURNEY_TIERS = [
  { id: "threshold", name: "Threshold Session", sessions: "1 × 90min", price: 25000, priceDisplay: "$250", description: "A mirror to open the field and illuminate what is ready to shift.", includes: ["Mirror Report", "Guided Session"] },
  { id: "self_guided", name: "Self-Guided Journey", sessions: "Self-paced", price: 44400, priceDisplay: "$444", description: "A portal of archetypal remembrance and embodied transformation.", includes: ["Mirror Report", "Full Codex Scroll", "9-Module Portal"] },
  { id: "awakening", name: "Awakening Arc", sessions: "3 sessions", price: 88800, priceDisplay: "$888", description: "A journey for those emerging from silence into clarity.", includes: ["Mirror Report", "Full Codex Scroll", "3 Live Sessions"] },
  { id: "reclamation", name: "Reclamation Path", sessions: "5 sessions", price: 144400, priceDisplay: "$1,444", description: "An unraveling and return for women releasing inherited systems.", includes: ["Mirror Report", "Full Codex Scroll", "5 Live Sessions"] },
  { id: "legacy", name: "Legacy Immersion", sessions: "9 sessions", price: 250000, priceDisplay: "$2,500", description: "A soul-deep remembrance for those embodying their sacred mission.", includes: ["Mirror Report", "Full Codex Scroll", "9 Live Sessions", "Priority Support"] },
];

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
    num: 1, title: "The Naming", glyph: "01", subtitle: "Meeting your archetypal constellation",
    description: "Before anything can shift, it must first be seen. This module invites you to sit with the archetypes that emerged from your assessment.",
    prompts: [
      { id: "1-1", text: "When you read the name of your primary archetype, what was the first sensation in your body?", type: "reflection", placeholder: "Let your body speak first..." },
      { id: "1-2", text: "Which archetype surprised you the most — and what does that surprise tell you?", type: "reflection", placeholder: "The surprise itself is a doorway..." },
      { id: "1-3", text: "Place one hand on your heart and one on your belly. Breathe into the space between. What archetype do you feel most?", type: "somatic", placeholder: "Breathe, then write..." },
    ],
  },
  {
    num: 2, title: "The Wound Map", glyph: "02", subtitle: "Tracing what was absorbed",
    description: "Your wound imprints are not failures — they are the precise locations where your system learned to protect you.",
    prompts: [
      { id: "2-1", text: "Your primary wound imprint is a pattern you have been carrying. When did you first learn this pattern?", type: "reflection", placeholder: "Go back to the first moment..." },
      { id: "2-2", text: "If your wound could speak, what would it say it has been protecting you from?", type: "reflection", placeholder: "Let the wound have a voice..." },
      { id: "2-3", text: "Close your eyes. Scan your body. Where does this wound live? Describe the texture, temperature, or weight.", type: "somatic", placeholder: "Name what your body holds..." },
    ],
  },
  {
    num: 3, title: "The Mirror", glyph: "03", subtitle: "Recognizing your reflection patterns",
    description: "Mirror patterns are the mechanisms by which you project, deflect, or absorb what you carry.",
    prompts: [
      { id: "3-1", text: "Describe the last time you caught yourself in your primary mirror pattern — what happened?", type: "reflection", placeholder: "Recall the moment..." },
      { id: "3-2", text: "If you could release this pattern entirely, what relationship would change the most?", type: "reflection", placeholder: "Imagine the shift..." },
      { id: "3-3", text: "Write a short letter to this pattern — acknowledging what it gave you and naming what it cost.", type: "letter", placeholder: "Dear pattern that kept me safe..." },
    ],
  },
  {
    num: 4, title: "The Descent", glyph: "04", subtitle: "Moving through shadow",
    description: "Shadow is not darkness to be feared — it is the part of you that went underground to survive.",
    prompts: [
      { id: "4-1", text: "What strength lives inside the shadow pattern your assessment revealed?", type: "reflection", placeholder: "Find the gift within the shadow..." },
      { id: "4-2", text: "What would you need to believe about yourself to let this shadow pattern rest?", type: "reflection", placeholder: "Name the belief that would set it free..." },
      { id: "4-3", text: "Sit in dim light. Place your hands palms-up. Invite the shadow to sit beside you. What does it want you to know?", type: "ritual", placeholder: "What does the guardian whisper..." },
    ],
  },
  {
    num: 5, title: "The Threshold", glyph: "05", subtitle: "Standing at the edge of becoming",
    description: "Threshold is the space between who you were and who you are becoming.",
    prompts: [
      { id: "5-1", text: "What are you being asked to leave behind right now?", type: "reflection", placeholder: "What must be released..." },
      { id: "5-2", text: "What quality is trying to emerge in you? Describe it even if it feels fragile.", type: "reflection", placeholder: "What is emerging..." },
      { id: "5-3", text: "Stand in a doorway. One side is who you were. The other is who you are becoming. Step forward. Write what you felt.", type: "somatic", placeholder: "Describe the crossing..." },
    ],
  },
  {
    num: 6, title: "The Reclamation", glyph: "06", subtitle: "Retrieving what was lost",
    description: "Reclamation is the act of returning to yourself the parts that were given away, taken, or buried.",
    prompts: [
      { id: "6-1", text: "What part of yourself did you abandon in order to be loved, accepted, or safe? Name her.", type: "reflection", placeholder: "She has been waiting..." },
      { id: "6-2", text: "If you could go back to the moment she was abandoned, what would you say to her now?", type: "letter", placeholder: "Write to her directly..." },
      { id: "6-3", text: "What is one small, concrete act you can do this week to welcome her back?", type: "reflection", placeholder: "One act of return..." },
    ],
  },
  {
    num: 7, title: "The Embodiment", glyph: "07", subtitle: "Returning to the body",
    description: "The body holds what the mind forgets. This module reconnects you with your somatic intelligence.",
    prompts: [
      { id: "7-1", text: "Where in your body do you feel the most alive? Where the most numb? Map both.", type: "somatic", placeholder: "The alive places... the numb places..." },
      { id: "7-2", text: "If your body could cry, rage, or dance right now — which would it choose? Why?", type: "reflection", placeholder: "Let the body choose..." },
      { id: "7-3", text: "Press your feet flat on the floor. Breathe into your belly for ten breaths. What does it feel like to be held?", type: "somatic", placeholder: "Being held feels like..." },
    ],
  },
  {
    num: 8, title: "The Sovereignty Ledger", glyph: "08", subtitle: "Weekly practice of self-witnessing",
    description: "Sovereignty is not declared once — it is practiced daily.",
    hasLedger: true,
    prompts: [
      { id: "8-1", text: "This week, I noticed my primary pattern surface when...", type: "ledger", placeholder: "Describe the moment..." },
      { id: "8-2", text: "This week, I chose differently by...", type: "ledger", placeholder: "Name your sovereign choice..." },
      { id: "8-3", text: "This week, I honored my body by...", type: "ledger", placeholder: "Name the act of honoring..." },
      { id: "8-4", text: "This week, I am most proud of...", type: "ledger", placeholder: "Acknowledge yourself..." },
    ],
  },
  {
    num: 9, title: "The Integration", glyph: "09", subtitle: "Weaving it all together",
    description: "Integration is not an ending — it is a way of being.",
    prompts: [
      { id: "9-1", text: "What is the single most important truth you discovered about yourself?", type: "reflection", placeholder: "The truth that changed everything..." },
      { id: "9-2", text: "Write a letter from yourself one year in the future. She has fully embodied your primary archetype's gift. What does she want you to know?", type: "letter", placeholder: "Dear present me..." },
      { id: "9-3", text: "Name three commitments you are making to yourself. These are not goals — they are vows of sovereignty.", type: "reflection", placeholder: "I commit to..." },
    ],
  },
];
