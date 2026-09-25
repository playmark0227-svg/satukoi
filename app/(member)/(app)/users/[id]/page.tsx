import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { IS_DEMO, getDemoMember } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { PRICING } from "@/lib/constants";
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
import { UserPhoto } from "@/components/member/UserPhoto";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BadgeVerified, BadgeCrown, IconChevronRight } from "@/components/member/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea, Select } from "@/components/ui/Input";
import { applyToUser, blockUser, reportUser } from "./actions";

/** 1行の項目表示（ラベル：値） */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
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

  // お相手との現在の関係（マッチ中／申込済み／申込を受け取っている）
  const pair = [
    { applicantId: me.id, receiverId: user.id },
    { applicantId: user.id, receiverId: me.id },
  ];
  const [activeMatch, myPending, theirPending] = await Promise.all([
    prisma.match.findFirst({
      where: { phase: { in: ["SCHEDULING", "CONFIRMED"] }, OR: pair },
      select: { id: true, phase: true },
    }),
    prisma.dateApplication.findFirst({
      where: { applicantId: me.id, receiverId: user.id, status: "PENDING" },
      select: { id: true },
    }),
    prisma.dateApplication.findFirst({
      where: { applicantId: user.id, receiverId: me.id, status: "PENDING" },
      select: { id: true },
    }),
  ]);
  const canApply = !activeMatch && !myPending && !theirPending;

  const holidayText =
    user.holidayType === "OTHER_FIXED" && user.fixedHolidays.length > 0
      ? `${HOLIDAY_TYPE_LABELS[user.holidayType]}（${user.fixedHolidays
          .map((w) => WEEKDAY_LABELS[w])
          .join("・")}）`
      : HOLIDAY_TYPE_LABELS[user.holidayType];

  // ハイライト（Instagram のストーリーハイライト風の丸）に出す短い項目
  const highlights = [
    { label: "身長", value: `${user.heightCm}cm` },
    { label: "体型", value: BODY_TYPE_LABELS[user.bodyType] },
    { label: "休日", value: user.holidayType === "OTHER_FIXED" ? "固定曜日" : HOLIDAY_TYPE_LABELS[user.holidayType] },
    { label: "タバコ", value: SMOKING_LABELS[user.smoking] },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title={user.nickname} backHref="/users" />

      {/* 写真（投稿のように端から端まで） */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-surface-alt">
        <UserPhoto url={user.photos[0]?.url} name={user.nickname} size="lg" />
      </div>

      {/* 名前・自己紹介 */}
      <section className="px-4 pt-3.5">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-xl font-bold text-ink">{user.nickname}</h2>
          {user.incomeCertVerified && <BadgeVerified className="shrink-0" />}
          {user.accountType === "SALON" && <BadgeCrown className="shrink-0" />}
          <span className="num-tnum ml-auto shrink-0 rounded-md bg-primary-tint px-2 py-1 text-xs font-semibold text-primary">
            AI相性 {compat}%
          </span>
        </div>
        <p className="num-tnum mt-0.5 text-sm text-ink-soft">
          {calcAge(user.birthDate)}歳・{RESIDENCE_AREA_LABELS[user.residenceArea]}
          {ELIGIBILITY_LABELS[user.eligibilityType]}・{user.occupation}
        </p>
        {user.selfIntroduction && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {user.selfIntroduction}
          </p>
        )}

        {/* ハイライト */}
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {highlights.map((h) => (
            <li key={h.label} className="flex flex-col items-center gap-1">
              <span className="story-ring-seen">
                <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#fafafa] px-1 text-center text-[12px] font-semibold leading-tight text-ink">
                  {h.value}
                </span>
              </span>
              <span className="text-[11px] text-ink-soft">{h.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="stagger mt-4 space-y-1 border-t border-line-soft pb-6">
        {/* 基本情報 */}
        <section className="px-4 pt-4">
          <h3 className="pb-1 text-[15px] font-bold text-ink">基本情報</h3>
          <div className="divide-y divide-line-soft">
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
          </div>
        </section>

        {/* プロフィール詳細 */}
        <section className="px-4 pt-4">
          <h3 className="pb-1 text-[15px] font-bold text-ink">プロフィール</h3>
          <div className="divide-y divide-line-soft">
            <Row label="身長" value={`${user.heightCm}cm`} />
            <Row label="体型" value={BODY_TYPE_LABELS[user.bodyType]} />
            <Row label="タバコ" value={SMOKING_LABELS[user.smoking]} />
            <Row label="お酒" value={DRINKING_LABELS[user.drinking]} />
            <Row label="婚姻歴" value={YES_NO[String(user.hasMarriageHistory) as "true" | "false"]} />
            <Row label="子供" value={YES_NO[String(user.hasChildren) as "true" | "false"]} />
            <Row label="将来子供は？" value={CHILDREN_WISH_LABELS[user.childrenWish]} />
            <Row label="資格" value={user.qualifications || "ー"} />
            <Row label="趣味" value={user.hobbies || "ー"} />
          </div>
        </section>

        {/* デート申込み（申込可能なときだけフォームを表示） */}
        {canApply && (
          <section id="apply" className="scroll-mt-14 px-4 pt-6">
            <h3 className="pb-2 text-[15px] font-bold text-ink">デートを申し込む</h3>
            <form action={applyToUser} className="space-y-3">
              <input type="hidden" name="targetId" value={user.id} />
              <Field label="メッセージ（任意）" hint="お申込みと一緒にお相手へ届きます。">
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
              <p className="text-center text-[11px] leading-relaxed text-ink-faint">
                {`お申込みの時点では料金はかかりません。日程が確定した時点でデート代 ${PRICING.DATE_FEE.toLocaleString("ja-JP")}円 をお支払いいただきます。`}
              </p>
            </form>
          </section>
        )}

        {/* ブロック / 通報 */}
        <section className="px-4 pt-6">
          <div className="divide-y divide-line-soft border-y border-line-soft">
            <form action={blockUser} className="flex items-center justify-between gap-3 py-3">
              <input type="hidden" name="targetId" value={user.id} />
              <span className="text-xs leading-relaxed text-ink-soft">
                ブロックすると、今後お互いに表示されなくなります。
              </span>
              <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                ブロック
              </Button>
            </form>
            <details className="group py-3">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-danger">
                この会員を通報する
                <IconChevronRight className="h-4 w-4 text-ink-faint transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <form action={reportUser} className="details-body mt-3 space-y-3">
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
          </div>
        </section>
      </div>

      {/* 画面下の固定アクション（プロフィール閲覧中はタブバーの代わりに表示） */}
      <div className="sticky bottom-0 z-20 border-t border-line-soft bg-surface px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5">
        {activeMatch ? (
          <ButtonLink href={`/matches/${activeMatch.id}`} size="lg">
            {activeMatch.phase === "CONFIRMED" ? "デートの予定を見る" : "マッチ成立中・日程調整へ"}
            <IconChevronRight className="h-4 w-4" />
          </ButtonLink>
        ) : theirPending ? (
          <ButtonLink href="/applications" size="lg">
            お申込みが届いています・確認する
            <IconChevronRight className="h-4 w-4" />
          </ButtonLink>
        ) : myPending ? (
          <div className="flex h-11 w-full items-center justify-center rounded-lg bg-surface-alt text-sm font-semibold text-ink-soft">
            お申込み済み・お返事をお待ちください
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="shrink-0 text-center">
              <p className="text-[10px] font-semibold text-ink-soft">AI相性</p>
              <p className="num-tnum text-lg font-bold leading-tight text-ink">{compat}%</p>
            </div>
            <ButtonLink href="#apply" size="lg" className="flex-1">
              デートを申し込む
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}

