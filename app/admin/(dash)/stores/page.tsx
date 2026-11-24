import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { PageHeader, Section, Panel, PanelHeader, PanelBody, EmptyInline } from "@/components/admin/ui/Layout";
import { StatusPill } from "@/components/admin/ui/Pills";
import { Table, Th, Td, rowClass, MobileList } from "@/components/admin/ui/Data";
import { navLabel } from "@/lib/admin/nav";
import { createStore, updateStore, toggleStoreActive } from "./actions";

const MAX_STORES = 5;

type StoreRow = {
  id: string;
  name: string;
  address: string;
  area: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  _count: { dateEvents: number };
};

/**
 * 「編集」ボタン（details の summary）。開いている間は「閉じる」。
 * 編集フォームは details の直後の兄弟要素に置き、`[:has(details[open])+&]` で表示する
 * （表の行の下に全幅で開くため。JS なしで動くので静的デモでもそのまま使える）。
 */
const editSummary =
  "press inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold whitespace-nowrap text-ink select-none hover:bg-surface-alt group-open:border-ink group-open:bg-surface-alt [&::-webkit-details-marker]:hidden";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { dateEvents: true } } },
  });

  const remaining = Math.max(0, MAX_STORES - stores.length);
  const canAdd = stores.length < MAX_STORES;

  return (
    <div>
      <PageHeader
        title={navLabel("stores")}
        status={
          <span
            className={cn(
              "num-tnum text-sm",
              canAdd ? "text-ink-soft" : "font-semibold text-ink"
            )}
          >
            {stores.length} / {MAX_STORES} 店舗{canAdd ? "" : "（上限）"}
          </span>
        }
        description={`デート確定時に運営が選択する店舗を登録します。登録できるのは最大${MAX_STORES}店舗です。`}
        actions={
          canAdd ? (
            <ButtonLink href="#create" size="md">
              ＋ 店舗を追加
            </ButtonLink>
          ) : undefined
        }
      />

      <Section title="店舗一覧">
        {stores.length === 0 ? (
          <Panel>
            <EmptyInline>店舗がまだ登録されていません。下のフォームから追加してください。</EmptyInline>
          </Panel>
        ) : (
          <>
            {/* PC（xl 以上）：表。「編集」を押すと行の下にフォームが開く。1024〜1279px は操作列が隠れないようカード行 */}
            <Table
              className="lg:hidden xl:block"
              head={
                <>
                  <Th>店舗名</Th>
                  <Th>状態</Th>
                  <Th>エリア</Th>
                  <Th>住所</Th>
                  <Th>TEL</Th>
                  <Th align="right">利用デート数</Th>
                  <Th align="right">操作</Th>
                </>
              }
            >
              {stores.map((s) => (
                <StoreTableRows key={s.id} store={s} />
              ))}
            </Table>

            {/* スマホ〜xl 未満：カード行 */}
            <MobileList className="lg:block xl:hidden">
              {stores.map((s) => (
                <li key={s.id} className={cn("px-4 py-3", !s.isActive && "bg-canvas/60")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn("text-[15px] font-bold", s.isActive ? "text-ink" : "text-ink-soft")}>
                        {s.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-soft">{s.address}</p>
                    </div>
                    <StoreStatusPill active={s.isActive} />
                  </div>
                  <p className="num-tnum mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-soft">
                    {s.area && <span>エリア {s.area}</span>}
                    {s.phone && <span>TEL {s.phone}</span>}
                    <span>
                      利用デート <b className="font-semibold text-ink">{s._count.dateEvents}</b> 件
                    </span>
                  </p>
                  {s.notes && (
                    <p className="mt-1 text-[13px] whitespace-pre-wrap text-ink-soft">{s.notes}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <EditToggle name={s.name} controls={editId(s.id, "sp")} />
                    <ToggleActiveForm store={s} />
                  </div>
                  <div id={editId(s.id, "sp")} className="hidden pt-3 [:has(details[open])+&]:block">
                    <div className="rounded-lg bg-canvas p-3">
                      <StoreEditForm store={s} />
                    </div>
                  </div>
                </li>
              ))}
            </MobileList>
          </>
        )}

        {!canAdd && (
          <p className="mt-3 text-[13px] text-ink-soft">
            上限の{MAX_STORES}店舗に達しています。追加するには既存の店舗を整理してください。
          </p>
        )}
      </Section>

      {canAdd && (
        <Section title="店舗を追加" id="create">
          <Panel className="max-w-3xl">
            <PanelHeader title="新しい店舗" description={`あと ${remaining} 店舗まで登録できます。`} />
            <PanelBody>
              <form action={createStore} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="店舗名" required>
                    <Input name="name" placeholder="例：カフェ・ノルテ 大通" required className="h-10" />
                  </Field>
                  <Field label="住所" required>
                    <Input name="address" placeholder="例：札幌市中央区大通西3丁目" required className="h-10" />
                  </Field>
                  <Field label="エリア" hint="例：札幌中心部・円山 など">
                    <Input name="area" placeholder="例：札幌中心部" className="h-10" />
                  </Field>
                  <Field label="電話番号">
                    <Input name="phone" placeholder="例：011-000-0000" className="h-10" />
                  </Field>
                </div>
                <Field label="メモ・備考">
                  <Textarea name="notes" placeholder="運営向けの覚え書き" rows={2} className="min-h-20" />
                </Field>
                <Button type="submit" size="md">
                  店舗を追加
                </Button>
              </form>
            </PanelBody>
          </Panel>
        </Section>
      )}
    </div>
  );
}

/** PC の表の1店舗分（本体の行＋編集フォームの行） */
function StoreTableRows({ store: s }: { store: StoreRow }) {
  return (
    <>
      <tr className={cn(rowClass({ muted: !s.isActive, clickable: false }), "has-[details[open]]:bg-canvas")}>
        <Td>
          <p className={cn("font-bold", s.isActive ? "text-ink" : "text-ink-soft")}>{s.name}</p>
          {s.notes && (
            <p className="mt-0.5 line-clamp-1 max-w-64 text-[13px] text-ink-soft" title={s.notes}>
              {s.notes}
            </p>
          )}
        </Td>
        <Td>
          <StoreStatusPill active={s.isActive} />
        </Td>
        <Td className="whitespace-nowrap">{s.area ?? <span className="text-ink-soft">—</span>}</Td>
        <Td>{s.address}</Td>
        <Td className="num-tnum whitespace-nowrap">{s.phone ?? <span className="text-ink-soft">—</span>}</Td>
        <Td align="right" className="font-semibold">
          {s._count.dateEvents.toLocaleString("ja-JP")}
          <span className="ml-0.5 text-[13px] font-normal text-ink-soft">件</span>
        </Td>
        <Td align="right">
          <div className="flex items-center justify-end gap-2">
            <EditToggle name={s.name} controls={editId(s.id, "pc")} />
            <ToggleActiveForm store={s} />
          </div>
        </Td>
      </tr>
      <tr id={editId(s.id, "pc")} className="hidden [:has(details[open])+&]:table-row">
        <td colSpan={7} className="bg-canvas px-4 py-4">
          <p className="mb-3 text-sm font-bold text-ink">「{s.name}」を編集</p>
          <StoreEditForm store={s} />
        </td>
      </tr>
    </>
  );
}

function StoreStatusPill({ active }: { active: boolean }) {
  return active ? <StatusPill tone="success">稼働中</StatusPill> : <StatusPill tone="neutral">停止中</StatusPill>;
}

/** 編集フォームの置き場所の id（表とカード行の両方に描画するので、どちらかを区別する） */
function editId(storeId: string, where: "pc" | "sp") {
  return `store-edit-${where}-${storeId}`;
}

/**
 * 編集フォームの開閉ボタン。name を揃えて、同時に開くのは1店舗だけにする。
 * フォームは details の外（直後の兄弟）にあるので、aria-controls で開く先を支援技術に伝える
 */
function EditToggle({ name, controls }: { name: string; controls: string }) {
  return (
    <details name="store-edit" className="group">
      <summary className={editSummary} aria-controls={controls}>
        <span className="sr-only">{name}：</span>
        <span className="group-open:hidden">編集</span>
        <span className="hidden group-open:inline">閉じる</span>
      </summary>
    </details>
  );
}

function ToggleActiveForm({ store }: { store: StoreRow }) {
  return (
    <form action={toggleStoreActive} className="shrink-0">
      <input type="hidden" name="id" value={store.id} />
      <Button type="submit" variant={store.isActive ? "outline" : "secondary"} size="sm">
        {store.isActive ? "停止にする" : "稼働にする"}
      </Button>
    </form>
  );
}

function StoreEditForm({ store }: { store: StoreRow }) {
  return (
    <form action={updateStore} aria-label={`「${store.name}」の編集`} className="max-w-3xl space-y-3 text-left">
      <input type="hidden" name="id" value={store.id} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="店舗名" required>
          <Input name="name" defaultValue={store.name} required className="h-10" />
        </Field>
        <Field label="住所" required>
          <Input name="address" defaultValue={store.address} required className="h-10" />
        </Field>
        <Field label="エリア" hint="例：札幌中心部・円山 など">
          <Input name="area" defaultValue={store.area ?? ""} className="h-10" />
        </Field>
        <Field label="電話番号">
          <Input name="phone" defaultValue={store.phone ?? ""} className="h-10" />
        </Field>
      </div>
      <Field label="メモ・備考">
        <Textarea name="notes" defaultValue={store.notes ?? ""} rows={2} className="min-h-20" />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={store.isActive}
            className="h-4 w-4 accent-primary"
          />
          稼働中にする
        </label>
        <Button type="submit" size="md">
          変更を保存
        </Button>
      </div>
    </form>
  );
}
