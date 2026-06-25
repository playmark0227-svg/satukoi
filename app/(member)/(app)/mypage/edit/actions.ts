"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  BodyType,
  HolidayType,
  SmokingHabit,
  DrinkingHabit,
  ChildrenWish,
  Weekday,
} from "@prisma/client";

const WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * プロフィール編集：自己編集可能なフィールドのみ更新。
 * 編集不可項目（名前/生年月日/性別/居住地/年収帯/婚姻歴/子供有無）は受け取らない。
 */
export async function updateProfile(formData: FormData) {
  const me = await requireMember();

  const holidayType = String(formData.get("holidayType")) as HolidayType;
  const fixedHolidays =
    holidayType === "OTHER_FIXED"
      ? WEEKDAYS.filter((w) => formData.get(`fixedHoliday_${w}`) === "on")
      : [];

  const heightCm = Number(formData.get("heightCm"));

  const qualifications = String(formData.get("qualifications") ?? "").trim();
  const hobbies = String(formData.get("hobbies") ?? "").trim();
  const selfIntroduction = String(
    formData.get("selfIntroduction") ?? ""
  ).trim();

  await prisma.member.update({
    where: { id: me.id },
    data: {
      nickname: String(formData.get("nickname") ?? "").trim() || me.nickname,
      occupation: String(formData.get("occupation") ?? "").trim() || me.occupation,
      holidayType,
      fixedHolidays,
      heightCm: Number.isFinite(heightCm) && heightCm > 0 ? heightCm : me.heightCm,
      bodyType: String(formData.get("bodyType")) as BodyType,
      smoking: String(formData.get("smoking")) as SmokingHabit,
      drinking: String(formData.get("drinking")) as DrinkingHabit,
      childrenWish: String(formData.get("childrenWish")) as ChildrenWish,
      qualifications: qualifications || null,
      hobbies: hobbies || null,
      selfIntroduction: selfIntroduction || null,
    },
  });

  revalidatePath("/mypage");
  revalidatePath("/mypage/edit");
  redirect("/mypage");
}
