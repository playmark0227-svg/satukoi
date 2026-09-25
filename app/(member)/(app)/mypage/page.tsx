import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconPencil,
  IconHeart,
  IconSend,
  IconChat,
  IconCrown,
  IconBuilding,
  IconChevronRight,
  IconMenu,
  IconUser,
  IconDoc,
  IconShield,
  IconCheck,
  IconTicket,
  BadgeVerified,
} from "@/components/member/icons";

function Stat({ n, label, href }: { n: number; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center active:opacity-60">
      <span className="num-tnum text-lg font-bold leading-tight text-ink">{n}</span>
      <span className="text-[13px] text-ink">{label}</span>
    </Link>
  );
}

function Row({ href, icon, label, sub }: { href: string; icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3 active:opacity-60">
      <span className="flex h-6 w-6 items-center justify-center text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] text-ink">{label}</span>
        {sub && <span className="block text-xs text-ink-soft">{sub}</span>}
      </span>
      <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
    </Link>
  );
}

/** プロフィール充実度（任意項目の充足）。Instagram の「プロフィールを完成させよう」風に表示。 */
function profileSteps(me: {
  photos: { url: string }[];
  selfIntroduction: string | null;
  hobbies: string | null;
  qualifications: string | null;
  incomeCertVerified: boolean;
}) {
  return [
    { done: me.photos.length > 0, title: "写真を追加", body: "印象が大きく変わります", icon: <IconUser className="h-6 w-6" /> },
    { done: !!me.selfIntroduction, title: "自己紹介を書く", body: "申し込みが通りやすくなります", icon: <IconPencil className="h-6 w-6" /> },
    { done: !!me.hobbies, title: "趣味を追加", body: "会話のきっかけになります", icon: <IconHeart className="h-6 w-6" /> },
    { done: !!me.qualifications, title: "資格を追加", body: "信頼感がアップします", icon: <IconDoc className="h-6 w-6" /> },
    { done: me.incomeCertVerified, title: "所得証明を提出", body: "年収が公開されます", icon: <IconShield className="h-6 w-6" /> },
  ];
}

export default async function MyPage() {
  const me = await requireMember();

  const [matchCount, sentCount, receivedCount] = await Promise.all([
    prisma.match.count({
      where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
    }),
    prisma.dateApplication.count({ where: { applicantId: me.id } }),
    prisma.dateApplication.count({ where: { receiverId: me.id } }),
  ]);

  const steps = profileSteps(me);
  const doneCount = steps.filter((x) => x.done).length;

  return (
    <div className="flex flex-1 flex-col pb-8">
      <BrandHeader
        title={me.nickname}
        right={
          <Link href="/menu" aria-label="メニュー" className="-mr-2 flex h-10 w-10 items-center justify-center text-ink active:opacity-60">
            <IconMenu className="h-[26px] w-[26px]" />
          </Link>
        }
      />

      {/* プロフィールヘッダー（写真＋数字） */}
      <section className="px-4 pt-1">
        <div className="flex items-center gap-6">
          <span className="story-ring-seen shrink-0">
            <Avatar url={me.photos[0]?.url} name={me.nickname} className="h-[84px] w-[84px] text-2xl" />
          </span>
          <div className="grid flex-1 grid-cols-3 text-center">
            <Stat n={matchCount} label="マッチ" href="/matches" />
            <Stat n={sentCount} label="申込み" href="/applications?tab=sent" />
            <Stat n={receivedCount} label="申し受け" href="/applications" />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-ink">
          {me.nickname}
          {me.incomeCertVerified && <BadgeVerified size="sm" />}
        </p>
        <p className="num-tnum text-sm text-ink-soft">
          {calcAge(me.birthDate)}歳・{RESIDENCE_AREA_LABELS[me.residenceArea]}・{me.occupation}
        </p>
        {me.selfIntroduction && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {me.selfIntroduction}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ButtonLink href="/mypage/edit" variant="secondary" size="md">
            プロフィールを編集
          </ButtonLink>
          <ButtonLink href="/referral" variant="secondary" size="md">
            お友達を紹介
          </ButtonLink>
        </div>
      </section>

      {/* プロフィールを完成させよう */}
      {doneCount < steps.length && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between px-4">
            <h2 className="text-[15px] font-bold text-ink">プロフィールを完成させよう</h2>
            <span className="num-tnum text-xs text-ink-soft">
              <span className="font-semibold text-success">{doneCount}/{steps.length}</span> 完了
            </span>
          </div>
          <div className="mt-2.5 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[...steps].sort((a, b) => Number(a.done) - Number(b.done)).map((st) => (
              <div
                key={st.title}
                className="flex w-[150px] shrink-0 flex-col items-center rounded-xl border border-line px-3 pb-3 pt-4 text-center"
              >
                <span
                  className={
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 " +
                    (st.done ? "border-success text-success" : "border-ink text-ink")
                  }
                >
                  {st.done ? <IconCheck className="h-6 w-6" /> : st.icon}
                </span>
                <p className="mt-2 text-sm font-semibold text-ink">{st.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{st.body}</p>
                {st.done ? (
                  <span className="mt-2.5 flex h-8 w-full items-center justify-center rounded-lg bg-surface-alt text-[13px] font-semibold text-ink-soft">
                    完了
                  </span>
                ) : (
                  <ButtonLink href="/mypage/edit" size="sm" className="mt-2.5 w-full">
                    追加する
                  </ButtonLink>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* アクティビティ */}
      <section className="mt-6 px-4">
        <h2 className="text-[15px] font-bold text-ink">アクティビティ</h2>
        <div className="mt-1 divide-y divide-line-soft">
          <Row href="/matches" icon={<IconHeart className="h-6 w-6" />} label="マッチング履歴" sub={`${matchCount}件`} />
          <Row href="/applications?tab=sent" icon={<IconSend className="h-6 w-6" />} label="送った申込み" sub={`${sentCount}件`} />
          <Row href="/applications" icon={<IconChat className="h-6 w-6" />} label="受け取った申込み" sub={`${receivedCount}件`} />
          <Row href="/tickets" icon={<IconTicket className="h-6 w-6" />} label="ギフト券" />
        </div>
      </section>

      {/* おすすめ（プレミアム・不動産） */}
      <section className="mt-6 px-4">
        <h2 className="text-[15px] font-bold text-ink">おすすめ</h2>
        <div className="mt-2 space-y-2.5">
          <div className="flex items-start gap-3 rounded-xl border border-line p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <IconCrown className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                婚活サロン会員募集
                <span className="ml-1.5 rounded-md bg-amber-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-amber-600">
                  プレミアム
                </span>
              </p>
              <p className="num-tnum mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                月9,900円〜でデート代無料・全国10万人以上とマッチング・専属カウンセラー
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-line p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink">
              <IconBuilding className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">成婚・同棲のお部屋探しもサポート</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                提携不動産でのお部屋探しで、お祝い金をキャッシュバック。新生活まで伴走します。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
