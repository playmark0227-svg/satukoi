import { SERVICE_NAME, SERVICE_CATCHPHRASE } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";

const ROWS: { label: string; value: string }[] = [
  { label: "サービス名", value: SERVICE_NAME },
  { label: "運営会社", value: "サツコイ運営事務局（仮）" },
  { label: "所在地", value: "北海道札幌市中央区（詳細はサンプル）" },
  { label: "事業内容", value: "恋活・婚活マッチングサービスの企画・運営" },
  { label: "対応エリア", value: "札幌市および札幌近郊" },
  { label: "お問い合わせ", value: "アプリ内お問い合わせフォームより受付" },
];

export default function CompanyPage() {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="運営会社" backHref="/mypage" />

      <div className="space-y-4 px-4 py-4">
        <Card>
          <CardBody className="space-y-1 text-center">
            <p className="text-lg font-black text-ink">
              {SERVICE_NAME}
            </p>
            <p className="text-sm text-ink-soft">{SERVICE_CATCHPHRASE}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="divide-y divide-line py-1">
            {ROWS.map((r) => (
              <div
                key={r.label}
                className="flex items-start justify-between gap-3 py-3"
              >
                <span className="shrink-0 text-sm text-ink-soft">{r.label}</span>
                <span className="text-right text-sm font-medium text-ink">
                  {r.value}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <p className="px-1 text-xs leading-relaxed text-ink-faint">
          ※ 本ページの記載内容はサンプルです。正式な会社情報・特定商取引法に基づく表記は別途掲載します。
        </p>
      </div>
    </div>
  );
}
