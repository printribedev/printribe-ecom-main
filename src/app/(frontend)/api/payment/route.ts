import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const MAX_BYTES = 5 * 1024 * 1024

/** Looks at the first bytes of the file, so a renamed .exe cannot pass as a screenshot. */
function sniffImage(b: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (b.length > 12 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'image/png'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

/** Attaches the payment screenshot (required) and optional UTR to an order. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })

  const number = String(form.get('number') || '')
  const token = String(form.get('token') || '')
  const utr = String(form.get('utr') || '').trim()
  const file = form.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Please upload a screenshot of your payment.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'The screenshot is too large. Maximum size is 5 MB.' }, { status: 400 })
  if (utr && !/^[A-Za-z0-9]{8,25}$/.test(utr)) {
    return NextResponse.json({ error: 'The UPI transaction ID should be 8 to 25 letters or numbers. Leave it empty if unsure.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimetype = sniffImage(buffer)
  if (!mimetype) return NextResponse.json({ error: 'Please upload a PNG, JPG or WebP image.' }, { status: 400 })

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: number }, publicToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]
  if (!order) return NextResponse.json({ error: 'We could not find this order.' }, { status: 404 })
  if (order.status !== 'awaiting-payment' && order.status !== 'payment-submitted') {
    return NextResponse.json({ error: 'Payment has already been recorded for this order.' }, { status: 409 })
  }

  const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg'
  const proof = await payload.create({
    collection: 'payment-proofs',
    data: {},
    file: { data: buffer, mimetype, name: `${number}-payment.${ext}`, size: buffer.length },
    overrideAccess: true,
  })

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      paymentProof: proof.id,
      utr: utr || undefined,
      status: 'payment-submitted',
      paymentSubmittedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
