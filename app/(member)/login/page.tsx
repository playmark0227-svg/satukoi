import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMemberId } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SERVICE_NAME, SERVICE_CATCHPHRASE } from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import { login } from "./actions";

/** LINE公式のフキダシをかたどったシンプルなアイコン（単色・currentColor） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2c-5.3 0-9.6 3.5-9.6 7.83 0 3.87 3.43 7.1 8.06 7.72.31.07.74.21.85.48.1.24.06.61.03.86l-.13.82c-.04.24-.2.96.84.52 1.04-.43 5.61-3.3 7.65-5.66 1.41-1.55 1.9-3.12 1.9-4.74 0-4.33-4.3-7.83-9.6-7.83z" />
    </svg>
  );
}

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
        <BrandMark className="mx-auto h-16 w-16" />
        <p className="mt-4 text-sm font-bold text-primary-strong">
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
        LINEログイン
        デモでは /users へ直接遷移して「ログイン後」の体験を見せる。
        本実装では LINE Login（OAuth 2.1 / LIFF）の認可URLへリダイレクトし、
        コールバックで LINE userId と会員を紐付けてセッションを発行する予定。
        ※ #06C755 は LINE のブランド公式色（ボタンのみに使用）
      */}
      <div className="animate-fade-up mt-8" style={{ animationDelay: "60ms" }}>
        <Link
          href={IS_DEMO ? "/users" : "#"}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#06C755] px-6 text-base font-bold whitespace-nowrap text-white transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
        >
          <LineIcon className="h-5 w-5" />
          LINEでログイン
        </Link>
        <p className="mt-2 text-center text-xs text-ink-faint">
          ID・パスワード不要でかんたんログイン
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
