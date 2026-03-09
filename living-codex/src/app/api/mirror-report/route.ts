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
          where: { status: "complete" },
          orderBy: { completedAt: "desc" },
          take: 1,
          include: { scoring: true },
        },
        mirrorReports: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.assessments[0]?.scoring) {
      return NextResponse.json({ scoring: null, userName: null, aprilNote: null });
    }

    const scoring = JSON.parse(user.assessments[0].scoring.resultJson);
    const mirrorReport = user.mirrorReports[0];

    return NextResponse.json({
      userName: user.name,
      scoring,
      aprilNote: mirrorReport?.aprilNote || null,
    });
  } catch (error) {
    console.error("Mirror report error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
