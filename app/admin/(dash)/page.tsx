import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";


function startOfThisMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function MetricCard({
  label,
  value,
  unit,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  unit?: string;
  sub?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <Card className="h-full transition hover:border-primary-soft">
      <CardBody>
        <p className="text-xs font-bold text-ink-faint">{label}</p>
        <p className="mt-2 flex items-end gap-1">
          <span className="text-3xl font-bold text-ink">{value}</span>
          {unit && <span className="pb-1 text-sm text-ink-soft">{unit}</span>}
        </p>
        {sub && <div className="mt-2 text-xs text-ink-soft">{sub}</div>}
      </CardBody>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

export default async function AdminDashboardPage() {
  const monthStart = startOfThisMonth();

  const [
    totalMembers,
    maleMembers,
    femaleMembers,
    newThisMonth,
    completedDates,
    docReviewMembers,
    pendingDocs,
    openReports,
    openInquiries,
    pendingCancellations,
    activeStores,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { sex: "MALE" } }),
    prisma.member.count({ where: { sex: "FEMALE" } }),
    prisma.member.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.match.count({ where: { phase: "COMPLETED" } }),
    prisma.member.count({ where: { status: "DOCUMENT_REVIEW" } }),
    prisma.document.count({ where: { checkStatus: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.inquiry.count({ where: { status: "OPEN" } }),
    // 未処理キャンセル：違約金決済が未完了（PENDING/FAILED）のもの
    prisma.payment.count({
      where: {
        purpose: { in: ["PENALTY_5500", "PENALTY_11000"] },
        status: { in: ["PENDING", "FAILED"] },
      },
    }),
    prisma.store.count({ where: { isActive: true } }),
  ]);

  const actionNeeded =
    docReviewMembers + pendingDocs + openReports + pendingCancellations;

  const recentMatches = await prisma.match.findMany({
    orderBy: { lastActionAt: "desc" },
    take: 5,
    include: {
      applicant: { select: { nickname: true } },
      receiver: { select: { nickname: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-ink">ダッシュボード</h1>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">概況</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="総会員数"
            value={totalMembers}
            unit="名"
            href="/admin/members"
            sub={
              <span className="flex gap-3">
                <span>男性 {maleMembers}名</span>
                <span>女性 {femaleMembers}名</span>
              </span>
            }
          />
          <MetricCard
            label="今月の登録数"
            value={newThisMonth}
            unit="名"
            href="/admin/members"
            sub={<span>{formatDateTime(monthStart)} 以降</span>}
          />
          <MetricCard
            label="デート実施件数"
            value={completedDates}
            unit="件"
            href="/admin/matches"
            sub={<span>実施済（COMPLETED）の累計</span>}
          />
          <MetricCard
            label="要対応件数"
            value={actionNeeded}
            unit="件"
            href="/admin/members"
            sub={
              actionNeeded > 0 ? (
                <Badge tone="warning">対応が必要です</Badge>
              ) : (
                <Badge tone="success">対応待ちなし</Badge>
              )
            }
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">要対応の内訳</h2>
        <Card>
          <CardBody className="divide-y divide-line p-0">
            <ActionRow
              label="書類確認中の会員"
              count={docReviewMembers}
              href="/admin/members"
            />
            <ActionRow
              label="書類の未確認（PENDING）"
              count={pendingDocs}
              href="/admin/members"
            />
            <ActionRow
              label="未対応の通報"
              count={openReports}
              href="/admin/reports"
            />
            <ActionRow
              label="未対応のお問い合わせ"
              count={openInquiries}
              href="/admin/reports"
            />
            <ActionRow
              label="違約金の未処理決済"
              count={pendingCancellations}
              href="/admin/cancellations"
            />
          </CardBody>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">最近のマッチ</h2>
        <Card>
          <CardBody className="p-0">
            {recentMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">
                マッチはまだありません。
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {recentMatches.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/matches/${m.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-canvas"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {m.applicant.nickname}さん × {m.receiver.nickname}さん
                        </p>
                        <p className="text-xs text-ink-faint">
                          最終更新 {formatDateTime(m.lastActionAt)}
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 text-xs text-primary">詳細 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">各管理画面</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NavTile label="会員管理" href="/admin/members" />
          <NavTile label="マッチ＆デート管理" href="/admin/matches" />
          <NavTile label="キャンセル・ペナルティ" href="/admin/cancellations" />
          <NavTile label="通報・お問い合わせ" href="/admin/reports" />
          <NavTile label="お知らせ" href="/admin/announcements" />
          <NavTile label="広告" href="/admin/ads" />
          <NavTile label={`店舗（${activeStores}店舗 稼働中）`} href="/admin/stores" />
        </div>
      </section>
    </div>
  );
}

function ActionRow({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-canvas">
      <span className="text-sm text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <Badge tone={count > 0 ? "warning" : "neutral"}>{count}件</Badge>
        <span className="text-xs text-ink-faint">→</span>
      </span>
    </Link>
  );
}

function NavTile({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition hover:border-primary-soft">
        <CardBody className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="text-primary">→</span>
        </CardBody>
      </Card>
    </Link>
  );
}
