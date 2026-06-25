import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SERVICE_NAME } from "@/lib/constants";
import { requestReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex flex-1 flex-col px-6 pt-16 pb-10">
      {/* ロゴ見出し */}
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-ink">
          {SERVICE_NAME}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">パスワードの再設定</p>
      </div>

      {sent ? (
        <div className="mt-10 space-y-6 text-center">
          <div className="rounded-xl bg-success-soft px-4 py-5 text-sm leading-relaxed text-ink">
            <p className="font-bold text-success">再設定リンクを送信しました</p>
            <p className="mt-2 text-ink-soft">
              ご登録のメールアドレス宛に、パスワード再設定用のリンクをお送りしました。
              <br />
              メールが届かない場合は、入力したアドレスをご確認のうえ、もう一度お試しください。
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-sm font-bold text-primary-strong hover:underline"
          >
            ログイン画面へ戻る
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            ご登録のメールアドレスを入力してください。
            <br />
            パスワード再設定用のリンクをお送りします。
          </p>

          <form action={requestReset} className="mt-6 space-y-4">
            <Field label="メールアドレス" required>
              <Input
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                placeholder="you@example.com"
                required
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" size="lg">
                再設定リンクを送信
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-primary-strong hover:underline"
            >
              ログイン画面へ戻る
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
