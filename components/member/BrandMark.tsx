import Image from "next/image";
import { cn } from "@/lib/cn";
import logo from "@/public/logo.png";

/**
 * サービスロゴマーク（ハート＝ロケーションピン）。
 * className でサイズを指定する（例: h-8 w-8）。静的インポートのため basePath も自動解決。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="サツコイ"
      priority
      sizes="128px"
      className={cn("inline-block select-none object-contain", className)}
    />
  );
}
