import { requireMember } from "@/lib/auth";
import { calcAge, formatDate } from "@/lib/format";
import {
  SEX_LABELS,
  RESIDENCE_AREA_LABELS,
  INCOME_BRACKET_LABELS,
  HOLIDAY_TYPE_LABELS,
  WEEKDAY_LABELS,
  BODY_TYPE_LABELS,
  SMOKING_LABELS,
  DRINKING_LABELS,
  CHILDREN_WISH_LABELS,
  YES_NO,
} from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { updateProfile } from "./actions";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

/** 編集不可項目（表示のみ） */
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label} locked>
      <Input value={value} disabled readOnly />
    </Field>
  );
}

export default async function ProfileEditPage() {
  const me = await requireMember();

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="プロフィール編集" backHref="/mypage" />

      <form action={updateProfile} className="space-y-4 px-4 py-4">
        {/* 編集不可項目 */}
        <div>
          <SectionTitle>登録情報（変更は運営へお申し出ください）</SectionTitle>
          <Card>
            <CardBody className="space-y-3">
              <LockedField label="名前" value={me.fullName} />
              <LockedField
                label="生年月日"
                value={`${formatDate(me.birthDate)}（${calcAge(me.birthDate)}歳）`}
              />
              <LockedField label="性別" value={SEX_LABELS[me.sex]} />
              <LockedField
                label="居住地"
                value={RESIDENCE_AREA_LABELS[me.residenceArea]}
              />
              <LockedField
                label="年収帯"
                value={INCOME_BRACKET_LABELS[me.incomeBracket]}
              />
              <LockedField
                label="婚姻歴"
                value={YES_NO[String(me.hasMarriageHistory) as "true" | "false"]}
              />
              <LockedField
                label="子供の有無"
                value={YES_NO[String(me.hasChildren) as "true" | "false"]}
              />
            </CardBody>
          </Card>
        </div>

        {/* 編集可能項目 */}
        <div>
          <SectionTitle>編集できる項目</SectionTitle>
          <Card>
            <CardBody className="space-y-4">
              <Field label="ニックネーム" required>
                <Input
                  name="nickname"
                  defaultValue={me.nickname}
                  maxLength={20}
                  required
                />
              </Field>

              <Field label="職業" required>
                <Input
                  name="occupation"
                  defaultValue={me.occupation}
                  maxLength={40}
                  required
                />
              </Field>

              <Field label="休日" required>
                <Select name="holidayType" defaultValue={me.holidayType} required>
                  {Object.entries(HOLIDAY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="固定曜日"
                hint="休日が「その他固定曜日」の場合に選択してください。"
              >
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((w) => (
                    <label
                      key={w}
                      className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-line py-2 text-xs text-ink-soft has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-strong"
                    >
                      <input
                        type="checkbox"
                        name={`fixedHoliday_${w}`}
                        defaultChecked={me.fixedHolidays.includes(w)}
                        className="sr-only"
                      />
                      {WEEKDAY_LABELS[w]}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="身長（cm）" required>
                <Input
                  name="heightCm"
                  type="number"
                  min={130}
                  max="210"
                  defaultValue={me.heightCm}
                  required
                />
              </Field>

              <Field label="体型" required>
                <Select name="bodyType" defaultValue={me.bodyType} required>
                  {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="タバコ" required>
                <Select name="smoking" defaultValue={me.smoking} required>
                  {Object.entries(SMOKING_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="お酒" required>
                <Select name="drinking" defaultValue={me.drinking} required>
                  {Object.entries(DRINKING_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="将来子供は？" required>
                <Select name="childrenWish" defaultValue={me.childrenWish} required>
                  {Object.entries(CHILDREN_WISH_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="資格">
                <Input
                  name="qualifications"
                  defaultValue={me.qualifications ?? ""}
                  maxLength={100}
                  placeholder="例：普通自動車免許"
                />
              </Field>

              <Field label="趣味">
                <Input
                  name="hobbies"
                  defaultValue={me.hobbies ?? ""}
                  maxLength={100}
                  placeholder="例：カフェ巡り、映画鑑賞"
                />
              </Field>

              <Field label="自己紹介">
                <Textarea
                  name="selfIntroduction"
                  defaultValue={me.selfIntroduction ?? ""}
                  rows={5}
                  maxLength={500}
                  placeholder="お相手に伝えたいことをご記入ください。"
                />
              </Field>
            </CardBody>
          </Card>
        </div>

        <Button type="submit" variant="primary" size="lg">
          変更を保存する
        </Button>
      </form>
    </div>
  );
}

