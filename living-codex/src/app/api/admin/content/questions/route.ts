import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const sectionNum = parseInt(req.nextUrl.searchParams.get("section") || "0");
    if (!sectionNum) {
      return NextResponse.json({ error: "section param required" }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: { sectionNum },
      orderBy: { questionNum: "asc" },
      include: {
        answers: {
          orderBy: { code: "asc" },
          select: {
            code: true,
            text: true,
            spectrumDepth: true,
            arPrimary: true,
            arSecondary: true,
            wi: true,
            mp: true,
            mmi: true,
            abi: true,
            epcl: true,
            wombField: true,
          },
        },
      },
    });

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        questionNum: q.questionNum,
        questionText: q.questionText,
        isGhost: q.isGhost,
        isOpenEnded: q.isOpenEnded,
        answers: q.answers,
      })),
    });
  } catch (error) {
    console.error("Content questions error:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}
