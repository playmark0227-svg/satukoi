import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/member/BottomNav";

/** ログイン必須のタブUI領域。未ログインは requireMember が /login へ。 */
export default async function AppTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await requireMember();
  const unread = await prisma.notification.count({
    where: { memberId: member.id, readAt: null },
  });

  return (
    <>
      <div className="flex-1">{children}</div>
      <BottomNav unread={unread} />
    </>
  );
}
