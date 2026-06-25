import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { MemberStatusBadge } from "@/components/ui/StatusBadge";

export default function RegisterCompletePage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="登録完了" />
      <div className="flex flex-1 flex-col px-4 py-6">
        <Card>
          <CardBody className="space-y-4 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-black text-ink">ご登録ありがとうございます</h2>
            <div className="flex justify-center">
              <MemberStatusBadge status="DOCUMENT_REVIEW" />
            </div>
            <p className="text-sm leading-relaxed text-ink-soft">
              ご提出いただいた書類を運営が確認いたします。
              <br />
              書類確認後、運営の承認をもってサービスのご利用を開始いただけます。
            </p>
            <p className="rounded-xl bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
              承認の結果は、アプリ内のお知らせとメールでご連絡します。今しばらくお待ちください。
            </p>
          </CardBody>
        </Card>

        <div className="mt-6">
          <ButtonLink href="/mypage" size="lg">
            マイページへ
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
