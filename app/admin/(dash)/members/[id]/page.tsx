import { notFound } from "next/navigation";
import type { ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import {
  PageHeader,
  Section,
  Panel,
  PanelHeader,
  PanelBody,
  DetailLayout,
  Callout,
  EmptyInline,
} from "@/components/admin/ui/Layout";
import {
  MemberStatusPill,
  DocCheckPill,
  StatusPill,
  Tag,
} from "@/components/admin/ui/Pills";
import {
  StatTile,
  KeyValueList,
  SummaryGrid,
  MemberName,
  Timestamp,
  rowClass,
  type KV,
} from "@/components/admin/ui/Data";
import { navLabel } from "@/lib/admin/nav";
import { IconChevronRight } from "@/components/member/icons";
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
import { calcAge, formatDate } from "@/lib/format";
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
/** 必須書類（所得証明は任意） */
const REQUIRED_DOC_TYPES: readonly string[] = ["ID_DOCUMENT", "SINGLE_CERT"];

const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  PENDING: "登録済（決済前）",
  ESTABLISHED: "紹介成立",
};

/** 画面で開ける URL か（アップロード未連携のプレースホルダ "pending-upload" などは除く） */
function isViewableUrl(url: string | null | undefined): url is string {
  return !!url && (/^https?:\/\//.test(url) || url.startsWith("/"));
}

/**
 * 2列表示で1つだけ行に取り残される項目を全幅にする（罫線が半分で途切れないように）。
 * full の項目の直前と末尾が対象。
 */
function balanceRows(items: KV[]): KV[] {
  const out = items.map((it) => ({ ...it }));
  let col = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i].full) {
      col = 0;
      continue;
    }
    const next = out[i + 1];
    if (col === 0 && (!next || next.full)) {
      out[i].full = true;
      continue;
    }
    col = col === 0 ? 1 : 0;
  }
  return out;
}

/**
 * 普段は閉じておく操作（確認済みの書類の変更・一括差戻し）。
 * JS なしでも開閉でき、中のフォームはそのまま送信される。
 */
function DocDisclosure({
  open = false,
  bare = false,
  label,
  heading = false,
  children,
}: {
  open?: boolean;
  /** true なら開閉させず、中身をそのまま出す（未確認の書類など、すぐ操作するもの） */
  bare?: boolean;
  label: string;
  /** true なら見出しの体裁（太字・黒）。false は文字リンクの体裁 */
  heading?: boolean;
  children: React.ReactNode;
}) {
  if (bare) return <>{children}</>;
  return (
    <details open={open} className="group">
      <summary
        className={cn(
          // py-1 … スマホで押しやすい高さ（24px 以上）を確保
          "inline-flex min-h-7 cursor-pointer list-none items-center gap-1 py-1 select-none [&::-webkit-details-marker]:hidden",
          heading
            ? "-my-1 text-sm font-bold text-ink"
            : "mt-1 text-[13px] font-semibold text-primary-text hover:underline"
        )}
      >
        <IconChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      {children}
    </details>
  );
}

/** 運営画面の「項目：値」（2列のとき取り残された項目は全幅）。KV_PANEL の Panel に入れる */
function KvGroup({ title, items }: { title?: string; items: KV[] }) {
  return <KeyValueList title={title} items={balanceRows(items)} columns={2} />;
}

/**
 * KvGroup を入れる Panel のクラス。
 * KeyValueList は画面幅（lg）で2列になるが、詳細の本文欄は xl〜2xl で 590〜670px と狭く、
 * 値の欄が 100px 台になってメールなどが途中で折れる。そこでパネル自体の幅で判定し、
 * 46rem 未満なら1列に戻す（全幅指定の col-span-2 も打ち消す）。
 * 最後の行の下罫線はパネル枠と重ねる（二重線にしない）。
 */
const KV_PANEL =
  "@container [&>div:last-child>dl]:-mb-px @max-[46rem]:[&_dl]:grid-cols-1 @max-[46rem]:[&_dl>div]:col-span-1";

