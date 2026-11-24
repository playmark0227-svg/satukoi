import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import type { ReportStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconChevronRight } from "@/components/member/icons";
import { PageHeader, Section, Panel, EmptyInline } from "@/components/admin/ui/Layout";
import {
  Tag,
  CountPill,
  ReportStatusPill,
  InquiryStatusPill,
  MemberStatusPill,
} from "@/components/admin/ui/Pills";
import { MemberName, Timestamp } from "@/components/admin/ui/Data";
import { FilterScope, FilterChips, FilterRow, FilterEmpty } from "@/components/admin/ui/Filter";
import { navLabel } from "@/lib/admin/nav";
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { resolveReport, suspendReported, addReportMemo, resolveInquiry } from "./actions";

// 通報・お問い合わせは同じ3段階（未対応・対応中・対応完了）
const STATUS_ORDER: ReportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

/** 要対応の行の左に出す黄色の線（一覧の rowClass と同じ表現） */
const ATTENTION_LINE = "shadow-[inset_3px_0_0_var(--color-warning)]";

function countByStatus(items: { status: ReportStatus }[]) {
  return Object.fromEntries(STATUS_ORDER.map((s) => [s, items.filter((i) => i.status === s).length])) as Record<
    ReportStatus,
    number
  >;
}

export default async function AdminReportsPage() {
  const [reports, inquiries] = await Promise.all([
    prisma.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        reporter: { select: { id: true, nickname: true, fullName: true } },
        reported: {
          select: { id: true, nickname: true, fullName: true, status: true },
        },
      },
    }),
    prisma.inquiry.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        member: { select: { id: true, nickname: true, fullName: true } },
      },
    }),
  ]);

  const reportCounts = countByStatus(reports);
  const inquiryCounts = countByStatus(inquiries);
  const openReports = reportCounts.OPEN + reportCounts.IN_PROGRESS;
  const openInquiries = inquiryCounts.OPEN + inquiryCounts.IN_PROGRESS;

  return (
    <div>
      <PageHeader
        title={navLabel("reports")}
        description="会員からの通報とお問い合わせを確認し、対応します。"
        actions={
          // PC では両セクションが1画面に収まるので、スマホ・タブレットだけ下のセクションへのリンクを出す
          <div className="lg:hidden">
            <JumpLink href="#inquiries" label="お問い合わせへ" open={openInquiries} />
          </div>
        }
      />

      {/* ── 通報 ── */}
      <Section id="reports" title="通報" count={reports.length} action={<OpenCount n={openReports} />}>
        {reports.length === 0 ? (
          <Panel>
            <EmptyInline tone="clear">通報はありません</EmptyInline>
          </Panel>
        ) : (
          <FilterScope params={["report"]}>
            <div className={cn("mb-3", WRAP_CHIPS)}>
              <FilterChips
                name="report"
                label="通報の対応状況"
                allCount={reports.length}
                options={STATUS_ORDER.map((s) => ({
                  value: s,
                  label: REPORT_STATUS_LABELS[s],
                  count: reportCounts[s],
                }))}
              />
            </div>
            <ul className="flex flex-col gap-3">
              {reports.map((r) => {
                const resolved = r.status === "RESOLVED";
                return (
                  <FilterRow
                    key={r.id}
                    id={r.id}
                    as="li"
                    search={[
                      r.reported.nickname,
                      r.reported.fullName,
                      r.reporter.nickname,
                      r.reporter.fullName,
                      REPORT_TYPE_LABELS[r.type],
                      r.content,
                    ].join(" ")}
                    facets={{ report: r.status }}
                  >
                    <Panel className={cn(resolved ? "bg-canvas" : ATTENTION_LINE)}>
                      {/* 未対応・対応中は右の列（スマホは下）に操作。対応完了は操作を下に畳む */}
                      <div className={cn(!resolved && "md:grid md:grid-cols-[minmax(0,1fr)_20rem]")}>
                        {/* 内容 */}
                        <div className="min-w-0 space-y-3 p-4">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <ReportStatusPill status={r.status} size="md" />
                            <Tag>{REPORT_TYPE_LABELS[r.type]}</Tag>
                            <Dates
                              className="xl:ml-auto"
                              items={[
                                ["通報", r.createdAt],
                                ["対応", r.handledAt],
                              ]}
                            />
                          </div>

                          <div className="space-y-1.5 text-sm">
                            {/* 折り返したときは名前の列にそろえる（ぶら下げインデント） */}
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-[3.75rem]">
                              <MemberName member={r.reported} role="対象会員" className={cn(ROLE_COL, "-ml-[3.75rem]")} />
                              <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                                会員の状態
                                <MemberStatusPill status={r.reported.status} />
                              </span>
                            </p>
                            <p>
                              <MemberName member={r.reporter} role="通報者" className={ROLE_COL} />
                            </p>
                          </div>

                          <div>
                            <p className="text-[13px] text-ink-soft">通報内容</p>
                            <p
                              className={cn(
                                "mt-0.5 text-sm leading-relaxed whitespace-pre-wrap",
                                resolved ? "text-ink-soft" : "text-ink"
                              )}
                            >
                              {r.content}
                            </p>
                          </div>
                        </div>

                        {resolved ? (
                          <details className="group border-t border-line">
                            <summary className="flex cursor-pointer list-none items-center gap-1 px-4 py-2.5 text-[13px] font-semibold text-primary-text select-none hover:bg-surface [&::-webkit-details-marker]:hidden">
                              <IconChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                              メモ・操作（運営メモ・対象会員の利用停止）
                            </summary>
                            <div className="max-w-xl px-4 pt-1 pb-4">
                              <ReportOps reportId={r.id} memberId={r.reported.id} resolved />
                            </div>
                          </details>
                        ) : (
                          <div className="border-t border-line p-4 md:border-t-0 md:border-l">
                            <ReportOps reportId={r.id} memberId={r.reported.id} resolved={false} />
                          </div>
                        )}
                      </div>
                    </Panel>
                  </FilterRow>
                );
              })}
            </ul>
            <FilterEmpty>条件に合う通報はありません</FilterEmpty>
          </FilterScope>
        )}
      </Section>

      {/* ── お問い合わせ ── */}
      <Section id="inquiries" title="お問い合わせ" count={inquiries.length} action={<OpenCount n={openInquiries} />}>
        {inquiries.length === 0 ? (
          <Panel>
            <EmptyInline tone="clear">お問い合わせはありません</EmptyInline>
          </Panel>
        ) : (
          <FilterScope params={["inquiry"]}>
            <div className={cn("mb-3", WRAP_CHIPS)}>
              <FilterChips
                name="inquiry"
                label="お問い合わせの対応状況"
                allCount={inquiries.length}
                options={STATUS_ORDER.map((s) => ({
                  value: s,
                  label: INQUIRY_STATUS_LABELS[s],
                  count: inquiryCounts[s],
                }))}
              />
            </div>
            <ul className="flex flex-col gap-3">
              {inquiries.map((q) => {
                const resolved = q.status === "RESOLVED";
                return (
                  <FilterRow
                    key={q.id}
                    id={q.id}
                    as="li"
                    search={[q.member?.nickname, q.member?.fullName, q.email, q.subject, q.body]
                      .filter(Boolean)
                      .join(" ")}
                    facets={{ inquiry: q.status }}
                  >
                    <Panel className={cn(resolved ? "bg-canvas" : ATTENTION_LINE)}>
                      <div className="min-w-0 space-y-3 p-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                          <InquiryStatusPill status={q.status} size="md" />
                          <Dates
                            className="sm:ml-auto"
                            items={[
                              ["受付", q.createdAt],
                              ["対応", q.handledAt],
                            ]}
                          />
                        </div>

                        <div>
                          <h3 className={cn("text-[15px] font-bold", resolved ? "text-ink-soft" : "text-ink")}>
                            {q.subject}
                          </h3>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            {q.member ? (
                              <MemberName member={q.member} role="送信者" />
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-xs font-medium text-ink-soft">送信者</span>
                                <Tag>会員以外</Tag>
                              </span>
                            )}
                            {q.email && (
                              <a
                                href={`mailto:${q.email}`}
                                className="min-w-0 font-medium break-all text-primary-text hover:underline"
                              >
                                {q.email}
                              </a>
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[13px] text-ink-soft">お問い合わせ内容</p>
                          <p
                            className={cn(
                              "mt-0.5 text-sm leading-relaxed whitespace-pre-wrap",
                              resolved ? "text-ink-soft" : "text-ink"
                            )}
                          >
                            {q.body}
                          </p>
                        </div>
                      </div>

                      {!resolved && (
                        <div className="border-t border-line px-4 py-3">
                          <form action={resolveInquiry}>
                            <input type="hidden" name="inquiryId" value={q.id} />
                            <Button type="submit" size="md">
                              対応完了にする
                            </Button>
                          </form>
                        </div>
                      )}
                    </Panel>
                  </FilterRow>
                );
              })}
            </ul>
            <FilterEmpty>条件に合うお問い合わせはありません</FilterEmpty>
          </FilterScope>
        )}
      </Section>
    </div>
  );
}

/** 状態のチップをスマホでも横スクロールにせず折り返す（端で切れて見えなくなるのを防ぐ） */
const WRAP_CHIPS = "[&_[role=radiogroup]]:mx-0 [&_[role=radiogroup]]:flex-wrap [&_[role=radiogroup]]:px-0";

/** 役割ラベル（対象会員・通報者）の幅を揃えて名前の頭を縦にそろえる */
const ROLE_COL = "[&>span:first-child]:w-14 [&>span:first-child]:shrink-0";

/** 見出し右の「要対応 n」 */
function OpenCount({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
      要対応
      <CountPill n={n} />
    </span>
  );
}

/** ページ内の下のセクションへ移る文字リンク（要対応の件数つき） */
function JumpLink({ href, label, open }: { href: string; label: string; open: number }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-text hover:underline"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M10 4v12M5 11l5 5 5-5" />
      </svg>
      {label}
      <span className="ml-1 inline-flex items-center gap-1 font-normal text-ink-soft">
        要対応
        <CountPill n={open} />
      </span>
    </a>
  );
}

