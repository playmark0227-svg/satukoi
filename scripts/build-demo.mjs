// ════════════════════════════════════════════════════════════════════
//  GitHub Pages 静的デモのビルドスクリプト
//
//  静的エクスポート(output:export)は Server Actions を許容しないため、
//  ビルド直前に「ソースを一時的に」次のとおり変換してからエクスポートし、
//  完了後に git で必ず元へ戻す（実アプリのソースは不変）。
//   1) app/**/actions.ts から "use server" を除去（=ただのモジュール化）
//   2) JSX の action={fn} / createMember={fn} を {undefined} に置換
//      （サーバー→クライアントへ関数を渡さない・フォームを無害化）
//  デモは読み取り専用のため、フォーム送信が無効でも問題ない。
// ════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync, execSync } from "node:child_process";

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
let stubbed = 0;
let patched = 0;
let forced = 0;
let removedRoutes = 0;

for (const f of files) {
  if (f.endsWith("actions.ts")) {
    // 1) Server Actions を通常モジュール化（"use server" 除去）
    const src = readFileSync(f, "utf8");
    const next = src.replace(/^\s*["']use server["'];?[ \t]*\r?\n/m, "");
    if (next !== src) {
      writeFileSync(f, next);
      stubbed++;
    }
  } else if (f.endsWith("route.ts")) {
    // 2) ルートハンドラ(POST 等)は静的エクスポート不可のため除去（git で復元）
    rmSync(f);
    removedRoutes++;
  } else if (f.endsWith(".tsx")) {
    const src = readFileSync(f, "utf8");
    // 3) サーバー→クライアントへ関数を渡さない・フォームを無害化
    let next = src.replace(/action=\{\w+\}/g, "action={undefined}");
    next = next.replace(/createMember=\{\w+\}/g, "createMember={undefined}");
    // 4) ページは force-static（searchParams/cookies を空値化して静的生成可能に）
    if (f.endsWith(`${"page"}.tsx`) && !/export const dynamic\b/.test(next)) {
      next += '\nexport const dynamic = "force-static";\n';
      forced++;
    }
    if (next !== src) {
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
    env: { ...process.env, DEMO_EXPORT: "1" },
  });
  code = r.status ?? 1;
  if (code === 0) {
    // GitHub Pages の Jekyll 処理を無効化（_next ディレクトリを配信させる）
    writeFileSync("out/.nojekyll", "");
    console.log("[demo] out/.nojekyll を作成しました");
  }
} finally {
  try {
    execSync(`git checkout -- ${ROOTS.join(" ")}`, { stdio: "inherit" });
    console.log("[demo] ソースを元に戻しました");
  } catch (e) {
    console.error("[demo] ソース復元に失敗:", e.message);
  }
}

process.exit(code);
