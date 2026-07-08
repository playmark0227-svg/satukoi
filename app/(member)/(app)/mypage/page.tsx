import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import {
  IconPencil,
  IconHeart,
  IconSend,
  IconChat,
  IconCrown,
  IconBuilding,
} from "@/components/member/icons";

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <CountUp value={n} className={`text-display num-tnum text-3xl font-medium ${color}`} />
      <span className="mt-1 text-xs text-ink-soft">{label}</span>
    </div>
  );
}

function Row({
  href,
  icon,
  iconClass,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-alt/50"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5">
        ›
      </span>
    </Link>
  );
}

/** プロフィール充実度（任意項目の充足率）。実アプリ定番の改善促進UI。 */
function profileCompleteness(me: {
  photos: { url: string }[];
  selfIntroduction: string | null;
  hobbies: string | null;
  qualifications: string | null;
  incomeCertVerified: boolean;
}): { percent: number; hint: string | null } {
  const items: [boolean, string][] = [
    [me.photos.length > 0, "写真を追加すると印象が大きく変わります"],
    [!!me.selfIntroduction, "自己紹介を書くと申し込みが通りやすくなります"],
    [!!me.hobbies, "趣味を追加すると会話のきっかけになります"],
    [!!me.qualifications, "資格を追加すると信頼感がアップします"],
    [me.incomeCertVerified, "所得証明を提出すると年収が公開されます"],
  ];
  const done = items.filter(([ok]) => ok).length;
  const firstMissing = items.find(([ok]) => !ok);
  return {
    percent: Math.round((done / items.length) * 100),
    hint: firstMissing ? firstMissing[1] : null,
  };
}

export default async function MyPage() {
  const me = await requireMember();

  const [matchCount, sentCount, receivedCount] = await Promise.all([
    prisma.match.count({
      where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
    }),
    prisma.dateApplication.count({ where: { applicantId: me.id } }),
    prisma.dateApplication.count({ where: { receiverId: me.id } }),
  ]);

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BrandHeader />

      <div className="space-y-5 px-4 py-5">
        {/* プロフィール */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-4">
            <Avatar
              url={me.photos[0]?.url}
              name={me.nickname}
              className="animate-scale-in h-20 w-20 shrink-0 text-2xl"
            />
            <div className="min-w-0">
              <p className="text-display truncate text-3xl font-medium text-ink">
                {me.nickname}
              </p>
              <p className="num-tnum mt-1 text-sm text-ink-soft">
                {calcAge(me.birthDate)}歳 / {RESIDENCE_AREA_LABELS[me.residenceArea]}
              </p>
            </div>
          </div>
          {/* プロフィール充実度 */}
          {(() => {
            const { percent, hint } = profileCompleteness(me);
            return (
              <div className="mt-4 rounded-2xl border border-line bg-surface p-3.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-bold text-ink-soft">プロフィール充実度</p>
                  <p className="num-tnum text-sm font-black text-primary">{percent}%</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {hint && (
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                    {hint}
                  </p>
                )}
              </div>
            );
          })()}

          <ButtonLink href="/mypage/edit" size="lg" className="mt-3">
            <IconPencil className="h-5 w-5" />
            プロフィールを編集
          </ButtonLink>
        </div>

        {/* スタッツ */}
        <div
          style={{ animationDelay: "60ms" }}
          className="animate-fade-up grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-4"
        >
          <Stat n={matchCount} label="マッチング" color="text-ink" />
          <Stat n={sentCount} label="申し込み" color="text-ink" />
          <Stat n={receivedCount} label="申し受け" color="text-ink" />
        </div>

        {/* 導線リスト */}
        <div
          style={{ animationDelay: "120ms" }}
          className="animate-fade-up divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <Row
            href="/matches"
            icon={<IconHeart className="h-5 w-5" />}
            iconClass="bg-surface-alt text-ink-soft"
            label="マッチング履歴"
          />
          <Row
            href="/applications?tab=sent"
            icon={<IconSend className="h-5 w-5" />}
            iconClass="bg-surface-alt text-ink-soft"
            label="申し込み"
          />
          <Row
            href="/applications?tab=received"
            icon={<IconChat className="h-5 w-5" />}
            iconClass="bg-surface-alt text-ink-soft"
            label="申し受け"
          />
        </div>

        {/* プレミアム（サロン）案内 */}
        <Link
          href="#"
          style={{ animationDelay: "180ms" }}
          className="animate-fade-up block rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-canvas"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <IconCrown className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                プレミアム
              </span>
              <p className="mt-1 text-[15px] font-bold text-ink">婚活サロン会員募集</p>
              <p className="num-tnum mt-1 text-[13px] leading-relaxed text-ink-soft">
                月9,900円〜でデート代無料・全国10万人以上とマッチング・専属カウンセラー
              </p>
              <p className="mt-2 text-[13px] font-bold text-primary">詳細を見る →</p>
            </div>
          </div>
        </Link>

        {/* 不動産シナジー（成婚・同棲サポート） */}
        <Link
          href="#"
          style={{ animationDelay: "240ms" }}
          className="animate-fade-up block rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-canvas"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
              <IconBuilding className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink">
                成婚・同棲のお部屋探しもサポート
              </p>
              <p className="num-tnum mt-1 text-[13px] leading-relaxed text-ink-soft">
                提携不動産でのお部屋探しで、お祝い金をキャッシュバック。新生活まで伴走します。
              </p>
              <p className="mt-2 text-[13px] font-bold text-primary">詳細を見る →</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
