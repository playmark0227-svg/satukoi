import { redirect } from "next/navigation";
import { destroyMemberSession } from "@/lib/auth";

export async function POST() {
  await destroyMemberSession();
  redirect("/");
}
