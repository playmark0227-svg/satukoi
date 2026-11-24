import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMemberId } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { FAQ } from "@/lib/faq";
import { formatYen } from "@/lib/format";
import {
  PRICING,
  RESIDENCE_AREA_LABELS,
  SCHEDULING_RULES,
  SERVICE_CATCHPHRASE,
  WARNING_RULES,
} from "@/lib/constants";
import { BrandMark } from "@/components/member/BrandMark";
import {
  IconBuilding,
  IconCalendar,
  IconChat,
  IconCheck,
  IconCoffee,
  IconDoc,
  IconHeart,
  IconMapPin,
  IconSearch,
  IconShield,
  IconUser,
} from "@/components/member/icons";
import { LpHeader } from "@/components/lp/LpHeader";
import { LpFooter } from "@/components/lp/LpFooter";
import { LpStartButton } from "@/components/lp/LpCta";
import { IconTile, LP_BODY, LP_CONTAINER, LpSection } from "@/components/lp/LpSection";
import { cn } from "@/lib/cn";

const AREAS = Object.values(RESIDENCE_AREA_LABELS);
const ELIGIBILITY = "札幌市および近郊に在住・在勤の、18歳以上の独身の方";
const MIN = SCHEDULING_RULES.DATE_DURATION_MIN;

const STEPS = [
  {
    Icon: IconSearch,
    title: "プロフィールを見て申し込む",
    desc: "気になるお相手のプロフィールを見て、デートを申し込みます。",
  },
  {
    Icon: IconHeart,
    title: "承諾でマッチ成立",
    desc: "お相手が申し込みを承諾すると、マッチ成立です。",
  },
  {
    Icon: IconCalendar,
    title: "日程を調整（チャットなし）",
    desc: `申し込みを受けた方が出す${SCHEDULING_RULES.MIN_CANDIDATES}件以上の候補から、日程を選ぶだけ。メッセージのやり取りはありません。`,
  },
  {
    Icon: IconCoffee,
    title: `札幌中心部のカフェで${MIN}分`,
    desc: `お店は運営が予約します。当日はお席で待ち合わせて、${MIN}分を目安にお話しします。`,
  },
];

const FEATURES = [
  {
    Icon: IconChat,
    title: "チャットなし",
    desc: "メッセージのやり取りは不要。マッチしたら日程を決めて、まずは会う設計です。",
  },
  {
    Icon: IconCoffee,
    title: `カフェで${MIN}分`,
    desc: `札幌中心部のカフェで、${MIN}分を目安に気軽に会えます。お店選びと予約は運営におまかせ。`,
  },
  {
    Icon: IconHeart,
    title: "結婚を前提に",
    desc: "結婚を前提とした出会いを探している方のためのサービスです。",
  },
  {
    Icon: IconMapPin,
    title: "札幌＆近郊限定",
    desc: `札幌市と近郊${AREAS.length - 1}市町村に在住・在勤の方が対象。ご近所で出会えます。`,
  },
];

const SAFETY = [
  {
    Icon: IconDoc,
    title: "身分証・独身証明書の提出",
    desc: "全員に、顔写真付き身分証明書と独身証明書の提出をお願いしています。",
  },
  {
    Icon: IconCheck,
    title: "運営の確認後に利用開始",
    desc: "提出された書類を運営が確認・承認してから、ご利用いただけます。",
  },
  {
    Icon: IconUser,
    title: "男性は源泉徴収票の提出が必須",
    desc: "年収は、所得証明（源泉徴収票）を運営が確認したうえで表示されます。",
  },
  {
    Icon: IconShield,
    title: "通報・ブロックと警告制度",
    desc: `困ったときは通報・ブロックができます。無断キャンセルなどの違反には警告があり、1年以内に${WARNING_RULES.FORCED_WITHDRAWAL_POINTS}点で強制退会です。`,
  },
];

/** note＝金額の補足（ふつうの文字）。salonFree＝サロン会員は無料（免除だけタグで目立たせる） */
const PRICES: { label: string; value: string; note?: string; salonFree?: boolean }[] = [
  { label: "月会費", value: "なし" },
  { label: "登録料", value: formatYen(PRICING.REGISTRATION), salonFree: true },
  { label: "更新料", value: formatYen(PRICING.RENEWAL), note: "1年ごと" },
  {
    label: "デート代",
    value: formatYen(PRICING.DATE_FEE),
    note: "お一人あたり・デートの日程が確定したとき",
    salonFree: true,
  },
];

