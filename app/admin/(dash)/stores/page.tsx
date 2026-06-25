import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { createStore, updateStore, toggleStoreActive } from "./actions";

export const dynamic = "force-dynamic";

const MAX_STORES = 5;

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { dateEvents: true } } },
  });

  const remaining = Math.max(0, MAX_STORES - stores.length);
  const canAdd = stores.length < MAX_STORES;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">店舗管理</h1>
      <p className="mb-4 text-sm text-ink-soft">
        デート確定時に運営が選択する店舗を登録します。店舗は最大{MAX_STORES}店舗までです（現在 {stores.length} / {MAX_STORES} 店舗）。
      </p>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">店舗一覧</h2>
        {stores.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="🏠"
                title="店舗がまだ登録されていません"
                description="下のフォームから店舗を追加してください。"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold text-ink">
                        {store.name}
                        {store.isActive ? (
                          <Badge tone="success">稼働中</Badge>
                        ) : (
                          <Badge tone="neutral">停止中</Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">{store.address}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
                        {store.area && <span>エリア：{store.area}</span>}
                        {store.phone && <span>TEL：{store.phone}</span>}
                        <span>利用デート {store._count.dateEvents} 件</span>
                      </p>
                      {store.notes && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-ink-soft">
                          {store.notes}
                        </p>
                      )}
                    </div>
                    <form action={toggleStoreActive} className="shrink-0">
                      <input type="hidden" name="id" value={store.id} />
                      <Button
                        type="submit"
                        variant={store.isActive ? "outline" : "secondary"}
                        size="sm"
                      >
                        {store.isActive ? "停止にする" : "稼働にする"}
                      </Button>
                    </form>
                  </div>

                  <details className="mt-3 border-t border-line pt-3">
                    <summary className="cursor-pointer text-sm font-bold text-primary">
                      この店舗を編集
                    </summary>
                    <form action={updateStore} className="mt-3 space-y-3">
                      <input type="hidden" name="id" value={store.id} />
                      <Field label="店舗名" required>
                        <Input name="name" defaultValue={store.name} required />
                      </Field>
                      <Field label="住所" required>
                        <Input name="address" defaultValue={store.address} required />
                      </Field>
                      <Field label="エリア" hint="例：札幌中心部・円山 など">
                        <Input name="area" defaultValue={store.area ?? ""} />
                      </Field>
                      <Field label="電話番号">
                        <Input name="phone" defaultValue={store.phone ?? ""} />
                      </Field>
                      <Field label="メモ・備考">
                        <Textarea name="notes" defaultValue={store.notes ?? ""} rows={3} />
                      </Field>
                      <label className="flex items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={store.isActive}
                          className="h-4 w-4 accent-primary"
                        />
                        稼働中にする
                      </label>
                      <Button type="submit" size="sm">
                        変更を保存
                      </Button>
                    </form>
                  </details>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">新規店舗の追加</h2>
        <Card>
          <CardBody>
            {canAdd ? (
              <form action={createStore} className="space-y-3">
                <p className="text-xs text-ink-faint">
                  あと {remaining} 店舗まで登録できます。
                </p>
                <Field label="店舗名" required>
                  <Input name="name" placeholder="例：カフェ・ノルテ 大通" required />
                </Field>
                <Field label="住所" required>
                  <Input name="address" placeholder="例：札幌市中央区大通西3丁目" required />
                </Field>
                <Field label="エリア" hint="例：札幌中心部・円山 など">
                  <Input name="area" placeholder="例：札幌中心部" />
                </Field>
                <Field label="電話番号">
                  <Input name="phone" placeholder="例：011-000-0000" />
                </Field>
                <Field label="メモ・備考">
                  <Textarea name="notes" placeholder="運営向けの覚え書き" rows={3} />
                </Field>
                <Button type="submit">店舗を追加</Button>
              </form>
            ) : (
              <p className="text-sm text-ink-soft">
                店舗は最大{MAX_STORES}店舗までです。追加するには既存の店舗を整理してください。
              </p>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
