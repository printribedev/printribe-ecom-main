import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { fail, readJson } from '@/lib/account/http'
import { getCustomerFromRequest, sameOrigin } from '@/lib/account/session'
import { normalizePhone } from '@/lib/shop/validation'

/** Adds an order placed as a guest to the signed-in account. Needs the order number AND the phone number used on the order. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const me = await getCustomerFromRequest(req)
  if (!me) return fail('Please sign in first.', 401)

  const body = await readJson<{ orderNumber?: string; phone?: string }>(req)
  const number = String(body?.orderNumber ?? '').trim().toUpperCase()
  const phone = normalizePhone(String(body?.phone ?? '').trim())
  const NOT_FOUND = 'We could not find an order with those details. Check the order number and the phone number you used.'
  if (!/^PT-[A-Z0-9]{6}$/.test(number) || !phone) return fail(NOT_FOUND, 404)

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'orders', where: { orderNumber: { equals: number } }, limit: 1, overrideAccess: true, depth: 0 })
  const order = found.docs[0]
  if (!order || normalizePhone(order.phone || '') !== phone) return fail(NOT_FOUND, 404)

  const owner = typeof order.customer === 'object' && order.customer ? order.customer.id : order.customer
  if (owner && owner !== me.id) return fail(NOT_FOUND, 404)
  if (!owner) await payload.update({ collection: 'orders', id: order.id, data: { customer: me.id }, overrideAccess: true })
  return NextResponse.json({ ok: true })
}
