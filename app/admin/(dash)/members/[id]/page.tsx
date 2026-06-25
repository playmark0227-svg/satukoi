import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MemberStatusBadge,
  DocCheckBadge,
} from "@/components/ui/StatusBadge";
import {
  MEMBER_STATUS_LABELS,
  MEMBER_ACCOUNT_TYPE_LABELS,
  SEX_LABELS,
  RESIDENCE_AREA_LABELS,
  ELIGIBILITY_LABELS,
  INCOME_BRACKET_LABELS,
  HOLIDAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  BODY_TYPE_LABELS,
  SMOKING_LABELS,
  DRINKING_LABELS,
  CHILDREN_WISH_LABELS,
  YES_NO,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/constants";
import { calcAge, formatDate, formatDateTime } from "@/lib/format";
import {
  approveMember,
  setStatus,
  rejectDocuments,
  forceWithdraw,
  suspendMember,
  setReferralBonus,
  addMemo,
  setDocCheck,
} from "./actions";


type MemberStatus = keyof typeof MEMBER_STATUS_LABELS;
const STATUS_VALUES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[];
const DOC_TYPES = ["ID_DOCUMENT", "SINGLE_CERT", "INCOME_CERT"] as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <span className="shrink-0 text-sm text-ink-soft">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

// 静的エクスポート（デモ）用：全会員を事前生成
export async function generateStaticParams() {
  if (process.env.DEMO_EXPORT !== "1") return [];
  const rows = await prisma.member.findMany({ select: { id: true } });
  return rows.map((r) => ({ id: r.id }));
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      ownReferralCode: true,
      referralAsReferred: true,
      adminMemos: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      _count: {
        select: {
          applicationsSent: true,
          applicationsReceived: true,
        },
      },
    },
  });

  if (!member) notFound();

  // デート回数：実施済（COMPLETED）のマッチ件数（申込/申受いずれの立場でも）
  const dateCount = await prisma.match.count({
    where: {
      phase: "COMPLETED",
      OR: [{ applicantId: member.id }, { receiverId: member.id }],
    },
  });

  // 書類は種別ごとに最新の1件を表示
  const latestDocByType = new Map<string, (typeof member.documents)[number]>();
  for (const d of member.documents) {
    if (!latestDocByType.has(d.type)) latestDocByType.set(d.type, d);
  }

  const holidays =
    member.holidayType === "OTHER_FIXED"
      ? member.fixedHolidays.map((w) => WEEKDAY_LABELS[w]).join("・") || "—"
      : HOLIDAY_TYPE_LABELS[member.holidayType];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/members"
          className="text-sm font-bold text-primary hover:underline"
        >
          ← 会員一覧へ
        </Link>
        <MemberStatusBadge status={member.status} />
      </div>

      {/* ── ヘッダー：写真・名前・会員ID ── */}
      <Card className="mb-4">
        <CardBody className="flex items-center gap-4">
          <Avatar
            url={member.photos[0]?.url}
            name={member.nickname}
            className="h-16 w-16 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-ink">
              {member.fullName}
              <span className="ml-2 text-sm font-medium text-ink-soft">
                （{member.nickname}）
              </span>
            </p>
            <p className="truncate text-xs text-ink-faint">
              会員ID：{member.id}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {SEX_LABELS[member.sex]}・{calcAge(member.birthDate)}歳・
              {MEMBER_ACCOUNT_TYPE_LABELS[member.accountType]}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ── 写真一覧 ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">写真</h2>
      <Card className="mb-4">
        <CardBody>
          {member.photos.length === 0 ? (
            <p className="text-sm text-ink-faint">写真は登録されていません。</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {member.photos.map((p) => (
                <Avatar
                  key={p.id}
                  url={p.url}
                  name={member.nickname}
                  rounded="xl"
                  className="h-20 w-20"
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── 基本プロフィール ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
        基本プロフィール
      </h2>
      <Card className="mb-4">
        <CardBody className="divide-y divide-line p-0">
          <Row label="名前（本名）" value={member.fullName} />
          <Row label="ニックネーム" value={member.nickname} />
          <Row label="メール" value={member.email} />
          <Row label="性別" value={SEX_LABELS[member.sex]} />
          <Row
            label="生年月日 / 年齢"
            value={`${formatDate(member.birthDate)}（${calcAge(member.birthDate)}歳）`}
          />
          <Row
            label="居住地"
            value={RESIDENCE_AREA_LABELS[member.residenceArea]}
          />
          <Row
            label="在住 / 在勤"
            value={ELIGIBILITY_LABELS[member.eligibilityType]}
          />
          <Row label="職業" value={member.occupation} />
          <Row
            label="年収帯"
            value={
              <span className="inline-flex items-center gap-2">
                {INCOME_BRACKET_LABELS[member.incomeBracket]}
                {member.incomeCertVerified ? (
                  <Badge tone="success">所得証明済</Badge>
                ) : (
                  <Badge tone="neutral">未提出</Badge>
                )}
              </span>
            }
          />
          <Row label="休日" value={holidays} />
          <Row
            label="婚姻歴"
            value={YES_NO[String(member.hasMarriageHistory) as "true" | "false"]}
          />
          <Row
            label="子供"
            value={YES_NO[String(member.hasChildren) as "true" | "false"]}
          />
          <Row
            label="将来子供は？"
            value={CHILDREN_WISH_LABELS[member.childrenWish]}
          />
          <Row label="身長" value={`${member.heightCm} cm`} />
          <Row label="体型" value={BODY_TYPE_LABELS[member.bodyType]} />
          <Row label="タバコ" value={SMOKING_LABELS[member.smoking]} />
          <Row label="お酒" value={DRINKING_LABELS[member.drinking]} />
          <Row label="資格" value={member.qualifications || "—"} />
          <Row label="趣味" value={member.hobbies || "—"} />
          <Row
            label="自己紹介"
            value={
              <span className="whitespace-pre-wrap text-left">
                {member.selfIntroduction || "—"}
              </span>
            }
          />
          <Row label="登録日" value={formatDate(member.createdAt)} />
          <Row
            label="承認日"
            value={member.approvedAt ? formatDateTime(member.approvedAt) : "—"}
          />
          <Row
            label="カード登録"
            value={member.cardRegistered ? "登録済" : "未登録"}
          />
        </CardBody>
      </Card>

      {/* ── 活動状況 ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">活動状況</h2>
      <Card className="mb-4">
        <CardBody className="divide-y divide-line p-0">
          <Row label="申込回数（送信）" value={`${member._count.applicationsSent} 回`} />
          <Row
            label="申受回数（受信）"
            value={`${member._count.applicationsReceived} 回`}
          />
          <Row label="デート回数（実施済）" value={`${dateCount} 回`} />
        </CardBody>
      </Card>

      {/* ── 紹介制度 ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">紹介制度</h2>
      <Card className="mb-4">
        <CardBody className="divide-y divide-line p-0">
          <Row
            label="紹介コード"
            value={member.ownReferralCode?.code ?? "—"}
          />
          <Row
            label="紹介元会員ID"
            value={
              member.referralAsReferred?.referrerId ? (
                <Link
                  href={`/admin/members/${member.referralAsReferred.referrerId}`}
                  className="text-primary hover:underline"
                >
                  {member.referralAsReferred.referrerId}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Row
            label="紹介特典（デート代無料）残数"
            value={`${member.referralBonusRemaining} 回分`}
          />
        </CardBody>
      </Card>

      {/* ── 書類 ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">書類確認</h2>
      <Card className="mb-4">
        <CardBody className="space-y-3">
          {DOC_TYPES.map((t) => {
            const doc = latestDocByType.get(t);
            return (
              <div key={t} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">
                    {DOCUMENT_TYPE_LABELS[t]}
                  </span>
                  {doc ? (
                    <DocCheckBadge status={doc.checkStatus} />
                  ) : (
                    <Badge tone="neutral">未提出</Badge>
                  )}
                </div>
                {doc?.note && (
                  <p className="mt-1 text-xs text-danger">{doc.note}</p>
                )}
                {doc?.checkedAt && (
                  <p className="mt-1 text-xs text-ink-faint">
                    確認日時：{formatDateTime(doc.checkedAt)}
                  </p>
                )}
                {doc && (
                  <form
                    action={setDocCheck}
                    className="mt-2 flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="docType" value={t} />
                    <Field label="確認状態" className="flex-1 min-w-[120px]">
                      <Select name="checkStatus" defaultValue={doc.checkStatus}>
                        <option value="PENDING">未確認</option>
                        <option value="OK">確認OK</option>
                        <option value="NG">差戻し</option>
                      </Select>
                    </Field>
                    <Field
                      label="差戻し理由（NG時）"
                      className="flex-1 min-w-[160px]"
                    >
                      <Input
                        name="note"
                        defaultValue={doc.note ?? ""}
                        placeholder="再提出の理由"
                      />
                    </Field>
                    <Button type="submit" size="sm" variant="outline">
                      反映
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* ── 操作 ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">運営操作</h2>
      <div className="mb-4 space-y-3">
        {/* 承認 */}
        {member.status === "DOCUMENT_REVIEW" && (
          <Card>
            <CardBody>
              <p className="mb-2 text-sm text-ink-soft">
                書類確認を完了し、この会員を有効化します。
              </p>
              <form action={approveMember}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button type="submit" size="sm">
                  承認して有効化
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* 差戻し */}
        <Card>
          <CardBody>
            <p className="mb-2 text-sm font-bold text-ink">書類の差戻し</p>
            <form action={rejectDocuments} className="space-y-2">
              <input type="hidden" name="memberId" value={member.id} />
              <Field label="差戻し理由">
                <Textarea
                  name="note"
                  rows={2}
                  placeholder="例：身分証の有効期限が切れています。"
                />
              </Field>
              <Button type="submit" size="sm" variant="outline">
                必須書類を差戻し（書類確認中へ）
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* ステータス変更 */}
        <Card>
          <CardBody>
            <p className="mb-2 text-sm font-bold text-ink">ステータス変更</p>
            <form
              action={setStatus}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="memberId" value={member.id} />
              <Field label="ステータス" className="flex-1 min-w-[160px]">
                <Select name="status" defaultValue={member.status}>
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {MEMBER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" size="sm" variant="secondary">
                変更
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* 紹介特典残数 */}
        <Card>
          <CardBody>
            <p className="mb-2 text-sm font-bold text-ink">
              紹介特典（デート代無料）残数の変更
            </p>
            <form
              action={setReferralBonus}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="memberId" value={member.id} />
              <Field label="残数" className="w-32">
                <Input
                  name="referralBonusRemaining"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={member.referralBonusRemaining}
                />
              </Field>
              <Button type="submit" size="sm" variant="secondary">
                更新
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* 利用停止 / 強制退会 */}
        <Card>
          <CardBody className="space-y-2">
            <p className="text-sm font-bold text-ink">アカウント制限</p>
            <div className="flex flex-wrap gap-2">
              <form action={suspendMember}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button type="submit" size="sm" variant="outline">
                  利用停止にする
                </Button>
              </form>
              <form action={forceWithdraw}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button type="submit" size="sm" variant="danger">
                  強制退会させる
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── 運営メモ ── */}
      <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">運営メモ</h2>
      <Card>
        <CardBody>
          <form action={addMemo} className="space-y-2">
            <input type="hidden" name="memberId" value={member.id} />
            <Field label="メモを追加">
              <Textarea
                name="body"
                rows={2}
                placeholder="対応履歴・申し送りなどを記録"
                required
              />
            </Field>
            <Button type="submit" size="sm">
              メモを追加
            </Button>
          </form>

          <div className="mt-4">
            {member.adminMemos.length === 0 ? (
              <EmptyState
                icon="📝"
                title="メモはまだありません"
                description="この会員に関する対応を記録できます。"
              />
            ) : (
              <ul className="space-y-2">
                {member.adminMemos.map((memo) => (
                  <li
                    key={memo.id}
                    className="rounded-xl border border-line bg-canvas p-3"
                  >
                    <p className="whitespace-pre-wrap text-sm text-ink">
                      {memo.body}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {memo.author?.name ?? "運営"}・
                      {formatDateTime(memo.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
