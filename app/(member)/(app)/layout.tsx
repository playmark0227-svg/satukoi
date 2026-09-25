import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/member/BottomNav";

/** ログイン必須のタブUI領域。未ログインは requireMember が /login へ。 */
export default async function AppTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMember();

  // マッチタブの赤い点：お返事待ちの申込が届いている
  const pendingReceived = await prisma.dateApplication.count({
    where: { receiverId: me.id, status: "PENDING" },
  });

  return (
    <>
      <div className="flex-1">{children}</div>
      <BottomNav
        avatarUrl={me.photos[0]?.url}
        nickname={me.nickname}
        badge={pendingReceived}
      />
    </>
  );
}
