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
        <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-gold-soft bg-surface p-6 text-center">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gold" />
          <span
            className="animate-float flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-gold"
            style={{ boxShadow: "inset 0 0 0 1px var(--color-gold)" }}
          >
            <IconGift className="h-7 w-7" />
          </span>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            お知り合いのご登録時にこのコードをご入力いただくと、
            <br />
            お二人に<b className="text-primary-strong">デート代無料</b>の特典が付きます。
          </p>
          <div className="sheen-host mt-4 w-full rounded-xl border border-dashed border-gold-soft bg-surface-alt px-4 py-4">
            <p className="caps-label text-[11px] text-ink-faint">Referral Code</p>
            <p className="num-tnum mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-primary-strong">
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
