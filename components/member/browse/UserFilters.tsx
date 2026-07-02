"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { IconFunnel } from "@/components/member/icons";

/** さがす画面の絞り込み。タップでパネルがなめらかに展開する。 */
export function UserFilters({
  ageMin: initialAgeMin,
  ageMax: initialAgeMax,
  area: initialArea,
}: {
  ageMin: string;
  ageMax: string;
  area: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ageMin, setAgeMin] = useState(initialAgeMin);
  const [ageMax, setAgeMax] = useState(initialAgeMax);
  const [area, setArea] = useState(initialArea);

  const activeCount =
    (initialAgeMin ? 1 : 0) + (initialAgeMax ? 1 : 0) + (initialArea ? 1 : 0);

  function apply() {
    const params = new URLSearchParams();
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    if (area) params.set("area", area);
    const qs = params.toString();
    router.push(qs ? `/users?${qs}` : "/users");
    setOpen(false);
  }

  function reset() {
    setAgeMin("");
    setAgeMax("");
    setArea("");
    router.push("/users");
    setOpen(false);
  }

  return (
    <div className="border-b border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-ink-soft transition-colors hover:text-ink"
      >
        <IconFunnel
          className={
            "h-5 w-5 transition-transform duration-300" + (open ? " -rotate-12" : "")
          }
        />
        <span className="text-sm font-semibold">絞り込み</span>
        {activeCount > 0 && (
          <span className="animate-scale-in num-tnum ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-surface">
            {activeCount}
          </span>
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            "ml-auto h-4 w-4 text-ink-faint transition-transform duration-300" +
            (open ? " rotate-180" : "")
          }
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* なめらかに開閉するパネル（grid-rows トランジション） */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4 pt-1">
            <Field label="年齢">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={120}
                  placeholder="18"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  aria-label="年齢の下限"
                />
                <span className="text-ink-faint">〜</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={120}
                  placeholder="上限"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  aria-label="年齢の上限"
                />
                <span className="shrink-0 text-sm text-ink-soft">歳</span>
              </div>
            </Field>

            <Field label="居住地">
              <Select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                aria-label="居住地"
              >
                <option value="">指定なし</option>
                {Object.entries(RESIDENCE_AREA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={apply}
              >
                この条件でさがす
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                リセット
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
