import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SERVICE_NAME } from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import { adminLogin } from "./actions";

/** ログイン後のサイドバー・ヘッダー（AdminShell）と同じ表記にする（「（仮）」を付けない） */
const ADMIN_BRAND = SERVICE_NAME.replace(/（仮）$/, "");

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="animate-fade-up text-center">
          <BrandMark className="mx-auto h-14 w-14" />
          <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">{ADMIN_BRAND}</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">運営管理画面</p>
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-6 sm:px-7">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-semibold text-danger-strong"
            >
              メールアドレスまたはパスワードが正しくありません。
            </p>
          )}

          <form action={adminLogin} className="space-y-4">
            <Field label="メールアドレス">
              <Input
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                placeholder="admin@example.com"
                required
              />
            </Field>

            <Field label="パスワード">
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </Field>

            <div className="pt-1">
              <Button type="submit" size="lg">
                ログイン
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink-soft">
          関係者以外のログインはご遠慮ください。
        </p>
      </div>
    </div>
  );
}
