import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Card, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberStatusBadge } from "@/components/ui/StatusBadge";
import {
  MEMBER_STATUS_LABELS,
  SEX_LABELS,
  RESIDENCE_AREA_LABELS,
} from "@/lib/constants";
import { calcAge, formatDate } from "@/lib/format";


type MemberStatus = keyof typeof MEMBER_STATUS_LABELS;

const STATUS_VALUES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[];

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status =
    sp.status && STATUS_VALUES.includes(sp.status as MemberStatus)
      ? (sp.status as MemberStatus)
      : "";

  const where: Prisma.MemberWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { nickname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">会員管理</h1>
      <p className="mb-4 text-sm text-ink-soft">
        会員の検索・絞り込み、各会員の詳細確認や承認・ステータス変更を行います。
      </p>

      <Card className="mb-4">
        <CardBody>
          <form method="get" className="space-y-3">
            <Field label="キーワード検索" hint="名前・ニックネーム・メールの部分一致">
              <Input
                name="q"
                defaultValue={q}
                placeholder="例：山本 / みさき / female1@..."
              />
            </Field>
            <Field label="ステータスで絞り込み">
              <Select name="status" defaultValue={status}>
                <option value="">すべて</option>
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {MEMBER_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                絞り込む
              </Button>
              {(q || status) && (
                <Link
                  href="/admin/members"
                  className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-ink-soft hover:bg-line/60"
                >
                  条件をクリア
                </Link>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="mb-2 px-1 text-sm text-ink-soft">
        該当 {members.length} 名
      </p>

      {members.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="🔍"
              title="該当する会員がいません"
              description="検索条件を変更してお試しください。"
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {members.map((m) => {
                const photo = m.photos[0];
                return (
                  <li key={m.id}>
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
                    >
                      <Avatar
                        url={photo?.url}
                        name={m.nickname}
                        className="h-12 w-12 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className="truncate font-bold text-ink">
                            {m.fullName}
                          </span>
                          <span className="shrink-0 text-xs text-ink-soft">
                            （{m.nickname}）
                          </span>
                        </p>
                        <p className="truncate text-xs text-ink-faint">
                          会員ID：{m.id}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-soft">
                          <span>{SEX_LABELS[m.sex]}</span>
                          <span>{calcAge(m.birthDate)}歳</span>
                          <span>{RESIDENCE_AREA_LABELS[m.residenceArea]}</span>
                          <span>登録 {formatDate(m.createdAt)}</span>
                        </p>
                      </div>
                      <span className="ml-1 shrink-0">
                        <MemberStatusBadge status={m.status} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
