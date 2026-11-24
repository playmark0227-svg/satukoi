// ════════════════════════════════════════════════════════════════════
//  よくある質問（LP と会員メニューの「よくある質問」で共通利用）
//  金額・エリアは lib/constants.ts から組み立て、業務ルールとずれないようにする。
// ════════════════════════════════════════════════════════════════════

import { PRICING, RESIDENCE_AREA_LABELS, SCHEDULING_RULES } from "@/lib/constants";
import { formatYen } from "@/lib/format";

export type FaqItem = { q: string; a: string };

/** 札幌市以外の対象エリア（「市・町・村」を省いた短い表記：江別・北広島…） */
const NEARBY_AREAS = Object.entries(RESIDENCE_AREA_LABELS)
  .filter(([key]) => key !== "SAPPORO")
  .map(([, label]) => label.replace(/[市町村]$/, ""))
  .join("・");

export const FAQ: FaqItem[] = [
  {
    q: "チャット機能はありますか？",
    a: "ありません。サツコイ！は「まずは会う」設計です。マッチ後は日程調整のみで、メッセージのやり取りなしにカフェデートへ進みます。",
  },
  {
    q: "料金はいくらですか？",
    a: `登録料${formatYen(PRICING.REGISTRATION)}、更新料${formatYen(PRICING.RENEWAL)}（1年ごと）、デート確定時にお一人${formatYen(PRICING.DATE_FEE)}です。結婚相談所（サロン）会員は登録料・デート代が無料です。`,
  },
  {
    q: "対象エリアは？",
    a: `札幌市および近郊（${NEARBY_AREAS}）に在住または在勤の18歳以上の方が対象です。`,
  },
  {
    q: "本人確認はありますか？",
    a: "顔写真付き身分証明書と独身証明書の提出が必須です。運営の確認・承認後にご利用開始となります。",
  },
  {
    q: "日程はどうやって決めますか？",
    a: `マッチが成立すると、申し込みを受けた方が${SCHEDULING_RULES.MIN_CANDIDATES}件以上の日程候補を出し、お相手が選ぶと日程が確定します。都合の合う日時がなければ、選ぶ側からも別の候補を出せます。`,
  },
  {
    q: "デートのお店は？",
    a: `運営が提携カフェを予約します。当日はお席での待ち合わせで、デート時間は${SCHEDULING_RULES.DATE_DURATION_MIN}分が目安です。お店でのお会計は割り勘がルールです。`,
  },
  {
    q: "キャンセルはできますか？",
    a: `日程確定後はキャンセル時期により返金不可・違約金が発生します。キャンセルした方のデート代は返金されず、デート開始の24時間前〜2時間前は違約金${formatYen(PRICING.PENALTY_24H_2H)}、2時間前以降・無断キャンセルは違約金${formatYen(PRICING.PENALTY_NOSHOW)}です（お相手には全額返金）。開始${SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS}時間前までなら日程の変更も希望できます。`,
  },
];
