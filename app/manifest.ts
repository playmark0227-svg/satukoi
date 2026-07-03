import type { MetadataRoute } from "next";

// 静的エクスポート（output:export）でも生成できるよう固定化する。
export const dynamic = "force-static";

// デモ（GitHub Pages）は /satukoi 配下で配信されるため、
// manifest 内の URL には手動で basePath を付与する（Next はマニフェスト本文の
// src を書き換えないため）。通常ビルドでは空文字。
const base = process.env.DEMO_EXPORT === "1" ? "/satukoi" : "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "サツコイ！（仮）",
    short_name: "サツコイ！",
    description:
      "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」",
    start_url: `${base}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ec4899",
    icons: [
      {
        src: `${base}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
