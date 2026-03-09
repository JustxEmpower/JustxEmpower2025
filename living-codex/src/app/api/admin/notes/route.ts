import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { userId, content } = await req.json();

    if (!userId || !content) {
      return NextResponse.json({ error: "userId and content required" }, { status: 400 });
    }

    await prisma.adminNote.create({
      data: { userId, content },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin note error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
