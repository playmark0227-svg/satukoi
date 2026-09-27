# ════════════════════════════════════════════════════════════════════
#  サツコイ！ 本番サーバー（会員アプリ＋運営管理画面）
#  Cloud Run / Render / Fly.io など、Docker が動く環境ならどこでも可。
#  起動時に DB マイグレーション（prisma migrate deploy）を適用してから起動する。
#  必要な環境変数は docs/DEPLOY.md を参照。
# ════════════════════════════════════════════════════════════════════
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall の prisma generate は DATABASE_URL を参照するため、ビルド時はダミーを渡す
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm ci
COPY . .
# NEXT_PUBLIC_* はビルド時に埋め込まれるため build-arg で渡す
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LIFF_ID
ARG NEXT_PUBLIC_LINE_OA_ID
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/package.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
