// ════════════════════════════════════════════════════════════════════
//  通知（メール／アプリ内）— アプリ内通知は DB に保存、メールはスタブ。
//  仕様「通知機能」の各イベントで利用。
// ════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export interface NotifyInput {
  memberId: string;
  type: NotificationType;
  title: string;
  body: string;
  matchId?: string;
  /** メール通知も送るか（既定 true：仕様はメール＋アプリ内の両方） */
  email?: boolean;
}

/** アプリ内通知を作成し、必要ならメールも送る（メールはスタブ）。 */
export async function notify(input: NotifyInput) {
  const sendEmail = input.email !== false;
  const emailSentAt = sendEmail ? new Date() : null;

  if (sendEmail) {
    // TODO: 実装時にメール配信（SES / Resend 等）へ差し替え
    console.info(`[MAIL STUB] -> member ${input.memberId}: ${input.title}`);
  }

  return prisma.notification.create({
    data: {
      memberId: input.memberId,
      type: input.type,
      title: input.title,
      body: input.body,
      matchId: input.matchId,
      emailSentAt,
    },
  });
}
