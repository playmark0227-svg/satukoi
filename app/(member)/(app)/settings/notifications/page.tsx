import { requireMember } from "@/lib/auth";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { LineLoginButton } from "@/components/member/liff/LineLoginButton";
import { IS_DEMO } from "@/lib/demo";
import { NOTIFICATION_EVENTS } from "@/lib/notification-rules";
import { saveLineSettings } from "./actions";

/** LINE公式アカウントの友だち追加 URL（ベーシックID 例: @123abcde） */
const OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID ?? "";
const addFriendUrl = OA_ID ? `https://line.me/R/ti/p/${encodeURIComponent(OA_ID)}` : null;

const LINE_EVENTS = NOTIFICATION_EVENTS.filter((e) => e.memberToggle);

/** LINE公式のフキダシをかたどったシンプルなアイコン（単色・currentColor） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2c-5.3 0-9.6 3.5-9.6 7.83 0 3.87 3.43 7.1 8.06 7.72.31.07.74.21.85.48.1.24.06.61.03.86l-.13.82c-.04.24-.2.96.84.52 1.04-.43 5.61-3.3 7.65-5.66 1.41-1.55 1.9-3.12 1.9-4.74 0-4.33-4.3-7.83-9.6-7.83z" />
    </svg>
  );
}

const MAIL_ITEMS = [
  { label: "いいね・申し受け・マッチング", desc: "いいね・デートの申し込み・マッチ成立時" },
  { label: "日程候補・日程確定", desc: "デートの日程に関する更新" },
  { label: "当日連絡・リマインド", desc: "デート当日のご連絡" },
  { label: "運営からのお知らせ", desc: "キャンペーン・重要なお知らせ" },
];

/** 通知設定（LINE／メール／アプリ内）。LINE の設定は保存され、通知の配信に反映される。 */
export default async function NotificationSettingsPage() {
  const member = await requireMember();
  const linked = !!member.lineUserId || member.lineConnected;

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
                連携すると、LINEからワンタップでログインでき、通知もLINEで受け取れます
              </p>
            </div>
            {linked ? (
              <span className="animate-scale-in inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
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
              <div className="w-40 shrink-0">
                <LineLoginButton demo={IS_DEMO} label="LINEと連携する" />
              </div>
            )}
          </div>

          {/* 公式アカウントの友だち追加（LINE でメッセージを受け取るのに必要） */}
          {linked && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">公式アカウントの友だち追加</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {member.lineFollowing === false
                    ? "ブロック中または未追加のため、LINE通知が届きません"
                    : "通知はサツコイ！公式アカウントから届きます"}
                </p>
              </div>
              {member.lineFollowing ? (
                <span className="shrink-0 text-xs font-bold text-success">追加済み</span>
              ) : addFriendUrl ? (
                <a
                  href={addFriendUrl}
                  className="press inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#06C755] px-4 text-sm font-bold whitespace-nowrap text-white"
                >
                  <LineIcon className="h-4 w-4" />
                  友だち追加
                </a>
              ) : (
                <span className="shrink-0 text-xs text-ink-faint">準備中</span>
              )}
            </div>
          )}

          <form action={saveLineSettings} className="divide-y divide-line border-t border-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">LINEで通知を受け取る</p>
                <p className="mt-0.5 text-xs text-ink-faint">OFFにすると、LINEへの通知をすべて止めます</p>
              </div>
              <Toggle name="notifyViaLine" defaultOn={member.notifyViaLine} label="LINEで通知を受け取る" autoSubmit={!IS_DEMO} />
            </div>
            {LINE_EVENTS.map((e) => (
              <div key={e.type} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{e.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{e.desc}</p>
                </div>
                <Toggle
                  name={`line_${e.type}`}
                  defaultOn={!member.lineMutedTypes.includes(e.type)}
                  label={`${e.label}をLINEで受け取る`}
                  autoSubmit={!IS_DEMO}
                />
              </div>
            ))}
          </form>
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
