import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMemberId } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SERVICE_NAME, SERVICE_CATCHPHRASE } from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import { LineLoginButton } from "@/components/member/liff/LineLoginButton";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const memberId = await getCurrentMemberId();
  if (memberId) redirect("/users");

  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col px-6 pt-16 pb-10">
      {/* ロゴ見出し */}
      <div className="animate-fade-up text-center">
        <span className="story-ring">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface">
            <BrandMark className="h-14 w-14" />
          </span>
        </span>
        <p className="mt-4 text-sm font-semibold text-ink-soft">
          {SERVICE_CATCHPHRASE}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">
          {SERVICE_NAME}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">ログイン</p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-center text-sm font-bold text-danger"
        >
          メールアドレスまたはパスワードが正しくありません。
        </p>
      )}

      {/*
        LINEログイン（LIFF）
        LINE アプリ内で開いた場合は LiffAutoLogin が自動でログインする。
        ブラウザではこのボタンから LINE ログインへ。デモ（LIFF ID 未設定）ではホームへ進む。
      */}
      <div className="animate-fade-up mt-8" style={{ animationDelay: "60ms" }}>
        <LineLoginButton demo={IS_DEMO} />
        <p className="mt-2 text-center text-xs text-ink-faint">
          LINEアプリから開くと自動でログインします
        </p>
      </div>

      {/* 区切り */}
      <div
        className="animate-fade-up mt-6 flex items-center gap-3"
        style={{ animationDelay: "90ms" }}
      >
        <span className="h-px flex-1 bg-line" aria-hidden />
        <span className="text-xs text-ink-faint">または</span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>

      <form action={login} className="mt-6 space-y-4">
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

        <Field label="パスワード" required>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="パスワード"
            required
          />
        </Field>

        <div className="pt-2">
          <Button type="submit" size="lg">
            ログイン
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-primary-strong hover:underline"
        >
          パスワードを忘れた方
        </Link>
        <p className="text-ink-soft">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/register"
            className="font-bold text-primary-strong hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