/** 受付・対応の日時を並べる（対応日時がなければ省略） */
function Dates({ items, className }: { items: [string, Date | null][]; className?: string }) {
  return (
    <span className={cn("flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-soft", className)}>
      {items
        .filter((it): it is [string, Date] => it[1] != null)
        .map(([label, date]) => (
          <span key={label}>
            {label} <Timestamp date={date} className="text-ink" />
          </span>
        ))}
    </span>
  );
}

/** 通報への操作：対応完了（主）・運営メモ・対象会員の停止 */
function ReportOps({ reportId, memberId, resolved }: { reportId: string; memberId: string; resolved: boolean }) {
  const memoId = `memo-${reportId}`;
  return (
    <div className="space-y-4">
      {!resolved && (
        <form action={resolveReport}>
          <input type="hidden" name="reportId" value={reportId} />
          <Button type="submit" size="md">
            対応完了にする
          </Button>
        </form>
      )}

      <form action={addReportMemo}>
        <input type="hidden" name="memberId" value={memberId} />
        <label htmlFor={memoId} className="mb-1 block text-[13px] font-semibold text-ink">
          運営メモ<span className="font-normal text-ink-soft">（対象会員に記録）</span>
        </label>
        <div className="flex gap-2">
          <Input id={memoId} name="body" className="h-10 min-w-0 flex-1" placeholder="例：写真の確認を依頼" />
          <Button type="submit" size="md" variant="secondary">
            追加
          </Button>
        </div>
      </form>

      <form action={suspendReported} className="border-t border-line-soft pt-3">
        <input type="hidden" name="memberId" value={memberId} />
        <Button type="submit" size="md" variant="outline">
          対象会員を利用停止
        </Button>
      </form>
    </div>
  );
}
