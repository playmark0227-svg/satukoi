import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  SURVEY_Q1_LABELS,
  SURVEY_Q2_LABELS,
  SURVEY_Q4_LABELS,
} from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { submitSurvey } from "./actions";

/** ラジオボタン群（選択式設問） */
function RadioGroup({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: Record<string, string>;
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(options).map(([value, label]) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:font-bold has-[:checked]:text-primary-strong"
        >
          <input
            type="radio"
            name={name}
            value={value}
            required
            defaultChecked={defaultValue === value}
            className="h-4 w-4 accent-primary"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const me = await requireMember();
  const { matchId } = await params;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [{ applicantId: me.id }, { receiverId: me.id }],
    },
    include: {
      applicant: { select: { id: true, nickname: true } },
      receiver: { select: { id: true, nickname: true } },
    },
  });
  if (!match) notFound();

  // デートが実施されていない場合は回答対象外
  if (match.phase !== "COMPLETED") redirect("/matches");

  const partner = match.applicantId === me.id ? match.receiver : match.applicant;

  // 既存回答（編集再送信に対応）
  const existing = await prisma.surveyResponse.findUnique({
    where: { matchId_memberId: { matchId, memberId: me.id } },
  });

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="デート後アンケート" backHref="/matches" />

      <div className="px-4 py-4">
        <Card className="mb-4">
          <CardBody>
            <p className="text-sm leading-relaxed text-ink-soft">
              {partner.nickname}さんとのデート、お疲れさまでした。
              今後のサービス改善のため、5つの質問にお答えください。
              ご回答内容はお相手には公開されません。
            </p>
          </CardBody>
        </Card>

        <form action={submitSurvey} className="space-y-5">
          <input type="hidden" name="matchId" value={match.id} />

          <Field label="Q1. デートは予定どおり実施できましたか？" required>
            <RadioGroup
              name="q1Implementation"
              options={SURVEY_Q1_LABELS}
              defaultValue={existing?.q1Implementation}
            />
          </Field>

          <Field label="Q2. 今回のデートの満足度は？" required>
            <RadioGroup
              name="q2Satisfaction"
              options={SURVEY_Q2_LABELS}
              defaultValue={existing?.q2Satisfaction}
            />
          </Field>

          <Field
            label="Q3. お相手への感想（200字以内）"
            hint="お相手には公開されません。"
            required
          >
            <Textarea
              name="q3Impression"
              rows={4}
              maxLength={200}
              required
              defaultValue={existing?.q3Impression ?? ""}
              placeholder="お相手の印象やデートのご感想をお書きください。"
            />
          </Field>

          <Field label="Q4. 今後のご希望は？" required>
            <RadioGroup
              name="q4Intent"
              options={SURVEY_Q4_LABELS}
              defaultValue={existing?.q4Intent}
            />
          </Field>

          <Field label="Q5. その他ご意見（任意・200字以内）">
            <Textarea
              name="q5Other"
              rows={3}
              maxLength={200}
              defaultValue={existing?.q5Other ?? ""}
              placeholder="運営へのご意見・ご要望があればお書きください。"
            />
          </Field>

          <Button type="submit" variant="primary" size="lg">
            アンケートを送信する
          </Button>
        </form>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
