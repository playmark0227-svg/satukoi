import Link from "next/link";
import { prisma } from "@/lib/db";
import type { MemberStatus } from "@prisma/client";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader, Panel, EmptyInline, RowChevron } from "@/components/admin/ui/Layout";
import { MemberStatusPill, Tag } from "@/components/admin/ui/Pills";
import {
  Table,
  Th,
  Td,
  rowClass,
  RowLink,
  MobileList,
  MemberName,
  Timestamp,
} from "@/components/admin/ui/Data";
import {
  FilterScope,
  FilterBar,
  SearchField,
  FilterChips,
  ToggleChip,
  FilterSummary,
  FilterRow,
  FilterEmpty,
} from "@/components/admin/ui/Filter";
import { navLabel } from "@/lib/admin/nav";
import { MEMBER_STATUS_LABELS, SEX_LABELS, RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { calcAge } from "@/lib/format";

const STATUS_VALUES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[];

// 絞り込み中の表・一覧の見た目の補正（FilterRow は非表示の行に hidden 属性を付けるので、それを :has() で見る）
//  - 1行も残らないときは枠ごと隠す（見出しだけの表や空の枠を出さず、FilterEmpty だけを見せる）
//  - 見えている最後の行の下線を消す（後ろに隠れた行があると、枠線と重なって二重線になるため）
const TABLE_FILTERED = cn(
  "[&:not(:has(tbody_tr:not([hidden])))]:hidden",
  "[&_tbody>tr:not([hidden]):not(:has(~tr:not([hidden])))]:border-b-0"
);
const LIST_FILTERED = cn(
  "[&:not(:has(>li:not([hidden])))]:hidden",
  "[&>li:not([hidden]):not(:has(~li:not([hidden])))]:border-b-0"
);

/**
 * 会員名の上書き。ニックネームを途中で改行しない／行（リンク）に乗ったらニックネームに下線。
 * 退会者は名前も ink-soft にする。
 */
function nameClass(withdrawn: boolean) {
  return cn(
    "[&>span]:whitespace-nowrap [a:hover_&>span:first-child]:underline",
    withdrawn && "[&_span]:text-ink-soft"
  );
}

export default async function AdminMembersPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を新しい登録順で渡す
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      nickname: true,
      sex: true,
      birthDate: true,
      residenceArea: true,
      accountType: true,
      status: true,
      createdAt: true,
      photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      documents: { select: { checkStatus: true } },
    },
  });

  const rows = members.map((m) => {
    const pendingDocs = m.documents.filter((d) => d.checkStatus === "PENDING").length;
    const ngDocs = m.documents.filter((d) => d.checkStatus === "NG").length;
    const withdrawn = m.status === "WITHDRAWN";
    // 審査待ち：書類確認中 または 未確認の書類がある（退会者は除く。サイドバーの件数と同じ定義）
    const needsReview = !withdrawn && (m.status === "DOCUMENT_REVIEW" || pendingDocs > 0);
    return {
      ...m,
      photoUrl: m.photos[0]?.url ?? null,
      age: calcAge(m.birthDate),
      salon: m.accountType === "SALON",
      pendingDocs,
      ngDocs,
      docCount: m.documents.length,
      withdrawn,
      needsReview,
      search: [m.fullName, m.fullName.replace(/\s+/g, ""), m.nickname, m.email].join(" "),
    };
  });

  const statusCounts = Object.fromEntries(
    STATUS_VALUES.map((s) => [s, rows.filter((r) => r.status === s).length])
  ) as Record<MemberStatus, number>;
  const reviewCount = rows.filter((r) => r.needsReview).length;

  return (
    <div>
      <PageHeader
        title={navLabel("members")}
        description={
          <>
            会員の検索・詳細確認・承認を行います（
            <b className="font-semibold text-ink">審査待ち</b>
            ＝書類確認中か、未確認の書類がある会員）。
          </>
        }
      />

      {rows.length === 0 ? (
        <Panel>
          <EmptyInline>登録された会員はまだいません</EmptyInline>
        </Panel>
      ) : (
        <FilterScope params={["status", "review"]}>
          {/* 1024〜1279px（サイドバーあり）ではステータスのチップを2段目に送る */}
          <FilterBar className="lg:flex-wrap">
            {/* 検索と「審査待ち」はスマホでも1行に並べる */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 lg:flex-none">
                <SearchField placeholder="名前・メールで検索" label="会員を名前（ニックネーム・本名）やメールで検索" />
              </div>
              <ToggleChip name="review" label="審査待ち" count={reviewCount} />
            </div>
            {/* スマホではチップを横スクロールにせず折り返す（退会などが画面外に隠れないように） */}
            <div className="min-w-0 max-lg:[&_[role=radiogroup]]:flex-wrap xl:border-l xl:border-line xl:pl-3">
              <FilterChips
                name="status"
                label="ステータス"
                allCount={rows.length}
                options={STATUS_VALUES.map((s) => ({
                  value: s,
                  label: MEMBER_STATUS_LABELS[s],
                  count: statusCounts[s],
                }))}
              />
            </div>
          </FilterBar>

          <FilterSummary unit="名" />

          {/* PC：表（サイドバーがある 1024px でも収まるよう 6 列に絞る） */}
          <Table
            className={TABLE_FILTERED}
            head={
              <>
                <Th>会員</Th>
                <Th>ステータス</Th>
                <Th>書類</Th>
                <Th>プロフィール</Th>
                <Th>登録日</Th>
                <Th className="w-10" />
              </>
            }
          >
            {rows.map((m) => (
              <FilterRow
                key={m.id}
                id={m.id}
                as="tr"
                search={m.search}
                facets={{ status: m.status, review: m.needsReview }}
                className={rowClass({ attention: m.needsReview, muted: m.withdrawn })}
              >
                <Td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar url={m.photoUrl} name={m.nickname} className="h-9 w-9 text-sm" />
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <RowLink href={`/admin/members/${m.id}`} className="min-w-0 font-normal">
                        <MemberName member={m} link={false} className={nameClass(m.withdrawn)} />
                      </RowLink>
                      {m.salon && <Tag>サロン</Tag>}
                    </div>
                  </div>
                </Td>
                <Td>
                  <MemberStatusPill status={m.status} />
                </Td>
                <Td>
                  <DocState row={m} />
                </Td>
                <Td>
                  <Profile row={m} stacked />
                </Td>
                <Td className="whitespace-nowrap">
                  <Timestamp date={m.createdAt} dateOnly />
                </Td>
                <Td className="pr-4 pl-0 text-right">
                  <RowChevron />
                </Td>
              </FilterRow>
            ))}
          </Table>

          {/* スマホ：カード行。1行目＝名前＋ステータス、2行目＝プロフィール＋登録日、審査待ちなどは3行目に書類 */}
          <MobileList className={LIST_FILTERED}>
            {rows.map((m) => (
              <FilterRow
                key={m.id}
                id={m.id}
                as="li"
                search={m.search}
                facets={{ status: m.status, review: m.needsReview }}
              >
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 hover:bg-canvas",
                    m.needsReview && "shadow-[inset_3px_0_0_var(--color-warning)]",
                    m.withdrawn && "bg-canvas/60"
                  )}
                >
                  <Avatar url={m.photoUrl} name={m.nickname} className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-[15px]">
                        <Link href={`/admin/members/${m.id}`} className="after:absolute after:inset-0">
                          <MemberName member={m} link={false} className={nameClass(m.withdrawn)} />
                        </Link>
                      </p>
                      <span className="shrink-0">
                        <MemberStatusPill status={m.status} />
                      </span>
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-2 text-[13px] text-ink-soft">
                      <p className="min-w-0">
                        <Profile row={m} />
                        {m.salon && <Tag className="ml-1.5 align-[1px]">サロン</Tag>}
                      </p>
                      <span className="shrink-0 text-xs leading-5">
                        登録 <Timestamp date={m.createdAt} dateOnly />
                      </span>
                    </div>
                    {(m.needsReview || m.ngDocs > 0) && (
                      <p className="mt-0.5 text-[13px] text-ink-soft">
                        書類 <DocState row={m} />
                      </p>
                    )}
                  </div>
                </div>
              </FilterRow>
            ))}
          </MobileList>

          <FilterEmpty>条件に合う会員はいません</FilterEmpty>
        </FilterScope>
      )}
    </div>
  );
}