export default async function LandingPage() {
  const memberId = await getCurrentMemberId();
  if (memberId) redirect("/users");

  // デモ（GitHub Pages）はログインできないので、ログインもアプリ画面（/users）へそのまま進む
  const loginHref = IS_DEMO ? "/users" : "/login";
  // 主ボタンが LINE のとき（デモ or LIFF 設定済み）だけ、メール登録を別の導線として添える。
  // LIFF 未設定の本番では主ボタン自体が /register なので、同じ行き先のリンクを重ねない。
  const showEmailLink = IS_DEMO || !!process.env.NEXT_PUBLIC_LIFF_ID;
  const [catchA, catchB] = SERVICE_CATCHPHRASE.split("、");

  const startActions = (align: "start" | "center") => (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6",
        align === "center" && "items-center sm:justify-center"
      )}
    >
      <LpStartButton demo={IS_DEMO} />
      {showEmailLink && (
        <Link
          href="/register"
          className="text-[15px] font-semibold text-primary-text underline-offset-4 hover:underline"
        >
          メールアドレスで登録
        </Link>
      )}
    </div>
  );

  return (
    <>
      <LpHeader demo={IS_DEMO} loginHref={loginHref} />

      <main className="flex-1">
        {/* ── ヒーロー ── */}
        <section className="bg-surface">
          <div
            className={cn(
              LP_CONTAINER,
              "grid items-center gap-12 pt-10 pb-14 md:pt-16 md:pb-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16 lg:pt-20 lg:pb-24"
            )}
          >
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-ink">
                <IconMapPin className="h-4 w-4" />
                札幌の恋活サービス
              </p>
              <h1 className="mt-5 text-[34px] leading-[1.3] font-black tracking-tight text-ink sm:text-5xl sm:leading-[1.25] lg:text-[56px]">
                <span className="inline-block">{catchA}、</span>
                <span className="inline-block">{catchB}</span>
              </h1>
              <p className={cn("mt-5 max-w-xl text-ink-soft md:mt-6", LP_BODY)}>
                結婚を前提に、まずは会う。マッチしたらメッセージのやり取りなしで日程を決めて、札幌中心部のカフェで{MIN}分。
              </p>
              <div className="mt-8">{startActions("start")}</div>
              <p className="mt-5 text-[13px] leading-relaxed text-ink-soft md:text-sm">
                対象：{ELIGIBILITY}
              </p>
              {IS_DEMO && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft md:text-sm">
                  ※ デモ版のため、ログインなしでアプリの画面に進みます。
                </p>
              )}
            </div>

            {/* PC のみ：ロゴと、サービスの要点 */}
            <div className="hidden lg:block">
              <div className="animate-fade-in rounded-3xl border border-line bg-canvas p-10">
                <div className="flex justify-center">
                  <span className="story-ring">
                    <span className="flex h-40 w-40 items-center justify-center rounded-full bg-surface">
                      <BrandMark className="h-28 w-28" />
                    </span>
                  </span>
                </div>
                <ul className="mt-10 space-y-4">
                  {[
                    { Icon: IconChat, text: "メッセージのやり取りなし" },
                    { Icon: IconCoffee, text: `札幌中心部のカフェで${MIN}分` },
                    { Icon: IconShield, text: "本人確認を済ませた方だけ" },
                  ].map(({ Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-base font-semibold text-ink">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── ご利用の流れ ── */}
        <LpSection
          id="flow"
          tone="canvas"
          title="ご利用の流れ"
          lead="会員登録と運営による書類の確認が済んだら、次の流れでデートまで進みます。"
        >
          {/* PC でも 2×2（4列にすると1行11文字ほどに詰まって読みにくいため） */}
          <ol className="stagger grid gap-4 md:grid-cols-2 lg:gap-5">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <li key={title} className="rounded-xl border border-line bg-surface p-5 md:p-6 lg:p-7">
                <div className="flex items-center justify-between">
                  <span className="num-tnum flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-white lg:h-9 lg:w-9 lg:text-[15px]">
                    {i + 1}
                  </span>
                  <Icon className="h-6 w-6 text-ink-soft" />
                </div>
                <h3 className="mt-4 text-[17px] leading-snug font-bold text-ink md:text-lg">{title}</h3>
                <p className={cn("mt-2 text-ink-soft", LP_BODY)}>{desc}</p>
              </li>
            ))}
          </ol>
          <p className={cn("mt-6 text-ink-soft", "text-sm leading-relaxed md:text-[15px]")}>
            デート代（お一人{formatYen(PRICING.DATE_FEE)}）は、日程が確定したときにお支払いいただきます。
          </p>
        </LpSection>

        {/* ── 特長 ── */}
        <LpSection id="features" title="サツコイ！の特長">
          {/* アイコン左・文章右の 2×2。カードの枠は付けず、次の「安心して会うために」（枠付きカード）と見分ける */}
          <ul className="stagger grid gap-x-12 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {FEATURES.map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4 md:gap-5">
                <IconTile size="lg">
                  <Icon />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="text-[17px] leading-snug font-bold text-ink md:text-lg">{title}</h3>
                  <p className={cn("mt-1.5 text-ink-soft", LP_BODY)}>{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </LpSection>

        {/* ── 安心・安全 ── */}
        <LpSection
          id="safety"
          tone="canvas"
          title="安心して会うために"
          lead="本人確認が済んだ方だけが利用できる、会員制のサービスです。"
        >
          <ul className="stagger grid gap-4 md:grid-cols-2 lg:gap-5">
            {SAFETY.map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 md:p-6">
                <IconTile>
                  <Icon />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="text-[17px] leading-snug font-bold text-ink md:text-lg">{title}</h3>
                  <p className={cn("mt-1.5 text-ink-soft", LP_BODY)}>{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </LpSection>

        {/* ── 料金 ── */}
        <LpSection
          id="pricing"
          title="料金"
          lead="月会費はかかりません。お支払いは登録料・更新料と、デートの日程が確定したときのデート代です。"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-8">
            <div>
              <dl className="divide-y divide-line rounded-xl border border-line bg-surface">
                {PRICES.map((p) => (
                  <div
                    key={p.label}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 md:px-6 md:py-5"
                  >
                    <dt className="text-base font-bold text-ink md:text-[17px]">{p.label}</dt>
                    <dd className="num-tnum text-right text-xl font-bold text-ink md:text-2xl">{p.value}</dd>
                    {p.note && (
                      <dd className="col-span-2 text-sm leading-relaxed text-ink-soft md:text-[15px]">{p.note}</dd>
                    )}
                    {p.salonFree && (
                      <dd className="col-span-2 mt-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-[13px] font-bold text-success-strong">
                          <IconCheck className="h-3.5 w-3.5" />
                          サロン会員は無料
                        </span>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                ※ サロン会員：結婚相談所（サロン）の会員の方。登録料・デート代が無料です。
              </p>
            </div>

            <div className="rounded-xl bg-canvas p-5 md:p-6">
              <h3 className="text-base font-bold text-ink md:text-[17px]">日程確定後のキャンセル</h3>
              <p className="mt-1.5 text-[15px] leading-[1.8] text-ink-soft">
                キャンセルした方のデート代は返金されません。さらに、デート開始までの時間により違約金がかかります（お相手には全額返金）。
              </p>
              <dl className="mt-3 divide-y divide-line border-y border-line text-[15px]">
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-ink">違約金：開始24時間前〜2時間前</dt>
                  <dd className="num-tnum shrink-0 font-bold text-ink">{formatYen(PRICING.PENALTY_24H_2H)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-ink">違約金：開始2時間前以降・無断</dt>
                  <dd className="num-tnum shrink-0 font-bold text-ink">{formatYen(PRICING.PENALTY_NOSHOW)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </LpSection>

        {/* ── 対象エリア ── */}
        <LpSection id="area" tone="canvas" title="対象エリア" lead={`${ELIGIBILITY}がご利用いただけます。`}>
          {/* 12市町村を同じ幅でそろえる（PC は 6×2、SP は 3×4）。1つだけ次の行に余る並びを避ける */}
          <ul className="stagger grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-2.5 lg:grid-cols-6">
            {AREAS.map((a, i) => (
              <li
                key={a}
                className={cn(
                  "rounded-full border bg-surface px-2 py-2 text-center text-[15px] text-ink md:py-2.5",
                  i === 0 ? "border-ink font-bold" : "border-line"
                )}
              >
                {a}
              </li>
            ))}
          </ul>
        </LpSection>

        {/* ── 成婚・同棲のお部屋探しサポート（小さめ） ── */}
        <section className="border-t border-line bg-surface py-12 md:py-16">
          <div className={LP_CONTAINER}>
            <div className="flex flex-col gap-4 rounded-xl border border-line p-5 sm:flex-row sm:items-start md:p-8">
              <IconTile size="lg">
                <IconBuilding />
              </IconTile>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-soft">成婚後のサポート</p>
                <h2 className="mt-1 text-xl leading-snug font-bold text-ink md:text-2xl">
                  成婚・同棲のお部屋探しサポート
                </h2>
                <p className={cn("mt-2 max-w-2xl text-ink-soft", LP_BODY)}>
                  提携不動産でお部屋探しをすると、お祝い金をキャッシュバック。出会いから、ふたりの新生活のスタートまで伴走します。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── よくある質問 ── */}
        <LpSection
          id="faq"
          tone="canvas"
          title="よくある質問"
          lead="質問を選ぶと、答えが開きます。"
          split
        >
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas md:px-6 md:py-5">
                  <span className="text-base leading-snug font-bold text-ink md:text-[17px]">{item.q}</span>
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-alt text-lg leading-none text-ink transition-transform duration-200 group-open:rotate-45"
                  >
                    ＋
                  </span>
                </summary>
                <p className={cn("details-body px-5 pb-5 text-ink-soft md:px-6 md:pb-6", LP_BODY)}>{item.a}</p>
              </details>
            ))}
          </div>
        </LpSection>

        {/* ── 最後の CTA ── */}
        <section className="border-t border-line bg-surface py-16 md:py-24">
          <div className={cn(LP_CONTAINER, "flex flex-col items-center text-center")}>
            <BrandMark className="h-14 w-14" />
            <h2 className="mt-5 text-2xl leading-snug font-bold tracking-tight text-ink md:text-[32px]">
              <span className="inline-block">結婚を前提とした出会いを、</span>
              <span className="inline-block">カフェでの{MIN}分から。</span>
            </h2>
            <p className={cn("mt-3 text-ink-soft", LP_BODY)}>対象：{ELIGIBILITY}</p>
            <div className="mt-8 w-full">{startActions("center")}</div>
          </div>
        </section>
      </main>

      <LpFooter />
    </>
  );
}
