import { LiffAutoLogin } from "@/components/member/liff/LiffAutoLogin";
import { getCurrentMemberId } from "@/lib/auth";

/**
 * 公開ランディングページ（/）のレイアウト。
 * 会員アプリのスマホ枠（PhoneFrame）は使わず、PC でも全幅で表示する。
 * LIFF のエンドポイントが "/" のため、LINE アプリ内で開かれたときの自動ログインはここでも動かす。
 */
export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const memberId = await getCurrentMemberId();
  return (
    <div className="flex min-h-dvh w-full flex-col bg-surface">
      <LiffAutoLogin hasSession={!!memberId} />
      {children}
    </div>
  );
}
