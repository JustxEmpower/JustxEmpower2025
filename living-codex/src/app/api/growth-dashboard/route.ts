import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [streak, milestones, companion, prediction, events, patternShifts, checkInCount, dialogueCount] =
      await Promise.all([
        prisma.userStreak.findUnique({ where: { userId: user.id } }),
        prisma.milestone.findMany({ where: { userId: user.id }, orderBy: { earnedAt: "desc" }, take: 10 }),
        prisma.companionState.findUnique({ where: { userId: user.id } }),
        prisma.prediction.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
        prisma.codexEvent.findMany({ where: { userId: user.id }, orderBy: { emittedAt: "desc" }, take: 10 }),
        prisma.patternShift.findMany({ where: { userId: user.id }, orderBy: { detectedAt: "desc" }, take: 5 }),
        prisma.checkIn.count({ where: { userId: user.id } }),
        prisma.dialogueSession.count({ where: { userId: user.id } }),
      ]);

    return NextResponse.json({
      streak,
      milestones,
      companion,
      prediction: prediction
        ? {
            ...prediction,
            predictionData: prediction.predictionData ? JSON.parse(prediction.predictionData) : null,
          }
        : null,
      events: events.map((e) => ({
        ...e,
        eventData: e.eventData ? JSON.parse(e.eventData) : null,
      })),
      patternShifts,
      stats: { checkInCount, dialogueCount },
    });
  } catch (error) {
    console.error("Growth dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
