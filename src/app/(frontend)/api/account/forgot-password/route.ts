import configPromise from '@payload-config'
import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { cleanEmail, fail, readJson } from '@/lib/account/http'
import { sameOrigin } from '@/lib/account/session'
import { getServerSideURL } from '@/utilities/getURL'

const HOUR = 60 * 60 * 1000

/** Always answers the same way, so nobody can use this to find out who has an account. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<{ email?: string }>(req)
  const email = cleanEmail(body?.email)
  const done = NextResponse.json({ ok: true })
  if (!email) return done

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'customers', where: { email: { equals: email } }, limit: 1, overrideAccess: true, depth: 0 })
  const customer = found.docs[0]
  if (!customer) return done

  // At most one reset email per minute for the same account
  if (customer.resetExpires && new Date(customer.resetExpires).getTime() - Date.now() > HOUR - 60 * 1000) return done

  const token = randomBytes(32).toString('base64url')
  await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetExpires: new Date(Date.now() + HOUR).toISOString() },
    overrideAccess: true,
  })

  const link = `${getServerSideURL()}/account/reset-password?token=${token}`
  // Development only: with no email service connected, print the link here so it can be tested
  if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) payload.logger.info(`DEV ONLY reset link: ${link}`)
  try {
    await payload.sendEmail({
      to: customer.email,
      subject: 'Reset your Printribe password',
      html: `<p>Hi ${escapeHtml(customer.name.split(' ')[0])},</p><p>We received a request to reset your Printribe password. This link works for one hour:</p><p><a href="${link}">Choose a new password</a></p><p>If you did not ask for this, you can ignore this email. Your password stays the same.</p><p>Team Printribe</p>`,
    })
  } catch (err) {
    payload.logger.error({ err }, 'Could not send the password reset email')
  }
  return done
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
