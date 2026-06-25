// ════════════════════════════════════════════════════════════════════
//  Stripe 連携（スタブ）
//  ※ 本スキャフォルドでは実 API を呼ばず、決済「予定」を記録する薄い
//    ラッパーのみ提供。実装時に Stripe SDK 呼び出しへ差し替える。
//  対象：登録料 / 更新料（自動）/ デート代（日程確定）/ 違約金 / 返金。
// ════════════════════════════════════════════════════════════════════

import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** 実キーが設定されている場合のみ Stripe クライアントを返す。 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("placeholder")) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

export interface ChargeResult {
  ok: boolean;
  paymentIntentId?: string;
  stub: boolean;
  message: string;
}

/**
 * 金額を即時決済する（登録料・デート代・違約金など）。
 * スタブ実装では常に成功扱いのダミー結果を返す。
 */
export async function charge(params: {
  customerId?: string | null;
  amountYen: number;
  description: string;
}): Promise<ChargeResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: true,
      stub: true,
      paymentIntentId: `pi_stub_${params.amountYen}`,
      message: `[STUB] ${params.description} ${params.amountYen}円を決済したものとして扱います`,
    };
  }
  // TODO: 実装時に PaymentIntent を作成・確定する
  const intent = await stripe.paymentIntents.create({
    amount: params.amountYen,
    currency: "jpy",
    customer: params.customerId ?? undefined,
    description: params.description,
  });
  return {
    ok: intent.status === "succeeded",
    stub: false,
    paymentIntentId: intent.id,
    message: intent.status,
  };
}

export async function refund(paymentIntentId: string): Promise<ChargeResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: true, stub: true, message: "[STUB] 全額返金したものとして扱います" };
  }
  const r = await stripe.refunds.create({ payment_intent: paymentIntentId });
  return { ok: r.status === "succeeded", stub: false, message: r.status ?? "" };
}
