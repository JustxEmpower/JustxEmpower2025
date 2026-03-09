import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const email = session.metadata?.email || session.customer_email;
    const tierId = session.metadata?.tierId || "self_guided";

    if (email) {
      // Update or create user with purchased tier
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          tier: tierId,
          purchaseDate: new Date(),
        },
        create: {
          email,
          passwordHash: "pending-signup",
          tier: tierId,
          purchaseDate: new Date(),
        },
      });

      // Send welcome email
      await sendWelcomeEmail(email, user.name || "", tierId);

      console.log(`✦ Purchase complete: ${email} → ${tierId}`);
    }
  }

  return NextResponse.json({ received: true });
}
