import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  GIFT_TICKET_STATUS_LABELS,
  GIFT_TICKET_REASON_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { IconGift } from "@/components/member/icons";

export default async function TicketsPage() {
  const me = await requireMember();
  const tickets = await prisma.giftTicket.findMany({
    where: { memberId: me.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="ギフト券" backHref="/menu" />
      <div className="space-y-4 px-4 py-4">
        {/* 説明 */}
        <Card className="animate-fade-up">
          <CardBody className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-soft">
              <IconGift className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-ink-soft">
              提携カフェ・美容室などでご利用いただける金券です。店頭でコードをご提示ください。
            </p>
          </CardBody>
        </Card>

        {tickets.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="ギフト券はまだありません"
                description="お友達紹介やキャンペーンで獲得できます。"
              />
            </CardBody>
          </Card>
        ) : (
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[15px] font-bold text-ink">保有ギフト券</h2>
              <span className="num-tnum text-xs text-ink-faint">
                {tickets.length}枚
              </span>
            </div>
            <div className="stagger space-y-3">
              {tickets.map((t) => (
                <Card
                  key={t.id}
                  className={t.status !== "ACTIVE" ? "opacity-60" : undefined}
                >
                  <CardBody className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="num-tnum text-2xl font-black text-ink">
                        ¥{t.amount.toLocaleString("ja-JP")}
                        <span className="ml-1.5 align-middle text-xs font-bold text-ink-faint">
                          {GIFT_TICKET_REASON_LABELS[t.reason]}
                        </span>
                      </p>
                      <Badge tone={t.status === "ACTIVE" ? "success" : "neutral"}>
                        {GIFT_TICKET_STATUS_LABELS[t.status]}
                      </Badge>
                    </div>
                    {/* 金券らしい切り取り線 */}
                    <div className="mt-3 border-t border-dashed border-line" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-ink-faint">
                          店頭提示コード
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold tracking-wide text-ink">
                          {t.code}
                        </p>
                      </div>
                      <p className="num-tnum shrink-0 text-xs text-ink-faint">
                        有効期限 {t.expiresAt ? formatDate(t.expiresAt) : "なし"}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
