import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMemberId } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SERVICE_CATCHPHRASE } from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import { LineLoginButton } from "@/components/member/liff/LineLoginButton";
import { login } from "./actions";

/**
 * ログイン（Instagram のログイン画面の構成）。
 * LINE アプリ内（LIFF）で開いた場合は LiffAutoLogin が自動でログインする。
 * ブラウザからはメール＋パスワードでも利用できる（両方式を併用）。
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const memberId = await getCurrentMemberId();
  if (memberId) redirect("/users");

  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col justify-between px-8 pb-6 pt-16">
      <div>
        <div className="animate-fade-up text-center">
          <span className="story-ring">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-surface">
              <BrandMark className="h-14 w-14" />
            </span>
          </span>
          <h1 className="mt-4 text-[34px] font-black tracking-tight text-ink">サツコイ！</h1>
          <p className="mt-1 text-sm text-ink-soft">{SERVICE_CATCHPHRASE}</p>
        </div>

        {error && (
          <p role="alert" className="mt-6 text-center text-sm text-danger">
            メールアドレスまたはパスワードが正しくありません。
          </p>
        )}

        <form action={login} className="mt-8 space-y-2">
          <Input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            placeholder="メールアドレス"
            aria-label="メールアドレス"
            required
          />
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="パスワード"
            aria-label="パスワード"
            required
          />
          <div className="pt-2">
            <Button type="submit" size="lg">
              ログイン
            </Button>
          </div>
        </form>

        <div className="mt-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-line" aria-hidden />
          <span className="text-[13px] font-semibold text-ink-soft">または</span>
          <span className="h-px flex-1 bg-line" aria-hidden />
        </div>

        <div className="mt-5">
          <LineLoginButton demo={IS_DEMO} />
          <p className="mt-2 text-center text-xs text-ink-soft">
            LINEアプリから開くと自動でログインします
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-ink">
            パスワードを忘れた場合
          </Link>
        </p>
      </div>

      <p className="mt-10 border-t border-line-soft pt-5 text-center text-sm text-ink-soft">
        アカウントをお持ちでない場合は{" "}
        <Link href="/register" className="font-semibold text-primary">
          登録する
        </Link>
      </p>
    </div>
  );
}
