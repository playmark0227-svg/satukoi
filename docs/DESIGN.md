# サツコイ！ デザインシステム v3 — 「実在アプリ」基調（脱AI）

## 哲学

実在の人気マッチングアプリ（Pairs / with / Omiai / tapple）の共通言語に合わせる。
**画面のベースは白・黒・グレー。ブランドピンクは「アクセント」に限定し、面で塗らない。**

AIが作ったUIに見える典型要素（=禁止）:

- 面をピンク/グラデーションで塗る（バナー、チップ、ヘッダー帯、アイコン枠）
- 無限ループする装飾アニメ（グラデーションが流れる文字、シアン光沢、キラキラ、浮遊、鼓動、ベル揺れ、波紋）
- グラデーション文字・ゴールド/foil表現
- 飾りの英語大文字ラベル（"PICK UP" 等）と ♥ 区切り線
- 中央揃えの誇張された見出し・過剰な角丸（24px超）・ピンク色の影

## トークン（globals.css @theme）

- primary `#ee3f9b` / primary-strong `#d31f80`（ロゴ実測）— **CTAボタン・アクティブ状態・通知数・強調テキストのみ**
- ink `#14161c` / ink-soft `#626875` / ink-faint `#9aa0ab`
- canvas `#f7f7f8` / surface `#ffffff` / surface-alt `#f2f3f5` / line `#e8eaee`
- radius-card `1rem`。影はニュートラルでごく薄く（ピンクの滲み禁止）

## 禁止クラス（コード中に残してはならない）

`bg-brand-gradient` `text-foil` `sheen-host` `animate-twinkle` `animate-float`
`animate-heart` `animate-bell` `animate-pulse-ring` `rule-letter` `caps-label`

置き換え指針:

| 旧 | 新 |
|---|---|
| bg-brand-gradient のボタン | `bg-primary text-white hover:bg-primary-strong`（Buttonコンポーネント使用） |
| bg-brand-gradient のアイコン枠 | 白カード上の小さな `bg-surface-alt text-ink-soft` 円/角丸、または文脈色（プレミアム=amber） |
| text-foil ワードマーク | `text-ink font-black`（プレーン） |
| animate-float / twinkle / sheen-host | 削除（置き換え不要） |
| animate-pulse-ring の未読ドット | 静的な `bg-danger` ドット |
| rule-letter / caps-label | 削除。見出しは左揃え `text-[15px] font-bold text-ink`、補助ラベルは `text-xs font-bold text-ink-faint` |
| ピンク面のバナー | 白カード `border border-line rounded-2xl` ＋ ink見出し＋グレー本文 |
| 色付きセクション帯（メニュー） | canvas上のプレーンな `text-xs font-bold text-ink-faint` ラベル |

## 許可されるアニメーション

入場系のみ: `animate-fade-up` `animate-fade-in` `animate-scale-in` `animate-page` `.stagger`
＋押下フィードバック（`active:scale-*` / hover遷移）。無限ループは通知ドット含めすべて不可。

## レイアウト定石

- セクション見出し: 左揃え。`<h2 class="text-[15px] font-bold text-ink">` ＋ 右側に件数/リンク（text-xs text-ink-faint）
- 一覧カード: 写真は `aspect-square rounded-xl`、**情報は写真の下**（名前=ink太字15px、年齢・地域=ink-soft 12px）。オーバーレイ文字は使わない
- バッジ: 本人確認=緑チェック（既存BadgeVerified）、サロン会員=amber王冠（BadgeCrown）
- リスト行: 白背景 divide-y、アイコンは `bg-surface-alt text-ink-soft` の小円、右端 ›
- 空状態: グレー円＋ロゴマーク小、太字ink見出し、グレー説明
- CTA: 1画面に主ボタンは1つ。Button primary（ピンク単色）
- プレミアム/サロン訴求: amber（金）系の控えめなワンポイント。紫グラデ禁止
