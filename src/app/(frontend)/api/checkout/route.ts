import configPromise from '@payload-config'
import { randomBytes, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { quoteOrder } from '@/lib/shop/order'
import { normalizePhone, validateDetails, type DetailsInput } from '@/lib/shop/validation'
import { checkEmailDomain, checkPincode } from '@/lib/shop/verify'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I, easy to read out over the phone

const makeOrderNumber = () => {
  const bytes = randomBytes(6)
  return 'PT-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Creates an order. The price is recomputed here from the database; nothing the browser sends about price is used. */
export async function POST(req: Request) {
  let body: {
    slug?: string
    colour?: string
    sizes?: Record<string, number>
    qty?: number
    details?: DetailsInput
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })
  }

  const d = body.details
  if (!body.slug || !d) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })

  const quote = await quoteOrder({ slug: body.slug, colour: body.colour, sizes: body.sizes, qty: body.qty })
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 })

  // 1. Dummy-entry rules
  const errors = validateDetails(d)
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 })

  // 2. Real-world checks (these let the order through if the lookup service is down)
  const [emailErr, pinErr] = await Promise.all([checkEmailDomain(d.email), checkPincode(d.pincode.trim(), d.state)])
  if (emailErr || pinErr) {
    return NextResponse.json(
      { errors: { ...(emailErr ? { email: emailErr } : {}), ...(pinErr ? { pincode: pinErr } : {}) } },
      { status: 422 },
    )
  }

  const payload = await getPayload({ config: configPromise })
  const token = randomUUID()

  let orderNumber = makeOrderNumber()
  for (let i = 0; i < 5; i++) {
    const clash = await payload.find({ collection: 'orders', where: { orderNumber: { equals: orderNumber } }, limit: 1 })
    if (!clash.docs.length) break
    orderNumber = makeOrderNumber()
  }

  await payload.create({
    collection: 'orders',
    data: {
      orderNumber,
      publicToken: token,
      status: 'awaiting-payment',
      product: quote.product.id,
      productTitle: quote.product.title,
      colour: quote.colour,
      sizes: quote.sizes,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      subtotal: quote.subtotal,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      customerName: d.name.trim().replace(/\s+/g, ' '),
      phone: normalizePhone(d.phone),
      email: d.email.trim().toLowerCase(),
      addressLine1: d.line1.trim().replace(/\s+/g, ' '),
      addressLine2: d.line2?.trim() || undefined,
      city: d.city.trim().replace(/\s+/g, ' '),
      state: d.state,
      pincode: d.pincode.trim(),
    },
    overrideAccess: true,
  })

  return NextResponse.json({ number: orderNumber, token })
}
