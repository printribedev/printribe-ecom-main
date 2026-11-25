import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { cleanEmail, fail, okWithSession, readJson } from '@/lib/account/http'
import { hashPassword, validatePassword } from '@/lib/account/password'
import { sameOrigin } from '@/lib/account/session'
import { normalizePhone, validateEmail, validateName, validatePhone } from '@/lib/shop/validation'

/** Creates a customer account and signs them in. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<{ name?: string; email?: string; phone?: string; password?: string }>(req)
  if (!body) return fail('Something went wrong. Please try again.')

  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
  const email = cleanEmail(body.email)
  const phoneRaw = String(body.phone ?? '').trim()
  const password = String(body.password ?? '')

  const errors: Record<string, string> = {}
  const nameErr = validateName(name)
  if (nameErr) errors.name = nameErr
  const emailErr = validateEmail(email)
  if (emailErr) errors.email = emailErr
  if (phoneRaw) {
    const phoneErr = validatePhone(phoneRaw)
    if (phoneErr) errors.phone = phoneErr
  }
  const pwErr = validatePassword(password, email)
  if (pwErr) errors.password = pwErr
  if (Object.keys(errors).length) return fail('Please check the highlighted details.', 422, { errors })

  const payload = await getPayload({ config: configPromise })
  const exists = await payload.find({ collection: 'customers', where: { email: { equals: email } }, limit: 1, overrideAccess: true, depth: 0 })
  if (exists.docs.length) {
    return fail('An account with this email already exists. Please sign in instead.', 409, { errors: { email: 'This email already has an account.' } })
  }

  const customer = await payload.create({
    collection: 'customers',
    data: {
      email,
      name,
      phone: phoneRaw ? normalizePhone(phoneRaw) : undefined,
      passwordHash: await hashPassword(password),
      sessionVersion: 1,
      lastLoginAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
  return okWithSession(customer)
}
