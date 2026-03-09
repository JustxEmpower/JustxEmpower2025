import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { slotId, notes } = await req.json();

    // Get current user (demo mode — auth will gate this in production)
    const user = await prisma.user.findFirst({ where: { role: "client" } });
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    // Store booking as an admin note (lightweight — swap for a Booking model in production)
    await prisma.adminNote.create({
      data: {
        userId: user.id,
        content: `SESSION BOOKED — Slot: ${slotId}${notes ? ` | Notes: ${notes}` : ""}`,
      },
    });

    // Send confirmation email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Session Confirmed — The Living Codex™ Journey",
        html: `<p>Your Threshold Session has been booked. A calendar invite with Zoom details will follow.</p>`,
      });
    }

    // Notify April
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (admin?.email) {
      await sendEmail({
        to: admin.email,
        subject: `New Session Booking — ${user.name || user.email}`,
        html: `<p><strong>${user.name || user.email}</strong> booked slot ${slotId}.</p>${notes ? `<p>Notes: ${notes}</p>` : ""}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
