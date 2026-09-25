import dayjsBase from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/ja";

dayjsBase.extend(utc);
dayjsBase.extend(timezone);
dayjsBase.locale("ja");

/** 表示は常に日本時間。サーバー（UTC 等）や閲覧端末のタイムゾーンに左右されない。 */
export const APP_TIME_ZONE = "Asia/Tokyo";
const dayjs = (d?: Date | string) => dayjsBase(d).tz(APP_TIME_ZONE);

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
