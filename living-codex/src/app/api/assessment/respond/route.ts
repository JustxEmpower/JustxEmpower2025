import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sectionNum, questionId, answerCode, openText, isGhost } = body;

    // Find or create in-progress assessment for this user
    let assessment = await prisma.assessment.findFirst({
      where: { userId: user.id, status: { not: "complete" } },
      orderBy: { createdAt: "desc" },
    });

    if (!assessment) {
      assessment = await prisma.assessment.create({
        data: {
          userId: user.id,
          status: "in_progress",
          startedAt: new Date(),
        },
      });
    }

    // Upsert the response
    await prisma.response.upsert({
      where: {
        assessmentId_sectionNum_questionId: {
          assessmentId: assessment.id,
          sectionNum,
          questionId,
        },
      },
      update: {
        answerCode: answerCode || null,
        openText: openText || null,
        isGhost: isGhost || false,
        answeredAt: new Date(),
      },
      create: {
        assessmentId: assessment.id,
        sectionNum,
        questionId,
        answerCode: answerCode || null,
        openText: openText || null,
        isGhost: isGhost || false,
      },
    });

    // Update assessment progress
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        currentSection: sectionNum,
        currentQuestion: parseInt(questionId.replace(/\D/g, "")) || 1,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save response:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
