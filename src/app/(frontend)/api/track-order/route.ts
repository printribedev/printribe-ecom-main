import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { fail, readJson } from '@/lib/account/http'
import { sameOrigin } from '@/lib/account/session'
import { normalizePhone } from '@/lib/shop/validation'

// Best-effort brake on guessing: 8 tries a minute per visitor address (per server instance)
const hits = new Map<string, { n: number; t: number }>()
const limited = (ip: string) => {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now })
    return false
  }
  h.n++
  return h.n > 8
}

/** "Where is my order?": order number + the phone number on the order opens that order's page. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  if (limited(ip)) return fail('Too many tries. Please wait a minute and try again.', 429)

  const body = await readJson<{ orderNumber?: string; phone?: string }>(req)
  const number = String(body?.orderNumber ?? '').trim().toUpperCase()
  const phone = normalizePhone(String(body?.phone ?? '').trim())
  const NOT_FOUND = 'We could not find an order with those details. Check the order number and the mobile number you used.'
  if (!/^PT-[A-Z0-9]{6}$/.test(number) || !phone) return fail(NOT_FOUND, 404)

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'orders', where: { orderNumber: { equals: number } }, limit: 1, overrideAccess: true, depth: 0 })
  const o = found.docs[0]
  if (!o || normalizePhone(o.phone || '') !== phone) return fail(NOT_FOUND, 404)

  return NextResponse.json({ url: `/order/${encodeURIComponent(o.orderNumber)}?t=${encodeURIComponent(o.publicToken)}` })
}
