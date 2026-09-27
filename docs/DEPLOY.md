# 本番サーバーのデプロイ（会員アプリ＋運営管理画面）

GitHub Pages のデモ（`https://playmark0227-svg.github.io/satukoi/`）は **静的な見本** です。
ボタンを押しても保存されず、運営管理画面（`/admin`）も閲覧のみです。
実際に会員登録・申込み・承認・LINE 通知などを動かすには、このアプリを **サーバー＋データベース** に
デプロイします。会員アプリと運営管理画面は同じアプリなので、1回のデプロイで両方が動きます
（運営管理画面は `https://<ドメイン>/admin`）。

カスタムドメインは購入を保留中のため、当面はサービスが発行する URL（例: `https://satukoi-xxxx.a.run.app`）を使います。

---

## 必要なもの

| 項目 | 内容 |
| --- | --- |
| サーバー | Docker が動く環境（推奨: Google Cloud Run。Render・Fly.io でも可） |
| データベース | PostgreSQL 16（推奨: Cloud SQL。Neon・Supabase でも可） |
| LINE | LINE ログインチャネル（LIFF）＋ Messaging API チャネル（公式アカウント） |

## 環境変数

| 変数 | 用途 | 例 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://user:pass@host:5432/satukoi` |
| `AUTH_SECRET` | セッション署名鍵（32文字以上のランダム値） | `openssl rand -base64 48` で生成 |
| `NEXT_PUBLIC_APP_URL` | アプリの URL（ビルド時） | `https://satukoi-xxxx.a.run.app` |
| `NEXT_PUBLIC_LIFF_ID` | LIFF アプリ ID（ビルド時） | `1234567890-AbCdEfGh` |
| `LINE_LOGIN_CHANNEL_ID` | LIFF を作った LINE ログインチャネルの ID | `1234567890` |
| `NEXT_PUBLIC_LINE_OA_ID` | 公式アカウントのベーシック ID（友だち追加ボタン用・ビルド時） | `@123abcde` |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | Messaging API のチャネルアクセストークン（長期） | |
| `LINE_MESSAGING_CHANNEL_SECRET` | Messaging API のチャネルシークレット（Webhook 署名検証） | |
| `STRIPE_*` | 決済（本実装時） | |

`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、Docker の `--build-arg` で渡します。

## 手順（Cloud Run の例）

1. **DB を用意**：Cloud SQL で PostgreSQL 16 を作成し、`DATABASE_URL` を控える。
2. **イメージを作ってデプロイ**
   ```bash
   gcloud run deploy satukoi --source . --region asia-northeast1 --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-secrets DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest
   ```
   コンテナは起動時に `prisma migrate deploy` を実行し、テーブルを最新にしてから起動します。
   GitHub から自動で出す場合は `.github/workflows/deploy-server.yml`（手動実行）を使います。
3. **運営アカウントを作成**（手元から本番 DB に対して1回だけ）
   ```bash
   DATABASE_URL="<本番の接続文字列>" npm run admin:create -- admin@example.com '<8文字以上のパスワード>' 運営
   ```
   デモ用のサンプルデータが必要なら `npm run db:seed`（**本番では実行しない**。全データを消して入れ直します）。
4. **動作確認**：`https://<URL>/api/health` が `{"ok":true,"db":"up"}` を返すこと、
   `https://<URL>/admin/login` から手順3のアカウントでログインできることを確認。
5. **LINE の設定**
   - LIFF のエンドポイント URL を `https://<URL>/` に設定（Scope: `openid` `profile`）。
   - LINE ログインチャネルの「リンクされた LINE 公式アカウント」に公式アカウントを設定し、
     友だち追加オプションを「On (Aggressive)」にすると、LINE ログイン時に友だち追加も案内されます。
   - Messaging API の Webhook URL を `https://<URL>/api/line/webhook` に設定し「Webhook の利用」を ON。
     応答メッセージ（自動応答）は OFF（アプリ側で返信します）。
6. **LINE 通知の配信量**：運営管理画面「LINE通知設定」で、イベント別の ON/OFF と月間上限を設定します。
