import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { moduleNum, promptId, responseText } = await req.json();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.scrollEntry.upsert({
      where: {
        userId_moduleNum_promptId: {
          userId: user.id,
          moduleNum,
          promptId,
        },
      },
      update: { responseText },
      create: {
        userId: user.id,
        moduleNum,
        promptId,
        responseText,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scroll respond error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
