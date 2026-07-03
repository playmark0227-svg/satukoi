import Image from "next/image";
import { cn } from "@/lib/cn";
import logo from "@/public/logo.png";

/**
 * サービスロゴマーク（ピンク→パープルのハート型＝ロケーションピン＋スパークル）。
 * className でサイズを指定する（例: h-9 w-9）。静的インポートのため basePath も自動解決。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="サツコイ"
      priority
      sizes="128px"
      className={cn(
        "inline-block select-none object-contain drop-shadow-[0_3px_10px_rgba(219,39,119,0.28)] transition-transform duration-300 will-change-transform hover:scale-105",
        className
      )}
    />
  );
}
