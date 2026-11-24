// ════════════════════════════════════════════════════════════════════
//  運営管理画面のメニュー（サイドバー・スマホのタブ・ページ見出しで同じ名前を使う）
// ════════════════════════════════════════════════════════════════════

import type { AttentionCounts } from "@/lib/admin/attention";

export type NavKey =
  | "dashboard"
  | "members"
  | "matches"
  | "cancellations"
  | "reports"
  | "announcements"
  | "ads"
  | "stores"
  | "gift-tickets"
  | "line";

export type NavItem = {
  key: NavKey;
  href: string;
  /** サイドバー・ページ見出し */
  label: string;
  /** スマホのタブ */
  short: string;
  group: "daily" | "content" | "settings";
  exact?: boolean;
  /** 件数バッジに使う要対応の種類 */
  counts?: (keyof Omit<AttentionCounts, "total">)[];
};

export const NAV_GROUP_LABELS: Record<NavItem["group"], string> = {
  daily: "日々の対応",
  content: "コンテンツ",
  settings: "設定",
};

export const ADMIN_NAV: NavItem[] = [
  { key: "dashboard", href: "/admin", label: "ダッシュボード", short: "ホーム", group: "daily", exact: true },
  { key: "members", href: "/admin/members", label: "会員管理", short: "会員", group: "daily", counts: ["review"] },
  { key: "matches", href: "/admin/matches", label: "マッチ＆デート", short: "マッチ", group: "daily", counts: ["matches"] },
  { key: "cancellations", href: "/admin/cancellations", label: "キャンセル・違約金", short: "キャンセル", group: "daily", counts: ["penalties"] },
  { key: "reports", href: "/admin/reports", label: "通報・お問い合わせ", short: "通報", group: "daily", counts: ["reports", "inquiries"] },
  { key: "announcements", href: "/admin/announcements", label: "お知らせ", short: "お知らせ", group: "content" },
  { key: "ads", href: "/admin/ads", label: "広告", short: "広告", group: "content" },
  { key: "stores", href: "/admin/stores", label: "店舗", short: "店舗", group: "settings" },
  { key: "gift-tickets", href: "/admin/gift-tickets", label: "ギフト券", short: "ギフト券", group: "settings" },
  { key: "line", href: "/admin/line", label: "LINE通知設定", short: "LINE通知", group: "settings" },
];

/** ページ見出し（h1）に使う名前。メニューと必ず一致させる */
export function navLabel(key: NavKey) {
  return ADMIN_NAV.find((n) => n.key === key)!.label;
}
