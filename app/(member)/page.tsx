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
          <ButtonLink href="/register" size="lg">
            新規登録ではじめる
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="outline">
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

      {/* 料金 */}
      <section className="px-5 pb-8">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[15px] font-bold text-ink">料金</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">登録料</dt>
              <dd className="font-bold text-ink">{formatYen(PRICING.REGISTRATION)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">更新料（1年ごと）</dt>
              <dd className="font-bold text-ink">{formatYen(PRICING.RENEWAL)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">デート代（確定時・各自）</dt>
              <dd className="font-bold text-ink">{formatYen(PRICING.DATE_FEE)}</dd>
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
