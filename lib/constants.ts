// ════════════════════════════════════════════════════════════════════
//  表示ラベル・料金・業務ルール定数（仕様書を一元化）
//  ※ DB の enum 値（英語）→ 画面表示（日本語）の対応を集約。
// ════════════════════════════════════════════════════════════════════

export const SERVICE_NAME = "サツコイ！（仮）";
export const SERVICE_CATCHPHRASE = "チャットなし、ちゃんと会える！";

// ── 料金（円） ──
export const PRICING = {
  REGISTRATION: 11000, // 登録料（結婚相談所会員は無料）
  RENEWAL: 11000, // 更新料（登録から1年後に自動決済）
  DATE_FEE: 5500, // デート代（日程確定時、両会員から）
  PENALTY_24H_2H: 5500, // 違約金：24時間前〜2時間前キャンセル
  PENALTY_NOSHOW: 11000, // 違約金：2時間前〜無断キャンセル
} as const;

// ── 日程調整・デートの業務ルール ──
export const SCHEDULING_RULES = {
  PROPOSAL_WINDOW_DAYS: 30, // 申受側はマッチ成立から30日以内の候補を提示
  MIN_CANDIDATES: 3, // 候補は3件以上
  FIRST_PROPOSAL_DEADLINE_HOURS: 24 * 7, // マッチ成立後7日以内に提示がなければ自動解除
  RESPONSE_DEADLINE_HOURS: 48, // 最後のアクションから48時間で自動解除
  DATE_DURATION_MIN: 60, // デート時間の目安
  RESCHEDULE_CUTOFF_HOURS: 24, // 開始24時間前まで日程変更可能
  NOSHOW_LATE_MINUTES: 20, // 20分以上の遅刻はデート実施不可（無断扱い）
  SURVEY_SEND_AFTER_HOURS: 2, // デート開始2時間後にアンケート送信
  SURVEY_DUE_HOURS: 24, // 回答期限24時間
} as const;

// ── 警告制度 ──
export const WARNING_RULES = {
  VALID_DAYS: 365, // 付与日から1年間有効
  FORCED_WITHDRAWAL_POINTS: 3, // 1年以内に3点以上で強制退会
} as const;

// ── プロフィール選択肢ラベル ──

export const SEX_LABELS = {
  MALE: "男性",
  FEMALE: "女性",
} as const;

export const RESIDENCE_AREA_LABELS = {
  SAPPORO: "札幌市",
  EBETSU: "江別市",
  KITAHIROSHIMA: "北広島市",
  ENIWA: "恵庭市",
  TOBETSU: "当別町",
  NANPORO: "南幌町",
  OTARU: "小樽市",
  ISHIKARI: "石狩市",
  IWAMIZAWA: "岩見沢市",
  CHITOSE: "千歳市",
  SHINSHINOTSU: "新篠津村",
  NAGANUMA: "長沼町",
} as const;

export const ELIGIBILITY_LABELS = {
  RESIDENT: "在住",
  WORKER: "在勤",
} as const;

export const INCOME_BRACKET_LABELS = {
  UNDER_399: "〜399万",
  B400_599: "400〜599万",
  B600_799: "600〜799万",
  B800_999: "800〜999万",
  OVER_1000: "1000万〜",
} as const;

export const HOLIDAY_TYPE_LABELS = {
  WEEKENDS_HOLIDAYS: "土日祝",
  SHIFT: "シフト",
  OTHER_FIXED: "その他固定曜日",
} as const;

export const WEEKDAY_LABELS = {
  MON: "月",
  TUE: "火",
  WED: "水",
  THU: "木",
  FRI: "金",
  SAT: "土",
  SUN: "日",
} as const;

export const BODY_TYPE_LABELS = {
  SLIM: "スリム",
  AVERAGE: "普通",
  CHUBBY: "ぽっちゃり",
  MUSCULAR: "ガッチリ",
  PLUMP: "ふっくら",
} as const;

export const SMOKING_LABELS = {
  SMOKER: "吸う",
  NON_SMOKER: "吸わない",
} as const;

export const DRINKING_LABELS = {
  DRINKER: "飲む",
  SOCIAL: "付き合い程度",
  NON_DRINKER: "飲まない",
} as const;

export const CHILDREN_WISH_LABELS = {
  WANT: "希望する",
  EITHER: "こだわらない",
  DONT_WANT: "希望しない",
} as const;

export const YES_NO = {
  true: "あり",
  false: "なし",
} as const;

// ── ステータス・フェーズ ──

export const MEMBER_STATUS_LABELS = {
  DOCUMENT_REVIEW: "書類確認中",
  ACTIVE: "有効",
  SUSPENDED: "停止",
  WITHDRAWN: "退会",
} as const;

export const MEMBER_ACCOUNT_TYPE_LABELS = {
  NORMAL: "一般会員",
  SALON: "サロン会員（結婚相談所）",
} as const;

export const DOCUMENT_TYPE_LABELS = {
  ID_DOCUMENT: "顔写真付き身分証明書",
  SINGLE_CERT: "独身証明書",
  INCOME_CERT: "所得証明",
} as const;

export const DOCUMENT_CHECK_LABELS = {
  PENDING: "未確認",
  OK: "確認OK",
  NG: "差戻し",
} as const;

export const APPLICATION_STATUS_LABELS = {
  PENDING: "申受待ち",
  ACCEPTED: "マッチ成立",
  DECLINED: "見送り",
  CANCELLED: "取消",
  EXPIRED: "期限切れ",
} as const;

