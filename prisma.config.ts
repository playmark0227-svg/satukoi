import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 は prisma.config.ts を使う場合 .env を自動読込しないため、
// Node 組み込みの loadEnvFile で明示的に読み込む（本番では環境変数が
// 直接設定されている想定なので失敗は無視）。
try {
  process.loadEnvFile();
} catch {
  // .env が無い環境（CI / 本番）は環境変数が直接設定されている前提
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
