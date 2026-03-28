import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const layers = await prisma.scrollLayer.findMany({
      where: { userId: user.id },
      orderBy: { layer: "asc" },
    });

    return NextResponse.json({
      layers: layers.map((l) => ({
        ...l,
        unlockProgress: l.unlockProgress ? JSON.parse(l.unlockProgress) : null,
        contentData: l.contentData ? JSON.parse(l.contentData) : null,
      })),
      totalUnlocked: layers.filter((l) => !l.sealed).length,
    });
  } catch (error) {
    console.error("Sealed scroll GET error:", error);
    return NextResponse.json({ error: "Failed to load scroll layers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { layerId, interactionType, responseText } = await req.json();

    await prisma.scrollInteraction.create({
      data: {
        id: `si_${Date.now().toString(36)}`,
        userId: user.id,
        layerId,
        interactionType,
        responseText: responseText || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sealed scroll POST error:", error);
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 });
  }
}
