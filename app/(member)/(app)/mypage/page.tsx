import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { AdBanner } from "@/components/member/AdBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MemberStatusBadge } from "@/components/ui/StatusBadge";

const MENU = [
  { href: "/mypage/edit", label: "プロフィール編集", icon: "✎" },
  { href: "/matches", label: "マッチング履歴", icon: "♡" },
  { href: "/applications", label: "送った／受信した申込", icon: "✉" },
  { href: "/info/terms", label: "利用規約", icon: "📄" },
  { href: "/info/privacy", label: "プライバシーポリシー", icon: "🔒" },
  { href: "/info/company", label: "運営会社", icon: "🏢" },
  { href: "/contact", label: "お問い合わせ", icon: "✉" },
];

export default async function MyPage() {
  const me = await requireMember();

  const referralCode = await prisma.referralCode.findUnique({
    where: { memberId: me.id },
  });

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="マイページ" />

      <div className="space-y-4 px-4 py-4">
        {/* プロフィール概要 */}
        <Card>
          <CardBody className="flex items-center gap-3">
            <Avatar
              url={me.photos[0]?.url}
              name={me.nickname}
              rounded="xl"
              className="h-16 w-16 shrink-0 text-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-black text-ink">
                  {me.nickname}
                </h2>
                <Badge tone="primary">{calcAge(me.birthDate)}歳</Badge>
              </div>
              <p className="mt-0.5 text-sm text-ink-soft">
                {RESIDENCE_AREA_LABELS[me.residenceArea]}
              </p>
              <div className="mt-1.5">
                <MemberStatusBadge status={me.status} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 紹介コード */}
        <div>
          <SectionTitle>ご紹介</SectionTitle>
          <Card>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-ink-soft">あなたの紹介コード</p>
                <p className="mt-0.5 font-mono text-xl font-black tracking-wider text-primary-strong">
                  {referralCode?.code ?? "ー"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  お知り合いのご登録時にこのコードをご入力いただくと、
                  お二人にデート代無料の特典が付きます。
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2">
                <span className="text-sm font-bold text-primary-strong">
                  紹介特典（デート代無料）残数
                </span>
                <span className="text-lg font-black text-primary-strong">
                  {me.referralBonusRemaining}回
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* メニュー導線 */}
        <div>
          <SectionTitle>メニュー</SectionTitle>
          <Card>
            <nav className="divide-y divide-line">
              {MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm text-primary">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {item.label}
                  </span>
                  <span className="text-ink-faint">›</span>
                </Link>
              ))}
            </nav>
          </Card>
        </div>

        {/* 広告 */}
        <AdBanner position="MYPAGE" />

        {/* ログアウト・退会 */}
        <div className="space-y-2 pt-2">
          <form action="/logout" method="post">
            <Button type="submit" variant="outline" size="lg">
              ログアウト
            </Button>
          </form>

          <details className="rounded-2xl border border-line bg-surface">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink-soft">
              退会について
            </summary>
            <div className="space-y-3 border-t border-line px-4 py-3">
              <p className="text-xs leading-relaxed text-ink-soft">
                退会すると、プロフィール・マッチング情報はご利用いただけなくなります。
                進行中のマッチがある場合は、お手続き前にお問い合わせください。
              </p>
              <Button type="button" variant="danger" size="sm" disabled>
                退会手続きへ進む（準備中）
              </Button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

