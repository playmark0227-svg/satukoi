import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

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

// ── 会員セッション ──

export function createMemberSession(memberId: string) {
  return write("member", memberId);
}

export function destroyMemberSession() {
  return clear("member");
}

export async function getCurrentMemberId() {
  return read("member");
}

export async function getCurrentMember() {
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
  const id = await read("admin");
  if (!id) return null;
  return prisma.adminUser.findUnique({ where: { id } });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
