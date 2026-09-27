// ════════════════════════════════════════════════════════════════════
//  通知（アプリ内／メール／LINE）
//  ・アプリ内通知は常に DB に保存（お知らせ画面に表示）
//  ・メールはスタブ（配信サービス接続時に差し替え）
//  ・LINE は Messaging API でプッシュ。送るかどうかは次の順で判定し、
//    送らなかった場合は理由を Notification.lineSkipReason に残す。
//      1. 運営の全体スイッチ（LineDeliverySetting.enabled）
//      2. イベント別の ON/OFF（NotificationRule.lineEnabled）
//      3. 会員の設定（notifyViaLine・イベント別の lineMutedTypes）
//      4. LINE 連携・友だち状態
//      5. 月間上限（monthlyLimit）と優先枠（priorityReserve）
// ════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";
import { EVENT_BY_TYPE, type RuleValue } from "@/lib/notification-rules";
import { isMessagingConfigured, notificationMessage, pushLineMessage } from "@/lib/line";

export interface NotifyInput {
  memberId: string;
  type: NotificationType;
  title: string;
  body: string;
  matchId?: string;
  /** 通知から開く画面（省略時は種類から決める） */
  path?: string;
  /** false ならメールは送らない（イベント設定より優先） */
  email?: boolean;
}

/** イベントの配信ルール（DB の上書き → なければ既定値） */
export async function getRule(type: NotificationType): Promise<RuleValue> {
  const row = await prisma.notificationRule.findUnique({ where: { type } });
  return row ?? EVENT_BY_TYPE[type].default;
}

/** 全イベントのルール（管理画面用） */
export async function getAllRules() {
  const rows = await prisma.notificationRule.findMany();
  const byType = new Map(rows.map((r) => [r.type, r]));
  return Object.values(EVENT_BY_TYPE).map((e) => ({
    ...e,
    rule: (byType.get(e.type) ?? e.default) as RuleValue,
    customized: byType.has(e.type),
  }));
}

export async function getLineDeliverySetting() {
  return (
    (await prisma.lineDeliverySetting.findUnique({ where: { id: "default" } })) ?? {
      id: "default",
      enabled: true,
      monthlyLimit: null as number | null,
      priorityReserve: 0,
      updatedAt: null as Date | null,
    }
  );
}

/** 当月（日本時間）の1日 0:00 */
export function startOfMonthJst(now = new Date()) {
  const jst = new Date(now.getTime() + 9 * 3600_000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1) - 9 * 3600_000);
}

/** 当月の LINE 配信数 */
export function countLineSentThisMonth() {
  return prisma.notification.count({ where: { lineSentAt: { gte: startOfMonthJst() } } });
}

function defaultPath(input: NotifyInput) {
  if (input.path) return input.path;
  if (input.matchId) return `/matches/${input.matchId}`;
  if (input.type === "APPLICATION_RECEIVED") return "/applications";
  return "/notifications";
}

type LineDecision = { send: true; to: string } | { send: false; reason: string };

async function decideLine(input: NotifyInput, rule: RuleValue): Promise<LineDecision> {
  const setting = await getLineDeliverySetting();
  if (!setting.enabled) return { send: false, reason: "DELIVERY_OFF" };
  if (!rule.lineEnabled) return { send: false, reason: "EVENT_OFF" };

  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: { lineUserId: true, notifyViaLine: true, lineMutedTypes: true, lineFollowing: true },
  });
  if (!member) return { send: false, reason: "NOT_LINKED" };
  if (!member.notifyViaLine) return { send: false, reason: "MEMBER_OFF" };
  if (member.lineMutedTypes.includes(input.type)) return { send: false, reason: "MEMBER_MUTED" };
  if (!member.lineUserId) return { send: false, reason: "NOT_LINKED" };
  if (member.lineFollowing === false) return { send: false, reason: "NOT_FRIEND" };

  if (setting.monthlyLimit != null) {
    const sent = await countLineSentThisMonth();
    const remaining = setting.monthlyLimit - sent;
    if (remaining <= 0) return { send: false, reason: "LIMIT_REACHED" };
    if (rule.priority < 1 && remaining <= setting.priorityReserve) {
      return { send: false, reason: "RESERVED_FOR_PRIORITY" };
    }
  }
  return { send: true, to: member.lineUserId };
}

/** アプリ内通知を作成し、ルールに従ってメール・LINE も送る。LINE の失敗で処理は止めない。 */
export async function notify(input: NotifyInput) {
  const rule = await getRule(input.type);
  const sendEmail = input.email !== false && rule.emailEnabled;

  if (sendEmail) {
    // TODO: 実装時にメール配信（SES / Resend 等）へ差し替え
    console.info(`[MAIL STUB] -> member ${input.memberId}: ${input.title}`);
  }

  let lineSentAt: Date | null = null;
  let lineSkipReason: string | null = null;
  try {
    const d = await decideLine(input, rule);
    if (!d.send) {
      lineSkipReason = d.reason;
    } else {
      const res = await pushLineMessage(d.to, [
        notificationMessage(input.title, input.body, defaultPath(input)),
      ]);
      if (res.ok) {
        // 未設定（スタブ）の場合は通数に数えない
        if (isMessagingConfigured()) lineSentAt = new Date();
        else lineSkipReason = "NOT_CONFIGURED";
      } else {
        console.error(`[LINE] push failed (${res.status}): ${res.error}`);
        lineSkipReason = "SEND_FAILED";
      }
    }
  } catch (e) {
    console.error("[LINE] notify error", e);
    lineSkipReason = "SEND_FAILED";
  }

  return prisma.notification.create({
    data: {
      memberId: input.memberId,
      type: input.type,
      title: input.title,
      body: input.body,
      matchId: input.matchId,
      path: defaultPath(input),
      emailSentAt: sendEmail ? new Date() : null,
      lineSentAt,
      lineSkipReason,
    },
  });
}
