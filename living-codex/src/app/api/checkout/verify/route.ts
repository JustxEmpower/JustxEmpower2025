import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId || !stripe) {
      return NextResponse.json({ success: false });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const email = session.metadata?.email || session.customer_email;
      const tierId = session.metadata?.tierId;

      if (email) {
        await prisma.user.updateMany({
          where: { email },
          data: {
            tier: tierId || "self_guided",
            purchaseDate: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true, tier: tierId });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ success: false });
  }
}
