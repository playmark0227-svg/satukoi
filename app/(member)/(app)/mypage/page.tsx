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
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <span className="text-ink-faint">›</span>
    </Link>
  );
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
              className="h-20 w-20 shrink-0 text-2xl"
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
          <ButtonLink href="/mypage/edit" size="lg" className="mt-4">
            <IconPencil className="h-5 w-5" />
            プロフィールを編集
          </ButtonLink>
        </div>

        {/* スタッツ */}
        <div
          style={{ animationDelay: "90ms" }}
          className="animate-fade-up grid grid-cols-3 divide-x divide-line rounded-2xl border border-line/70 bg-surface py-4 shadow-[var(--shadow-card)]"
        >
          <Stat n={matchCount} label="マッチング" color="text-ink" />
          <Stat n={sentCount} label="申し込み" color="text-ink" />
          <Stat n={receivedCount} label="申し受け" color="text-ink" />
        </div>

        {/* 導線リスト */}
        <div
          style={{ animationDelay: "180ms" }}
          className="animate-fade-up divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-[var(--shadow-card)]"
        >
          <Row
            href="/matches"
            icon={<IconHeart className="h-5 w-5" />}
            iconClass="bg-primary-soft text-primary"
            label="マッチング履歴"
          />
          <Row
            href="/applications?tab=sent"
            icon={<IconSend className="h-5 w-5" />}
            iconClass="bg-info-soft text-info"
            label="申し込み"
          />
          <Row
            href="/applications?tab=received"
            icon={<IconChat className="h-5 w-5" />}
            iconClass="bg-surface-alt text-gold"
            label="申し受け"
          />
        </div>

        {/* プレミアム（サロン）バナー */}
        <Link
          href="#"
          style={{ animationDelay: "270ms" }}
          className="animate-fade-up relative block overflow-hidden rounded-2xl border border-gold-soft bg-surface p-5"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gold" />
          <div className="flex items-start gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-alt text-gold"
              style={{ boxShadow: "inset 0 0 0 1px var(--color-gold)" }}
            >
              <IconCrown className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <span className="caps-label text-[11px] font-semibold text-gold">
                PREMIUM
              </span>
              <p className="text-display mt-1 text-base text-ink">婚活サロン会員募集</p>
              <p className="num-tnum mt-1 text-sm leading-relaxed text-ink-soft">
                月9,900円〜でデート代無料・全国10万人以上とマッチング・専属カウンセラー
              </p>
              <p className="mt-2 text-sm font-semibold text-primary">詳細を見る →</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
