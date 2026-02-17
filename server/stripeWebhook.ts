import { Router, raw } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { orders, eventRegistrations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Lazy Stripe initialization
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia" as any,
      });
    } catch (e) {
      console.warn("[Webhook] Stripe initialization failed", e);
    }
  }
  return _stripe;
}

export function createStripeWebhookRouter(): Router {
  const router = Router();

  // Stripe sends raw body — must NOT be parsed as JSON
  router.post(
    "/",
    raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      if (!stripe) {
        console.error("[Webhook] Stripe not initialized");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("[Webhook] STRIPE_WEBHOOK_SECRET not set");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "payment_intent.succeeded":
            await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;

          case "payment_intent.payment_failed":
            await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;

          case "charge.refunded":
            await handleChargeRefunded(event.data.object as Stripe.Charge);
            break;

          case "charge.dispute.created":
            await handleDisputeCreated(event.data.object as Stripe.Dispute);
            break;

          default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err: any) {
        console.error(`[Webhook] Error handling ${event.type}:`, err.message);
        // Return 200 anyway so Stripe doesn't retry endlessly
        return res.status(200).json({ received: true, error: err.message });
      }

      res.status(200).json({ received: true });
    }
  );

  return router;
}

// --- Event Handlers ---

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment succeeded: ${paymentIntent.id} — $${(paymentIntent.amount / 100).toFixed(2)}`);

  const db = await getDb();
  if (!db) return;

  // Update shop order payment status if it exists
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentIntentId, paymentIntent.id));

  if (order) {
    await db
      .update(orders)
      .set({ paymentStatus: "paid", status: "processing" })
      .where(eq(orders.id, order.id));
    console.log(`[Webhook] Order ${order.orderNumber} marked as paid`);
  }

  // Update event registration payment status if it exists
  const [registration] = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.paymentIntentId, paymentIntent.id));

  if (registration) {
    await db
      .update(eventRegistrations)
      .set({ paymentStatus: "paid" })
      .where(eq(eventRegistrations.id, registration.id));
    console.log(`[Webhook] Registration ${registration.confirmationNumber} marked as paid`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment failed: ${paymentIntent.id} — ${paymentIntent.last_payment_error?.message || "unknown error"}`);

  const db = await getDb();
  if (!db) return;

  // Mark order as payment failed
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentIntentId, paymentIntent.id));

  if (order) {
    await db
      .update(orders)
      .set({ paymentStatus: "failed" })
      .where(eq(orders.id, order.id));
    console.log(`[Webhook] Order ${order.orderNumber} marked as payment failed`);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;

  console.log(`[Webhook] Charge refunded: ${charge.id} (PI: ${paymentIntentId})`);

  if (!paymentIntentId) return;

  const db = await getDb();
  if (!db) return;

  // Update order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentIntentId, paymentIntentId));

  if (order) {
    const isFullRefund = charge.amount_refunded >= charge.amount;
    await db
      .update(orders)
      .set({
        paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
        status: isFullRefund ? "cancelled" : order.status,
      })
      .where(eq(orders.id, order.id));
    console.log(`[Webhook] Order ${order.orderNumber} marked as ${isFullRefund ? "refunded" : "partially refunded"}`);
  }

  // Update event registration
  const [registration] = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.paymentIntentId, paymentIntentId));

  if (registration) {
    await db
      .update(eventRegistrations)
      .set({ paymentStatus: "refunded", status: "cancelled" })
      .where(eq(eventRegistrations.id, registration.id));
    console.log(`[Webhook] Registration ${registration.confirmationNumber} marked as refunded`);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id;

  console.log(`[Webhook] Dispute created: ${dispute.id} — reason: ${dispute.reason} (PI: ${paymentIntentId})`);

  if (!paymentIntentId) return;

  const db = await getDb();
  if (!db) return;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentIntentId, paymentIntentId));

  if (order) {
    await db
      .update(orders)
      .set({ paymentStatus: "disputed", status: "on_hold" })
      .where(eq(orders.id, order.id));
    console.log(`[Webhook] Order ${order.orderNumber} marked as disputed and put on hold`);
  }
}
