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
/**
 * 日本時間で「今日から days 日後の h:m」。デモの時刻を 19:00 などキリのよい値にそろえる
 * （実行時刻に依存した 16:12 のような半端な時刻を出さない）。
 */
const jstAt = (days: number, h: number, m = 0) => {
  const d = new Date(Date.now() + 9 * 3_600_000); // 日本時間の壁時計
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(h, m, 0, 0);
  return new Date(d.getTime() - 9 * 3_600_000);
};

// デモ用のポートレート画像（性別ごと・安定URL）。実運用ではアップロード画像に差し替え。
const portrait = (sex: "MALE" | "FEMALE", i: number) =>
  `https://randomuser.me/api/portraits/${sex === "FEMALE" ? "women" : "men"}/${
    (i * 9 + 11) % 99
  }.jpg`;

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
  await prisma.giftTicket.deleteMany();
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
// ログイン用メールアドレス（ニックネームのローマ字 @example.com）
const ROMAJI: Record<string, string> = {
  だいすけ: "daisuke", けんた: "kenta", しょう: "sho", りょう: "ryo", たくや: "takuya", しゅう: "shu",
  みさき: "misaki", あおい: "aoi", ゆい: "yui", ななみ: "nanami", まお: "mao", あやか: "ayaka",
  まちお: "machio",
};
// 登録日の固定（デモの申込・マッチより前に登録している必要がある会員）
const JOINED_DAYS_AGO: Record<string, number> = { けんた: 40, まお: 35 };
const OCCUPATIONS = ["会社員", "公務員", "看護師", "美容師", "ITエンジニア", "教員"];
const HOBBIES = ["カフェ巡り", "映画鑑賞", "ドライブ", "ランニング", "料理", "スノーボード"];

