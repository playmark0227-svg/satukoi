"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";

/** さがす画面の絞り込み（年齢min/max・居住エリア）。router.push で searchParams を更新。 */
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
  const [ageMin, setAgeMin] = useState(initialAgeMin);
  const [ageMax, setAgeMax] = useState(initialAgeMax);
  const [area, setArea] = useState(initialArea);

  function apply() {
    const params = new URLSearchParams();
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    if (area) params.set("area", area);
    const qs = params.toString();
    router.push(qs ? `/users?${qs}` : "/users");
  }

  function reset() {
    setAgeMin("");
    setAgeMax("");
    setArea("");
    router.push("/users");
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <Field label="年齢">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={18}
              max={120}
              placeholder="下限"
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
          <Button type="button" variant="primary" size="sm" className="flex-1" onClick={apply}>
            この条件でさがす
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            リセット
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
