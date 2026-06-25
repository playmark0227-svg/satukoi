import { SERVICE_NAME } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "第1条（適用）",
    body: `本規約は、${SERVICE_NAME}（以下「本サービス」といいます。）の利用に関する条件を、本サービスを利用するすべての会員と運営者との間で定めるものです。`,
  },
  {
    title: "第2条（会員登録）",
    body: "本サービスは、札幌市及びその近郊に在住または在勤の独身の方を対象とします。登録にあたっては、顔写真付き身分証明書および独身証明書のご提出をお願いしております。",
  },
  {
    title: "第3条（料金）",
    body: "登録料、更新料、デート代等の料金は、本サービス所定の方法により表示・決済されます。詳細は料金のご案内をご確認ください。",
  },
  {
    title: "第4条（禁止事項）",
    body: "他の会員への迷惑行為、虚偽のプロフィール登録、なりすまし、無断キャンセル等の行為を禁止します。違反が確認された場合、警告・利用停止・強制退会等の措置をとることがあります。",
  },
  {
    title: "第5条（キャンセルと違約金）",
    body: "デート日程確定後のキャンセルは、キャンセルの時期に応じて返金の可否・違約金が発生します。詳細はキャンセルポリシーをご確認ください。",
  },
  {
    title: "第6条（退会）",
    body: "会員はいつでも退会のお手続きが可能です。ただし、未払いの違約金がある場合は、お支払い完了後の退会となります。",
  },
  {
    title: "第7条（規約の変更）",
    body: "運営者は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上に表示した時点から効力を生じるものとします。",
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="利用規約" backHref="/mypage" />

      <div className="space-y-4 px-4 py-4">
        <p className="text-xs text-ink-faint">最終更新日：2026年6月25日</p>
        <Card>
          <CardBody className="space-y-5">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="mb-1 text-sm font-bold text-ink">{s.title}</h2>
                <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </section>
            ))}
            <p className="border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
              ※ 本文はサンプルです。正式な利用規約は別途定めるものとします。
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
