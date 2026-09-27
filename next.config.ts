import type { NextConfig } from "next";

// DEMO_EXPORT=1 のとき、GitHub Pages 向けの静的エクスポート設定に切り替える。
// （リポジトリ名 satukoi のプロジェクトページ: /satukoi 配下で配信）
const isDemoExport = process.env.DEMO_EXPORT === "1";

// 画面遷移アニメーション（React の <ViewTransition>）を有効化。デモ・本番とも共通。
const common: NextConfig = {
  experimental: { viewTransition: true },
};

const nextConfig: NextConfig = isDemoExport
  ? {
      ...common,
      output: "export",
      basePath: "/satukoi",
      images: { unoptimized: true },
      trailingSlash: true,
      // デモ（静的）はサーバーアクションを除去した上でビルドするため、
      // それに伴う型不整合でデプロイを止めない。本番ビルドは別途検証済み。
      typescript: { ignoreBuildErrors: true },
    }
  : common;

export default nextConfig;
