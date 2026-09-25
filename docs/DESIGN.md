# サツコイ！ デザインシステム v4.1 — 「Instagram のような」デザイン × 従来のレイアウト

## 方針

**Instagram に寄せるのは「デザイン（色・線・文字・アイコン・質感）」だけ。画面の構成（レイアウト）は従来どおり**
（ホームは2列グリッド、下タブはアイコン＋ラベル、各画面は白いカードで情報をまとめる）。
アイコン・ロゴ等の素材は Instagram のものを使わない（独自作図＋Feather Icons[MIT] 準拠）。

- 画面の地は **ごく薄いグレー（#fafafa）**、カード・ヘッダー・タブは **白**。区切りは影ではなく **細いグレーの罫線**
- 文字は黒（`ink`）とグレー（`ink-soft` / `ink-faint`）の2〜3段階だけ
- 操作（主ボタン・リンク・選択中）は **ブルー**（`primary`）。サブボタンは **グレーの面ボタン**（`secondary`）
- ブランドのグラデーション（ロゴのピンク→紫にオレンジを足したもの）は
  **ストーリーの輪・「NEW」ラベル・ロゴまわりのみ**。面を塗らない、文字に使わない
- 未読・件数バッジは赤（`like`）

## トークン（app/globals.css @theme）

| 役割 | トークン | 値 |
|---|---|---|
| 操作色 | primary / primary-strong / primary-soft / primary-tint | #0095f6 / #1877f2 / #e0f1fe / #f0f8ff |
| ブランド（グラデの素材） | brand / brand-violet / brand-orange | #ee3f9b / #ab48e5 / #ff8a3d |
| 未読・いいね | like | #ff3040 |
| 文字 | ink / ink-soft / ink-faint | #0c0c0d / #737373 / #a8a8a8 |
| 面 | canvas / surface / surface-alt | #fafafa / #ffffff / #efefef |
| 罫線 | line / line-soft | #dbdbdb / #efefef |

- 角丸：ボタン・入力欄 8px（`rounded-lg`）、カード 12px（`--radius-card`）
- 影：原則なし（`--shadow-card: none`）
- グラデーション：`var(--gradient-brand)`（`.story-ring` とホームの「NEW」ラベルのみが使用）

## 部品のきまり

- **下タブ**：アイコン＋ラベル（ホーム／マッチ／マイページ＝自分の写真／メニュー）。選択中は黒の塗りアイコン＋太字。未対応の申込があればマッチに赤い点
- **ヘッダー**：トップは左にロゴ＋ワードマーク、右にベル（未読数の赤バッジ）。下層は中央タイトル＋左に戻る
- **ストーリーの輪**：`.story-ring`（要対応・自分のプロフィール）／`.story-ring-seen`（通常）。輪の中はアバター
- **ホーム**：2列グリッド。写真（正方形・角丸8px）の上に「相性◯%」、新着は「NEW」（ブランドグラデ）、関係（申込済み・マッチ中など）は右上の黒いラベル。自分から申し込んだ相手はハートが赤
- **ボタン**：`primary`（ブルー）は1画面に原則1つ。並べるときは「主＝ブルー、副＝グレー面」
- **リスト**：白いカードの中に罫線区切りで並べる（従来レイアウト）。右端はシェブロン
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
