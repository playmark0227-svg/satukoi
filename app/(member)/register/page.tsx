import Link from "next/link";
import { AppHeader } from "@/components/member/AppHeader";
import { RegisterWizard } from "@/components/member/register/RegisterWizard";
import { createMember } from "./actions";
import { SERVICE_NAME } from "@/lib/constants";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="新規会員登録" backHref="/" />
      <div className="flex-1 px-4 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-black text-ink">
            {SERVICE_NAME}にようこそ
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            4つのステップでご登録いただけます。ご入力後、運営が書類を確認し、承認をもってご利用開始となります。
          </p>
          <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-xs leading-relaxed text-ink-soft">
            ※ 名前・生年月日・性別・居住地・年収帯・婚姻歴・子供の有無は、登録後はご自身で変更できません（変更は運営への申請が必要です）。
          </p>
        </div>

        <RegisterWizard createMember={createMember} />

        <p className="mt-6 text-center text-xs text-ink-faint">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-bold text-primary">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
