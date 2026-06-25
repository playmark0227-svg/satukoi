import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatYen, formatDate } from "@/lib/format";
import { PAYMENT_PURPOSE_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function PaymentsPage() {
  const me = await requireMember();
  const payments = await prisma.payment.findMany({
    where: { memberId: me.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="決済履歴" backHref="/menu" />
      <div className="px-4 py-4">
        {payments.length === 0 ? (
          <EmptyState title="決済履歴はありません" icon="💳" />
        ) : (
          <Card>
            <div className="divide-y divide-line">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {PAYMENT_PURPOSE_LABELS[p.purpose]}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">
                      {p.amount === 0 ? "無料" : formatYen(p.amount)}
                    </span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
