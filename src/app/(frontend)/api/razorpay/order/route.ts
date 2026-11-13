import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { createRazorpayOrder, razorpayKeys } from '@/lib/shop/razorpay'

/** Starts a payment: creates (or reuses) the Razorpay order for an existing Printribe order. The amount comes from our database. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { number?: string; token?: string } | null
  const keys = razorpayKeys()
  if (!keys) return NextResponse.json({ error: 'Online payment is not switched on yet. Please contact us.' }, { status: 503 })
  if (!body?.number || !body.token) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: body.number }, publicToken: { equals: body.token } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (!order) return NextResponse.json({ error: 'We could not find this order.' }, { status: 404 })
  if (order.status !== 'awaiting-payment') return NextResponse.json({ error: 'This order is already paid.' }, { status: 409 })

  try {
    let razorpayOrderId = order.razorpayOrderId
    if (!razorpayOrderId) {
      razorpayOrderId = await createRazorpayOrder({
        amountRupees: order.total,
        receipt: order.orderNumber,
        notes: { orderNumber: order.orderNumber },
      })
      await payload.update({ collection: 'orders', id: order.id, data: { razorpayOrderId }, overrideAccess: true })
    }
    return NextResponse.json({
      keyId: keys.keyId,
      razorpayOrderId,
      amountPaise: Math.round(order.total * 100),
      name: order.customerName,
      email: order.email,
      phone: order.phone,
    })
  } catch {
    return NextResponse.json({ error: 'We could not start the payment. Please try again in a moment.' }, { status: 502 })
  }
}
