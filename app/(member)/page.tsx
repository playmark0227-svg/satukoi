import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMemberId } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/Button";
import {
  SERVICE_NAME,
  SERVICE_CATCHPHRASE,
  PRICING,
  RESIDENCE_AREA_LABELS,
} from "@/lib/constants";
import { formatYen } from "@/lib/format";
import { BrandMark } from "@/components/member/BrandMark";
import { IconBuilding } from "@/components/member/icons";

/** LINE公式のフキダシをかたどったシンプルなアイコン（単色・currentColor） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2c-5.3 0-9.6 3.5-9.6 7.83 0 3.87 3.43 7.1 8.06 7.72.31.07.74.21.85.48.1.24.06.61.03.86l-.13.82c-.04.24-.2.96.84.52 1.04-.43 5.61-3.3 7.65-5.66 1.41-1.55 1.9-3.12 1.9-4.74 0-4.33-4.3-7.83-9.6-7.83z" />
    </svg>
  );
}

const points = [
  { icon: "💬", title: "チャットなし", desc: "メッセージのやり取りは不要。まずは会う設計。" },
  { icon: "☕", title: "カフェで60分", desc: "札幌中心部のカフェで、気軽に60分のデート。" },
  { icon: "🪪", title: "本人確認必須", desc: "身分証・独身証明書の提出で安心して出会える。" },
  { icon: "📍", title: "札幌＆近郊限定", desc: "在住・在勤の方限定。ご近所で出会える。" },
];

export default async function LandingPage() {
  const memberId = await getCurrentMemberId();
  if (memberId) redirect("/users");

  return (
    <div className="flex flex-1 flex-col">
      {/* ヒーロー */}
      <section className="animate-fade-up border-b border-line bg-surface px-6 pt-14 pb-10 text-center">
        <BrandMark className="mx-auto h-24 w-24" />
        <p className="mt-5 text-sm font-bold text-primary-strong">{SERVICE_CATCHPHRASE}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">
          {SERVICE_NAME}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          札幌恋活マッチングサービス。
          <br />
          結婚を前提とした、ちゃんと会える出会いを。
        </p>
        <div className="mt-7 space-y-3">
          {/*
            主CTA：LINEではじめる。
            本実装では LINE Login（LIFF）で友だち追加→プロフィール登録へ接続する予定。
            ※ #06C755 は LINE のブランド公式色（ボタンのみに使用・面塗り不可）
          */}
          <Link
            href="/register"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#06C755] px-6 text-base font-bold whitespace-nowrap text-white transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
          >
            <LineIcon className="h-5 w-5" />
            LINEではじめる
          </Link>
          <ButtonLink href="/register" size="lg" variant="outline">
            新規登録ではじめる
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="ghost">
            ログイン
          </ButtonLink>
        </div>
      </section>

      {/* 特長 */}
      <section className="stagger grid grid-cols-2 gap-3 px-5 py-8">
        {points.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-sm font-bold text-ink">
              <span className="mr-1.5 text-base" aria-hidden>
                {p.icon}
              </span>
              {p.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{p.desc}</p>
          </div>
        ))}
      </section>

      {/* 成婚・同棲のお部屋探しサポート */}
      <section className="px-5 pb-8">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
              <IconBuilding className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-ink">
                成婚・同棲のお部屋探しサポート
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                提携不動産でお部屋探しをすると、お祝い金をキャッシュバック。
                出会いから、ふたりの新生活のスタートまで伴走します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 料金（成功報酬型） */}
      <section className="px-5 pb-8">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[15px] font-bold text-ink">料金</h2>
          <div className="mt-4 text-center">
            <p className="text-xs font-bold text-ink-faint">月会費</p>
            <p className="num-tnum mt-1 text-4xl font-black tracking-tight text-ink">
              0円
            </p>
          </div>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-ink-soft">
            メッセージし放題の月額課金ではなく、実際に会えた時だけ。
          </p>
          <dl className="mt-4 divide-y divide-line border-t border-line text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">デート（日程）確定時のみ</dt>
              <dd className="num-tnum font-bold text-ink">
                {formatYen(PRICING.DATE_FEE)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-ink-soft">
                登録料
                <span className="ml-1 text-xs text-ink-faint">（サロン会員無料）</span>
              </dt>
              <dd className="num-tnum font-bold text-ink">
                {formatYen(PRICING.REGISTRATION)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-faint">
            ※ 結婚相談所（サロン）会員は登録料・デート代が無料です。
          </p>
        </div>
      </section>

      {/* 対象エリア */}
      <section className="px-5 pb-12">
        <h2 className="px-1 text-[15px] font-bold text-ink">対象エリア（在住・在勤）</h2>
        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-soft">
          {Object.values(RESIDENCE_AREA_LABELS).join("・")}（18歳以上）
        </p>
      </section>

      <footer className="mt-auto border-t border-line px-5 py-6 text-center text-xs text-ink-faint">
        © {SERVICE_NAME}
      </footer>
    </div>
  );
}
