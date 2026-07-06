/**
 * 相性スコア（デモ用の擬似スコア）。
 *
 * 2つの会員IDから決定的に 78〜98% の整数スコアを算出する。
 * IDの順序に依存しない（compatScore(a, b) === compatScore(b, a)）ため、
 * どちらの会員から見ても同じ相性が表示される。
 *
 * 本実装では、成婚データ・デート成立/リピート等の行動ログを学習した
 * 協調フィルタリング／埋め込みベースの推薦モデル（プロフィール属性・
 * 希望条件の類似度を組み合わせたスコアリング）に置換する想定。
 */
export function compatScore(idA: string, idB: string): number {
  // 順序非依存：辞書順に並べてから連結し、同一ペアは常に同じ入力になるようにする
  const key = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;

  // FNV-1a 32bit ハッシュ（決定的・依存なし）
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // 78〜98 の21段階へ写像
  return 78 + ((hash >>> 0) % 21);
}
