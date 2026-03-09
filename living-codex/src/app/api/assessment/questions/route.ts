import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      orderBy: { id: "asc" },
    });

    const result = [];

    for (const section of sections) {
      const questions = await prisma.question.findMany({
        where: { sectionNum: section.id },
        orderBy: { questionNum: "asc" },
        include: {
          answers: {
            orderBy: { code: "asc" },
            select: {
              code: true,
              text: true,
              // Never send scoring metadata to client
            },
          },
        },
      });

      result.push({
        sectionNum: section.id,
        title: section.title,
        glyph: section.glyph,
        subtitle: section.subtitle,
        questions: questions.map((q) => ({
          id: `Q${q.questionNum}`,
          question_text: q.questionText,
          is_ghost: q.isGhost,
          is_open_ended: q.isOpenEnded,
          answers: q.isOpenEnded
            ? []
            : q.answers.map((a) => ({
                code: a.code,
                text: a.text,
              })),
        })),
      });
    }

    return NextResponse.json({ sections: result });
  } catch (error) {
    console.error("Failed to load questions:", error);
    return NextResponse.json(
      { error: "Failed to load assessment" },
      { status: 500 }
    );
  }
}
