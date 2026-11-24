import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
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
import { AD_TYPE_LABELS, AD_POSITION_LABELS } from "@/lib/constants";
import { createAd, toggleAd } from "./actions";
import { AdImage } from "@/components/member/AdImage";

const TYPE_VALUES = Object.keys(
  AD_TYPE_LABELS
) as (keyof typeof AD_TYPE_LABELS)[];
const POSITION_VALUES = Object.keys(
  AD_POSITION_LABELS
) as (keyof typeof AD_POSITION_LABELS)[];

/** 一覧に出すリンク先（https:// と末尾の / を省いて短く） */
function displayUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.host}${path}${u.search}`;
  } catch {
    return url;
  }
}

export default async function AdminAdsPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を従来の並び（表示位置→表示順→新しい順）で渡す
  const rows = await prisma.ad.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const ads = rows.map((ad) => ({
    ...ad,
    search: `${ad.title} ${ad.linkUrl} ${AD_TYPE_LABELS[ad.type]}`,
  }));

  const positionCounts = Object.fromEntries(
    POSITION_VALUES.map((p) => [p, ads.filter((a) => a.position === p).length])
  ) as Record<(typeof POSITION_VALUES)[number], number>;

  return (
    <div>
      <PageHeader
        title={navLabel("ads")}
        count={ads.length}
        description="トップページ下部・マイページに表示する広告（自社広告・他社スポンサー）を登録し、表示・非表示を切り替えます。"
        actions={<ButtonLink href="#create">＋ 広告を追加</ButtonLink>}
      />

      {/* ── 一覧 ── */}
      <Section title="広告一覧">
        {ads.length === 0 ? (
          <Panel>
            <EmptyInline>広告はまだありません。下のフォームから追加できます。</EmptyInline>
          </Panel>
        ) : (
          <FilterScope params={["position"]}>
            <FilterBar>
              <SearchField placeholder="タイトル・リンク先で検索" label="広告を検索" />
              <FilterChips
                name="position"
                label="表示位置"
                allCount={ads.length}
                options={POSITION_VALUES.map((p) => ({
                  value: p,
                  label: AD_POSITION_LABELS[p],
                  count: positionCounts[p],
                }))}
              />
            </FilterBar>

            {/* PC：表（relative は操作列の sr-only 見出しを表の枠内に閉じ込め、ページ全体が横に流れないようにするため） */}
            <Table
              className="relative"
              head={
                <>
                  <Th>広告</Th>
                  {/* 1360px 未満は「表示位置」の下に「タイプ」を縦に並べ（見出しも同じ順）、広告名の幅を確保する */}
                  <Th>
                    表示位置<span className="min-[1360px]:hidden">／タイプ</span>
                  </Th>
                  <Th className="hidden min-[1360px]:table-cell">タイプ</Th>
                  <Th>状態</Th>
                  <Th className="hidden xl:table-cell">登録日</Th>
                  <Th className="w-px">
                    <span className="sr-only">操作</span>
                  </Th>
                </>
              }
            >
              {ads.map((ad) => (
                <FilterRow
                  key={ad.id}
                  id={ad.id}
                  as="tr"
                  search={ad.search}
                  facets={{ position: ad.position }}
                  className={rowClass({ muted: !ad.isEnabled, clickable: false })}
                >
                  <Td>
                    <div data-ad-row className="flex items-center gap-3">
                      <AdThumb url={ad.imageUrl} className="h-8 w-32 xl:h-10 xl:w-40" />
                      <div className="min-w-0">
                        {/* 長い語句でも表が横にはみ出さないよう、必要なら語句の途中でも折り返す */}
                        <p
                          className={cn(
                            "font-semibold [overflow-wrap:anywhere]",
                            ad.isEnabled ? "text-ink" : "text-ink-soft"
                          )}
                        >
                          {ad.title}
                        </p>
                        <p className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 text-[13px] text-ink-soft">
                          <AdLink url={ad.linkUrl} />
                          <span className="shrink-0 whitespace-nowrap xl:hidden">
                            登録 <Timestamp date={ad.createdAt} dateOnly />
                          </span>
                        </p>
                        <ThumbFailedNote className="mt-0.5" />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <Tag>{AD_POSITION_LABELS[ad.position]}</Tag>
                      <Tag className="min-[1360px]:hidden">{AD_TYPE_LABELS[ad.type]}</Tag>
                    </div>
                  </Td>
                  <Td className="hidden min-[1360px]:table-cell">
                    <Tag>{AD_TYPE_LABELS[ad.type]}</Tag>
                  </Td>
                  <Td>
                    <EnabledPill isEnabled={ad.isEnabled} />
                  </Td>
                  <Td className="hidden whitespace-nowrap xl:table-cell">
                    {/* 登録の時刻は運用上ほぼ不要なので日付のみ（ホバーで正確な日時）。サムネイルの幅を確保する */}
                    <Timestamp date={ad.createdAt} dateOnly />
                  </Td>
                  <Td align="right" className="pl-2">
                    <EnabledToggle id={ad.id} isEnabled={ad.isEnabled} />
                  </Td>
                </FilterRow>
              ))}
            </Table>

            {/* スマホ：カード行（切り替えボタンは下に置き、タイトルを狭めない） */}
            <MobileList>
              {ads.map((ad) => (
                <FilterRow key={ad.id} id={ad.id} as="li" search={ad.search} facets={{ position: ad.position }}>
                  <MobileRowContent
                    muted={!ad.isEnabled}
                    title={<span className="[overflow-wrap:anywhere]">{ad.title}</span>}
                    meta={
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <EnabledPill isEnabled={ad.isEnabled} />
                        <span className="inline-flex items-center gap-1">
                          表示位置 <Tag>{AD_POSITION_LABELS[ad.position]}</Tag>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          タイプ <Tag>{AD_TYPE_LABELS[ad.type]}</Tag>
                        </span>
                        <span className="whitespace-nowrap">
                          登録 <Timestamp date={ad.createdAt} dateOnly />
                        </span>
                      </span>
                    }
                    below={
                      <div data-ad-row>
                        <div className="flex min-w-0 items-center gap-3">
                          <AdThumb url={ad.imageUrl} className="h-8 w-32" />
                          <div className="min-w-0 text-[13px]">
                            <AdLink url={ad.linkUrl} />
                          </div>
                        </div>
                        <ThumbFailedNote className="mt-1.5" />
                        <div className="mt-2.5">
                          <EnabledToggle id={ad.id} isEnabled={ad.isEnabled} />
                        </div>
                      </div>
                    }
                  />
                </FilterRow>
              ))}
            </MobileList>

            <FilterEmpty>条件に合う広告はありません</FilterEmpty>
          </FilterScope>
        )}
      </Section>

      {/* ── 追加フォーム ── */}
      <Section id="create" title="広告を追加">
        <Panel className="max-w-3xl">
          <PanelBody>
            <form action={createAd} className="space-y-4">
              <Field label="広告タイトル" required>
                <Input
                  name="title"
                  placeholder="例：札幌のおすすめカフェ特集"
                  required
                  className="h-10"
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="バナー画像URL" hint="表示するバナー画像のURL" required>
                  <Input
                    name="imageUrl"
                    type="url"
                    placeholder="https://example.com/banner.png"
                    required
                    className="h-10"
                  />
                </Field>
                <Field label="リンク先URL" hint="タップ時の遷移先URL" required>
                  <Input
                    name="linkUrl"
                    type="url"
                    placeholder="https://example.com"
                    required
                    className="h-10"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-3">
                <Field label="タイプ" className="w-48">
                  <Select name="type" defaultValue="OWN" className="h-10">
                    {TYPE_VALUES.map((t) => (
                      <option key={t} value={t}>
                        {AD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="表示位置" className="w-52">
                  <Select name="position" defaultValue="TOP_BOTTOM" className="h-10">
                    {POSITION_VALUES.map((p) => (
                      <option key={p} value={p}>
                        {AD_POSITION_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    defaultChecked
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  すぐに表示する
                </label>
                <Button type="submit" size="md">
                  広告を追加
                </Button>
              </div>
            </form>
          </PanelBody>
        </Panel>
      </Section>
    </div>
  );
}

/** 表示状態（表示中＝有効、非表示＝無効） */
function EnabledPill({ isEnabled }: { isEnabled: boolean }) {
  return isEnabled ? (
    <StatusPill tone="success">表示中</StatusPill>
  ) : (
    <StatusPill tone="neutral">非表示</StatusPill>
  );
}

/**
 * バナーの小さなプレビュー（クリックで画像を新しいタブで開く。ホバーで画像URL）。
 * 会員側と同じ AdImage（読み込み失敗を検知）を枠いっぱいに敷き、失敗時は AdImage が出す
 * タイトル入りの大きな代替バナー（div）を隠して、下地のアイコンを赤系で見せる。
 * 失敗の文言は同じ行の ThumbFailedNote が出す（data-ad-row / data-ad-thumb で連動）。
 */
function AdThumb({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`バナー画像：${url}`}
      aria-label="バナー画像を新しいタブで開く"
      data-ad-thumb=""
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-md border border-line bg-surface-alt text-ink-soft hover:border-ink-soft",
        "[&>div]:hidden [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:bg-surface",
        "[&:has(>div)]:border-danger/40 [&:has(>div)]:bg-danger-soft [&:has(>div)]:text-danger",
        className
      )}
    >
      <span aria-hidden className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M21 16l-5-5-9 9" />
        </svg>
      </span>
      <AdImage url={url} title="" />
    </a>
  );
}

/** 同じ行（data-ad-row）のバナーが読み込めなかったときだけ出る注意書き */
function ThumbFailedNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "hidden items-center gap-1 text-xs font-semibold text-danger-strong",
        "[[data-ad-row]:has([data-ad-thumb]>div)_&]:flex",
        className
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden
      >
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.5M10 13.5v.01" />
      </svg>
      バナー画像を読み込めません
    </p>
  );
}

/** リンク先（新しいタブで開く。長いURLは1行いっぱいまで出して省略し、ホバーで全体。表の幅を押し広げない） */
function AdLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      className="line-clamp-1 min-w-0 font-semibold break-all text-primary-text hover:underline"
    >
      {displayUrl(url)}
    </a>
  );
}

/** 表示・非表示の切り替え（行内の操作なので outline sm） */
function EnabledToggle({ id, isEnabled }: { id: string; isEnabled: boolean }) {
  return (
    <form action={toggleAd}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline">
        {isEnabled ? "非表示にする" : "表示する"}
      </Button>
    </form>
  );
}
