import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set — Stripe features will be disabled.");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

export const TIER_PRICES: Record<string, { name: string; amount: number; description: string }> = {
  threshold: { name: "Threshold Session", amount: 25000, description: "Mirror Report + 1 x 90-min Guided Session" },
  self_guided: { name: "Self-Guided Journey", amount: 44400, description: "Mirror Report + Full Codex Scroll + 9-Module Portal" },
  awakening: { name: "Awakening Arc", amount: 88800, description: "Mirror Report + Codex Scroll + 3 Live Sessions" },
  reclamation: { name: "Reclamation Path", amount: 144400, description: "Mirror Report + Codex Scroll + 5 Live Sessions" },
  legacy: { name: "Legacy Immersion", amount: 250000, description: "Mirror Report + Codex Scroll + 9 Live Sessions + Priority Support" },
};
