import 'server-only'
import configPromise from '@payload-config'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

/**
 * Razorpay helpers. Keys live in .env only (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET)
 * and never reach the browser except the public key id.
 * Test keys (rzp_test_...) move no real money. Live keys (rzp_live_...) do.
 */
export const razorpayKeys = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  return keyId && keySecret ? { keyId, keySecret } : null
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Creates a Razorpay order for the given amount in rupees. */
export async function createRazorpayOrder(opts: { amountRupees: number; receipt: string; notes?: Record<string, string> }) {
  const keys = razorpayKeys()
  if (!keys) throw new Error('Razorpay keys are not set')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString('base64'),
    },
    body: JSON.stringify({
      amount: Math.round(opts.amountRupees * 100), // Razorpay works in paise
      currency: 'INR',
      receipt: opts.receipt,
      notes: opts.notes,
    }),
  })
  const body = (await res.json()) as { id?: string; error?: { description?: string } }
  if (!res.ok || !body.id) throw new Error(body.error?.description || 'Razorpay could not create the order')
  return body.id
}

/** True if the signature Razorpay returned after payment is genuine. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const keys = razorpayKeys()
  if (!keys || !orderId || !paymentId || !signature) return false
  const expected = createHmac('sha256', keys.keySecret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqual(expected, signature)
}

/** True if a webhook body really came from Razorpay. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqual(expected, signature)
}

/**
 * Marks the order paid. Safe to call twice (the browser and the webhook may both report the same payment).
 * Only an order that is still waiting for payment moves to Paid, and only if the Razorpay order matches.
 */
export async function markOrderPaid(razorpayOrderId: string, razorpayPaymentId: string): Promise<'paid' | 'already' | 'unknown'> {
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'orders',
    where: { razorpayOrderId: { equals: razorpayOrderId } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (!order) return 'unknown'
  if (order.status !== 'awaiting-payment') return 'already'
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { status: 'paid', razorpayPaymentId, paidAt: new Date().toISOString() },
    overrideAccess: true,
  })
  return 'paid'
}
