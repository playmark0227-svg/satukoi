import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/member/AppHeader";
import { AdvisorChat } from "@/components/member/advisor/AdvisorChat";

/**
 * AIアドバイザー相談画面。
 * 会員の活動データ（マッチ数・申し込み数・申し受け数）を集計し、
 * チャットUI（クライアント）へ渡す。アドバイスの出し分けはチャット側で行う。
 */
export default async function AdvisorPage() {
  const me = await requireMember();

  const [matchCount, sentCount, receivedCount] = await Promise.all([
    prisma.match.count({
      where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
    }),
    prisma.dateApplication.count({ where: { applicantId: me.id } }),
    prisma.dateApplication.count({ where: { receiverId: me.id } }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="AIアドバイザー" backHref="/menu" />
      <AdvisorChat
        nickname={me.nickname}
        stats={{ matchCount, sentCount, receivedCount }}
      />
    </div>
  );
}
