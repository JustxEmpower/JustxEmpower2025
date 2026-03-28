import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

const OPENING_PROMPTS: Record<string, string> = {
  discovery: "What part of yourself have you been afraid to look at?",
  integration: "What truth are you beginning to accept about your patterns?",
  threshold: "What would it mean to step fully into your power?",
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activeSession = await prisma.dialogueSession.findFirst({
      where: { userId: user.id, status: "active" },
      include: { exchanges: { orderBy: { exchangeIndex: "asc" } } },
    });

    const pastSessions = await prisma.dialogueSession.findMany({
      where: { userId: user.id, status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const revelations = await prisma.microRevelation.findMany({
      where: { userId: user.id, viewed: false },
      take: 3,
    });

    const activeChallenge = await prisma.realWorldChallenge.findFirst({
      where: { userId: user.id, completedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activeSession, pastSessions, revelations, activeChallenge });
  } catch (error) {
    console.error("Dialogue GET error:", error);
    return NextResponse.json({ error: "Failed to load dialogue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, type, sessionId, response, revelationId } = body;

    if (action === "start") {
      const dialogueType = type || "discovery";
      const session = await prisma.dialogueSession.create({
        data: {
          id: `ds_${Date.now().toString(36)}`,
          userId: user.id,
          type: dialogueType,
          status: "active",
        },
      });

      const exchange = await prisma.dialogueExchange.create({
        data: {
          id: `dx_${Date.now().toString(36)}`,
          sessionId: session.id,
          exchangeIndex: 0,
          guidePrompt: OPENING_PROMPTS[dialogueType] || OPENING_PROMPTS.discovery,
        },
      });

      return NextResponse.json({
        session: { ...session, exchanges: [exchange] },
      });
    }

    if (action === "respond" && sessionId && response) {
      const session = await prisma.dialogueSession.findUnique({
        where: { id: sessionId },
        include: { exchanges: { orderBy: { exchangeIndex: "asc" } } },
      });
      if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

      const lastExchange = session.exchanges[session.exchanges.length - 1];
      if (lastExchange && !lastExchange.userResponse) {
        await prisma.dialogueExchange.update({
          where: { id: lastExchange.id },
          data: { userResponse: response },
        });
      }

      const nextPrompt = generateReflection(session.exchanges.length);
      const newExchange = await prisma.dialogueExchange.create({
        data: {
          id: `dx_${Date.now().toString(36)}_${session.exchanges.length}`,
          sessionId: session.id,
          exchangeIndex: session.exchanges.length,
          guidePrompt: nextPrompt,
        },
      });

      await prisma.dialogueSession.update({
        where: { id: sessionId },
        data: { exchangeCount: session.exchanges.length + 1 },
      });

      const updated = await prisma.dialogueSession.findUnique({
        where: { id: sessionId },
        include: { exchanges: { orderBy: { exchangeIndex: "asc" } } },
      });

      return NextResponse.json({ session: updated });
    }

    if (action === "complete" && sessionId) {
      const updated = await prisma.dialogueSession.update({
        where: { id: sessionId },
        data: { status: "completed" },
        include: { exchanges: { orderBy: { exchangeIndex: "asc" } } },
      });
      return NextResponse.json({ session: updated });
    }

    if (action === "markRevelationViewed" && revelationId) {
      await prisma.microRevelation.update({
        where: { id: revelationId },
        data: { viewed: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Dialogue POST error:", error);
    return NextResponse.json({ error: "Failed to process dialogue" }, { status: 500 });
  }
}

function generateReflection(depth: number): string {
  const reflections = [
    "I hear something important in what you shared. What lives beneath that feeling?",
    "There is a pattern emerging here. Can you feel it taking shape?",
    "What you are describing touches something deeper. Where in your body do you feel this?",
    "This is the kind of truth that reveals itself in layers. What is the next layer?",
    "You are closer to something essential now. What would it mean to let this be fully seen?",
    "The wound and the gift often live in the same place. What gift might be hidden here?",
  ];
  return reflections[Math.min(depth, reflections.length - 1)];
}
