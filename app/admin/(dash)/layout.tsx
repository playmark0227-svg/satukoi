import { requireAdmin } from "@/lib/auth";
import { getAttentionCounts } from "@/lib/admin/attention";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  // サイドバー・タブに出す対応待ちの件数（ダッシュボードと同じ定義）
  const counts = await getAttentionCounts();
  return (
    <AdminShell adminName={admin.name} counts={counts}>
      {children}
    </AdminShell>
  );
}
