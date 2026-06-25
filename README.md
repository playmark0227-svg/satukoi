# サツコイ！（仮）

> チャットなし、ちゃんと会える！ — 札幌恋活マッチングサービス

結婚を前提とした出会いを、「まずは会う」「チャットしない」設計で提供する
スマホ専用 Web アプリ（会員アプリ＋運営管理画面）の実装です。

このリポジトリは仕様書をもとにした **基盤＋データモデル＋主要画面の土台** です。
データモデルとビジネスルールは網羅的に実装し、画面は会員側・運営側ともに
一通りスキャフォルドしてあります（決済・メール送信・画像アップロードはスタブ）。

---

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フレームワーク | Next.js 16（App Router, React 19, Server Components） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4（スマホ専用フレーム） |
| ORM / DB | Prisma 7（Rust-free / driver adapter）+ PostgreSQL 16 |
| 認証 | Cookie セッション（`jose` で署名した JWT・httpOnly）＋ `bcryptjs` |
| 決済 | Stripe（`lib/stripe.ts` はスタブ。実キーで実決済に切替） |
| フォーム | React Hook Form / Server Actions |
| 日付 | dayjs |

---

## セットアップ

### 前提
- Node.js 20+（推奨 22）
- PostgreSQL 16（ローカル or Docker）

### 手順

```bash
# 1) 依存インストール（postinstall で prisma generate も実行）
npm install

# 2) 環境変数
cp .env.example .env
#   DATABASE_URL を自分の PostgreSQL に合わせて編集
#   AUTH_SECRET は十分長いランダム値に変更

# 3) マイグレーション適用
npm run db:migrate     # = prisma migrate dev

# 4) サンプルデータ投入
npm run db:seed        # = tsx prisma/seed.ts

# 5) 開発サーバー
npm run dev            # http://localhost:3000
```

### デモ用ログイン情報（seed 投入後）

| 種別 | メール | パスワード |
| --- | --- | --- |
| 会員（男性） | `male0@satukoi.local` 〜 `male5@satukoi.local` | `password` |
| 会員（女性） | `female0@satukoi.local` 〜 `female5@satukoi.local` | `password` |
| 運営（管理画面） | `admin@satukoi.local` | `password` |

> `male0` はサロン（結婚相談所）会員。会員ログインは `/login`、運営は `/admin/login`。

### npm スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | `tsc --noEmit` 型チェック |
| `npm run db:migrate` | マイグレーション作成・適用 |
| `npm run db:reset` | DB リセット＋再シード |
| `npm run db:seed` | サンプルデータ投入 |
| `npm run db:studio` | Prisma Studio |
| `npm run demo:build` | GitHub Pages 用の静的エクスポート（`out/`） |

---

## ディレクトリ構成

```
app/
  (member)/                 会員アプリ（スマホ枠 PhoneFrame）
    page.tsx                ランディング
    login/ forgot-password/ register/   認証・登録（認証不要）
    (app)/                  ログイン必須・ボトムナビ付き
      users/                ユーザー一覧・絞り込み・詳細・申込/ブロック/通報
      matches/              マッチ一覧・日程調整フロー・デート・キャンセル
      applications/         送った/受信した申込
      mypage/               マイページ・プロフィール編集
      notifications/        お知らせ・通知
      survey/[matchId]/     デート後アンケート
      contact/ info/        お問い合わせ・規約・プライバシー・運営会社
  admin/                    運営管理画面
    login/                  運営ログイン
    (dash)/                 AdminShell（サイドバー）・運営認証必須
      page.tsx              ダッシュボード
      members/ matches/ cancellations/ reports/ announcements/ ads/ stores/
components/
  ui/                       Button, Card, Badge, StatusBadge, Field, Input, Avatar, ...
  member/  admin/           レイアウト・各機能の部品
lib/
  db.ts                     Prisma クライアント（pg adapter）
  auth.ts                   会員/運営セッション
  constants.ts              ラベル・料金・業務ルール・ポリシー文言の一元管理
  scheduling.ts             日程調整・キャンセル区分・違約金の業務ルール（純粋関数）
  stripe.ts notifications.ts format.ts password.ts cn.ts
prisma/
  schema.prisma             データモデル（26 テーブル）
  seed.ts                   サンプルデータ
```

