import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
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
        <div className="flex flex-col items-center rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-tint to-surface p-6 text-center shadow-[var(--shadow-card)]">
          <span className="bg-brand-gradient animate-float flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-float)]">
            <IconGift className="h-7 w-7" />
          </span>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            お知り合いのご登録時にこのコードをご入力いただくと、
            <br />
            お二人に<b className="text-primary-strong">デート代無料</b>の特典が付きます。
          </p>
          <div className="sheen-host mt-4 w-full rounded-2xl border border-dashed border-primary/40 bg-surface px-4 py-4">
            <p className="caps-label text-[11px] font-bold text-primary">Referral Code</p>
            <p className="num-tnum mt-1 font-mono text-3xl font-black tracking-[0.3em] text-primary-strong">
              {code?.code ?? "ー"}
            </p>
          </div>
        </div>

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
