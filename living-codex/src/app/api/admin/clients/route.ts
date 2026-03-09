import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      where: { role: "client" },
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
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const clients = users.map((user) => {
      const assessment = user.assessments[0];
      const scoring = assessment?.scoring
        ? JSON.parse(assessment.scoring.resultJson)
        : null;
      const mirrorReport = user.mirrorReports[0];

      return {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        tier: user.tier,
        assessmentStatus: assessment?.status || "not_started",
        currentSection: assessment?.currentSection || 0,
        topArchetypes: scoring?.archetypeConstellation
          ?.slice(0, 3)
          .map((a: { archetype: string }) => a.archetype) || [],
        mirrorReportStatus: mirrorReport?.status || "pending",
        scrollProgress: 0,
        notes: user.notes.map((n) => n.content),
      };
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Admin clients error:", error);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}
