import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ANNOUNCEMENT_TARGET_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { createAnnouncement, togglePublish } from "./actions";


const TARGET_VALUES = Object.keys(
  ANNOUNCEMENT_TARGET_LABELS
) as (keyof typeof ANNOUNCEMENT_TARGET_LABELS)[];

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">お知らせ</h1>
      <p className="mb-4 text-sm text-ink-soft">
        会員へのお知らせを作成・公開します。対象を全員／男性／女性から選べます（全 {announcements.length} 件）。
      </p>

      {/* 作成フォーム */}
      <section className="mb-8">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          お知らせの作成
        </h2>
        <Card>
          <CardBody>
            <form action={createAnnouncement} className="space-y-3">
              <Field label="タイトル" required>
                <Input
                  name="title"
                  placeholder="例：メンテナンスのお知らせ"
                  required
                />
              </Field>
              <Field label="本文" required>
                <Textarea
                  name="body"
                  placeholder="会員向けのお知らせ本文を入力してください。"
                  rows={4}
                  required
                />
              </Field>
              <Field label="対象">
                <Select name="target" defaultValue="ALL">
                  {TARGET_VALUES.map((t) => (
                    <option key={t} value={t}>
                      {ANNOUNCEMENT_TARGET_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  name="isPublished"
                  className="h-4 w-4 accent-primary"
                />
                すぐに公開する（チェックを外すと非公開で保存）
              </label>
              <Button type="submit">お知らせを作成</Button>
            </form>
          </CardBody>
        </Card>
      </section>

      {/* 一覧 */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          お知らせ一覧
        </h2>
        {announcements.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="📣"
                title="お知らせがありません"
                description="上のフォームから作成してください。"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                        {a.title}
                        {a.isPublished ? (
                          <Badge tone="success">公開中</Badge>
                        ) : (
                          <Badge tone="neutral">非公開</Badge>
                        )}
                        <Badge tone="info">
                          {ANNOUNCEMENT_TARGET_LABELS[a.target]}
                        </Badge>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">
                        {a.body}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        作成 {formatDateTime(a.createdAt)}
                        {a.publishedAt &&
                          ` ／ 公開 ${formatDateTime(a.publishedAt)}`}
                      </p>
                    </div>
                    <form action={togglePublish} className="shrink-0">
                      <input type="hidden" name="id" value={a.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={a.isPublished ? "outline" : "secondary"}
                      >
                        {a.isPublished ? "非公開にする" : "公開する"}
                      </Button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
