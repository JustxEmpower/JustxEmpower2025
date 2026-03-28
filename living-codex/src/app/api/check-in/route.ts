import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

const DAILY_PROMPTS = [
  "What is your body telling you right now?",
  "What pattern did you notice today?",
  "What would your archetype say about today?",
];

const WEEKLY_PROMPTS = [
  "What shifted in you this week?",
  "Where did you feel resistance?",
  "What is ready to be released?",
  "What new pattern is emerging?",
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const checkIns = await prisma.checkIn.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const patterns = await prisma.checkInPattern.findMany({
      where: { userId: user.id },
      orderBy: { frequency: "desc" },
    });

    const streak = await prisma.userStreak.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      checkIns: checkIns.map((c) => ({
        ...c,
        questionsData: JSON.parse(c.questionsData),
        responsesData: c.responsesData ? JSON.parse(c.responsesData) : null,
        patternsExtracted: c.patternsExtracted ? JSON.parse(c.patternsExtracted) : null,
      })),
      patterns,
      streak,
    });
  } catch (error) {
    console.error("Check-in GET error:", error);
    return NextResponse.json({ error: "Failed to load check-ins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, type, checkInId, responses } = body;

    if (action === "start") {
      const prompts = type === "weekly" ? WEEKLY_PROMPTS : DAILY_PROMPTS;
      const checkIn = await prisma.checkIn.create({
        data: {
          id: `ci_${Date.now().toString(36)}`,
          userId: user.id,
          type: type || "daily",
          questionsData: JSON.stringify(prompts),
        },
      });
      return NextResponse.json({
        ...checkIn,
        questionsData: prompts,
      });
    }

    if (action === "submit" && checkInId && responses) {
      const checkIn = await prisma.checkIn.update({
        where: { id: checkInId },
        data: {
          responsesData: JSON.stringify(responses),
          completedAt: new Date(),
        },
      });
      return NextResponse.json({
        ...checkIn,
        questionsData: JSON.parse(checkIn.questionsData),
        responsesData: responses,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Check-in POST error:", error);
    return NextResponse.json({ error: "Failed to process check-in" }, { status: 500 });
  }
}
