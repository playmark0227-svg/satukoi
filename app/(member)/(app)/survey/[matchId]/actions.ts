"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { redirect } from "next/navigation";
import type {
  SurveyImplementation,
  SurveySatisfaction,
  SurveyIntent,
} from "@prisma/client";

/**
 * デート後アンケートの送信。
 * SurveyResponse を upsert（@@unique matchId_memberId）し、submittedAt を記録。
 */
export async function submitSurvey(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));

  // 自分が当事者であるマッチか確認
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ applicantId: me.id }, { receiverId: me.id }],
    },
  });
  if (!match) redirect("/matches");

  const q1Implementation = String(
    formData.get("q1Implementation")
  ) as SurveyImplementation;
  const q2Satisfaction = String(
    formData.get("q2Satisfaction")
  ) as SurveySatisfaction;
  const q3Impression = String(formData.get("q3Impression") ?? "").trim();
  const q4Intent = String(formData.get("q4Intent")) as SurveyIntent;
  const q5Other = String(formData.get("q5Other") ?? "").trim();

  const now = new Date();

  await prisma.surveyResponse.upsert({
    where: { matchId_memberId: { matchId, memberId: me.id } },
    create: {
      matchId,
      memberId: me.id,
      q1Implementation,
      q2Satisfaction,
      q3Impression,
      q4Intent,
      q5Other: q5Other || null,
      submittedAt: now,
    },
    update: {
      q1Implementation,
      q2Satisfaction,
      q3Impression,
      q4Intent,
      q5Other: q5Other || null,
      submittedAt: now,
    },
  });

  redirect("/matches");
}
