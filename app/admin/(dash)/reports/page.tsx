import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberStatusBadge } from "@/components/ui/StatusBadge";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  INQUIRY_STATUS_LABELS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import {
  resolveReport,
  suspendReported,
  addReportMemo,
  resolveInquiry,
} from "./actions";

export const dynamic = "force-dynamic";

const REPORT_STATUS_TONE = {
  OPEN: "danger",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
} as const;

const INQUIRY_STATUS_TONE = {
  OPEN: "danger",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
} as const;

export default async function AdminReportsPage() {
  const [reports, inquiries] = await Promise.all([
    prisma.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        reporter: { select: { id: true, nickname: true } },
        reported: {
          select: { id: true, nickname: true, fullName: true, status: true },
        },
      },
    }),
    prisma.inquiry.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        member: { select: { id: true, nickname: true } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">通報・お問い合わせ</h1>
      <p className="mb-6 text-sm text-ink-soft">
        会員からの通報と、お問い合わせを確認し対応します。
      </p>

      {/* ── 通報一覧 ── */}
      <section className="mb-8">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          通報一覧（{reports.length} 件）
        </h2>
        {reports.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="🚩"
                title="通報はありません"
                description="会員からの通報が届くとここに表示されます。"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={REPORT_STATUS_TONE[r.status]}>
                      {REPORT_STATUS_LABELS[r.status]}
                    </Badge>
                    <Badge tone="neutral">{REPORT_TYPE_LABELS[r.type]}</Badge>
                    <MemberStatusBadge status={r.reported.status} />
                  </div>

                  <p className="text-sm text-ink">
                    <Link
                      href={`/admin/members/${r.reporter.id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {r.reporter.nickname}さん
                    </Link>
                    <span className="text-ink-faint">（通報者）→ </span>
                    <Link
                      href={`/admin/members/${r.reported.id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {r.reported.nickname}さん
                    </Link>
                    <span className="text-xs text-ink-faint">
                      （{r.reported.fullName}・対象会員）
                    </span>
                  </p>

                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">
                    {r.content}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    通報日時 {formatDateTime(r.createdAt)}
                    {r.handledAt && ` ／ 対応 ${formatDateTime(r.handledAt)}`}
                  </p>

                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <form action={addReportMemo} className="space-y-2">
                      <input
                        type="hidden"
                        name="memberId"
                        value={r.reported.id}
                      />
                      <Field label="運営メモ（対象会員に記録）">
                        <Input
                          name="body"
                          placeholder="例：写真の確認を依頼、本人確認済み など"
                        />
                      </Field>
                      <Button type="submit" size="sm" variant="secondary">
                        メモを追加
                      </Button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      <form action={suspendReported}>
                        <input
                          type="hidden"
                          name="memberId"
                          value={r.reported.id}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          対象会員を停止
                        </Button>
                      </form>
                      {r.status !== "RESOLVED" && (
                        <form action={resolveReport}>
                          <input type="hidden" name="reportId" value={r.id} />
                          <Button type="submit" size="sm">
                            対応完了にする
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── お問い合わせ一覧 ── */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          お問い合わせ一覧（{inquiries.length} 件）
        </h2>
        {inquiries.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="✉"
                title="お問い合わせはありません"
                description="会員からのお問い合わせが届くとここに表示されます。"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {inquiries.map((q) => (
              <Card key={q.id}>
                <CardBody>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={INQUIRY_STATUS_TONE[q.status]}>
                      {INQUIRY_STATUS_LABELS[q.status]}
                    </Badge>
                  </div>

                  <p className="text-sm font-bold text-ink">{q.subject}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {q.member ? (
                      <Link
                        href={`/admin/members/${q.member.id}`}
                        className="text-primary hover:underline"
                      >
                        {q.member.nickname}さん
                      </Link>
                    ) : (
                      "会員以外"
                    )}
                    {q.email && ` ／ ${q.email}`}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">
                    {q.body}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    受付 {formatDateTime(q.createdAt)}
                    {q.handledAt && ` ／ 対応 ${formatDateTime(q.handledAt)}`}
                  </p>

                  {q.status !== "RESOLVED" && (
                    <div className="mt-3 border-t border-line pt-3">
                      <form action={resolveInquiry}>
                        <input type="hidden" name="inquiryId" value={q.id} />
                        <Button type="submit" size="sm">
                          対応完了にする
                        </Button>
                      </form>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
