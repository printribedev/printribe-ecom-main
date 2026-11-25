import configPromise from '@payload-config'
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'

import { fail, okWithSession, readJson } from '@/lib/account/http'
import { hashPassword, validatePassword } from '@/lib/account/password'
import { sameOrigin } from '@/lib/account/session'

/** Sets a new password using the link from the email, then signs the customer in. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<{ token?: string; password?: string }>(req)
  const token = String(body?.token ?? '')
  const password = String(body?.password ?? '')
  const BAD_LINK = 'This reset link is not valid any more. Please ask for a new one.'
  if (token.length < 20) return fail(BAD_LINK, 400)

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'customers',
    where: { resetTokenHash: { equals: createHash('sha256').update(token).digest('hex') } },
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })
  const customer = found.docs[0]
  if (!customer || !customer.resetExpires || new Date(customer.resetExpires).getTime() < Date.now()) return fail(BAD_LINK, 400)

  const pwErr = validatePassword(password, customer.email)
  if (pwErr) return fail(pwErr, 422, { errors: { password: pwErr } })

  const updated = await payload.update({
    collection: 'customers',
    id: customer.id,
    data: {
      passwordHash: await hashPassword(password),
      sessionVersion: (customer.sessionVersion ?? 1) + 1, // signs out every other device
      resetTokenHash: null,
      resetExpires: null,
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  return okWithSession(updated)
}
