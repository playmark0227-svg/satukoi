import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サツコイ！（仮）",
  description:
    "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f8617e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
