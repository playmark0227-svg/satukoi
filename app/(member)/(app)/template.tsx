import { ViewTransition } from "react";

/**
 * 画面遷移ごとに再マウントされるページの枠。
 * ・進む（nav-forward）は右から、戻る（nav-back）は左からスライド
 * ・下タブの切り替え（nav-tab）はその場でふわっと切り替え
 * ・種類のない遷移（ブラウザの戻る等）は軽いフェード
 * View Transitions 非対応ブラウザでは .animate-page のフェードインだけが効く。
 */
const MAP = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-tab": "nav-tab",
  default: "nav-fade",
};

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={MAP} exit={MAP} default="none">
      <div className="animate-page flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
