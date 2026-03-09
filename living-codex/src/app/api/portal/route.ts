import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { scoring: true },
        },
        mirrorReports: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const assessment = user.assessments[0] || null;
    const scoring = assessment?.scoring || null;
    const mirrorReport = user.mirrorReports[0] || null;

    return NextResponse.json({
      user: {
        name: user.name,
        tier: user.tier,
        purchaseDate: user.purchaseDate?.toISOString() || null,
      },
      assessment: assessment
        ? {
            status: assessment.status,
            currentSection: assessment.currentSection,
            currentQuestion: assessment.currentQuestion,
          }
        : null,
      scoring: scoring
        ? { resultJson: scoring.resultJson }
        : null,
      mirrorReport: mirrorReport
        ? {
            status: mirrorReport.status,
            releasedAt: mirrorReport.releasedAt?.toISOString() || null,
          }
        : null,
    });
  } catch (error) {
    console.error("Portal data error:", error);
    return NextResponse.json({ error: "Failed to load portal" }, { status: 500 });
  }
}
