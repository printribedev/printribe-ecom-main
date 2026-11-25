import configPromise from '@payload-config'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import type { Customer } from '@/payload-types'

/**
 * Customer sessions. A session is a signed cookie: "<id>.<expiry>.<version>.<signature>".
 * The signature uses PAYLOAD_SECRET, so it cannot be forged. Changing a password raises the customer's
 * sessionVersion, which signs everyone out of that account at once.
 */
export const SESSION_COOKIE = 'pt_session'
export const SESSION_DAYS = 30

const secret = () => {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET is not set')
  return s
}

const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('base64url')

export function makeSessionValue(c: { id: number; sessionVersion?: number | null }): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const body = `${c.id}.${exp}.${c.sessionVersion ?? 1}`
  return `${body}.${sign(body)}`
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
}

/** Reads the cookie and returns the signed-in customer, or null. Never throws for bad cookies. */
export async function getCustomerFromCookieValue(value?: string | null): Promise<Customer | null> {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const [id, exp, ver, sig] = parts
  const body = `${id}.${exp}.${ver}`
  const good = Buffer.from(sign(body))
  const given = Buffer.from(sig)
  if (good.length !== given.length || !timingSafeEqual(good, given)) return null
  if (!Number.isFinite(Number(exp)) || Number(exp) < Date.now()) return null

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'customers',
    where: { id: { equals: Number(id) } },
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })
  const c = found.docs[0]
  if (!c || (c.sessionVersion ?? 1) !== Number(ver)) return null
  return c
}

/** For server pages: the signed-in customer, or null. */
export async function getCustomer(): Promise<Customer | null> {
  const jar = await cookies()
  return getCustomerFromCookieValue(jar.get(SESSION_COOKIE)?.value)
}

/** For API routes that receive a Request. */
export async function getCustomerFromRequest(req: Request): Promise<Customer | null> {
  const header = req.headers.get('cookie') || ''
  const match = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${SESSION_COOKIE}=`))
  return getCustomerFromCookieValue(match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null)
}

/** Blocks cross-site form posts: a browser sends the page's own address in Origin. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // same-site navigations and non-browser tools do not always send it
  try {
    return new URL(origin).host === (req.headers.get('x-forwarded-host') || req.headers.get('host'))
  } catch {
    return false
  }
}
