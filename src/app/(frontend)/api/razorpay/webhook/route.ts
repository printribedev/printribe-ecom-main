import { NextResponse } from 'next/server'

import { markOrderPaid, verifyWebhookSignature } from '@/lib/shop/razorpay'

/**
 * Razorpay calls this by itself when a payment is captured, even if the customer closed the page
 * before our confirmation ran. Set it up in the Razorpay dashboard (Webhooks) once the site is online:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Events: payment.captured and order.paid
 *   Secret: the same value as RAZORPAY_WEBHOOK_SECRET in .env
 */
export async function POST(req: Request) {
  const raw = await req.text()
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') || '')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: {
    event?: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } }
  }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  }

  const pay = event.payload?.payment?.entity
  if ((event.event === 'payment.captured' || event.event === 'order.paid') && pay?.order_id && pay.id) {
    await markOrderPaid(pay.order_id, pay.id)
  }
  return NextResponse.json({ ok: true })
}
