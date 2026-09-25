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
  IconTicket,
  IconSend,
  IconCoffee,
  IconChevronRight,
} from "@/components/member/icons";

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="border-t-[6px] border-[#fafafa] px-4 pb-1 pt-4 text-[13px] font-semibold text-ink-soft">{label}</p>
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
      className="flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-surface-alt"
    >
      <span className="shrink-0 text-ink">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] text-ink">{label}</span>
        {subtitle && <span className="block text-xs text-ink-soft">{subtitle}</span>}
      </span>
      <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
    </Link>
  );
}

export default async function MenuPage() {
  await requireMember();
  const ink = "h-6 w-6";

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BrandHeader title="メニュー" />

      <SectionHeader label="アカウント" />
      <div className="stagger">
        <MenuRow href="/mypage/edit" icon={<IconUser className={ink} />} label="プロフィール設定" />
        <MenuRow href="/payments" icon={<IconCard className={ink} />} label="決済履歴" />
        <MenuRow href="/settings/notifications" icon={<IconBell className={ink} />} label="通知設定" />
      </div>

      <SectionHeader label="デート" />
      <div className="stagger">
        <MenuRow
          href="/applications"
          icon={<IconSend className={ink} />}
          label="お申込み"
          subtitle="受け取った申込・送った申込"
        />
        <MenuRow
          href="/partners"
          icon={<IconCoffee className={ink} />}
          label="提携パートナー"
          subtitle="デートで使う提携カフェ・特典"
        />
      </div>

      <SectionHeader label="紹介・特典" />
      <div className="stagger">
        <MenuRow
          href="/referral"
          icon={<IconGift className={ink} />}
          label="お友達を紹介する"
          subtitle="両者にデート無料特典"
        />
        <MenuRow
          href="/tickets"
          icon={<IconTicket className={ink} />}
          label="ギフト券"
          subtitle="提携店で使える金券"
        />
      </div>

      <SectionHeader label="サポート" />
      <div className="stagger">
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
