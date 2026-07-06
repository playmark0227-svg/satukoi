"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/Stepper";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import {
  SEX_LABELS,
  RESIDENCE_AREA_LABELS,
  ELIGIBILITY_LABELS,
  INCOME_BRACKET_LABELS,
  HOLIDAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  BODY_TYPE_LABELS,
  SMOKING_LABELS,
  DRINKING_LABELS,
  CHILDREN_WISH_LABELS,
  PRICING,
} from "@/lib/constants";
import { formatYen } from "@/lib/format";

const STEPS = ["アカウント", "プロフィール", "書類", "確認"];

/** ラベルマップから <option> を生成 */
function options(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));
}

type Form = {
  // Step1
  email: string;
  password: string;
  cardNumber: string;
  // Step2
  fullName: string;
  nickname: string;
  birthDate: string;
  sex: string;
  residenceArea: string;
  eligibilityType: string;
  occupation: string;
  incomeBracket: string;
  holidayType: string;
  fixedHolidays: string[];
  hasMarriageHistory: string; // "true" | "false"
  hasChildren: string;
  childrenWish: string;
  heightCm: string;
  bodyType: string;
  smoking: string;
  drinking: string;
  qualifications: string;
  hobbies: string;
  selfIntroduction: string;
  referralCode: string;
  // Step4
  agreed: boolean;
};

const initial: Form = {
  email: "",
  password: "",
  cardNumber: "",
  fullName: "",
  nickname: "",
  birthDate: "",
  sex: "MALE",
  residenceArea: "SAPPORO",
  eligibilityType: "RESIDENT",
  occupation: "",
  incomeBracket: "B400_599",
  holidayType: "WEEKENDS_HOLIDAYS",
  fixedHolidays: [],
  hasMarriageHistory: "false",
  hasChildren: "false",
  childrenWish: "EITHER",
  heightCm: "",
  bodyType: "AVERAGE",
  smoking: "NON_SMOKER",
  drinking: "SOCIAL",
  qualifications: "",
  hobbies: "",
  selfIntroduction: "",
  referralCode: "",
  agreed: false,
};

