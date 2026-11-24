import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader, Section, Panel, PanelBody, EmptyInline } from "@/components/admin/ui/Layout";
import { StatusPill, Tag } from "@/components/admin/ui/Pills";
import { Table, Th, Td, rowClass, MobileList, MobileRowContent, Timestamp } from "@/components/admin/ui/Data";
import {
  FilterScope,
  FilterBar,
  SearchField,
  FilterChips,
  FilterRow,
  FilterEmpty,
} from "@/components/admin/ui/Filter";
import { navLabel } from "@/lib/admin/nav";
import { ANNOUNCEMENT_TARGET_LABELS } from "@/lib/constants";
import { createAnnouncement, togglePublish } from "./actions";

const TARGET_VALUES = Object.keys(
  ANNOUNCEMENT_TARGET_LABELS
) as (keyof typeof ANNOUNCEMENT_TARGET_LABELS)[];

export default async function AdminAnnouncementsPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を作成の新しい順で渡す
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = announcements.map((a) => ({
    ...a,
    status: a.isPublished ? "published" : "draft",
    search: `${a.title} ${a.body} ${ANNOUNCEMENT_TARGET_LABELS[a.target]}`,
  }));
  const publishedCount = rows.filter((r) => r.isPublished).length;

  return (
    <div>
      <PageHeader
        title={navLabel("announcements")}
        count={rows.length}
        description="会員向けのお知らせ（対象：全員・男性・女性）を作成し、公開・非公開を切り替えます。"
        actions={<ButtonLink href="#create">＋ お知らせを作成</ButtonLink>}
      />

      {/* ── 一覧 ── */}
      <Section title="お知らせ一覧">
        {rows.length === 0 ? (
          <Panel>
            <EmptyInline>お知らせはまだありません。下のフォームから作成できます。</EmptyInline>
          </Panel>
        ) : (
          <FilterScope params={["status"]}>
            <FilterBar>
              <SearchField placeholder="タイトル・本文で検索" label="お知らせを検索" />
              <FilterChips
                name="status"
                label="公開状態"
                allCount={rows.length}
                options={[
                  { value: "published", label: "公開中", count: publishedCount },
                  { value: "draft", label: "非公開", count: rows.length - publishedCount },
                ]}
              />
            </FilterBar>

            {/* PC：表（relative は操作列の sr-only 見出しを表の枠内に閉じ込め、ページ全体が横に流れないようにするため） */}
            <Table
              className="relative"
              head={
                <>
                  <Th>タイトル</Th>
                  <Th>対象</Th>
                  <Th>状態</Th>
                  <Th>日付</Th>
                  <Th className="w-px">
                    <span className="sr-only">操作</span>
                  </Th>
                </>
              }
            >
              {rows.map((a) => (
                <FilterRow
                  key={a.id}
                  id={a.id}
                  as="tr"
                  search={a.search}
                  facets={{ status: a.status }}
                  className={rowClass({ muted: !a.isPublished, clickable: false })}
                >
                  <Td>
                    {/* 長い語句でも表が横にはみ出さないよう、必要なら語句の途中でも折り返す */}
                    <p
                      className={cn(
                        "font-semibold [overflow-wrap:anywhere]",
                        a.isPublished ? "text-ink" : "text-ink-soft"
                      )}
                    >
                      {a.title}
                    </p>
                    {/* 本文に URL などの長い語句があっても表を押し広げず、1行目をいっぱいまで使って省略する（break-all） */}
                    <p className="mt-0.5 line-clamp-1 text-[13px] break-all text-ink-soft">
                      {a.body}
                    </p>
                  </Td>
                  <Td>
                    <Tag>{ANNOUNCEMENT_TARGET_LABELS[a.target]}</Tag>
                  </Td>
                  <Td>
                    <PublishPill isPublished={a.isPublished} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    <DateLabel publishedAt={a.publishedAt} createdAt={a.createdAt} />
                  </Td>
                  <Td align="right" className="pl-2">
                    <PublishToggle id={a.id} isPublished={a.isPublished} />
                  </Td>
                </FilterRow>
              ))}
            </Table>

            {/* スマホ：カード行（切り替えボタンは本文の下に置き、本文を狭めない） */}
            <MobileList>
              {rows.map((a) => (
                <FilterRow key={a.id} id={a.id} as="li" search={a.search} facets={{ status: a.status }}>
                  <MobileRowContent
                    muted={!a.isPublished}
                    title={<span className="[overflow-wrap:anywhere]">{a.title}</span>}
                    meta={
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <PublishPill isPublished={a.isPublished} />
                        <Tag>{ANNOUNCEMENT_TARGET_LABELS[a.target]}</Tag>
                        <DateLabel publishedAt={a.publishedAt} createdAt={a.createdAt} dateOnly />
                      </span>
                    }
                    below={
                      <>
                        <p className="line-clamp-2 text-[13px] [overflow-wrap:anywhere] text-ink-soft">{a.body}</p>
                        <div className="mt-2.5">
                          <PublishToggle id={a.id} isPublished={a.isPublished} />
                        </div>
                      </>
                    }
                  />
                </FilterRow>
              ))}
            </MobileList>

            <FilterEmpty>条件に合うお知らせはありません</FilterEmpty>
          </FilterScope>
        )}
      </Section>

      {/* ── 作成フォーム ── */}
      <Section id="create" title="お知らせを作成">
        <Panel className="max-w-3xl">
          <PanelBody>
            <form action={createAnnouncement} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <Field label="タイトル" required>
                  <Input
                    name="title"
                    placeholder="例：メンテナンスのお知らせ"
                    required
                    className="h-10"
                  />
                </Field>
                <Field label="対象" className="w-36">
                  <Select name="target" defaultValue="ALL" className="h-10">
                    {TARGET_VALUES.map((t) => (
                      <option key={t} value={t}>
                        {ANNOUNCEMENT_TARGET_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="本文" required>
                <Textarea
                  name="body"
                  placeholder="会員向けのお知らせ本文を入力してください。"
                  rows={4}
                  required
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="isPublished"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    すぐに公開する
                    <span className="text-ink-soft">（チェックを外すと非公開で保存）</span>
                  </span>
                </label>
                <Button type="submit" size="md">
                  お知らせを作成
                </Button>
              </div>
            </form>
          </PanelBody>
        </Panel>
      </Section>
    </div>
  );
}

/** 公開状態（公開中＝有効、非公開＝無効） */
function PublishPill({ isPublished }: { isPublished: boolean }) {
  return isPublished ? (
    <StatusPill tone="success">公開中</StatusPill>
  ) : (
    <StatusPill tone="neutral">非公開</StatusPill>
  );
}

/**
 * 一番意味のある日付を1つだけ：公開中なら公開日、非公開なら作成日（ラベル付き）。
 * dateOnly でなければ、表が狭い（xl 未満）ときは日付だけ・広いときは時刻まで（ホバーで正確な日時）。
 */
function DateLabel({
  publishedAt,
  createdAt,
  dateOnly = false,
}: {
  publishedAt: Date | null;
  createdAt: Date;
  dateOnly?: boolean;
}) {
  const [label, date] = publishedAt ? (["公開", publishedAt] as const) : (["作成", createdAt] as const);
  return (
    <span className="whitespace-nowrap">
      <span className="mr-1.5 text-xs text-ink-soft">{label}</span>
      {dateOnly ? (
        <Timestamp date={date} dateOnly />
      ) : (
        <>
          <Timestamp date={date} dateOnly className="xl:hidden" />
          <Timestamp date={date} className="hidden xl:inline" />
        </>
      )}
    </span>
  );
}

/** 公開・非公開の切り替え（行内の操作なので outline sm） */
function PublishToggle({ id, isPublished }: { id: string; isPublished: boolean }) {
  return (
    <form action={togglePublish}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">
        {isPublished ? "非公開にする" : "公開する"}
      </Button>
    </form>
  );
}
