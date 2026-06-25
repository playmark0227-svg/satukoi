import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { AD_TYPE_LABELS, AD_POSITION_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { createAd, toggleAd } from "./actions";


const TYPE_VALUES = Object.keys(
  AD_TYPE_LABELS
) as (keyof typeof AD_TYPE_LABELS)[];
const POSITION_VALUES = Object.keys(
  AD_POSITION_LABELS
) as (keyof typeof AD_POSITION_LABELS)[];

export default async function AdminAdsPage() {
  const ads = await prisma.ad.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">広告</h1>
      <p className="mb-4 text-sm text-ink-soft">
        トップページ下部・マイページに表示する広告を管理します。自社広告・他社スポンサーの掲載と表示ON/OFFを切り替えられます（全 {ads.length} 件）。
      </p>

      {/* 作成フォーム */}
      <section className="mb-8">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          広告の追加
        </h2>
        <Card>
          <CardBody>
            <form action={createAd} className="space-y-3">
              <Field label="広告タイトル" required>
                <Input
                  name="title"
                  placeholder="例：札幌のおすすめカフェ特集"
                  required
                />
              </Field>
              <Field
                label="バナー画像URL"
                hint="表示するバナー画像のURL"
                required
              >
                <Input
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/banner.png"
                  required
                />
              </Field>
              <Field label="リンク先URL" hint="タップ時の遷移先URL" required>
                <Input
                  name="linkUrl"
                  type="url"
                  placeholder="https://example.com"
                  required
                />
              </Field>
              <div className="flex gap-2">
                <Field label="タイプ" className="flex-1">
                  <Select name="type" defaultValue="OWN">
                    {TYPE_VALUES.map((t) => (
                      <option key={t} value={t}>
                        {AD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="表示位置" className="flex-1">
                  <Select name="position" defaultValue="TOP_BOTTOM">
                    {POSITION_VALUES.map((p) => (
                      <option key={p} value={p}>
                        {AD_POSITION_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="isEnabled"
                  defaultChecked
                  className="h-4 w-4 accent-primary"
                />
                すぐに表示する
              </label>
              <Button type="submit">広告を追加</Button>
            </form>
          </CardBody>
        </Card>
      </section>

      {/* 一覧 */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">広告一覧</h2>
        {ads.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="🖼"
                title="広告がありません"
                description="上のフォームから広告を追加してください。"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                        {ad.title}
                        {ad.isEnabled ? (
                          <Badge tone="success">表示中</Badge>
                        ) : (
                          <Badge tone="neutral">非表示</Badge>
                        )}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-2 text-xs">
                        <Badge tone="info">{AD_POSITION_LABELS[ad.position]}</Badge>
                        <Badge tone="primary">{AD_TYPE_LABELS[ad.type]}</Badge>
                      </p>
                    </div>
                    <form action={toggleAd} className="shrink-0">
                      <input type="hidden" name="id" value={ad.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={ad.isEnabled ? "outline" : "secondary"}
                      >
                        {ad.isEnabled ? "非表示にする" : "表示する"}
                      </Button>
                    </form>
                  </div>

                  {/* バナープレビュー */}
                  <div className="mt-3 overflow-hidden rounded-xl border border-line bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="block h-auto w-full"
                    />
                  </div>

                  <dl className="mt-2 space-y-1 text-xs text-ink-soft">
                    <div className="truncate">
                      <span className="text-ink-faint">画像URL：</span>
                      {ad.imageUrl}
                    </div>
                    <div className="truncate">
                      <span className="text-ink-faint">リンク先：</span>
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {ad.linkUrl}
                      </a>
                    </div>
                    <div>
                      <span className="text-ink-faint">登録：</span>
                      {formatDateTime(ad.createdAt)}
                    </div>
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
