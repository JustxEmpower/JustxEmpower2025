import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SECTION_META: Record<
  number,
  { title: string; glyph: string; subtitle: string; weight: number }
> = {
  1: { title: "Voice & Visibility", glyph: "🜂", subtitle: "The terrain of your truth — what speaks, what silences, what waits.", weight: 1.0 },
  2: { title: "Relational Patterns", glyph: "☽", subtitle: "The mirror of how you love — and how love has shaped you.", weight: 1.0 },
  3: { title: "Wound Imprints", glyph: "⚖", subtitle: "The archaeology of what was absorbed — what was never yours to carry.", weight: 1.25 },
  4: { title: "Mirror Patterns", glyph: "🝊", subtitle: "The reflection mechanisms — how you project what you carry.", weight: 1.0 },
  5: { title: "Survival Archetypes", glyph: "🝸", subtitle: "The strategies that kept you alive — and the cost of keeping them.", weight: 1.25 },
  6: { title: "Soul Disconnection", glyph: "🜃", subtitle: "The spaces where you lost yourself — and where you begin to return.", weight: 1.0 },
  7: { title: "Somatic Embodiment", glyph: "⚳", subtitle: "The body's memory — what it holds, what it releases, what it knows.", weight: 1.0 },
  8: { title: "Lineage Imprint", glyph: "🜄", subtitle: "The inherited patterns — what was passed down through blood and silence.", weight: 1.0 },
  9: { title: "Money & Survival", glyph: "🝮", subtitle: "The economics of worth — how safety and value became entangled.", weight: 1.0 },
  10: { title: "Longing & Reclamation", glyph: "☿", subtitle: "The ache beneath the surface — what you've been reaching toward.", weight: 1.0 },
  11: { title: "Thresholds", glyph: "♀", subtitle: "The edges of becoming — where you stand between who you were and who you are.", weight: 1.25 },
  12: { title: "Open-Ended Integration", glyph: "🜁", subtitle: "Your own words — the Codex listens.", weight: 0 },
  13: { title: "Masculine Mirror", glyph: "👁", subtitle: "The masculine imprint — what you've encountered, internalized, and mirrored.", weight: 1.5 },
  14: { title: "Abuse Bond Imprint", glyph: "🌀", subtitle: "The bonds that bound — with care, with tenderness, with truth.", weight: 2.0 },
  15: { title: "Escape/Power/Control Loops", glyph: "✦", subtitle: "The behavioral loops — what you do to manage the unmanageable.", weight: 1.5 },
  16: { title: "Womb Mapping", glyph: "◯", subtitle: "The cyclical field — your body's seasons and sacred architecture.", weight: 1.0 },
};

export const ARCHETYPES = {
  core: [
    { id: 1, name: "The Silent Flame", glyph: "🜂", tagline: "She who burns unseen — whose depth has been swallowed by survival." },
    { id: 2, name: "The Forsaken Child", glyph: "☽", tagline: "She who learned too early that love was conditional — and built a life around earning it." },
    { id: 3, name: "The Pleaser Flame", glyph: "⚖", tagline: "She who made herself small so the room would stay safe." },
    { id: 4, name: "The Burdened Flame", glyph: "🝊", tagline: "She who carries what was never hers — and mistakes the weight for purpose." },
    { id: 5, name: "The Drifting One", glyph: "🝸", tagline: "She without an anchor — searching for herself in every horizon." },
    { id: 6, name: "The Guarded Mystic", glyph: "🜃", tagline: "She who knows — but has learned to doubt her own knowing." },
    { id: 7, name: "The Spirit-Dimmed", glyph: "⚳", tagline: "She who once burned bright — and forgot how, or why." },
    { id: 8, name: "The Fault-Bearer", glyph: "🜄", tagline: "She who absorbs blame like a sponge — turning every wound inward." },
    { id: 9, name: "The Shielded One", glyph: "🝮", tagline: "She who built walls so strong she sometimes cannot find the door." },
    { id: 10, name: "The Rational Pilgrim", glyph: "☿", tagline: "She who lives in the mind — and suspects the body cannot be trusted." },
    { id: 11, name: "The Living Flame", glyph: "♀", tagline: "She who is becoming — active in her emergence, alive to her own unfolding." },
    { id: 12, name: "The Rooted Flame", glyph: "🜁", tagline: "She who has come home to herself — and tends the fire from the ground." },
  ],
  expansion: [
    { id: 13, name: "The Sovereign", glyph: "👁", tagline: "She who leads not from title or performance — but from the wholeness of who she is." },
    { id: 14, name: "The Threshold Walker", glyph: "🌀", tagline: "She who lives at the edge of every becoming — and is learning to trust the crossing." },
    { id: 15, name: "The Luminous Witness", glyph: "✦", tagline: "She who has walked through fire and emerged — and now holds the lantern for others." },
  ],
};

export const JOURNEY_TIERS = [
  { id: "threshold", name: "Threshold Session", sessions: "1 × 90min", price: "$250", description: "A mirror to open the field and illuminate what is ready to shift.", includes: ["Mirror Report", "Guided Session"] },
  { id: "self_guided", name: "Self-Guided Journey", sessions: "Self-paced", price: "$444", description: "A portal of archetypal remembrance and embodied transformation.", includes: ["Mirror Report", "Full Codex Scroll", "9-Module Portal"] },
  { id: "awakening", name: "Awakening Arc", sessions: "3 sessions", price: "$888", description: "A journey for those emerging from silence into clarity.", includes: ["Mirror Report", "Full Codex Scroll", "3 Live Sessions"] },
  { id: "reclamation", name: "Reclamation Path", sessions: "5 sessions", price: "$1,444", description: "An unraveling and return for women releasing inherited systems.", includes: ["Mirror Report", "Full Codex Scroll", "5 Live Sessions"] },
  { id: "legacy", name: "Legacy Immersion", sessions: "9 sessions", price: "$2,500", description: "A soul-deep remembrance for those embodying their sacred mission.", includes: ["Mirror Report", "Full Codex Scroll", "9 Live Sessions", "Priority Support"] },
];
