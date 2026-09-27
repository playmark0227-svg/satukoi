// ════════════════════════════════════════════════════════════════════
//  運営アカウントの作成・パスワード再設定（本番の初回セットアップ用）
//  使い方: DATABASE_URL=... npm run admin:create -- <email> <password> [表示名]
//  同じメールが既にあればパスワードと表示名を更新する。
// ════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {}

const [email, password, name = "運営"] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error("使い方: npm run admin:create -- <email> <password(8文字以上)> [表示名]");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHash = bcrypt.hashSync(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, name, role: "OWNER" },
    update: { passwordHash, name },
  });
  console.log(`運営アカウントを用意しました: ${admin.email}（${admin.name}）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
