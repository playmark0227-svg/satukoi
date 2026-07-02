import { requireMember } from "@/lib/auth";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

const ITEMS = [
  { label: "申し受け・マッチング", desc: "お相手からの申し受けやマッチ成立時" },
  { label: "日程候補・日程確定", desc: "デートの日程に関する更新" },
  { label: "当日連絡・リマインド", desc: "デート当日のご連絡" },
  { label: "運営からのお知らせ", desc: "キャンペーン・重要なお知らせ" },
];

/** 通知設定（メール／アプリ内）。本デモではUIのみ（保存は未実装）。 */
export default async function NotificationSettingsPage() {
  await requireMember();

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="通知設定" backHref="/menu" />
      <div className="space-y-3 px-4 py-4">
        <p className="px-1 text-xs text-ink-faint">
          メール通知・アプリ内通知の受け取りを項目ごとに設定できます。
        </p>
        <Card>
          <div className="stagger divide-y divide-line">
            {ITEMS.map((it) => (
              <div key={it.label} className="flex items-center justify-between gap-3 px-4 py-3.5">
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