/** Button（danger-outline・md）と同じ見た目。<summary> の中でボタンに見せる用 */
const DANGER_OUTLINE_MD =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-danger/40 bg-surface px-4 text-sm font-semibold whitespace-nowrap text-danger-strong";

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
      referralAsReferred: {
        include: {
          referrer: { select: { id: true, nickname: true, fullName: true } },
          code: { select: { code: true, sourceType: true, storeLabel: true } },
        },
      },
      adminMemos: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      _count: {
        select: {
          applicationsSent: true,
          applicationsReceived: true,
          referralsAsReferrer: true,
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
  const latestDocs = DOC_TYPES.map((t) => latestDocByType.get(t)).filter(
    (d): d is NonNullable<typeof d> => !!d
  );
  const pendingDocs = latestDocs.filter((d) => d.checkStatus === "PENDING").length;
  const ngDocs = latestDocs.filter((d) => d.checkStatus === "NG").length;
  const missingRequired = REQUIRED_DOC_TYPES.filter((t) => !latestDocByType.has(t)).length;

  const holidays =
    member.holidayType === "OTHER_FIXED"
      ? member.fixedHolidays.map((w) => WEEKDAY_LABELS[w]).join("・") || "—"
      : HOLIDAY_TYPE_LABELS[member.holidayType];

  const age = calcAge(member.birthDate);
  const isReview = member.status === "DOCUMENT_REVIEW";
  const referral = member.referralAsReferred;
  const incomeDoc = latestDocByType.get("INCOME_CERT");
  // 書類が承認の妨げになっている（未確認・差戻し・必須の未提出）
  const docsNeedAction = pendingDocs > 0 || ngDocs > 0 || missingRequired > 0;
  // 書類確認を本文の上の方に出すか（書類確認中の会員は、未確認がなくても書類が課題）
  const docsFirst = pendingDocs > 0 || isReview;

  // ── 書類の状態（要点）。対応が要るときだけ書類確認へのリンクを添える ──
  const docSummary = (
    <span className="flex flex-wrap items-center gap-x-2">
      {pendingDocs > 0 ? (
        <span className="font-semibold text-warning-strong">未確認 {pendingDocs}件</span>
      ) : ngDocs > 0 ? (
        <span className="font-semibold text-danger-strong">差戻し {ngDocs}件</span>
      ) : missingRequired > 0 ? (
        <span className="font-semibold text-warning-strong">必須書類が未提出</span>
      ) : latestDocs.length > 0 ? (
        <span className="text-success-strong">すべて確認OK</span>
      ) : (
        "—"
      )}
      {docsNeedAction && (
        <a
          href="#docs"
          className="inline-flex min-h-6 items-center text-[13px] font-semibold text-primary-text hover:underline"
        >
          書類確認へ
        </a>
      )}
    </span>
  );

  // ── ステータスごとの説明（有効はステータスで分かるので出さない。日付は見出しの下にある） ──
  const statusGuide: Record<MemberStatus, React.ReactNode> = {
    DOCUMENT_REVIEW: "書類を確認し、問題がなければ承認してください。承認すると会員に通知が届きます。",
    ACTIVE: null,
    SUSPENDED: "利用停止中です。再開するときは「その他の操作」のステータス変更で「有効」にします。",
    WITHDRAWN: "退会済みです。サービスは利用できません。",
  };

  // ── その他の操作（ステータス変更・紹介特典残数）。xl 以上は右欄、未満は本文の末尾 ──
  const otherOps = (wide: boolean) => (
    <div
      className={cn(
        "divide-y divide-line",
        wide && "md:grid md:grid-cols-2 md:divide-x md:divide-y-0"
      )}
    >
      {/* ステータス変更 */}
      <form action={setStatus} className="flex items-end gap-2 px-4 py-3">
        <input type="hidden" name="memberId" value={member.id} />
        <Field label="ステータス変更" className="min-w-0 flex-1">
          <Select name="status" defaultValue={member.status} className="h-10">
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {MEMBER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" size="md" variant="secondary">
          変更
        </Button>
      </form>

      {/* 紹介特典残数 */}
      <form action={setReferralBonus} className="flex items-end gap-2 px-4 py-3">
        <input type="hidden" name="memberId" value={member.id} />
        <Field label="紹介特典残数（デート代無料）" className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Input
              name="referralBonusRemaining"
              type="number"
              min={0}
              step={1}
              defaultValue={member.referralBonusRemaining}
              className="num-tnum h-10 w-24"
            />
            <span className="text-sm text-ink-soft">回分</span>
          </span>
        </Field>
        <Button type="submit" size="md" variant="secondary">
          更新
        </Button>
      </form>
    </div>
  );

  // ── 右欄：ステータスと操作 ──
  // xl 未満は見出しのすぐ下に来るので、見出しと重なる情報（ステータスのピル・日付）は出さない。
  // xl 以上は右欄が追従し見出しが隠れるので、ピルを出す。
  const aside = (
    <div>
      <Panel tone={isReview ? "warning" : "default"}>
        <PanelHeader
          title="ステータス"
          action={
            <span className="hidden xl:block">
              <MemberStatusPill status={member.status} />
            </span>
          }
        />
        <PanelBody className="space-y-3">
          {statusGuide[member.status] && (
            <p className="text-sm leading-relaxed text-ink">{statusGuide[member.status]}</p>
          )}
          <SummaryGrid
            className="xl:grid-cols-2"
            items={[
              { label: "書類", value: docSummary },
              { label: "カード登録", value: member.cardRegistered ? "登録済" : "未登録" },
            ]}
          />
          {isReview && (
            <form action={approveMember} className="pt-1">
              <input type="hidden" name="memberId" value={member.id} />
              <Button type="submit" size="md" className="w-full md:w-auto md:px-8 xl:w-full">
                承認して有効化
              </Button>
            </form>
          )}
        </PanelBody>
      </Panel>

      <Panel className="mt-4 hidden xl:block">
        <PanelHeader title="その他の操作" />
        {otherOps(false)}
      </Panel>
    </div>
  );

  const otherOpsSection = (
    <Section title="その他の操作" className="xl:hidden">
      <Panel>{otherOps(true)}</Panel>
    </Section>
  );

  // ── 写真 ──
  const photosSection = (
    <Section title="写真" count={member.photos.length}>
      <Panel>
        <PanelBody>
          {member.photos.length === 0 ? (
            <p className="text-sm text-ink-soft">写真は登録されていません。</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
              {member.photos.map((p, i) => {
                const thumb = (
                  <Avatar
                    url={p.url}
                    name={member.nickname}
                    className="aspect-square h-auto w-full rounded-lg text-2xl"
                  />
                );
                return (
                  <li key={p.id} className="min-w-0">
                    {isViewableUrl(p.url) ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg transition hover:brightness-95"
                        aria-label={`写真${i + 1}枚目を原寸で開く`}
                      >
                        {thumb}
                      </a>
                    ) : (
                      thumb
                    )}
                    <p className="mt-1 text-xs text-ink-soft">
                      {i === 0 ? "1枚目（メイン）" : `${i + 1}枚目`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {member.photos.length < 2 && (
            <p className={cn("mt-3 text-[13px]", isReview ? "text-warning-strong" : "text-ink-soft")}>
              顔写真は2枚が必須です（現在 {member.photos.length} 枚）。
            </p>
          )}
          {member.photos.some((p) => isViewableUrl(p.url)) && (
            <p className="mt-3 text-xs text-ink-soft">写真をクリックすると原寸で開きます。</p>
          )}
        </PanelBody>
      </Panel>
    </Section>
  );

  // ── 書類確認 ──
  const docsSection = (
    <Section title="書類確認" id="docs">
      {pendingDocs > 0 && (
        <Callout tone="warning" title={`未確認の書類が${pendingDocs}件あります`}>
          内容を確認し、書類ごとに「確認OK」か「差戻し」を反映してください。
          {isReview && "問題がなければステータス欄の「承認して有効化」で利用を開始できます。"}
        </Callout>
      )}
      <Panel>
        <ul className="divide-y divide-line">
          {DOC_TYPES.map((t) => {
            const doc = latestDocByType.get(t);
            const optional = !REQUIRED_DOC_TYPES.includes(t);
            return (
              <li
                key={t}
                className={cn(
                  rowClass({ attention: doc?.checkStatus === "PENDING", clickable: false }),
                  "px-4 py-3"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-bold text-ink">
                      {DOCUMENT_TYPE_LABELS[t]}
                      {optional && <span className="ml-1 text-xs font-normal text-ink-soft">（任意）</span>}
                    </h3>
                    {doc ? <DocCheckPill status={doc.checkStatus} /> : <Tag>未提出</Tag>}
                  </div>
                  {doc &&
                    (isViewableUrl(doc.url) ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-semibold text-primary-text hover:underline"
                      >
                        書類を開く
                      </a>
                    ) : (
                      <span className="text-xs text-ink-soft">ファイル未連携</span>
                    ))}
                </div>
                {doc && (
                  <p className="num-tnum mt-1 flex flex-wrap gap-x-3 text-[13px] text-ink-soft">
                    <span>
                      提出 <Timestamp date={doc.createdAt} />
                    </span>
                    {doc.checkedAt && (
                      <span>
                        確認 <Timestamp date={doc.checkedAt} />
                      </span>
                    )}
                  </p>
                )}
                {doc?.note && (
                  <p className="mt-1 text-[13px] text-danger-strong [overflow-wrap:anywhere]">
                    差戻し理由：{doc.note}
                  </p>
                )}
                {doc && (
                  <DocDisclosure bare={doc.checkStatus === "PENDING"} label="確認状態を変更">
                    <form action={setDocCheck} className="mt-3 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="docType" value={t} />
                      <Field label="確認状態" className="w-36">
                        <Select name="checkStatus" defaultValue={doc.checkStatus} className="h-10">
                          <option value="PENDING">未確認</option>
                          <option value="OK">確認OK</option>
                          <option value="NG">差戻し</option>
                        </Select>
                      </Field>
                      <Field label="差戻し理由（NG時）" className="min-w-[12rem] flex-1">
                        <Input
                          name="note"
                          defaultValue={doc.note ?? ""}
                          placeholder="再提出の理由"
                          className="h-10"
                        />
                      </Field>
                      <Button type="submit" size="md" variant="secondary">
                        反映
                      </Button>
                    </form>
                  </DocDisclosure>
                )}
              </li>
            );
          })}

          {/* 必須書類の一括差戻し */}
          <li className="bg-canvas px-4 py-3">
            <DocDisclosure open={isReview} label="必須書類をまとめて差戻す" heading>
              <form action={rejectDocuments} className="mt-1 max-w-2xl space-y-2">
                <input type="hidden" name="memberId" value={member.id} />
                <p className="text-[13px] text-ink-soft">
                  身分証と独身証明書を「差戻し」にし、会員を「書類確認中」に戻して再提出のお願いを通知します。
                </p>
                <Field label="差戻し理由">
                  <Textarea
                    name="note"
                    rows={2}
                    placeholder="例：身分証の有効期限が切れています。"
                    className="min-h-20 bg-surface"
                  />
                </Field>
                <Button type="submit" size="md" variant="outline">
                  必須書類を差戻し（書類確認中へ）
                </Button>
              </form>
            </DocDisclosure>
          </li>
        </ul>
      </Panel>
    </Section>
  );

  // ── プロフィール ──
  // 年収帯の横に出す所得証明の状態は、書類（INCOME_CERT）の最新の確認状態から出す。
  // incomeCertVerified は「年収を会員に公開するか」のフラグで、書類の確認では変わらないため別の行にする。
  const incomeCertPill = !incomeDoc ? (
    <Tag>所得証明なし</Tag>
  ) : incomeDoc.checkStatus === "PENDING" ? (
    <StatusPill tone="warning">所得証明 確認待ち</StatusPill>
  ) : incomeDoc.checkStatus === "NG" ? (
    <StatusPill tone="danger">所得証明 差戻し</StatusPill>
  ) : (
    <StatusPill tone="success">所得証明 確認OK</StatusPill>
  );

  const profileSection = (
    <Section title="プロフィール">
      <Panel className={KV_PANEL}>
        <KvGroup
          title="基本情報"
          items={[
            { label: "名前（本名）", value: member.fullName },
            { label: "ニックネーム", value: member.nickname },
            { label: "メール", value: member.email },
            { label: "性別", value: SEX_LABELS[member.sex] },
            {
              label: "生年月日 / 年齢",
              value: `${formatDate(member.birthDate)}（${age}歳）`,
            },
            { label: "居住地", value: RESIDENCE_AREA_LABELS[member.residenceArea] },
            { label: "在住 / 在勤", value: ELIGIBILITY_LABELS[member.eligibilityType] },
          ]}
        />
        <KvGroup
          title="仕事・収入"
          items={[
            { label: "職業", value: member.occupation },
            {
              label: "年収帯",
              value: (
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  {INCOME_BRACKET_LABELS[member.incomeBracket]}
                  {incomeCertPill}
                </span>
              ),
            },
            {
              label: "年収の公開",
              value: member.incomeCertVerified ? "公開中" : "非公開",
            },
            { label: "休日", value: holidays },
            { label: "資格", value: member.qualifications || "—" },
          ]}
        />
        <KvGroup
          title="結婚・家族"
          items={[
            {
              label: "婚姻歴",
              value: YES_NO[String(member.hasMarriageHistory) as "true" | "false"],
            },
            {
              label: "子供",
              value: YES_NO[String(member.hasChildren) as "true" | "false"],
            },
            { label: "将来子供は？", value: CHILDREN_WISH_LABELS[member.childrenWish] },
          ]}
        />
        <KvGroup
          title="ライフスタイル"
          items={[
            { label: "身長", value: `${member.heightCm} cm` },
            { label: "体型", value: BODY_TYPE_LABELS[member.bodyType] },
            { label: "タバコ", value: SMOKING_LABELS[member.smoking] },
            { label: "お酒", value: DRINKING_LABELS[member.drinking] },
            { label: "趣味", value: member.hobbies || "—", full: true },
            {
              label: "自己紹介",
              value: (
                <span className="whitespace-pre-wrap leading-relaxed">
                  {member.selfIntroduction || "—"}
                </span>
              ),
              full: true,
            },
          ]}
        />
        {/* 会員種別・登録日・承認日は見出しの下、カード登録はステータス欄にあるので、ここには出さない */}
      </Panel>
    </Section>
  );

  // ── 活動状況 ──
  const activitySection = (
    <Section title="活動状況">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile
          label="申込（送信）"
          value={member._count.applicationsSent}
          unit="回"
          className="p-3 sm:p-4"
        />
        <StatTile
          label="申受（受信）"
          value={member._count.applicationsReceived}
          unit="回"
          className="p-3 sm:p-4"
        />
        <StatTile label="デート実施" value={dateCount} unit="回" className="p-3 sm:p-4" />
      </div>
    </Section>
  );

  // ── 紹介制度 ──
  let referrerValue: React.ReactNode = "—";
  if (referral) {
    if (referral.referrer) {
      referrerValue = <MemberName member={referral.referrer} />;
    } else if (referral.code.sourceType === "STORE") {
      referrerValue = (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          {referral.code.storeLabel || "店舗"}
          <Tag>店舗コード</Tag>
        </span>
      );
    } else {
      referrerValue = <span className="text-ink-soft">紹介元の会員は削除済み</span>;
    }
  }

  const referralSection = (
    <Section title="紹介制度">
      <Panel className={KV_PANEL}>
        <KvGroup
          items={[
            {
              label: "紹介コード",
              value: member.ownReferralCode ? (
                <span className="font-mono">{member.ownReferralCode.code}</span>
              ) : (
                "—"
              ),
            },
            {
              label: "紹介した人数",
              value: `${member._count.referralsAsReferrer} 人`,
            },
            { label: "紹介元", value: referrerValue },
            {
              label: "紹介の状態",
              value: referral ? (
                <span>
                  {REFERRAL_STATUS_LABELS[referral.status]}
                  {referral.code && (
                    <span className="ml-2 text-[13px] font-normal text-ink-soft">
                      コード <span className="font-mono">{referral.code.code}</span>
                    </span>
                  )}
                </span>
              ) : (
                "紹介なし"
              ),
            },
            {
              label: "紹介特典残数",
              value: (
                <span>
                  {member.referralBonusRemaining} 回分
                  <span className="ml-2 text-[13px] font-normal text-ink-soft">
                    デート代無料
                  </span>
                </span>
              ),
            },
          ]}
        />
      </Panel>
    </Section>
  );

  // ── 運営メモ ──
  const memoSection = (
    <Section title="運営メモ" count={member.adminMemos.length}>
      <Panel>
        <PanelBody>
          <form action={addMemo} className="space-y-2">
            <input type="hidden" name="memberId" value={member.id} />
            <Field label="メモを追加">
              <Textarea
                name="body"
                rows={2}
                placeholder="対応履歴・申し送りなどを記録"
                required
                className="min-h-20"
              />
            </Field>
            <Button type="submit" size="md" variant="secondary">
              メモを追加
            </Button>
          </form>
        </PanelBody>
        <div className="border-t border-line">
          {member.adminMemos.length === 0 ? (
            <EmptyInline>メモはまだありません</EmptyInline>
          ) : (
            <ul className="divide-y divide-line">
              {member.adminMemos.map((memo) => (
                <li key={memo.id} className="px-4 py-3">
                  <p className="text-[13px] text-ink-soft">
                    <span className="font-semibold text-ink">{memo.author?.name ?? "運営"}</span>
                    <span className="mx-1.5" aria-hidden>
                      ・
                    </span>
                    <Timestamp date={memo.createdAt} />
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">
                    {memo.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </Section>
  );

  // ── 危険な操作 ──
  // すでにその状態の会員には該当の操作を出さない（押すと停止日・退会日が上書きされるだけのため）。
  // 強制退会は、行を開いてから「強制退会を確定」を押す2段階（JS なしでも動く details）。
  const isSuspended = member.status === "SUSPENDED";
  const isWithdrawn = member.status === "WITHDRAWN";
  const dangerSection = (
    <Panel tone="danger">
      <PanelHeader
        tone="danger"
        title="危険な操作"
        description={
          isWithdrawn ? undefined : "会員の利用に直接影響します。実行前に内容をよく確認してください。"
        }
      />
      {isWithdrawn ? (
        <p className="px-4 py-3 text-sm text-ink-soft">
          退会済みのため、利用停止・強制退会の操作はありません。
        </p>
      ) : (
        <div className="divide-y divide-line">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">利用停止</p>
              <p className="mt-0.5 text-[13px] text-ink-soft">
                {isSuspended
                  ? "現在 停止中です。再開するときは「その他の操作」のステータス変更で「有効」にします。"
                  : "ステータスを「停止」にします。ステータス変更で「有効」に戻せます。"}
              </p>
            </div>
            {!isSuspended && (
              <form action={suspendMember}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button type="submit" size="md" variant="outline">
                  利用停止にする
                </Button>
              </form>
            )}
          </div>
          <details className="group">
            <summary className="group/sum flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
              <span className="block min-w-0">
                <span className="block text-sm font-bold text-ink">強制退会</span>
                <span className="mt-0.5 block text-[13px] text-ink-soft">
                  会員を退会扱い（ステータス「退会」）にします。押すと確認が出ます。
                </span>
              </span>
              <span
                className={cn(
                  DANGER_OUTLINE_MD,
                  "group-hover/sum:bg-danger-soft group-open:border-line group-open:text-ink group-open:group-hover/sum:bg-surface-alt"
                )}
              >
                <span className="group-open:hidden">強制退会させる…</span>
                <span className="hidden group-open:inline">やめる</span>
              </span>
            </summary>
            <div className="px-4 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-danger-soft px-3 py-3">
                <p className="min-w-0 text-[13px] leading-relaxed text-danger-strong [overflow-wrap:anywhere]">
                  {member.nickname}さん（{member.fullName}）を強制退会させます。よろしければ確定してください。
                </p>
                <form action={forceWithdraw}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button type="submit" size="md" variant="danger-outline">
                    強制退会を確定
                  </Button>
                </form>
              </div>
            </div>
          </details>
        </div>
      )}
    </Panel>
  );

  // 書類が課題のとき（未確認がある・書類確認中）は、書類確認を写真のすぐ下（上の方）に出す
  const main = (
    <>
      {photosSection}
      {docsFirst && docsSection}
      {profileSection}
      {activitySection}
      {referralSection}
      {!docsFirst && docsSection}
      {memoSection}
      {otherOpsSection}
      {dangerSection}
    </>
  );

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/members", label: navLabel("members") }}
        title={
          <span className="[overflow-wrap:anywhere]">
            {member.nickname}
            <span className="font-normal">さん</span>
            <span className="ml-1 font-medium text-ink-soft">（{member.fullName}）</span>
          </span>
        }
        status={<MemberStatusPill status={member.status} size="md" />}
        meta={
          <>
            <span>
              {SEX_LABELS[member.sex]}・{age}歳・{RESIDENCE_AREA_LABELS[member.residenceArea]}
            </span>
            <span>{MEMBER_ACCOUNT_TYPE_LABELS[member.accountType]}</span>
            <span>
              登録 <Timestamp date={member.createdAt} dateOnly />
            </span>
            {/* 未承認はステータス（書類確認中）で分かるので出さない */}
            {member.approvedAt && (
              <span>
                承認 <Timestamp date={member.approvedAt} dateOnly />
              </span>
            )}
            {isSuspended && member.suspendedAt && (
              <span>
                停止 <Timestamp date={member.suspendedAt} dateOnly />
              </span>
            )}
            {isWithdrawn && member.withdrawnAt && (
              <span>
                退会 <Timestamp date={member.withdrawnAt} dateOnly />
              </span>
            )}
            <span title={`会員ID：${member.id}`}>
              ID <span className="font-mono">…{member.id.slice(-8)}</span>
            </span>
          </>
        }
      />
      <DetailLayout main={main} aside={aside} />
    </div>
  );
}
