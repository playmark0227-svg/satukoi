import { AppHeader } from "@/components/member/AppHeader";
import { infoBackHref } from "./back-href";
import { HistoryBack } from "./HistoryBack";

/**
 * 規約・運営会社などの公開ページのヘッダー。
 * 「戻る」はサイト内から来たときは前のページへ（HistoryBack）、直接開いたときは infoBackHref() の行き先へ。
 */
export async function InfoHeader({ title }: { title: string }) {
  const backHref = await infoBackHref();
  return (
    <HistoryBack>
      <AppHeader title={title} backHref={backHref} />
    </HistoryBack>
  );
}
