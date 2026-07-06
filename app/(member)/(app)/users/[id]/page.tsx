import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { IS_DEMO, getDemoMember } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { compatScore } from "@/lib/compat";
import {
  RESIDENCE_AREA_LABELS,
  ELIGIBILITY_LABELS,
  INCOME_BRACKET_LABELS,
  HOLIDAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  BODY_TYPE_LABELS,
  SMOKING_LABELS,
  DRINKING_LABELS,
  CHILDREN_WISH_LABELS,
  YES_NO,
  REPORT_TYPE_LABELS,
} from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BadgeVerified, BadgeCrown } from "@/components/member/icons";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea, Select } from "@/components/ui/Input";
import { applyToUser, blockUser, reportUser } from "./actions";

/** 1行の項目表示（ラベル：値） */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="shrink-0 text-sm text-ink-soft">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

// 静的エクスポート（デモ）用：デモ会員が閲覧できる異性会員のみ事前生成
export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  const me = await getDemoMember();
  const opp = me.sex === "MALE" ? "FEMALE" : "MALE";
  const rows = await prisma.member.findMany({
    where: { status: "ACTIVE", sex: opp, NOT: { id: me.id } },
    select: { id: true },
  });
  return rows.map((r) => ({ id: r.id }));
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireMember();
  const { id } = await params;

  if (id === me.id) redirect("/users");

  const user = await prisma.member.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!user || user.status !== "ACTIVE" || user.sex === me.sex) notFound();

  // ブロック関係（双方どちらか）があれば閲覧不可
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me.id, blockedId: user.id },
        { blockerId: user.id, blockedId: me.id },
      ],
    },
  });
  if (blocked) redirect("/users");

  // AIによる相性スコア（デモでは決定的な擬似スコア。lib/compat.ts 参照）
  const compat = compatScore(me.id, user.id);

  const holidayText =
    user.holidayType === "OTHER_FIXED" && user.fixedHolidays.length > 0
      ? `${HOLIDAY_TYPE_LABELS[user.holidayType]}（${user.fixedHolidays
          .map((w) => WEEKDAY_LABELS[w])
          .join("・")}）`
      : HOLIDAY_TYPE_LABELS[user.holidayType];

  return (
    <div className="flex flex-1 flex-col pb-8">
      <AppHeader title={`${user.nickname}さん`} backHref="/users" />

      <div className="stagger space-y-4 px-4 py-4">
        {/* 写真＋名前（写真の下に白背景で情報。オーバーレイ文字は使わない） */}
        <Card className="overflow-hidden">
          <Avatar
            url={user.photos[0]?.url}
            name={user.nickname}
            rounded="xl"
            className="aspect-[4/5] w-full text-5xl"
          />
          <CardBody className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-lg font-bold text-ink">
                {user.nickname}
              </h2>
              {user.incomeCertVerified && <BadgeVerified className="shrink-0" />}
              {user.accountType === "SALON" && <BadgeCrown className="shrink-0" />}
              <Badge tone="primary" className="num-tnum ml-auto shrink-0">
                相性 {compat}%
              </Badge>
            </div>
            <p className="num-tnum text-sm text-ink-soft">
              {calcAge(user.birthDate)}歳・
              {RESIDENCE_AREA_LABELS[user.residenceArea]}（
              {ELIGIBILITY_LABELS[user.eligibilityType]}）・{user.occupation}
            </p>
          </CardBody>
        </Card>

        {/* サブ写真 */}
        {user.photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {user.photos.slice(1).map((p) => (
              <Avatar
                key={p.id}
                url={p.url}
                name={user.nickname}
                rounded="xl"
                className="aspect-square w-full"
              />
            ))}
          </div>
        )}

        {/* 基本情報 */}
        <div>
          <SectionTitle>基本情報</SectionTitle>
          <Card>
            <CardBody className="divide-y divide-line py-1">
              <Row label="年齢" value={`${calcAge(user.birthDate)}歳`} />
              <Row label="居住地" value={RESIDENCE_AREA_LABELS[user.residenceArea]} />
              <Row label="区分" value={ELIGIBILITY_LABELS[user.eligibilityType]} />
              <Row label="職業" value={user.occupation} />
              <Row
                label="年収"
                value={
                  user.incomeCertVerified ? (
                    INCOME_BRACKET_LABELS[user.incomeBracket]
                  ) : (
                    <span className="text-ink-faint">非公開</span>
                  )
                }
              />
              <Row label="休日" value={holidayText} />
            </CardBody>
          </Card>
        </div>

        {/* プロフィール詳細 */}
        <div>
          <SectionTitle>プロフィール</SectionTitle>
          <Card>
            <CardBody className="divide-y divide-line py-1">
              <Row label="身長" value={`${user.heightCm}cm`} />
              <Row label="体型" value={BODY_TYPE_LABELS[user.bodyType]} />
              <Row label="タバコ" value={SMOKING_LABELS[user.smoking]} />
              <Row label="お酒" value={DRINKING_LABELS[user.drinking]} />
              <Row label="婚姻歴" value={YES_NO[String(user.hasMarriageHistory) as "true" | "false"]} />
              <Row label="子供" value={YES_NO[String(user.hasChildren) as "true" | "false"]} />
              <Row label="将来子供は？" value={CHILDREN_WISH_LABELS[user.childrenWish]} />
              <Row label="資格" value={user.qualifications || "ー"} />
              <Row label="趣味" value={user.hobbies || "ー"} />
            </CardBody>
          </Card>
        </div>

        {/* 自己紹介 */}
        {user.selfIntroduction && (
          <div>
            <SectionTitle>自己紹介</SectionTitle>
            <Card>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {user.selfIntroduction}
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* デート申込み */}
        <Card>
          <CardBody>
            <SectionTitle>デートを申し込む</SectionTitle>
            <form action={applyToUser} className="space-y-3">
              <input type="hidden" name="targetId" value={user.id} />
              <Field label="メッセージ（任意）" hint="お申込み時にお相手へ届きます。">
                <Textarea
                  name="message"
                  rows={3}
                  maxLength={300}
                  placeholder="はじめまして。よろしければお会いしたいです。"
                />
              </Field>
              <Button type="submit" variant="primary" size="lg">
                {user.nickname}さんにデートを申し込む
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ブロック / 通報 */}
        <div className="space-y-2">
          <SectionTitle>その他の操作</SectionTitle>

          {/* ブロック */}
          <Card>
            <CardBody>
              <p className="mb-2 text-xs leading-relaxed text-ink-soft">
                ブロックすると、今後お互いに表示されなくなります。
              </p>
              <form action={blockUser}>
                <input type="hidden" name="targetId" value={user.id} />
                <Button type="submit" variant="outline" size="sm">
                  この会員をブロックする
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* 通報 */}
          <Card>
            <CardBody>
              <details>
                <summary className="cursor-pointer text-sm font-bold text-ink-soft">
                  この会員を通報する
                </summary>
                <form action={reportUser} className="mt-3 space-y-3">
                  <input type="hidden" name="targetId" value={user.id} />
                  <Field label="通報の種類" required>
                    <Select name="type" required defaultValue="">
                      <option value="" disabled>
                        選択してください
                      </option>
                      {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="内容" hint="状況を具体的にお書きください。">
                    <Textarea
                      name="content"
                      rows={3}
                      maxLength={500}
                      placeholder="通報の理由や状況をご記入ください。"
                    />
                  </Field>
                  <Button type="submit" variant="danger" size="sm">
                    通報する
                  </Button>
                </form>
              </details>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

