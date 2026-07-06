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
  IconSparkle,
} from "@/components/member/icons";

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pb-2 pt-6 text-xs font-bold text-ink-faint">{label}</p>
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
    <Link
      href={href}
      className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-alt/50"
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {subtitle && (
          <span className="mt-0.5 block text-xs text-ink-faint">{subtitle}</span>
        )}
      </span>
      <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5">
        ›
      </span>
    </Link>
  );
}

export default async function MenuPage() {
  await requireMember();
  const ink = "h-[22px] w-[22px] text-ink-soft";

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BrandHeader />

      <SectionHeader label="アカウント" />
      <div className="stagger divide-y divide-line border-y border-line bg-surface">
        <MenuRow href="/mypage/edit" icon={<IconUser className={ink} />} label="プロフィール設定" />
        <MenuRow href="/payments" icon={<IconCard className={ink} />} label="決済履歴" />
        <MenuRow href="/settings/notifications" icon={<IconBell className={ink} />} label="通知設定" />
      </div>

      <SectionHeader label="相談" />
      <div className="stagger divide-y divide-line border-y border-line bg-surface">
        <MenuRow
          href="/advisor"
          icon={<IconSparkle className={ink} />}
          label="AIアドバイザー"
          subtitle="恋愛・活動の悩みをAIに相談"
        />
      </div>

      <SectionHeader label="紹介・特典" />
      <div className="stagger divide-y divide-line border-y border-line bg-surface">
        <MenuRow
          href="/referral"
          icon={<IconGift className={ink} />}
          label="お友達を紹介する"
          subtitle="両者にデート無料特典"
        />
        <MenuRow
          href="/tickets"
          icon={<IconCard className={ink} />}
          label="ギフト券"
          subtitle="提携店で使える金券"
        />
      </div>

      <SectionHeader label="サポート" />
      <div className="stagger divide-y divide-line border-y border-line bg-surface">
        <MenuRow href="/info/faq" icon={<IconQuestion className={ink} />} label="よくある質問" />
        <MenuRow href="/contact" icon={<IconChat className={ink} />} label="お問い合わせ" />
        <MenuRow href="/info/terms" icon={<IconDoc className={ink} />} label="利用規約" />
        <MenuRow href="/info/privacy" icon={<IconShield className={ink} />} label="プライバシーポリシー" />
        <MenuRow href="/info/company" icon={<IconBuilding className={ink} />} label="運営会社" />
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

      <p className="mt-auto pb-8 pt-10 text-center text-[11px] text-ink-faint">
        サツコイ！（仮） ver 0.1
      </p>
    </div>
  );
}
