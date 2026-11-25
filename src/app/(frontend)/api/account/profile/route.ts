import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { fail, okWithSession, readJson } from '@/lib/account/http'
import { hashPassword, validatePassword, verifyPassword } from '@/lib/account/password'
import { getCustomerFromRequest, sameOrigin } from '@/lib/account/session'
import { normalizePhone, validateName, validatePhone } from '@/lib/shop/validation'

/** Changes the signed-in customer's name and phone, or their password. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const me = await getCustomerFromRequest(req)
  if (!me) return fail('Please sign in first.', 401)
  const body = await readJson<{ action?: string; name?: string; phone?: string; currentPassword?: string; newPassword?: string }>(req)
  if (!body) return fail('Something went wrong. Please try again.')
  const payload = await getPayload({ config: configPromise })

  if (body.action === 'details') {
    const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
    const phoneRaw = String(body.phone ?? '').trim()
    const errors: Record<string, string> = {}
    const nameErr = validateName(name)
    if (nameErr) errors.name = nameErr
    if (phoneRaw) {
      const phoneErr = validatePhone(phoneRaw)
      if (phoneErr) errors.phone = phoneErr
    }
    if (Object.keys(errors).length) return fail('Please check the highlighted details.', 422, { errors })
    await payload.update({
      collection: 'customers',
      id: me.id,
      data: { name, phone: phoneRaw ? normalizePhone(phoneRaw) : null },
      overrideAccess: true,
    })
    return Response.json({ ok: true })
  }

  if (body.action === 'password') {
    const current = String(body.currentPassword ?? '')
    const next = String(body.newPassword ?? '')
    if (!(await verifyPassword(current, me.passwordHash))) return fail('Your current password is not correct.', 422, { errors: { currentPassword: 'Not correct.' } })
    const pwErr = validatePassword(next, me.email)
    if (pwErr) return fail(pwErr, 422, { errors: { newPassword: pwErr } })
    const updated = await payload.update({
      collection: 'customers',
      id: me.id,
      data: { passwordHash: await hashPassword(next), sessionVersion: (me.sessionVersion ?? 1) + 1 },
      overrideAccess: true,
    })
    return okWithSession(updated) // keeps this device signed in, signs the others out
  }

  return fail('Something went wrong. Please try again.')
}
