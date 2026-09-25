import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { IS_DEMO, getDemoMember, getDemoAdmin } from "@/lib/demo";

const MEMBER_COOKIE = "satukoi_session";
const ADMIN_COOKIE = "satukoi_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30日

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

type SessionKind = "member" | "admin";

async function sign(kind: SessionKind, subject: string) {
  return new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

async function read(kind: SessionKind): Promise<string | null> {
  const store = await cookies();
  const token = store.get(kind === "member" ? MEMBER_COOKIE : ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== kind || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function write(kind: SessionKind, subject: string) {
  const store = await cookies();
  const token = await sign(kind, subject);
  store.set(kind === "member" ? MEMBER_COOKIE : ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

async function clear(kind: SessionKind) {
  const store = await cookies();
  store.delete(kind === "member" ? MEMBER_COOKIE : ADMIN_COOKIE);
}

// ── LINE 連携の一時情報（未登録の LINE ユーザーが新規登録へ進む間だけ保持） ──

const LINE_PENDING_COOKIE = "satukoi_line_pending";
const LINE_PENDING_MAX_AGE = 60 * 30; // 30分

export type LinePending = { sub: string; name?: string; picture?: string };

export async function setLinePending(p: LinePending) {
  const token = await new SignJWT({ kind: "line", name: p.name, picture: p.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${LINE_PENDING_MAX_AGE}s`)
    .sign(secret());
  const store = await cookies();
  store.set(LINE_PENDING_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LINE_PENDING_MAX_AGE,
  });
}

export async function readLinePending(): Promise<LinePending | null> {
  if (IS_DEMO) return null;
  const store = await cookies();
  const token = store.get(LINE_PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "line" || !payload.sub) return null;
    return {
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

export async function clearLinePending() {
  const store = await cookies();
  store.delete(LINE_PENDING_COOKIE);
}

// ── 会員セッション ──

export function createMemberSession(memberId: string) {
  return write("member", memberId);
}

export function destroyMemberSession() {
  return clear("member");
}

export async function getCurrentMemberId() {
  // デモ：公開ページ（ランディング/ログイン）はそのまま表示させたいので null。
  if (IS_DEMO) return null;
  return read("member");
}

export async function getCurrentMember() {
  if (IS_DEMO) return getDemoMember();
  const id = await read("member");
  if (!id) return null;
  return prisma.member.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  });
}

/** 未ログインなら /login へ。承認前・停止中の扱いは画面側で判定。 */
export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

// ── 運営（管理画面）セッション ──

export function createAdminSession(adminId: string) {
  return write("admin", adminId);
}

export function destroyAdminSession() {
  return clear("admin");
}

export async function getCurrentAdmin() {
  // デモ：運営ログインページを表示させたいので null。
  if (IS_DEMO) return null;
  const id = await read("admin");
  if (!id) return null;
  return prisma.adminUser.findUnique({ where: { id } });
}

export async function requireAdmin() {
  if (IS_DEMO) return getDemoAdmin();
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
