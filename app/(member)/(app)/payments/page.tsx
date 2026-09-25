import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatYen, formatDate } from "@/lib/format";
import { PAYMENT_PURPOSE_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCard } from "@/components/member/icons";

export default async function PaymentsPage() {
  const me = await requireMember();
  const payments = await prisma.payment.findMany({
    where: { memberId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      match: {
        select: {
          applicantId: true,
          applicant: { select: { nickname: true } },
          receiver: { select: { nickname: true } },
        },
      },
    },
  });
  const total = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amount - p.refundedAmount, 0);

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="決済履歴" backHref="/menu" />
      <div className="px-4 py-4">
        {payments.length === 0 ? (
          <EmptyState
            title="決済履歴はありません"
            icon={<IconCard className="h-6 w-6 text-ink-faint" />}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-bold text-ink-soft">
                お支払い合計
              </span>
              <span className="num-tnum text-lg font-black text-ink">
                {formatYen(total)}
              </span>
            </div>
            <Card>
              <div className="stagger divide-y divide-line">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {PAYMENT_PURPOSE_LABELS[p.purpose]}
                      </p>
                      <p className="num-tnum mt-0.5 text-xs text-ink-faint">
                        {formatDate(p.createdAt)}
                        {p.match &&
                          `・${
                            p.match.applicantId === me.id
                              ? p.match.receiver.nickname
                              : p.match.applicant.nickname
                          }さんとのデート`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="num-tnum font-bold text-ink">
                        {p.amount === 0 ? "無料" : formatYen(p.amount)}
                      </span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <p className="px-1 text-[11px] leading-relaxed text-ink-faint">
              ※ お支払いは登録済みのクレジットカードで決済されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
