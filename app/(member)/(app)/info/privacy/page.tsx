import { SERVICE_NAME } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "1. 取得する情報",
    body: `${SERVICE_NAME}は、会員登録時にお名前・生年月日・性別・居住地・職業・年収帯・顔写真・各種証明書類等の情報を取得します。`,
  },
  {
    title: "2. 利用目的",
    body: "取得した情報は、本人確認、会員間のマッチング、デートの日程・店舗のご案内、料金の決済、お問い合わせへの対応、サービス改善のために利用します。",
  },
  {
    title: "3. 第三者への提供",
    body: "法令に基づく場合を除き、ご本人の同意なく個人情報を第三者へ提供することはありません。なお、お名前は会員間では公開されません。",
  },
  {
    title: "4. 決済情報の取り扱い",
    body: "クレジットカード情報は、決済代行事業者（Stripe）が安全に管理し、運営者がカード番号そのものを保持することはありません。",
  },
  {
    title: "5. 安全管理",
    body: "運営者は、個人情報の漏えい・滅失・毀損の防止に努め、適切な安全管理措置を講じます。",
  },
  {
    title: "6. 開示・訂正・削除のご請求",
    body: "ご自身の個人情報の開示・訂正・削除をご希望の場合は、お問い合わせ窓口よりご連絡ください。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="プライバシーポリシー" backHref="/mypage" />

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
              ※ 本文はサンプルです。正式なプライバシーポリシーは別途定めるものとします。
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
