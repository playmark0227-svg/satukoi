// ════════════════════════════════════════════════════════════════════
//  GitHub Pages 静的デモのビルドスクリプト
//
//  静的エクスポート(output:export)は Server Actions を許容しないため、
//  ビルド直前に「ソースを一時的に」次のとおり変換してからエクスポートし、
//  完了後に必ず元へ戻す（実アプリのソースは不変）。
//   1) app/**/actions.ts から "use server" を除去（=ただのモジュール化）
//   2) JSX の action={fn} / createMember={fn} を {undefined} に置換
//      （サーバー→クライアントへ関数を渡さない・フォームを無害化）
//   3) route handler(POST 等) は静的エクスポート不可のため一時削除
//   4) page は force-static（searchParams/cookies を空値化して静的生成可能に）
//  復元は「変更前の内容を記憶して書き戻す」方式。git に未コミットの編集が
//  あっても失われない（git checkout は使わない）。
// ════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOTS = ["app", "components"];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
// path -> { content, deleted } 変更前の状態を記憶して finally で書き戻す
const backups = new Map();
let stubbed = 0;
let patched = 0;
let forced = 0;
let removedRoutes = 0;

for (const f of files) {
  if (f.endsWith("actions.ts")) {
    const src = readFileSync(f, "utf8");
    const next = src.replace(/^\s*["']use server["'];?[ \t]*\r?\n/m, "");
    if (next !== src) {
      backups.set(f, { content: src, deleted: false });
      writeFileSync(f, next);
      stubbed++;
    }
  } else if (f.endsWith("route.ts")) {
    backups.set(f, { content: readFileSync(f, "utf8"), deleted: true });
    rmSync(f);
    removedRoutes++;
  } else if (f.endsWith(".tsx")) {
    const src = readFileSync(f, "utf8");
    let next = src.replace(/action=\{\w+\}/g, "action={undefined}");
    next = next.replace(/createMember=\{\w+\}/g, "createMember={undefined}");
    if (f.endsWith(`${"page"}.tsx`) && !/export const dynamic\b/.test(next)) {
      next += '\nexport const dynamic = "force-static";\n';
      forced++;
    }
    if (next !== src) {
      backups.set(f, { content: src, deleted: false });
      writeFileSync(f, next);
      patched++;
    }
  }
}
console.log(
  `[demo] "use server"除去:${stubbed} / action無害化:${patched} / force-static:${forced} / route削除:${removedRoutes}`
);

let code = 0;
try {
  const r = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    // DEMO_EXPORT: output:export / デモ認証、NEXT_PUBLIC_DEMO: クライアント側のログインUI非表示
    env: { ...process.env, DEMO_EXPORT: "1", NEXT_PUBLIC_DEMO: "1" },
  });
  code = r.status ?? 1;
  if (code === 0) {
    // GitHub Pages の Jekyll 処理を無効化（_next ディレクトリを配信させる）
    writeFileSync("out/.nojekyll", "");
    // ルート(/)を開いたら即ホーム（さがす一覧）へ。先方提案用にログイン画面を挟まない。
    // このページは Next の metadata を経由しないため、favicon/OG は手動で basePath 付き指定。
    const base = "/satukoi";
    const home = `${base}/users/`;
    const desc =
      "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」";
    const ogImage = `https://playmark0227-svg.github.io${base}/opengraph-image.png`;
    writeFileSync(
      "out/index.html",
      `<!doctype html><html lang="ja"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>サツコイ！（仮）</title>` +
        `<meta name="theme-color" content="#ee3f9b">` +
        `<meta name="description" content="${desc}">` +
        `<link rel="icon" href="${base}/favicon.ico" sizes="any">` +
        `<link rel="icon" type="image/png" href="${base}/icon.png">` +
        `<link rel="apple-touch-icon" href="${base}/apple-icon.png">` +
        `<link rel="manifest" href="${base}/manifest.webmanifest">` +
        `<meta property="og:type" content="website">` +
        `<meta property="og:title" content="サツコイ！（仮）">` +
        `<meta property="og:description" content="${desc}">` +
        `<meta property="og:image" content="${ogImage}">` +
        `<meta name="twitter:card" content="summary_large_image">` +
        `<meta name="twitter:image" content="${ogImage}">` +
        `<meta http-equiv="refresh" content="0; url=${home}">` +
        `<link rel="canonical" href="${home}">` +
        `<script>location.replace(${JSON.stringify(home)});</script>` +
        `</head>` +
        `<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:sans-serif;color:#1f2430;background:#f8f7fa">` +
        `<div style="text-align:center">` +
        `<img src="${base}/logo.png" width="72" height="72" alt="サツコイ" style="filter:drop-shadow(0 4px 12px rgba(219,39,119,.28))">` +
        `<p style="margin-top:12px;font-size:14px;color:#6b7280">ホームに移動します… <a href="${home}" style="color:#d31f80;font-weight:bold;text-decoration:none">こちら</a></p>` +
        `</div></body></html>\n`
    );
    console.log("[demo] out/.nojekyll とトップのホーム転送(index.html→/users)を作成しました");
  }
} finally {
  for (const [f, { content }] of backups) writeFileSync(f, content);
  console.log(`[demo] ソースを元に戻しました（${backups.size}ファイル）`);
}

process.exit(code);
