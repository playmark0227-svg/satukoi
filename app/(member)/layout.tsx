import { PhoneFrame } from "@/components/member/PhoneFrame";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