/** 運営向け：マッチの4フェーズ */
export const MATCH_PHASE_LABELS = {
  SCHEDULING: "日程調整中",
  CONFIRMED: "日程確定",
  COMPLETED: "デート実施済",
  CANCELLED: "キャンセル",
} as const;

/** 会員向け：表示ステータスは2種類のみ（仕様「会員向け表示ステータス」） */
export function memberFacingPhaseLabel(phase: keyof typeof MATCH_PHASE_LABELS) {
  return phase === "CONFIRMED" ? "日程確定" : "日程調整中";
}

export const PAYMENT_PURPOSE_LABELS = {
  REGISTRATION: "登録料",
  RENEWAL: "更新料",
  DATE_FEE: "デート代",
  PENALTY_5500: "違約金（5,500円）",
  PENALTY_11000: "違約金（11,000円）",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: "処理中",
  SUCCEEDED: "完了",
  FAILED: "失敗",
  REFUNDED: "返金済",
  PARTIALLY_REFUNDED: "一部返金",
} as const;

export const CANCELLATION_CATEGORY_LABELS = {
  BEFORE_24H: "24時間前まで",
  H24_TO_2H: "24時間前〜2時間前",
  WITHIN_2H_OR_NOSHOW: "2時間前〜無断",
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  APPLICATION_RECEIVED: "申受",
  MATCHED: "マッチング",
  CANDIDATE_RECEIVED: "デート日程候補受信",
  DATE_CONFIRMED: "デート日程確定",
  DAY_OF_CONTACT: "当日連絡",
  DATE_CANCELLED: "デートキャンセル",
  RESCHEDULE_REQUEST: "日程変更希望",
  ADMIN_ANNOUNCEMENT: "運営からのお知らせ",
} as const;

export const ANNOUNCEMENT_TARGET_LABELS = {
  ALL: "全員",
  MALE: "男性",
  FEMALE: "女性",
} as const;

export const AD_TYPE_LABELS = {
  OWN: "自社広告",
  SPONSOR: "他社スポンサー",
} as const;

export const AD_POSITION_LABELS = {
  TOP_BOTTOM: "トップページ下部",
  MYPAGE: "マイページ",
} as const;

export const REPORT_TYPE_LABELS = {
  HARASSMENT: "迷惑行為",
  INAPPROPRIATE_CONTENT: "不適切なプロフィール",
  FAKE_PROFILE: "なりすまし",
  NO_SHOW: "無断キャンセル",
  OTHER: "その他",
} as const;

export const REPORT_STATUS_LABELS = {
  OPEN: "未対応",
  IN_PROGRESS: "対応中",
  RESOLVED: "対応完了",
} as const;

export const INQUIRY_STATUS_LABELS = {
  OPEN: "未対応",
  IN_PROGRESS: "対応中",
  RESOLVED: "対応完了",
} as const;

// ── アンケート（デート後・運営改善用） ──

export const SURVEY_Q1_LABELS = {
  AS_PLANNED: "はい（約60分）",
  ENDED_EARLY: "早めに終了した",
  OVER_60: "60分以上かかった",
} as const;

export const SURVEY_Q2_LABELS = {
  VERY_SATISFIED: "とても満足",
  SATISFIED: "満足",
  NEUTRAL: "普通",
  SOMEWHAT_DISSATISFIED: "やや不満",
  DISSATISFIED: "不満",
} as const;

export const SURVEY_Q4_LABELS = {
  WANT_AGAIN: "もう一度会いたい",
  NO_MATCH: "今回はご縁がなかった",
} as const;

// ── キャンセルポリシー文言 ──

/** 日程確定ボタン押下前に必ず表示する短い要約版 */
export const CANCELLATION_NOTICE_SHORT =
  "日程確定後はキャンセル時期により返金不可・違約金が発生します";

/** キャンセル操作時に全文表示する詳細ポリシー */
export const CANCELLATION_POLICY_FULL = [
  {
    title: "① 日程確定後〜デート開始24時間前まで",
    rows: [
      "操作：キャンセル／日程変更（日程調整中に戻す）",
      "キャンセル者：デート料金の返金なし",
      "相手側：全額返金",
      "マッチ：自動解除／ペナルティ：なし／再申込：可能",
    ],
  },
  {
    title: "② デート開始24時間前〜当日開始2時間前まで",
    rows: [
      "操作：キャンセルのみ（日程変更不可）",
      "キャンセル者：返金なし・違約金 5,500円を即時決済",
      "相手側：全額返金",
      "マッチ：自動解除／ペナルティ：警告1点／再申込：可能",
      "※ 違約金決済が失敗した場合、決済完了までサービス利用を停止します",
    ],
  },
  {
    title: "③ 当日開始2時間前〜無断キャンセル（開始20分以上の遅刻でデート実施不可を含む）",
    rows: [
      "キャンセル者：返金なし・違約金 11,000円を即時決済",
      "相手側：全額返金・次回デート1回無料付与",
      "マッチ：自動解除／以降お互い非表示／ペナルティ：警告2点",
      "※ 違約金決済が失敗した場合、決済完了までサービス利用を停止します",
    ],
  },
] as const;

/** 店舗の注意事項テンプレ（サービス名を差し込む） */
export function dateNotesTemplate(serviceName: string = SERVICE_NAME) {
  return [
    `${serviceName}で予約しています。`,
    "お席での待ち合わせでお願い致します。",
    "デート時間は60分を目安にお願い致します。",
    "デート代金は割り勘がルールです。",
  ].join("\n");
}
