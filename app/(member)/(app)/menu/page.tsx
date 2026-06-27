import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { BrandHeader } from "@/components/member/BrandHeader";
import { Button } from "@/components/ui/Button";
import {
  IconUser,
  IconCard,
  IconBell,
  IconGift,
  IconQuestion,
  IconChat,
  IconDoc,
  IconShield,
  IconBuilding,
} from "@/components/member/icons";

type Tone = "neutral" | "primary" | "info";

function SectionHeader({ label, tone }: { label: string; tone: Tone }) {
  const cls =
    tone === "primary"
      ? "text-primary"
      : tone === "info"
        ? "text-gold"
        : "text-ink-soft";
  return (
    <p className={`text-display bg-surface-alt px-4 py-2.5 text-xs font-medium tracking-wide ${cls}`}>
      {label}
    </p>
  );
}

function MenuRow({
  href,
  icon,
  label,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-canvas">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {subtitle && (
          <span className="mt-0.5 block text-xs text-ink-faint">{subtitle}</span>
        )}
      </span>
      <span className="text-ink-faint">›</span>
    </Link>
  );
}

export default async function MenuPage() {
  await requireMember();
  const ink = "h-[22px] w-[22px] text-ink-soft";
  const blue = "h-[22px] w-[22px] text-gold";

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BrandHeader />

      <SectionHeader label="アカウント" tone="neutral" />
      <div className="divide-y divide-line bg-surface">
        <MenuRow href="/mypage/edit" icon={<IconUser className={ink} />} label="プロフィール設定" />
        <MenuRow href="/payments" icon={<IconCard className={ink} />} label="決済履歴" />
        <MenuRow href="/settings/notifications" icon={<IconBell className={ink} />} label="通知設定" />
      </div>

      <SectionHeader label="紹介特典" tone="primary" />
      <div className="divide-y divide-line bg-surface">
        <MenuRow
          href="/referral"
          icon={<IconGift className="h-[22px] w-[22px] text-primary" />}
          label="お友達を紹介する"
          subtitle="両者にデート無料特典"
        />
      </div>

      <SectionHeader label="サポート" tone="info" />
      <div className="divide-y divide-line bg-surface">
        <MenuRow href="/info/faq" icon={<IconQuestion className={blue} />} label="よくある質問" />
        <MenuRow href="/contact" icon={<IconChat className={blue} />} label="お問い合わせ" />
        <MenuRow href="/info/terms" icon={<IconDoc className={blue} />} label="利用規約" />
        <MenuRow href="/info/privacy" icon={<IconShield className={blue} />} label="プライバシーポリシー" />
        <MenuRow href="/info/company" icon={<IconBuilding className={blue} />} label="運営会社" />
      </div>

      {!IS_DEMO && (
        <div className="px-4 py-6">
          <form action="/logout" method="post">
            <Button type="submit" variant="outline" size="lg">
              ログアウト
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
