// ════════════════════════════════════════════════════════════════════
//  通知イベントの配信ルール（既定値とラベル）
//  運営管理画面「LINE通知設定」で上書きした値は NotificationRule テーブルに保存され、
//  行が無いイベントはここの既定値を使う（＝テーブルが空でも動く）。
//
//  priority = 1 のイベントは「優先」。LINE の月間上限に近づいたとき
//  （残りが priorityReserve 以下になったとき）も優先イベントだけは配信を続ける。
// ════════════════════════════════════════════════════════════════════

import type { NotificationType } from "@prisma/client";

export type RuleValue = { lineEnabled: boolean; emailEnabled: boolean; priority: number };

export const NOTIFICATION_EVENTS: {
  type: NotificationType;
  label: string;
  desc: string;
  /** 会員が「通知設定」で LINE の受け取りを個別に切り替えられるか */
  memberToggle: boolean;
  default: RuleValue;
}[] = [
  {
    type: "LIKE_RECEIVED",
    label: "いいねが届いた",
    desc: "お相手からいいねが届いたとき",
    memberToggle: true,
    default: { lineEnabled: true, emailEnabled: false, priority: 0 },
  },
  {
    type: "APPLICATION_RECEIVED",
    label: "デートの申込みが届いた",
    desc: "お相手からデートの申込みが届いたとき",
    memberToggle: true,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "MATCHED",
    label: "マッチング成立",
    desc: "申込みが承諾され、マッチングが成立したとき",
    memberToggle: true,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "CANDIDATE_RECEIVED",
    label: "日程候補が届いた",
    desc: "お相手からデートの日程候補が届いたとき",
    memberToggle: true,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "DATE_CONFIRMED",
    label: "デート日程の確定",
    desc: "デートの日時・お店が確定したとき",
    memberToggle: true,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "DAY_OF_CONTACT",
    label: "当日の連絡",
    desc: "デート当日の遅刻・到着などの連絡",
    memberToggle: false,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "RESCHEDULE_REQUEST",
    label: "日程変更の希望",
    desc: "お相手から日程変更の希望が届いたとき",
    memberToggle: false,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "DATE_CANCELLED",
    label: "デートのキャンセル",
    desc: "デートがキャンセルされたとき",
    memberToggle: false,
    default: { lineEnabled: true, emailEnabled: true, priority: 1 },
  },
  {
    type: "ADMIN_ANNOUNCEMENT",
    label: "運営からのお知らせ",
    desc: "審査結果・警告など運営からの個別連絡",
    memberToggle: false,
    default: { lineEnabled: false, emailEnabled: true, priority: 0 },
  },
];

export const EVENT_BY_TYPE = Object.fromEntries(
  NOTIFICATION_EVENTS.map((e) => [e.type, e])
) as Record<NotificationType, (typeof NOTIFICATION_EVENTS)[number]>;

/** LINE を送らなかった理由（Notification.lineSkipReason）の表示名 */
export const LINE_SKIP_LABELS: Record<string, string> = {
  EVENT_OFF: "イベントがOFF",
  DELIVERY_OFF: "LINE配信を停止中",
  MEMBER_OFF: "会員がLINE通知をOFF",
  MEMBER_MUTED: "会員がこのイベントをOFF",
  NOT_LINKED: "LINE未連携",
  NOT_FRIEND: "公式アカウント未追加・ブロック",
  LIMIT_REACHED: "月間上限に到達",
  RESERVED_FOR_PRIORITY: "優先枠のため見送り",
  NOT_CONFIGURED: "Messaging API 未設定（ログのみ）",
  SEND_FAILED: "送信エラー",
};
