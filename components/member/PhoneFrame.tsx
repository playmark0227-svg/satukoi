/** スマホ専用フレーム。PC では中央のプレビュー枠として表示。 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-canvas">
      <div className="phone-frame flex flex-col">{children}</div>
    </div>
  );
}
