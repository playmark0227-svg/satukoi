import { PhoneFrame } from "@/components/member/PhoneFrame";
import { LiffAutoLogin } from "@/components/member/liff/LiffAutoLogin";
import { getCurrentMemberId } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const memberId = await getCurrentMemberId();
  return (
    <PhoneFrame>
      {/* LINE アプリ内（LIFF）で開かれたときの自動ログイン */}
      <LiffAutoLogin hasSession={!!memberId} />
      {children}
    </PhoneFrame>
  );
}
