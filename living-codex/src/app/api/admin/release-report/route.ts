import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { sendMirrorReportReleasedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { userId, aprilNote } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Find the user's latest completed assessment with scoring
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: {
          where: { status: "complete" },
          orderBy: { completedAt: "desc" },
          take: 1,
          include: { scoring: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const assessment = user.assessments[0];
    if (!assessment?.scoring) {
      return NextResponse.json({ error: "No scored assessment found" }, { status: 404 });
    }

    // Create or update mirror report
    const existing = await prisma.mirrorReport.findFirst({
      where: { userId },
      orderBy: { generatedAt: "desc" },
    });

    if (existing) {
      await prisma.mirrorReport.update({
        where: { id: existing.id },
        data: {
          status: "released",
          releasedAt: new Date(),
          aprilNote: aprilNote || null,
          contentJson: assessment.scoring.resultJson,
        },
      });
    } else {
      await prisma.mirrorReport.create({
        data: {
          userId,
          assessmentId: assessment.id,
          status: "released",
          releasedAt: new Date(),
          aprilNote: aprilNote || null,
          contentJson: assessment.scoring.resultJson,
        },
      });
    }

    // Send email notification
    if (user.email) {
      await sendMirrorReportReleasedEmail(user.email, user.name || "");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Release report error:", error);
    return NextResponse.json({ error: "Failed to release report" }, { status: 500 });
  }
}
