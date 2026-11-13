import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { markOrderPaid, verifyPaymentSignature } from '@/lib/shop/razorpay'

/** Called by the browser right after Razorpay says the payment worked. The order becomes Paid only if the signature is genuine. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as {
    number?: string
    token?: string
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
  } | null
  if (!b?.number || !b.token || !b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: b.number }, publicToken: { equals: b.token } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (!order || order.razorpayOrderId !== b.razorpay_order_id) {
    return NextResponse.json({ error: 'We could not match this payment to your order.' }, { status: 404 })
  }
  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    return NextResponse.json({ error: 'We could not confirm this payment. If money was deducted, it will show on your order shortly or be refunded.' }, { status: 400 })
  }

  await markOrderPaid(b.razorpay_order_id, b.razorpay_payment_id)
  return NextResponse.json({ ok: true })
}
