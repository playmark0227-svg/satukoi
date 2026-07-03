import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://playmark0227-svg.github.io"),
  title: {
    default: "サツコイ！（仮）",
    template: "%s｜サツコイ！（仮）",
  },
  description:
    "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」",
  applicationName: "サツコイ！（仮）",
  appleWebApp: {
    capable: true,
    title: "サツコイ！",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "サツコイ！（仮）",
    description:
      "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」",
    siteName: "サツコイ！（仮）",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "サツコイ！（仮）",
    description:
      "チャットなし、ちゃんと会える！札幌恋活マッチングサービス「サツコイ！（仮）」",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ec4899",
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
