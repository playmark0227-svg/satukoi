import { requireMember } from "@/lib/auth";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

/** LINE公式のフキダシをかたどったシンプルなアイコン（単色・currentColor） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2c-5.3 0-9.6 3.5-9.6 7.83 0 3.87 3.43 7.1 8.06 7.72.31.07.74.21.85.48.1.24.06.61.03.86l-.13.82c-.04.24-.2.96.84.52 1.04-.43 5.61-3.3 7.65-5.66 1.41-1.55 1.9-3.12 1.9-4.74 0-4.33-4.3-7.83-9.6-7.83z" />
    </svg>
  );
}

const LINE_ITEMS = [
  {
    label: "申し込み・マッチ成立をLINEで受け取る",
    desc: "お相手からの申し込みやマッチ成立時にLINEでお知らせ",
  },
  {
    label: "日程確定・前日リマインドをLINEで受け取る",
    desc: "デート日程の確定と前日のリマインド",
  },
];

const MAIL_ITEMS = [
  { label: "申し受け・マッチング", desc: "お相手からの申し受けやマッチ成立時" },
  { label: "日程候補・日程確定", desc: "デートの日程に関する更新" },
  { label: "当日連絡・リマインド", desc: "デート当日のご連絡" },
  { label: "運営からのお知らせ", desc: "キャンペーン・重要なお知らせ" },
];

/** 通知設定（LINE／メール／アプリ内）。本デモではUIのみ（保存は未実装）。 */
export default async function NotificationSettingsPage() {
  const member = await requireMember();

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="通知設定" backHref="/menu" />
      <div className="space-y-3 px-4 py-4">
        <p className="px-1 text-xs text-ink-faint">
          LINE通知・メール通知・アプリ内通知の受け取りを項目ごとに設定できます。
        </p>

        {/* ── LINE通知 ── */}
        <p className="px-1 pt-2 text-xs font-bold text-ink-faint">LINE通知</p>
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">LINE連携</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                公式アカウントと連携すると、通知をLINEで受け取れます
              </p>
            </div>
            {member.lineConnected ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                  aria-hidden
                >
                  <path d="M4 10.5l4 4 8-8.5" />
                </svg>
                LINE連携済み
              </span>
            ) : (
              /*
                デモでは押下しても何もしない（type="button"）。
                本実装では LINE公式アカウントの友だち追加後、
                Messaging API のアカウント連携（account link）で
                LINE userId と会員IDを紐付ける予定。
                ※ #06C755 は LINE のブランド公式色（ボタンのみに使用）
              */
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#06C755] px-4 text-sm font-bold whitespace-nowrap text-white transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
              >
                <LineIcon className="h-4 w-4" />
                LINEと連携する
              </button>
            )}
          </div>
          <div className="divide-y divide-line border-t border-line">
            {LINE_ITEMS.map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{it.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{it.desc}</p>
                </div>
                <Toggle defaultOn={member.notifyViaLine} label={it.label} />
              </div>
            ))}
          </div>
        </Card>

        {/* ── メール・アプリ内通知 ── */}
        <p className="px-1 pt-2 text-xs font-bold text-ink-faint">
          メール・アプリ内通知
        </p>
        <Card>
          <div className="stagger divide-y divide-line">
            {MAIL_ITEMS.map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{it.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{it.desc}</p>
                </div>
                <Toggle defaultOn label={it.label} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
