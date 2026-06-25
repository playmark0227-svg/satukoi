import { requireMember } from "@/lib/auth";
import { BottomNav } from "@/components/member/BottomNav";

/** ログイン必須のタブUI領域。未ログインは requireMember が /login へ。 */
export default async function AppTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMember();

  return (
    <>
      <div className="flex-1">{children}</div>
      <BottomNav />
    </>
  );
}
