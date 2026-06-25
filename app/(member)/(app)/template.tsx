/** 画面遷移ごとに再マウントされ、各ページをふわっとフェードイン表示する。 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page flex flex-1 flex-col">{children}</div>;
}
