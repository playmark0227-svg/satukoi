"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SCHEDULING_RULES } from "@/lib/constants";

/**
 * 日程候補の提示フォーム（申受側 / 再提示時に使用）。
 * 日付 + 開始/終了時刻の行を動的に追加できる。初期3行。
 * 規定（3件以上）を満たすまで送信不可。
 * 各行は candidates[] という同名フィールドで送信し、Server Action で組み立てる。
 */
export function CandidateForm({
  action,
  matchId,
}: {
  action: (formData: FormData) => void;
  matchId: string;
}) {
  const min = SCHEDULING_RULES.MIN_CANDIDATES;
  const [rows, setRows] = useState<number[]>(
    Array.from({ length: min }, (_, i) => i)
  );
  const [nextKey, setNextKey] = useState<number>(min);

  const addRow = () => {
    setRows((r) => [...r, nextKey]);
    setNextKey((k) => k + 1);
  };
  const removeRow = (key: number) => {
    setRows((r) => (r.length > min ? r.filter((k) => k !== key) : r));
  };

  const canSubmit = rows.length >= min;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />

      <p className="text-xs text-ink-soft leading-relaxed">
        マッチ成立から{SCHEDULING_RULES.PROPOSAL_WINDOW_DAYS}日以内で、
        {min}件以上の候補日時を提示してください。デート時間は
        {SCHEDULING_RULES.DATE_DURATION_MIN}分が目安です。
      </p>

      <div className="space-y-3">
        {rows.map((key, idx) => (
          <div
            key={key}
            className="rounded-2xl border border-line bg-canvas p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">
                候補 {idx + 1}
              </span>
              {rows.length > min && (
                <button
                  type="button"
                  onClick={() => removeRow(key)}
                  className="text-xs font-bold text-danger"
                >
                  削除
                </button>
              )}
            </div>

            <Field label="日付" required>
              <Input type="date" name={`date_${key}`} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="開始時刻" required>
                <Input type="time" name={`start_${key}`} required />
              </Field>
              <Field label="終了時刻" required>
                <Input type="time" name={`end_${key}`} required />
              </Field>
            </div>
            {/* 行が有効であることを示す目印（Server Action で参照） */}
            <input type="hidden" name="rowKey" value={key} />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full"
        onClick={addRow}
      >
        ＋ 候補を追加
      </Button>

      <Button type="submit" size="lg" disabled={!canSubmit}>
        この内容で候補を提示する
      </Button>
      {!canSubmit && (
        <p className="text-center text-xs text-danger">
          候補は{min}件以上必要です
        </p>
      )}
    </form>
  );
}
