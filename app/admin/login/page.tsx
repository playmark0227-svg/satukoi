import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SERVICE_NAME } from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import { adminLogin } from "./actions";

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
          <BrandMark className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-ink">
            {SERVICE_NAME}
          </h1>
          <p className="mt-2 text-sm font-bold text-ink-soft">運営管理画面</p>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <p className="text-center text-sm font-bold text-ink">
            運営ログイン
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-center text-sm font-bold text-danger"
            >
              メールアドレスまたはパスワードが正しくありません。
            </p>
          )}

          <form action={adminLogin} className="mt-5 space-y-4">
            <Field label="メールアドレス" required>
              <Input
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                placeholder="admin@example.com"
                required
              />
            </Field>

            <Field label="パスワード" required>
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="パスワード"
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

        <p className="mt-6 text-center text-xs text-ink-faint">
          関係者以外のログインはご遠慮ください。
        </p>
      </div>
    </div>
  );
}