/** 会員登録ウィザード（4ステップで入力、最終ステップで一括送信） */
export function RegisterWizard({
  createMember,
}: {
  createMember: (formData: FormData) => void | Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState<Form>(initial);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function toggleHoliday(day: string) {
    setF((prev) => ({
      ...prev,
      fixedHolidays: prev.fixedHolidays.includes(day)
        ? prev.fixedHolidays.filter((d) => d !== day)
        : [...prev.fixedHolidays, day],
    }));
  }

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <form action={createMember} className="space-y-4">
      <Stepper steps={STEPS} current={step} />

      {/* ── Step1: アカウント ── */}
      <div className={step === 1 ? "space-y-3" : "hidden"}>
        <Card>
          <CardBody className="space-y-4">
            <Field label="メールアドレス" required>
              <Input
                type="email"
                name="email"
                inputMode="email"
                placeholder="you@example.com"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="パスワード" required hint="8文字以上を推奨します。">
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={f.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </Field>
            <Field
              label="クレジットカード番号"
              required
              hint={`登録料 ${formatYen(
                PRICING.REGISTRATION
              )} のお支払いに使用します（サロン会員は無料）。`}
            >
              <Input
                type="text"
                name="cardNumber"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={f.cardNumber}
                onChange={(e) => set("cardNumber", e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* ── Step2: プロフィール ── */}
      <div className={step === 2 ? "space-y-3" : "hidden"}>
        <Card>
          <CardBody className="space-y-4">
            <Field
              label="名前"
              required
              locked
              hint="会員同士には公開されません。本人確認に使用します。"
            >
              <Input
                type="text"
                name="fullName"
                placeholder="札幌 太郎"
                value={f.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Field>
            <Field label="ニックネーム" required hint="一覧・プロフィールで表示されます。">
              <Input
                type="text"
                name="nickname"
                placeholder="たろう"
                value={f.nickname}
                onChange={(e) => set("nickname", e.target.value)}
              />
            </Field>
            <Field label="生年月日" required locked>
              <Input
                type="date"
                name="birthDate"
                value={f.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </Field>
            <Field label="性別" required locked>
              <Select
                name="sex"
                value={f.sex}
                onChange={(e) => set("sex", e.target.value)}
              >
                {options(SEX_LABELS)}
              </Select>
            </Field>
            <Field label="居住地（エリア）" required locked>
              <Select
                name="residenceArea"
                value={f.residenceArea}
                onChange={(e) => set("residenceArea", e.target.value)}
              >
                {options(RESIDENCE_AREA_LABELS)}
              </Select>
            </Field>
            <Field label="在住 / 在勤" required>
              <Select
                name="eligibilityType"
                value={f.eligibilityType}
                onChange={(e) => set("eligibilityType", e.target.value)}
              >
                {options(ELIGIBILITY_LABELS)}
              </Select>
            </Field>
            <Field label="職業" required>
              <Input
                type="text"
                name="occupation"
                placeholder="会社員"
                value={f.occupation}
                onChange={(e) => set("occupation", e.target.value)}
              />
            </Field>
            <Field
              label="年収帯"
              required
              locked
              hint="所得証明の確認後に公開されます。"
            >
              <Select
                name="incomeBracket"
                value={f.incomeBracket}
                onChange={(e) => set("incomeBracket", e.target.value)}
              >
                {options(INCOME_BRACKET_LABELS)}
              </Select>
            </Field>
            <Field label="休日" required>
              <Select
                name="holidayType"
                value={f.holidayType}
                onChange={(e) => set("holidayType", e.target.value)}
              >
                {options(HOLIDAY_TYPE_LABELS)}
              </Select>
            </Field>
            {f.holidayType === "OTHER_FIXED" && (
              <Field label="固定の曜日" hint="該当する曜日を選択してください。">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(WEEKDAY_LABELS).map(([value, label]) => {
                    const on = f.fixedHolidays.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleHoliday(value)}
                        className={
                          on
                            ? "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                            : "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-sm text-ink-soft"
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
            {/* 固定曜日は配列で送信（hidden） */}
            {f.fixedHolidays.map((day) => (
              <input key={day} type="hidden" name="fixedHolidays" value={day} />
            ))}
            <Field label="婚姻歴" required locked>
              <Select
                name="hasMarriageHistory"
                value={f.hasMarriageHistory}
                onChange={(e) => set("hasMarriageHistory", e.target.value)}
              >
                <option value="false">なし</option>
                <option value="true">あり</option>
              </Select>
            </Field>
            <Field label="子供" required locked>
              <Select
                name="hasChildren"
                value={f.hasChildren}
                onChange={(e) => set("hasChildren", e.target.value)}
              >
                <option value="false">なし</option>
                <option value="true">あり</option>
              </Select>
            </Field>
            <Field label="将来子供は？" required>
              <Select
                name="childrenWish"
                value={f.childrenWish}
                onChange={(e) => set("childrenWish", e.target.value)}
              >
                {options(CHILDREN_WISH_LABELS)}
              </Select>
            </Field>
            <Field label="身長（cm）" required>
              <Input
                type="number"
                name="heightCm"
                inputMode="numeric"
                min={130}
                max={220}
                placeholder="170"
                value={f.heightCm}
                onChange={(e) => set("heightCm", e.target.value)}
              />
            </Field>
            <Field label="体型" required>
              <Select
                name="bodyType"
                value={f.bodyType}
                onChange={(e) => set("bodyType", e.target.value)}
              >
                {options(BODY_TYPE_LABELS)}
              </Select>
            </Field>
            <Field label="タバコ" required>
              <Select
                name="smoking"
                value={f.smoking}
                onChange={(e) => set("smoking", e.target.value)}
              >
                {options(SMOKING_LABELS)}
              </Select>
            </Field>
            <Field label="お酒" required>
              <Select
                name="drinking"
                value={f.drinking}
                onChange={(e) => set("drinking", e.target.value)}
              >
                {options(DRINKING_LABELS)}
              </Select>
            </Field>
            <Field label="資格">
              <Input
                type="text"
                name="qualifications"
                placeholder="例：簿記2級、TOEIC800"
                value={f.qualifications}
                onChange={(e) => set("qualifications", e.target.value)}
              />
            </Field>
            <Field label="趣味">
              <Input
                type="text"
                name="hobbies"
                placeholder="例：カフェ巡り、登山"
                value={f.hobbies}
                onChange={(e) => set("hobbies", e.target.value)}
              />
            </Field>
            <Field label="自己紹介">
              <Textarea
                name="selfIntroduction"
                placeholder="自己紹介をご記入ください。"
                value={f.selfIntroduction}
                onChange={(e) => set("selfIntroduction", e.target.value)}
              />
            </Field>
            <Field label="紹介コード" hint="お持ちの場合のみご入力ください（任意）。">
              <Input
                type="text"
                name="referralCode"
                placeholder="ABCD1234"
                value={f.referralCode}
                onChange={(e) => set("referralCode", e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* ── Step3: 書類 ── */}
      <div className={step === 3 ? "space-y-3" : "hidden"}>
        <Card>
          <CardBody className="space-y-4">
            <p className="rounded-xl bg-info-soft px-3 py-2 text-xs leading-relaxed text-ink-soft">
              書類は運営が手動で確認します。確認完了・承認をもってサービスをご利用いただけます。
              ※ ファイルのアップロードは現在準備中のため、選択しても送信されません。
            </p>
            <Field
              label="顔写真"
              required
              hint="最大5枚。2枚以上の登録が必要です（1枚目が一覧に表示されます）。"
            >
              <Input type="file" name="photos" accept="image/*" multiple />
            </Field>
            <Field label="顔写真付き身分証明書" required>
              <Input type="file" name="idDocument" accept="image/*" />
            </Field>
            <Field label="独身証明書" required>
              <Input type="file" name="singleCert" accept="image/*" />
            </Field>
            <Field
              label="所得証明（源泉徴収票）"
              required={f.sex === "MALE"}
              hint={
                f.sex === "MALE"
                  ? "男性は源泉徴収票のご提出が必須です（女性は任意）。年収欄の公開には所得証明の確認が必要です。"
                  : "女性は任意です（男性は必須）。年収欄の公開には所得証明の確認が必要です。"
              }
            >
              <Input type="file" name="incomeCert" accept="image/*" />
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* ── Step4: 確認 ── */}
      <div className={step === 4 ? "space-y-3" : "hidden"}>
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-sm font-bold text-ink-soft">入力内容の確認</h2>
            <dl className="space-y-1.5 text-sm">
              <ConfirmRow label="メール" value={f.email} />
              <ConfirmRow label="ニックネーム" value={f.nickname} />
              <ConfirmRow label="生年月日" value={f.birthDate} />
              <ConfirmRow label="性別" value={SEX_LABELS[f.sex as keyof typeof SEX_LABELS]} />
              <ConfirmRow
                label="居住地"
                value={
                  RESIDENCE_AREA_LABELS[
                    f.residenceArea as keyof typeof RESIDENCE_AREA_LABELS
                  ]
                }
              />
              <ConfirmRow label="職業" value={f.occupation} />
            </dl>
            <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs leading-relaxed text-ink-soft">
              名前・生年月日・性別・居住地・年収帯・婚姻歴・子供の有無は、登録後はご自身で変更できません（変更は運営への申請が必要です）。
            </p>
            <label className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-3">
              <input
                type="checkbox"
                name="agreed"
                checked={f.agreed}
                onChange={(e) => set("agreed", e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
              />
              <span className="text-sm leading-relaxed text-ink">
                利用規約・プライバシーポリシー、キャンセルポリシーに同意します。
              </span>
            </label>
          </CardBody>
        </Card>
      </div>

      {/* ── ナビゲーション ── */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button type="button" variant="outline" size="lg" onClick={back}>
            戻る
          </Button>
        )}
        {step < 4 ? (
          <Button type="button" size="lg" onClick={next}>
            次へ
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!f.agreed}>
            この内容で登録する
          </Button>
        )}
      </div>
    </form>
  );
}

function ConfirmRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-faint">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">
        {value || "（未入力）"}
      </dd>
    </div>
  );
}
