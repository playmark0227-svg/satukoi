// サツコイ！ サンプルデータ投入スクリプト（tsx 実行）
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  // CI / 本番は環境変数が直接設定されている前提
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const hash = (s: string) => bcrypt.hashSync(s, 10);
const yearsAgo = (n: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
};
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

async function clean() {
  // 子→親の順で全削除（再実行可能に）
  await prisma.auditLog.deleteMany();
  await prisma.adminMemo.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.warning.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.scheduleCandidate.deleteMany();
  await prisma.scheduleProposal.deleteMany();
  await prisma.dateEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.dateApplication.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.member.deleteMany();
  await prisma.store.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.adminUser.deleteMany();
}

const AREAS = [
  "SAPPORO",
  "EBETSU",
  "KITAHIROSHIMA",
  "ENIWA",
  "OTARU",
  "ISHIKARI",
] as const;
const INCOME = ["UNDER_399", "B400_599", "B600_799", "B800_999", "OVER_1000"] as const;
const BODY = ["SLIM", "AVERAGE", "CHUBBY", "MUSCULAR", "PLUMP"] as const;

const MALE_NAMES = [
  ["佐藤 大輔", "だいすけ"],
  ["鈴木 健太", "けんた"],
  ["高橋 翔", "しょう"],
  ["田中 涼", "りょう"],
  ["伊藤 拓也", "たくや"],
  ["渡辺 修平", "しゅう"],
];
const FEMALE_NAMES = [
  ["山本 美咲", "みさき"],
  ["中村 葵", "あおい"],
  ["小林 結衣", "ゆい"],
  ["加藤 七海", "ななみ"],
  ["吉田 真央", "まお"],
  ["山田 彩花", "あやか"],
];
const OCCUPATIONS = ["会社員", "公務員", "看護師", "美容師", "ITエンジニア", "教員"];
const HOBBIES = ["カフェ巡り", "映画鑑賞", "ドライブ", "ランニング", "料理", "スノーボード"];

async function createMember(args: {
  i: number;
  sex: "MALE" | "FEMALE";
  name: [string, string];
  accountType?: "NORMAL" | "SALON";
}) {
  const { i, sex, name } = args;
  return prisma.member.create({
    data: {
      email: `${sex.toLowerCase()}${i}@satukoi.local`,
      passwordHash: hash("password"),
      accountType: args.accountType ?? "NORMAL",
      status: "ACTIVE",
      approvedAt: daysFromNow(-30),
      cardRegistered: true,
      stripeCustomerId: `cus_stub_${sex}${i}`,
      fullName: name[0],
      nickname: name[1],
      birthDate: yearsAgo(26 + i * 2),
      sex,
      residenceArea: AREAS[i % AREAS.length],
      eligibilityType: i % 3 === 0 ? "WORKER" : "RESIDENT",
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
      incomeBracket: INCOME[i % INCOME.length],
      incomeCertVerified: i % 2 === 0,
      holidayType: i % 3 === 0 ? "SHIFT" : "WEEKENDS_HOLIDAYS",
      hasMarriageHistory: i % 4 === 0,
      hasChildren: false,
      childrenWish: i % 3 === 0 ? "EITHER" : "WANT",
      heightCm: sex === "MALE" ? 168 + i : 154 + i,
      bodyType: BODY[i % BODY.length],
      smoking: i % 3 === 0 ? "SMOKER" : "NON_SMOKER",
      drinking: i % 2 === 0 ? "SOCIAL" : "DRINKER",
      qualifications: i % 2 === 0 ? "普通自動車免許" : null,
      hobbies: HOBBIES[i % HOBBIES.length],
      selfIntroduction:
        "はじめまして。札幌在住です。休日はカフェ巡りが好きです。よろしくお願いします。",
      referralBonusRemaining: i === 1 ? 1 : 0,
      nextRenewalAt: daysFromNow(335),
      documents: {
        create: [
          { type: "ID_DOCUMENT", url: "pending-upload", checkStatus: "OK", checkedAt: daysFromNow(-29) },
          { type: "SINGLE_CERT", url: "pending-upload", checkStatus: "OK", checkedAt: daysFromNow(-29) },
        ],
      },
    },
  });
}

