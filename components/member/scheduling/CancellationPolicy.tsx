import { CANCELLATION_POLICY_FULL } from "@/lib/constants";

/**
 * キャンセルポリシー全文の整形表示（サーバー部品）。
 * デートキャンセル操作時に必ず表示する。
 */
export function CancellationPolicy() {
  return (
    <div className="space-y-3">
      {CANCELLATION_POLICY_FULL.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-line bg-canvas p-3"
        >
          <p className="text-sm font-bold text-ink">{section.title}</p>
          <ul className="mt-2 space-y-1">
            {section.rows.map((row, i) => (
              <li
                key={i}
                className="text-xs leading-relaxed text-ink-soft"
              >
                ・{row}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
