import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runScoringEngine, type AnswerMetadata, type ResponseRecord } from "@/lib/scoring-engine";
import { sendAssessmentCompleteEmail, sendSafetyReferralEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { userId: user.id, status: "in_progress" },
      orderBy: { createdAt: "desc" },
      include: { responses: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "No active assessment" }, { status: 404 });
    }

    // Build answer lookup from database
    const answerLookup = new Map<string, AnswerMetadata>();
    const allAnswers = await prisma.answer.findMany({
      include: { question: true },
    });

    for (const a of allAnswers) {
      const key = `${a.question.sectionNum}-Q${a.question.questionNum}-${a.code}`;
      answerLookup.set(key, {
        code: a.code,
        spectrumDepth: a.spectrumDepth,
        arPrimary: a.arPrimary,
        arSecondary: a.arSecondary,
        wi: a.wi,
        mp: a.mp,
        mmi: a.mmi || undefined,
        abi: a.abi || undefined,
        epcl: a.epcl || undefined,
        wombField: a.wombField || undefined,
      });
    }

    // Map responses
    const responses: ResponseRecord[] = assessment.responses.map((r) => ({
      sectionNum: r.sectionNum,
      questionId: r.questionId,
      answerCode: r.answerCode,
      openText: r.openText,
      isGhost: r.isGhost,
    }));

    // Run scoring engine
    const result = runScoringEngine(responses, answerLookup);

    // Save scoring result
    await prisma.scoring.upsert({
      where: { assessmentId: assessment.id },
      update: { resultJson: JSON.stringify(result), scoredAt: new Date() },
      create: {
        assessmentId: assessment.id,
        resultJson: JSON.stringify(result),
      },
    });

    // Mark assessment complete
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: "complete", completedAt: new Date() },
    });

    // Send triggered emails
    if (user.email) {
      await sendAssessmentCompleteEmail(user.email, user.name || "");

      // Safety referral if S14 abuse bond patterns detected
      if (result.abuseBond && result.abuseBond.patterns.length > 0 && result.abuseBond.noneOfAboveCount === 0) {
        await sendSafetyReferralEmail(user.email, user.name || "");
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Scoring failed:", error);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