async function main() {
  await clean();

  // 運営アカウント
  await prisma.adminUser.create({
    data: {
      email: "admin@satukoi.local",
      passwordHash: hash("password"),
      name: "運営 太郎",
      role: "OWNER",
    },
  });

  // 店舗（札幌中心部・5店舗）
  const storeData = [
    ["カフェ・ノルテ 大通", "札幌市中央区大通西3丁目", "札幌中心部"],
    ["コーヒースタンド すすきの", "札幌市中央区南4条西4丁目", "札幌中心部"],
    ["ラウンジ 円山", "札幌市中央区南1条西24丁目", "円山"],
    ["カフェ 札幌駅前", "札幌市北区北6条西4丁目", "札幌駅前"],
    ["ティールーム 狸小路", "札幌市中央区南2条西5丁目", "狸小路"],
  ];
  const stores = [];
  for (const [name, address, area] of storeData) {
    stores.push(
      await prisma.store.create({ data: { name, address, area, isActive: true } })
    );
  }

  // 会員
  const males = [];
  const females = [];
  for (let i = 0; i < MALE_NAMES.length; i++) {
    males.push(
      await createMember({
        i,
        sex: "MALE",
        name: MALE_NAMES[i] as [string, string],
        accountType: i === 0 ? "SALON" : "NORMAL",
      })
    );
  }
  for (let i = 0; i < FEMALE_NAMES.length; i++) {
    females.push(
      await createMember({
        i,
        sex: "FEMALE",
        name: FEMALE_NAMES[i] as [string, string],
      })
    );
  }

  // 紹介コード（各会員に1つ）
  for (const m of [...males, ...females]) {
    await prisma.referralCode.create({
      data: {
        code: m.id.slice(-8).toUpperCase(),
        sourceType: "MEMBER",
        memberId: m.id,
      },
    });
  }

  // 1人を書類確認中（承認待ち）に
  const pending = await createMember({
    i: 9,
    sex: "MALE",
    name: ["承認 待男", "まちお"],
  });
  await prisma.member.update({
    where: { id: pending.id },
    data: { status: "DOCUMENT_REVIEW", approvedAt: null },
  });
  await prisma.document.updateMany({
    where: { memberId: pending.id },
    data: { checkStatus: "PENDING", checkedAt: null },
  });

  // ── マッチ①：日程調整中（申受側が候補提示済） ──
  const app1 = await prisma.dateApplication.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[0].id,
      status: "ACCEPTED",
      respondedAt: daysFromNow(-3),
    },
  });
  const match1 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[0].id,
      applicationId: app1.id,
      phase: "SCHEDULING",
      matchedAt: daysFromNow(-3),
      lastActionAt: daysFromNow(-1),
    },
  });
  await prisma.scheduleProposal.create({
    data: {
      matchId: match1.id,
      proposedById: females[0].id,
      round: 1,
      candidates: {
        create: [
          { startAt: daysFromNow(5), endAt: hoursFromNow(24 * 5 + 1) },
          { startAt: daysFromNow(7), endAt: hoursFromNow(24 * 7 + 1) },
          { startAt: daysFromNow(9), endAt: hoursFromNow(24 * 9 + 1) },
        ],
      },
    },
  });
  await prisma.notification.create({
    data: {
      memberId: males[1].id,
      type: "CANDIDATE_RECEIVED",
      title: "デート日程候補が届きました",
      body: `${females[0].nickname}さんから日程候補が3件届いています。`,
      matchId: match1.id,
      emailSentAt: daysFromNow(-1),
    },
  });

  // ── マッチ②：日程確定（店舗確定・両者決済済） ──
  const app2 = await prisma.dateApplication.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[1].id,
      status: "ACCEPTED",
      respondedAt: daysFromNow(-6),
    },
  });
  const match2 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[1].id,
      applicationId: app2.id,
      phase: "CONFIRMED",
      matchedAt: daysFromNow(-6),
      lastActionAt: daysFromNow(-2),
    },
  });
  const prop2 = await prisma.scheduleProposal.create({
    data: { matchId: match2.id, proposedById: females[1].id, round: 1 },
  });
  await prisma.scheduleCandidate.create({
    data: {
      proposalId: prop2.id,
      startAt: daysFromNow(3),
      endAt: hoursFromNow(24 * 3 + 1),
      isSelected: true,
      selectedById: males[1].id,
      selectedAt: daysFromNow(-2),
    },
  });
  await prisma.dateEvent.create({
    data: {
      matchId: match2.id,
      startAt: daysFromNow(3),
      endAt: hoursFromNow(24 * 3 + 1),
      status: "SCHEDULED",
      storeId: stores[0].id,
      storeConfirmedAt: daysFromNow(-2),
      reservationName: "サツコイ！",
      notesTemplate:
        "サツコイ！（仮）で予約しています。\nお席での待ち合わせでお願い致します。\nデート時間は60分を目安にお願い致します。\nデート代金は割り勘がルールです。",
    },
  });
  for (const m of [males[1], females[1]]) {
    await prisma.payment.create({
      data: {
        memberId: m.id,
        matchId: match2.id,
        purpose: "DATE_FEE",
        amount: 5500,
        status: "SUCCEEDED",
        stripePaymentIntentId: "pi_stub_5500",
      },
    });
    await prisma.notification.create({
      data: {
        memberId: m.id,
        type: "DATE_CONFIRMED",
        title: "デート日程が確定しました",
        body: "店舗情報をアプリでご確認ください。",
        matchId: match2.id,
        emailSentAt: daysFromNow(-2),
      },
    });
  }

  // ── マッチ③：デート実施済（アンケート回答済） ──
  const match3 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[1].id,
      phase: "COMPLETED",
      matchedAt: daysFromNow(-20),
      lastActionAt: daysFromNow(-10),
    },
  });
  await prisma.dateEvent.create({
    data: {
      matchId: match3.id,
      startAt: daysFromNow(-10),
      endAt: hoursFromNow(-24 * 10 + 1),
      status: "COMPLETED",
      storeId: stores[1].id,
      storeConfirmedAt: daysFromNow(-12),
      reservationName: "サツコイ！",
    },
  });
  await prisma.surveyResponse.create({
    data: {
      matchId: match3.id,
      memberId: males[1].id,
      q1Implementation: "AS_PLANNED",
      q2Satisfaction: "SATISFIED",
      q3Impression: "とても話しやすい方でした。",
      q4Intent: "WANT_AGAIN",
      submittedAt: daysFromNow(-9),
      sentAt: daysFromNow(-10),
      dueAt: daysFromNow(-9),
    },
  });

  // 通報・お問い合わせ
  await prisma.report.create({
    data: {
      reporterId: females[1].id,
      reportedId: males[4].id,
      type: "INAPPROPRIATE_CONTENT",
      content: "プロフィール写真が本人と異なる可能性があります。",
      status: "OPEN",
    },
  });
  await prisma.inquiry.create({
    data: {
      memberId: females[4].id,
      email: females[4].email,
      subject: "領収書の発行について",
      body: "登録料の領収書を発行いただけますか？",
      status: "OPEN",
    },
  });

  // お知らせ
  await prisma.announcement.create({
    data: {
      title: "サービス開始のお知らせ",
      body: "サツコイ！（仮）をご利用いただきありがとうございます。",
      target: "ALL",
      isPublished: true,
      publishedAt: daysFromNow(-30),
    },
  });
  await prisma.announcement.create({
    data: {
      title: "女性会員さま向けキャンペーン",
      body: "ご紹介で次回デート代が無料になります。",
      target: "FEMALE",
      isPublished: false,
    },
  });

  // 広告
  await prisma.ad.create({
    data: {
      title: "札幌のおすすめカフェ特集",
      imageUrl: "https://placehold.co/600x160?text=Satukoi+Ad",
      linkUrl: "https://example.com",
      type: "OWN",
      position: "TOP_BOTTOM",
      isEnabled: true,
      sortOrder: 0,
    },
  });
  await prisma.ad.create({
    data: {
      title: "結婚相談所スポンサー",
      imageUrl: "https://placehold.co/600x120?text=Sponsor",
      linkUrl: "https://example.com",
      type: "SPONSOR",
      position: "MYPAGE",
      isEnabled: true,
      sortOrder: 0,
    },
  });

  const counts = {
    members: await prisma.member.count(),
    matches: await prisma.match.count(),
    stores: await prisma.store.count(),
  };
  console.log("Seed 完了:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
