import Link from "next/link";
import { AppHeader } from "@/components/member/AppHeader";
import { BrandMark } from "@/components/member/BrandMark";
import { RegisterWizard } from "@/components/member/register/RegisterWizard";
import { createMember } from "./actions";
import { SERVICE_NAME } from "@/lib/constants";
import { readLinePending } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { Avatar } from "@/components/ui/Avatar";
import { LineIcon, LineLoginButton } from "@/components/member/liff/LineLoginButton";

export default async function RegisterPage() {
  // LINE（LIFF）から来た未登録ユーザー：LINE アカウントと連携して登録する
  const line = await readLinePending();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="新規会員登録" backHref="/login" />
      <div className="flex-1 px-4 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <h2 className="text-lg font-bold text-ink">
              {SERVICE_NAME}にようこそ
            </h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            4つのステップでご登録いただけます。ご入力後、運営が書類を確認し、承認をもってご利用開始となります。
          </p>
          {line ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
              <Avatar url={line.picture} name={line.name ?? "L"} className="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold text-ink">
                  <LineIcon className="h-4 w-4 text-[#06C755]" />
                  LINEアカウントと連携して登録
                </p>
                <p className="truncate text-xs text-ink-soft">{line.name ?? "LINEユーザー"}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <LineLoginButton demo={IS_DEMO} label="LINEで登録" />
              <p className="mt-2 text-center text-xs text-ink-soft">または下のフォームから登録</p>
            </div>
          )}
          <p className="mt-3 rounded-xl bg-[#fafafa] px-3 py-2 text-xs leading-relaxed text-ink-soft">
            ※ 名前・生年月日・性別・居住地・年収帯・婚姻歴・子供の有無は、登録後はご自身で変更できません（変更は運営への申請が必要です）。
          </p>
        </div>

        <RegisterWizard createMember={createMember} defaultNickname={line?.name ?? ""} />

        <p className="mt-6 text-center text-xs text-ink-faint">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-semibold text-primary">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
