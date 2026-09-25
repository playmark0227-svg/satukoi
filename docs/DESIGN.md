# サツコイ！ デザインシステム v4 — 「Instagram のような」雰囲気

## 方針

ユーザーが毎日開き慣れている Instagram の「空気感」に合わせる（見た目の真似ではなく、構成と余白の考え方を借りる）。
アイコン・ロゴ等の素材は Instagram のものを使わない（独自作図＋Feather Icons[MIT] 準拠）。

- 画面のベースは **真っ白**。区切りは影ではなく **細いグレーの罫線**（`line` / `line-soft`）
- 文字は黒（`ink`）とグレー（`ink-soft` / `ink-faint`）の2〜3段階だけ
- 操作（主ボタン・リンク・選択中）は **ブルー**（`primary`）。サブボタンは **グレーの面ボタン**（`secondary`）
- ブランドのグラデーション（ロゴのピンク→紫にオレンジを足したもの）は
  **ストーリーの輪・ロゴまわりのみ**。面を塗らない、文字に使わない
- 未読・件数バッジは赤（`like`）

## トークン（app/globals.css @theme）

| 役割 | トークン | 値 |
|---|---|---|
| 操作色 | primary / primary-strong / primary-soft / primary-tint | #0095f6 / #1877f2 / #e0f1fe / #f0f8ff |
| ブランド（グラデの素材） | brand / brand-violet / brand-orange | #ee3f9b / #ab48e5 / #ff8a3d |
| 未読・いいね | like | #ff3040 |
| 文字 | ink / ink-soft / ink-faint | #0c0c0d / #737373 / #a8a8a8 |
| 面 | canvas・surface / surface-alt | #ffffff / #efefef |
| 罫線 | line / line-soft | #dbdbdb / #efefef |

- 角丸：ボタン・入力欄 8px（`rounded-lg`）、カード 12px（`--radius-card`）
- 影：原則なし（`--shadow-card: none`）
- グラデーション：`var(--gradient-brand)`（`.story-ring` のみが使用）

## 部品のきまり

- **下タブ**：アイコンのみ（ホーム／マッチ／マイページ＝自分の写真／メニュー）。選択中は塗りつぶし。未対応の申込があればマッチに赤い点
- **ヘッダー**：トップは左にロゴ＋ワードマーク、右にベル（未読数の赤バッジ）。下層は中央タイトル＋左に戻る
- **ストーリーの輪**：`.story-ring`（新着・要対応）／`.story-ring-seen`（既読・通常）。輪の中はアバター
- **フィード**：投稿ヘッダー（輪付きアバター＋名前＋地域）→ 4:5 の写真（端から端まで）→ アクション行 → キャプション（自己紹介）
- **ボタン**：`primary`（ブルー）は1画面に原則1つ。並べるときは「主＝ブルー、副＝グレー面」
- **リスト**：カードで囲まず、白地に罫線区切り。右端はシェブロン
- **見出し**：左揃え `text-[15px] font-bold text-ink`
- **バッジ**：本人確認＝ブルーのチェック、サロン会員＝amber の王冠、プレミアム訴求＝amber
- **LINE ボタン**：LINE 公式色 #06C755（LINE 関連の操作だけに使用）

## 禁止

- 面をグラデーションで塗る／グラデーション文字／キラキラ・浮遊・点滅など無限ループの装飾
- 色付きの影、24px を超える角丸、ピンクの面
- 旧クラス：`bg-brand-gradient` `text-foil` `sheen-host` `animate-twinkle` `animate-float` `animate-heart` `animate-bell` `animate-pulse-ring` `rule-letter` `caps-label`

## アニメーション

入場系のみ：`animate-fade-up` `animate-fade-in` `animate-scale-in` `animate-page` `.stagger`
＋押下フィードバック（`active:opacity-*` / `active:scale-*`）。
