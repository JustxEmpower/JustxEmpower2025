import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();

    const sections = await prisma.section.findMany({
      orderBy: { id: "asc" },
    });

    const result = [];
    for (const s of sections) {
      const questionCount = await prisma.question.count({ where: { sectionNum: s.id } });
      const answerCount = await prisma.answer.count({
        where: { question: { sectionNum: s.id } },
      });

      result.push({
        id: s.id,
        title: s.title,
        glyph: s.glyph,
        subtitle: s.subtitle,
        questionCount,
        answerCount,
      });
    }

    return NextResponse.json({ sections: result });
  } catch (error) {
    console.error("Content sections error:", error);
    return NextResponse.json({ error: "Failed to load sections" }, { status: 500 });
  }
}