async function createMember(args: {
  i: number;
  sex: "MALE" | "FEMALE";
  name: [string, string];
  accountType?: "NORMAL" | "SALON";
  /** 何日前に登録したか（登録→翌日に書類確認→翌々日に承認、の順で日付を作る） */
  joinedDaysAgo?: number;
}) {
  const { i, sex, name } = args;
  const joined =
    args.joinedDaysAgo ?? JOINED_DAYS_AGO[name[1]] ?? 4 + ((i * 11 + (sex === "FEMALE" ? 5 : 0)) % 45);
  const createdAt = jstAt(-joined, 10 + (i % 11), (i % 4) * 15);
  const checkedAt = jstAt(-joined + 1, 15, 30);
  return prisma.member.create({
    data: {
      email: `${ROMAJI[name[1]] ?? `${sex.toLowerCase()}${i}`}@example.com`,
      passwordHash: hash("password"),
      accountType: args.accountType ?? "NORMAL",
      status: "ACTIVE",
      createdAt,
      approvedAt: jstAt(-joined + 2, 11, 0),
      cardRegistered: true,
      stripeCustomerId: `cus_stub_${sex}${i}`,
      lineConnected: i % 2 === 1, // デモ会員（けんた=男性i=1）はLINE連携済み
      notifyViaLine: true,
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
      nextRenewalAt: new Date(createdAt.getTime() + 365 * 86_400_000),
      photos: {
        create: [{ url: portrait(sex, i), order: 0 }],
      },
      documents: {
        create: [
          { type: "ID_DOCUMENT", url: "pending-upload", checkStatus: "OK", checkedAt },
          { type: "SINGLE_CERT", url: "pending-upload", checkStatus: "OK", checkedAt },
          // 男性は源泉徴収票等の所得証明が必須
          ...(sex === "MALE"
            ? [{ type: "INCOME_CERT" as const, url: "pending-upload", checkStatus: "OK" as const, checkedAt }]
            : []),
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

  // 登録料（一般会員のみ。サロン会員＝結婚相談所会員は無料）
  for (const m of [...males, ...females]) {
    if (m.accountType !== "NORMAL") continue;
    await prisma.payment.create({
      data: {
        memberId: m.id,
        purpose: "REGISTRATION",
        amount: 11000,
        status: "SUCCEEDED",
        stripePaymentIntentId: `pi_stub_reg_${m.id.slice(-6)}`,
        createdAt: m.createdAt,
      },
    });
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

  // 提携店ギフト券（デモ会員けんた＝males[1]に発行例）
  await prisma.giftTicket.create({
    data: {
      memberId: males[1].id,
      code: "SATSU-GIFT-2001",
      amount: 5000,
      reason: "REFERRAL",
      status: "ACTIVE",
      note: "お友達紹介の報酬",
      issuedAt: jstAt(-6, 10, 0),
      expiresAt: jstAt(174, 23, 59),
    },
  });
  await prisma.giftTicket.create({
    data: {
      memberId: males[1].id,
      code: "SATSU-GIFT-1001",
      amount: 5000,
      reason: "CAMPAIGN",
      status: "USED",
      note: "リリース記念キャンペーン",
      issuedAt: jstAt(-25, 10, 0),
      usedAt: jstAt(-10, 14, 5),
    },
  });

  // 1人を書類確認中（承認待ち）に
  const pending = await createMember({
    i: 9,
    sex: "MALE",
    name: ["承認 待男", "まちお"],
    joinedDaysAgo: 1,
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
      message: "はじめまして。カフェ巡りがお好きと拝見して、ぜひお話ししてみたいです。",
      createdAt: jstAt(-5, 21, 10),
      respondedAt: jstAt(-4, 12, 30),
    },
  });
  const match1 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[0].id,
      applicationId: app1.id,
      phase: "SCHEDULING",
      matchedAt: jstAt(-4, 12, 30),
      lastActionAt: jstAt(-1, 20, 5),
    },
  });
  await prisma.scheduleProposal.create({
    data: {
      matchId: match1.id,
      proposedById: females[0].id,
      round: 1,
      createdAt: jstAt(-1, 20, 5),
      candidates: {
        create: [
          { startAt: jstAt(5, 19, 0), endAt: jstAt(5, 20, 0) },
          { startAt: jstAt(7, 19, 30), endAt: jstAt(7, 20, 30) },
          { startAt: jstAt(9, 14, 0), endAt: jstAt(9, 15, 0) },
        ],
      },
    },
  });
  await prisma.notification.create({
    data: {
      memberId: males[1].id,
      type: "MATCHED",
      title: "マッチングが成立しました",
      body: `${females[0].nickname}さんがお申込みを承諾しました。日程候補が届くまでお待ちください。`,
      matchId: match1.id,
      emailSentAt: jstAt(-4, 12, 30),
      readAt: jstAt(-4, 12, 45),
      createdAt: jstAt(-4, 12, 30),
    },
  });
  await prisma.notification.create({
    data: {
      memberId: males[1].id,
      type: "CANDIDATE_RECEIVED",
      title: "デート日程候補が届きました",
      body: `${females[0].nickname}さんから日程候補が3件届いています。`,
      matchId: match1.id,
      emailSentAt: jstAt(-1, 20, 5),
      createdAt: jstAt(-1, 20, 5),
    },
  });

  // ── マッチ②：日程確定（店舗確定・両者決済済） ──
  const app2 = await prisma.dateApplication.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[1].id,
      status: "ACCEPTED",
      message: "映画がお好きなんですね。おすすめの作品などお話しできたらうれしいです。",
      createdAt: jstAt(-8, 22, 40),
      respondedAt: jstAt(-7, 9, 10),
    },
  });
  const match2 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[1].id,
      applicationId: app2.id,
      phase: "CONFIRMED",
      matchedAt: jstAt(-7, 9, 10),
      lastActionAt: jstAt(-2, 21, 30),
    },
  });
  const prop2 = await prisma.scheduleProposal.create({
    data: { matchId: match2.id, proposedById: females[1].id, round: 1, createdAt: jstAt(-6, 19, 0) },
  });
  await prisma.scheduleCandidate.create({
    data: {
      proposalId: prop2.id,
      startAt: jstAt(3, 14, 0),
      endAt: jstAt(3, 15, 0),
      isSelected: true,
      selectedById: males[1].id,
      selectedAt: jstAt(-2, 21, 30),
    },
  });
  await prisma.dateEvent.create({
    data: {
      matchId: match2.id,
      startAt: jstAt(3, 14, 0),
      endAt: jstAt(3, 15, 0),
      status: "SCHEDULED",
      confirmedAt: jstAt(-2, 21, 30),
      storeId: stores[0].id,
      storeConfirmedAt: jstAt(-2, 21, 30),
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
        createdAt: jstAt(-2, 21, 30),
      },
    });
    await prisma.notification.create({
      data: {
        memberId: m.id,
        type: "DATE_CONFIRMED",
        title: "デート日程が確定しました",
        body: "お店の情報と当日の注意事項をアプリでご確認ください。",
        matchId: match2.id,
        emailSentAt: jstAt(-2, 21, 31),
        readAt: jstAt(-2, 21, 40),
        createdAt: jstAt(-2, 21, 31),
      },
    });
  }

  // ── マッチ③：デート実施済（アンケート回答済） ──
  const app3 = await prisma.dateApplication.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[4].id,
      status: "ACCEPTED",
      createdAt: jstAt(-24, 20, 0),
      respondedAt: jstAt(-23, 12, 0),
    },
  });
  const match3 = await prisma.match.create({
    data: {
      applicantId: males[1].id,
      receiverId: females[4].id,
      applicationId: app3.id,
      phase: "COMPLETED",
      matchedAt: jstAt(-23, 12, 0),
      lastActionAt: jstAt(-10, 21, 0),
    },
  });
  await prisma.dateEvent.create({
    data: {
      matchId: match3.id,
      startAt: jstAt(-10, 14, 0),
      endAt: jstAt(-10, 15, 0),
      status: "COMPLETED",
      confirmedAt: jstAt(-14, 18, 0),
      storeId: stores[1].id,
      storeConfirmedAt: jstAt(-14, 18, 0),
      reservationName: "サツコイ！",
    },
  });
  for (const m of [males[1], females[4]]) {
    await prisma.payment.create({
      data: {
        memberId: m.id,
        matchId: match3.id,
        purpose: "DATE_FEE",
        amount: 5500,
        status: "SUCCEEDED",
        stripePaymentIntentId: "pi_stub_5500",
        createdAt: jstAt(-14, 18, 0),
      },
    });
  }
  await prisma.surveyResponse.create({
    data: {
      matchId: match3.id,
      memberId: males[1].id,
      q1Implementation: "AS_PLANNED",
      q2Satisfaction: "SATISFIED",
      q3Impression: "とても話しやすい方でした。",
      q4Intent: "WANT_AGAIN",
      submittedAt: jstAt(-10, 21, 0),
      sentAt: jstAt(-10, 16, 0),
      dueAt: jstAt(-9, 16, 0),
    },
  });

  // ── 受け取ったお申込み（デモ会員けんた宛・お返事待ち） ──
  const received: [number, string | null, Date][] = [
    [2, "プロフィールを拝見しました。休日が合いそうなので、よろしければお会いしたいです。", jstAt(-1, 22, 15)],
    [3, null, jstAt(-2, 19, 45)],
  ];
  for (const [fi, message, at] of received) {
    await prisma.dateApplication.create({
      data: {
        applicantId: females[fi].id,
        receiverId: males[1].id,
        status: "PENDING",
        message,
        createdAt: at,
      },
    });
    await prisma.notification.create({
      data: {
        memberId: males[1].id,
        type: "APPLICATION_RECEIVED",
        title: "デートのお申込みが届きました",
        body: `${females[fi].nickname}さんからデートのお申込みが届いています。`,
        emailSentAt: at,
        createdAt: at,
      },
    });
  }

  // 通報・お問い合わせ
  await prisma.report.create({
    data: {
      reporterId: females[1].id,
      reportedId: males[4].id,
      type: "INAPPROPRIATE_CONTENT",
      content: "プロフィール写真が本人と異なる可能性があります。",
      status: "OPEN",
      createdAt: jstAt(-1, 18, 20),
    },
  });
  await prisma.inquiry.create({
    data: {
      memberId: females[4].id,
      email: females[4].email,
      subject: "領収書の発行について",
      body: "登録料の領収書を発行いただけますか？",
      status: "OPEN",
      createdAt: jstAt(-1, 9, 5),
    },
  });

  // お知らせ
  await prisma.announcement.create({
    data: {
      title: "サービス開始のお知らせ",
      body: "サツコイ！（仮）をご利用いただきありがとうございます。",
      target: "ALL",
      isPublished: true,
      publishedAt: jstAt(-30, 10, 0),
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