/**
 * 「男性・44歳・恵庭市」。
 * stacked（PC の表）… 表が狭い xl 未満は「男性・44歳」と「恵庭市」の2行に分ける（語の途中で折り返さない）
 */
function Profile({
  row,
  stacked = false,
}: {
  row: { sex: keyof typeof SEX_LABELS; age: number; residenceArea: keyof typeof RESIDENCE_AREA_LABELS };
  stacked?: boolean;
}) {
  return (
    <span className="num-tnum whitespace-nowrap">
      {SEX_LABELS[row.sex]}・{row.age}歳
      <span className={stacked ? "hidden xl:inline" : undefined}>・</span>
      <span className={stacked ? "block xl:inline" : undefined}>{RESIDENCE_AREA_LABELS[row.residenceArea]}</span>
    </span>
  );
}

/** 書類の状態（未確認は運営の対応待ちとして黄、差戻しは赤）。退会者は色を付けない */
function DocState({
  row,
}: {
  row: { pendingDocs: number; ngDocs: number; docCount: number; status: MemberStatus; withdrawn: boolean };
}) {
  const tone = (cls: string) => (row.withdrawn ? "text-ink-soft" : cls);
  if (row.pendingDocs > 0) {
    return (
      <span className={cn("num-tnum font-semibold whitespace-nowrap", tone("text-warning-strong"))}>
        未確認 {row.pendingDocs}件
      </span>
    );
  }
  if (row.ngDocs > 0) {
    return (
      <span className={cn("num-tnum font-semibold whitespace-nowrap", tone("text-danger-strong"))}>
        差戻し {row.ngDocs}件
      </span>
    );
  }
  if (row.docCount === 0) return <span className="whitespace-nowrap text-ink-soft">未提出</span>;
  if (row.status === "DOCUMENT_REVIEW") {
    // 書類は全部確認済みで、会員の承認だけが残っている
    return (
      <span className={cn("inline-flex flex-wrap font-semibold", tone("text-warning-strong"))}>
        <span className="whitespace-nowrap">確認済み・</span>
        <span className="whitespace-nowrap">承認待ち</span>
      </span>
    );
  }
  return <span className="whitespace-nowrap text-ink-soft">確認済み</span>;
}
