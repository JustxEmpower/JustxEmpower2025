import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.scrollEntry.findMany({
      where: { userId: user.id },
      select: { moduleNum: true, promptId: true, responseText: true },
    });

    return NextResponse.json({
      responses: entries.map((e) => ({
        moduleNum: e.moduleNum,
        promptId: e.promptId,
        responseText: e.responseText || "",
      })),
    });
  } catch (error) {
    console.error("Scroll responses error:", error);
    return NextResponse.json({ responses: [] });
  }
}
