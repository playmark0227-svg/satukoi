"use client";

// ── AIアドバイザー チャット（デモ実装）──────────────────────────────
// 応答はすべてクライアント内の定型文で、会話はローカル state のみ。
// 本実装では、成婚データ＋仲人の実アドバイスを RAG / ファインチューニングで
// 学習した LLM API（ストリーミング応答）に置き換える。
// 併せてフリー入力の内容は担当カウンセラーへの共有キューに連携する想定。

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IconSend } from "@/components/member/icons";
import mark from "@/public/logo-mark.png";

type Stats = {
  matchCount: number;
  sentCount: number;
  receivedCount: number;
};

type Msg = {
  id: number;
  role: "ai" | "me";
  text: string;
};

/** 定型質問チップと、それぞれへの定型アドバイス（仲人監修の想定文面） */
const QUICK_QUESTIONS: { q: string; a: string }[] = [
  {
    q: "プロフィールの改善点は？",
    a: "まず写真です。メインは明るい場所での自然な笑顔、2枚目に趣味が伝わる1枚を入れると人柄が伝わります。自己紹介文には「休日の過ごし方」と「ふたりでやってみたいこと」を具体的に1つずつ書きましょう。これだけで申し込みの通りやすさは目に見えて変わりますよ。",
  },
  {
    q: "デートの会話が不安",
    a: "初回デートは90分、話す割合は「相手7：自分3」を意識しましょう。「最近ハマっていること」「休日の過ごし方」「行ってみたい場所」の3つを聞けば会話は自然につながります。沈黙は失敗ではないので、飲み物を一口はさむくらいの余裕で大丈夫ですよ。",
  },
  {
    q: "服装はどうすれば？",
    a: "大事なのは値段より清潔感とサイズ感です。男性は襟付きシャツにジャケット、女性は明るい色のブラウスやワンピースが定番。迷ったら「お店の雰囲気より少しきちんとめ」を選んで、靴と髪を整えれば印象はぐっと良くなります。",
  },
  {
    q: "申し込みが通らない",
    a: "申し込みは1〜2割通れば十分なので、落ち込まなくて大丈夫。まずは希望条件をひとつだけ緩めて、週3人ペースで申し込みを続けましょう。あわせてメイン写真を1枚変えると反応が変わることも多いです。数と見せ方、両方から整えていきましょう。",
  },
];

/** 活動データに基づく初回のお節介コメント */
function statsComment(nickname: string, s: Stats): string {
  if (s.matchCount > 0) {
    return `${nickname}さんはこれまでにマッチが${s.matchCount}件。とてもいいペースです！マッチしたお相手には3日以内に日程候補を返すのが鉄則ですよ。迷っているうちに気持ちは冷めてしまうので、今日ひとつ動いてみましょう。`;
  }
  if (s.sentCount === 0) {
    return s.receivedCount > 0
      ? `お相手から${s.receivedCount}件の申し込みが届いていますね。まずはプロフィールを見て、気になる方にはお返事してみましょう。${nickname}さんからの申し込みも、今週2人を目標にどうですか？`
      : `まだ申し込みが0件ですね。プロフィールを眺めているだけではご縁は動きません。まずは「いいな」と思った方おひとりに申し込んでみましょう。最初は練習のつもりで大丈夫ですよ。`;
  }
  return `いまの申し込みは${s.sentCount}件ですね。今週はあと2人に申し込んでみましょう。返事は気にしすぎなくて大丈夫、続けた方からご縁が生まれています。`;
}

/** フリー入力への汎用応答（デモ。実装ではLLM応答＋カウンセラー共有に置換） */
function freeReply(nickname: string): string {
  return `ありがとうございます！その相談は担当カウンセラーにも共有しますね。${nickname}さんの場合は、これまでの活動データをもとに具体的な作戦を立てられます。焦らなくて大丈夫、今週できる一歩から一緒に進めていきましょう。`;
}

function AiAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
      <Image src={mark} alt="" sizes="20px" className="h-4.5 w-4.5 object-contain" />
    </span>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="animate-fade-up flex items-start gap-2">
      <AiAvatar />
      <p className="max-w-[76%] rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink">
        {text}
      </p>
    </div>
  );
}

function MeBubble({ text }: { text: string }) {
  return (
    <div className="animate-fade-up flex justify-end">
      <p className="max-w-[76%] rounded-2xl bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-white">
        {text}
      </p>
    </div>
  );
}

/** 入力中表示（静的な3点ドット。無限ループアニメは使わない） */
function TypingBubble() {
  return (
    <div className="animate-fade-in flex items-start gap-2" aria-label="入力中">
      <AiAvatar />
      <span className="flex items-center gap-1 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint opacity-40" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint opacity-70" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
      </span>
    </div>
  );
}

export function AdvisorChat({
  nickname,
  stats,
}: {
  nickname: string;
  stats: Stats;
}) {
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: 1,
      role: "ai",
      text: `${nickname}さん、こんにちは！仲人歴20年のノウハウを学習したAIアドバイザーです。活動のこと、なんでも聞いてくださいね。`,
    },
    { id: 2, role: "ai", text: statsComment(nickname, stats) },
  ]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const nextIdRef = useRef(3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // アンマウント時に応答待ちタイマーを破棄
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 新しい吹き出しが増えたら最下部へスクロール（初回表示時は動かさない）
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  /** 自分の発言を追加し、約1秒の「入力中…」を挟んでAIの定型応答を返す */
  const send = (text: string, reply: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const meId = nextIdRef.current++;
    setMessages((m) => [...m, { id: meId, role: "me", text: trimmed }]);
    setTyping(true);
    timerRef.current = setTimeout(() => {
      const aiId = nextIdRef.current++;
      setMessages((m) => [...m, { id: aiId, role: "ai", text: reply }]);
      setTyping(false);
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || typing) return;
    send(draft, freeReply(nickname));
    setDraft("");
  };

  return (
    <div className="flex min-h-[calc(100dvh-116px)] flex-1 flex-col">
      {/* 会話ログ */}
      <div className="flex-1 space-y-3 px-4 py-4" aria-live="polite">
        <p className="animate-fade-in text-center text-[11px] font-medium text-ink-faint">
          今日
        </p>
        {messages.map((m) =>
          m.role === "ai" ? (
            <AiBubble key={m.id} text={m.text} />
          ) : (
            <MeBubble key={m.id} text={m.text} />
          )
        )}
        {typing && <TypingBubble />}
        <div ref={endRef} />
      </div>

      {/* 定型質問チップ（横スクロール） */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_QUESTIONS.map(({ q, a }) => (
          <button
            key={q}
            type="button"
            disabled={typing}
            onClick={() => send(q, a)}
            className="shrink-0 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-all duration-150 hover:bg-canvas active:scale-[0.97] disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* フリー入力欄 */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="相談してみる"
          aria-label="相談内容"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 text-ink outline-none placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        <button
          type="submit"
          disabled={typing || !draft.trim()}
          aria-label="送信"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all duration-150 hover:bg-primary-strong active:scale-95 disabled:opacity-40"
        >
          <IconSend className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
