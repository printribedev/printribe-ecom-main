import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { cleanEmail, fail, okWithSession, readJson } from '@/lib/account/http'
import { hashPassword, verifyPassword } from '@/lib/account/password'
import { sameOrigin } from '@/lib/account/session'

const MAX_FAILS = 5
const LOCK_MINUTES = 15
const WRONG = 'Email or password is not correct.'

// A real-looking hash to compare against when the email is unknown, so the response takes the same time either way
let dummyHash: Promise<string> | null = null

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<{ email?: string; password?: string }>(req)
  if (!body) return fail('Something went wrong. Please try again.')
  const email = cleanEmail(body.email)
  const password = String(body.password ?? '')
  if (!email || !password || password.length > 200) return fail(WRONG, 401)

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'customers', where: { email: { equals: email } }, limit: 1, overrideAccess: true, depth: 0 })
  const customer = found.docs[0]

  if (!customer) {
    dummyHash ||= hashPassword('not-a-real-password')
    await verifyPassword(password, await dummyHash)
    return fail(WRONG, 401)
  }

  if (customer.lockedUntil && new Date(customer.lockedUntil).getTime() > Date.now()) {
    return fail(`Too many wrong attempts. Please try again in ${LOCK_MINUTES} minutes, or reset your password.`, 429)
  }

  const good = await verifyPassword(password, customer.passwordHash)
  if (!good) {
    const fails = (customer.failedLogins ?? 0) + 1
    const lock = fails >= MAX_FAILS
    await payload.update({
      collection: 'customers',
      id: customer.id,
      data: { failedLogins: lock ? 0 : fails, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString() : null },
      overrideAccess: true,
    })
    return fail(WRONG, 401)
  }

  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() },
    overrideAccess: true,
  })
  return okWithSession(customer)
}
