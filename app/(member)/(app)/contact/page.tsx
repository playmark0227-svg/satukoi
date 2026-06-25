import { requireMember } from "@/lib/auth";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { submitInquiry } from "./actions";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const me = await requireMember();
  const { sent } = await searchParams;

  if (sent === "1") {
    return (
      <div className="flex flex-1 flex-col pb-10">
        <AppHeader title="お問い合わせ" backHref="/mypage" />
        <div className="px-4 py-4">
          <Card>
            <EmptyState
              icon="✓"
              title="お問い合わせを受け付けました"
              description="内容を確認のうえ、ご登録のメールアドレス宛にご連絡いたします。"
              action={
                <ButtonLink href="/mypage" variant="secondary" size="md">
                  マイページへ戻る
                </ButtonLink>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="お問い合わせ" backHref="/mypage" />

      <div className="px-4 py-4">
        <Card>
          <CardBody>
            <p className="mb-4 text-sm leading-relaxed text-ink-soft">
              ご質問・ご要望はこちらからお寄せください。ご登録のメールアドレス（
              {me.email}）宛にご返信いたします。
            </p>

            <form action={submitInquiry} className="space-y-4">
              <Field label="件名" required>
                <Input
                  name="subject"
                  maxLength={60}
                  required
                  placeholder="例：領収書の発行について"
                />
              </Field>

              <Field label="お問い合わせ内容" required>
                <Textarea
                  name="body"
                  rows={6}
                  maxLength={1000}
                  required
                  placeholder="お問い合わせの内容をできるだけ具体的にご記入ください。"
                />
              </Field>

              <Button type="submit" variant="primary" size="lg">
                送信する
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

