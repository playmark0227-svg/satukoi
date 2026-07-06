import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { GIFT_TICKET_AMOUNT } from "@/lib/constants";
import { IconGift } from "@/components/member/icons";

export default async function ReferralPage() {
  const me = await requireMember();
  const code = await prisma.referralCode.findUnique({
    where: { memberId: me.id },
  });

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="お友達を紹介する" backHref="/menu" />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-soft">
                <IconGift className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-ink-soft">
                お知り合いのご登録時にこのコードをご入力いただくと、お二人に
                <b className="text-primary-strong">デート代無料</b>の特典が付きます。
              </p>
            </div>
            <ul className="num-tnum space-y-1 rounded-xl bg-surface-alt/60 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              <li>特典① デート代無料 1回</li>
              <li>
                特典② 提携店ギフト券 {GIFT_TICKET_AMOUNT.toLocaleString("ja-JP")}
                円分
              </li>
            </ul>
            <div className="rounded-xl border border-dashed border-line bg-surface-alt/60 px-4 py-3">
              <p className="text-xs font-bold text-ink-faint">紹介コード</p>
              <p className="num-tnum mt-1 font-mono text-2xl font-bold tracking-widest text-ink">
                {code?.code ?? "ー"}
              </p>
            </div>
            <Link
              href="/tickets"
              className="inline-block text-[13px] font-bold text-primary"
            >
              保有ギフト券を見る →
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">紹介特典（デート代無料）残数</span>
            <span className="text-xl font-black text-primary-strong">
              {me.referralBonusRemaining}回
            </span>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
