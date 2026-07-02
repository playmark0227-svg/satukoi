import { requireMember } from "@/lib/auth";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";

const FAQ = [
  {
    q: "チャット機能はありますか？",
    a: "ありません。サツコイ！は「まずは会う」設計です。マッチ後は日程調整のみで、メッセージのやり取りなしにカフェデートへ進みます。",
  },
  {
    q: "料金はいくらですか？",
    a: "登録料11,000円、更新料11,000円（1年ごと）、デート確定時にお一人5,500円です。結婚相談所（サロン）会員は登録料・デート代が無料です。",
  },
  {
    q: "対象エリアは？",
    a: "札幌市および近郊（江別・北広島・恵庭・当別・南幌・小樽・石狩・岩見沢・千歳・新篠津・長沼）に在住または在勤の18歳以上の方が対象です。",
  },
  {
    q: "本人確認はありますか？",
    a: "顔写真付き身分証明書と独身証明書の提出が必須です。運営の確認・承認後にご利用開始となります。",
  },
  {
    q: "キャンセルはできますか？",
    a: "日程確定後はキャンセル時期により返金不可・違約金が発生します。詳しくはキャンセルポリシーをご確認ください。",
  },
];

export default async function FaqPage() {
  await requireMember();

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="よくある質問" backHref="/menu" />
      <div className="stagger space-y-3 px-4 py-4">
        {FAQ.map((item) => (
          <Card key={item.q} as="details" className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-ink">{item.q}</span>
              <span className="text-gold transition-transform duration-300 group-open:rotate-45">
                ＋
              </span>
            </summary>
            <p className="details-body border-t border-line px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
              {item.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
