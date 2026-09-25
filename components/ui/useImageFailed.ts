"use client";

import { useCallback, useState } from "react";

/**
 * 画像の読み込み失敗を検知する。
 * 静的HTMLでは React のハイドレーション前に失敗して onError を取りこぼすため、
 * マウント時にも img.complete && naturalWidth === 0（=壊れた画像）を確認する。
 */
export function useImageFailed() {
  const [failed, setFailed] = useState(false);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const onError = useCallback(() => setFailed(true), []);
  return { failed, ref, onError };
}
