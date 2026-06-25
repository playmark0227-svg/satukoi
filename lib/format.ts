import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

/** 生年月日から年齢を自動算出 */
export function calcAge(birthDate: Date | string): number {
  const b = dayjs(birthDate);
  return dayjs().diff(b, "year");
}

/** 円表記（例：11,000円） */
export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

export function formatDate(d: Date | string): string {
  return dayjs(d).format("YYYY/M/D");
}

export function formatDateWithDow(d: Date | string): string {
  return dayjs(d).format("YYYY/M/D（ddd）");
}

export function formatDateTime(d: Date | string): string {
  return dayjs(d).format("YYYY/M/D（ddd）HH:mm");
}

export function formatTime(d: Date | string): string {
  return dayjs(d).format("HH:mm");
}

/** 開始・終了の時刻レンジ（例：2/5（水）19:00〜20:00） */
export function formatSlot(start: Date | string, end: Date | string): string {
  return `${dayjs(start).format("M/D（ddd）HH:mm")}〜${dayjs(end).format("HH:mm")}`;
}

export function fromNow(d: Date | string): string {
  return dayjs(d).format("M/D HH:mm");
}