---

## データモデル（要点）

`prisma/schema.prisma` に全 26 テーブルを定義。主な集約は以下。

- **Member / Photo / Document** … 会員と顔写真（最大5枚）・本人確認書類（身分証・独身証明・所得証明）。登録後編集不可項目はアプリ層でガード。
- **DateApplication → Match** … 申込み／申受（ACCEPTED でマッチ成立）。
- **ScheduleProposal / ScheduleCandidate** … 日程候補の提示（3件以上・回数無制限）と選択。
- **DateEvent / Store** … 確定デートと店舗（事前登録5店舗・運営が選択）。
- **Payment** … 登録料/更新料/デート代/違約金/返金（Stripe）。
- **Cancellation / Warning** … キャンセル区分（3種）・返金・違約金・警告（1年有効・3点で強制退会）。
- **ReferralCode / Referral** … 紹介制度（登録料決済で成立・両者に特典）。
- **SurveyResponse** … デート後アンケート（運営改善用・全5問）。
- **Notification / Announcement / Ad** … 通知（メール＋アプリ内）・お知らせ・広告。
- **AdminUser / AdminMemo / AuditLog** … 運営・メモ・監査ログ。

業務ルール（料金・日程ルール・キャンセル区分・警告制度）の数値とポリシー文言は
すべて `lib/constants.ts` に集約し、判定ロジックは `lib/scheduling.ts` に純粋関数として
切り出しています。

### 仕様 → 実装 対応の例

| 仕様 | 実装箇所 |
| --- | --- |
| 会員向け表示ステータスは2種（日程調整中/日程確定） | `MemberFacingPhaseBadge`, `memberFacingPhaseLabel` |
| 自動キャンセル（7日/48時間） | `shouldAutoDissolve()` |
| キャンセル区分と返金・違約金・警告 | `classifyCancellation()` / `resolveCancellationOutcome()` |
| 日程確定前の短い注意文／全文ポリシー | `CANCELLATION_NOTICE_SHORT` / `CANCELLATION_POLICY_FULL` |
| サロン会員・紹介特典の無料判定 | `isDateFeeWaived()` |
| 注意事項テンプレ | `dateNotesTemplate()` |

---

## スタブ（未実装・本番で差し替え）

- **Stripe 決済**：`lib/stripe.ts` は実 API を呼ばずダミー結果を返す。実キー設定で実決済に。
- **メール通知**：`lib/notifications.ts` はアプリ内通知のみ DB 保存し、メールは `console` 出力。
- **画像/書類アップロード**：URL は `pending-upload` のプレースホルダ。実ストレージ連携は別途。
- **自動キャンセル/更新決済/アンケート送信**：判定関数は実装済。定期実行（cron）は別途。

---

## GitHub Pages プレビュー（静的デモ）

GitHub Pages は静的配信のみのため、サーバー機能（ログイン・DB・決済）は動作しません。
プレビュー用に **seed データで各画面を事前生成した読み取り専用デモ** を
GitHub Actions で自動デプロイします。

- 公開URL: **https://playmark0227-svg.github.io/satukoi/**
- 見た目・画面遷移・デザインの確認用。フォーム送信やログインは動作しません。
- ローカルで静的デモを生成する場合:

```bash
npm run demo:build      # 静的エクスポート（out/ に出力）
npx serve out           # ローカル確認（任意）
```

設定はリポジトリ設定 → Pages の Source を「GitHub Actions」にすると有効になります。
詳細は `.github/workflows/deploy-pages.yml` を参照。

---

## 補足：Prisma 7 / ネットワーク制限環境

- Prisma 7 は Rust-free 構成のため、接続 URL は `prisma.config.ts`（マイグレーション用）と
  `PrismaClient` の adapter（実行時）で指定します（`schema.prisma` には書きません）。
- マイグレーション用の `schema-engine` バイナリは通常 `npm install` の postinstall で取得されます。
  取得できない制限環境では `PRISMA_SCHEMA_ENGINE_BINARY` で配置済みバイナリを指すことができます。
