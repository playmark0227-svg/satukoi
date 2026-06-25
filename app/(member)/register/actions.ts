"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createMemberSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type {
  Sex,
  ResidenceArea,
  EligibilityType,
  IncomeBracket,
  HolidayType,
  Weekday,
  BodyType,
  SmokingHabit,
  DrinkingHabit,
  ChildrenWish,
} from "@prisma/client";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableStr(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v === "" ? null : v;
}

/** 会員登録の一括作成。各ステップの入力を1フォームで受け取り、Member を新規作成する。 */
export async function createMember(formData: FormData) {
  const email = str(formData, "email");
  const password = str(formData, "password");

  const passwordHash = await hashPassword(password);

  // 固定曜日（OTHER_FIXED のときのみ複数選択）
  const fixedHolidays = formData
    .getAll("fixedHolidays")
    .map((v) => String(v))
    .filter((v) => v !== "") as Weekday[];

  const referralCodeInput = str(formData, "referralCode");

  const member = await prisma.member.create({
    data: {
      email,
      passwordHash,
      status: "DOCUMENT_REVIEW",
      fullName: str(formData, "fullName"),
      nickname: str(formData, "nickname"),
      birthDate: new Date(str(formData, "birthDate")),
      sex: str(formData, "sex") as Sex,
      residenceArea: str(formData, "residenceArea") as ResidenceArea,
      eligibilityType: str(formData, "eligibilityType") as EligibilityType,
      occupation: str(formData, "occupation"),
      incomeBracket: str(formData, "incomeBracket") as IncomeBracket,
      holidayType: str(formData, "holidayType") as HolidayType,
      fixedHolidays,
      hasMarriageHistory: str(formData, "hasMarriageHistory") === "true",
      hasChildren: str(formData, "hasChildren") === "true",
      childrenWish: str(formData, "childrenWish") as ChildrenWish,
      heightCm: Number(str(formData, "heightCm")) || 0,
      bodyType: str(formData, "bodyType") as BodyType,
      smoking: str(formData, "smoking") as SmokingHabit,
      drinking: str(formData, "drinking") as DrinkingHabit,
      qualifications: nullableStr(formData, "qualifications"),
      hobbies: nullableStr(formData, "hobbies"),
      selfIntroduction: nullableStr(formData, "selfIntroduction"),
    },
  });

  // 会員自身の紹介コードを発行
  await prisma.referralCode.create({
    data: {
      code: randomUUID().slice(0, 8).toUpperCase(),
      sourceType: "MEMBER",
      memberId: member.id,
    },
  });

  // 書類（アップロードはスタブ。url="pending-upload" で確認待ち登録）
  await prisma.document.createMany({
    data: [
      { memberId: member.id, type: "ID_DOCUMENT", url: "pending-upload" },
      { memberId: member.id, type: "SINGLE_CERT", url: "pending-upload" },
      { memberId: member.id, type: "INCOME_CERT", url: "pending-upload" },
    ],
  });

  // 顔写真（ダミー。1枚目が一覧表示に使用される）
  await prisma.photo.createMany({
    data: [
      { memberId: member.id, url: "pending-upload", order: 0 },
      { memberId: member.id, url: "pending-upload", order: 1 },
    ],
  });

  // 紹介コードの入力があれば Referral を作成
  if (referralCodeInput) {
    const code = await prisma.referralCode.findUnique({
      where: { code: referralCodeInput },
    });
    if (code && code.isActive) {
      await prisma.referral.create({
        data: {
          codeId: code.id,
          referrerId: code.memberId,
          referredId: member.id,
          status: "PENDING",
        },
      });
    }
  }

  await createMemberSession(member.id);
  redirect("/register/complete");
}
