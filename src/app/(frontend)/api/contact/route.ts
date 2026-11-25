import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload, type Where } from 'payload'

import { fail, readJson } from '@/lib/account/http'
import { getCustomerFromRequest, sameOrigin } from '@/lib/account/session'
import {
  ENQUIRY_BEST_TIME,
  ENQUIRY_HEARD,
  ENQUIRY_NEEDS,
  ENQUIRY_QUANTITIES,
  ENQUIRY_WHAT,
  ENQUIRY_WHEN,
  sentenceFrom,
} from '@/lib/contact/options'
import { normalizePhone, validateEmail, validateName, validatePhone } from '@/lib/shop/validation'
import { ENQUIRY_PREFIX, publicBase } from '@/lib/studio/r2'

const MAX_FILES = 3
const HOUR = 60 * 60 * 1000

type Body = {
  name?: string
  email?: string
  phone?: string
  organisation?: string
  what?: string
  need?: string
  quantity?: string
  neededBy?: string
  bestTime?: string
  details?: string
  files?: string[]
  heard?: string
  channel?: string
  website?: string // hidden trap field: real people leave it empty
}

const pick = <T extends readonly string[]>(list: T, v: unknown): string => (typeof v === 'string' && (list as readonly string[]).includes(v) ? v : '')
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Saves a Contact page enquiry in the admin and (when email is set up) emails the team and the customer. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<Body>(req)
  if (!body) return fail('Something went wrong. Please try again.')
  if (body.website) return NextResponse.json({ ok: true }) // a bot filled the trap field: pretend it worked, save nothing

  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
  const email = String(body.email ?? '').trim().toLowerCase()
  const phoneRaw = String(body.phone ?? '').trim()
  const details = String(body.details ?? '').trim()
  const organisation = String(body.organisation ?? '').trim().slice(0, 120)

  const errors: Record<string, string> = {}
  const nameErr = validateName(name)
  if (nameErr) errors.name = nameErr
  if (email) {
    const emailErr = validateEmail(email)
    if (emailErr) errors.email = emailErr
  }
  const phoneErr = validatePhone(phoneRaw)
  if (phoneErr) errors.phone = phoneErr
  if (details.length > 3000) errors.details = 'Please keep your notes under 3000 characters.'
  if (Object.keys(errors).length) return fail('Please check the highlighted details.', 422, { errors })

  // Files must be ones WE stored for enquiries
  const prefix = `${publicBase()}/${ENQUIRY_PREFIX}`
  const files = (Array.isArray(body.files) ? body.files : []).filter((u): u is string => typeof u === 'string')
  if (files.length > MAX_FILES || files.some((u) => !u.startsWith(prefix) || u.length > 400 || u.includes('..'))) {
    return fail('One of the files was not uploaded properly. Please remove it and add it again.')
  }

  const phone = normalizePhone(phoneRaw)
  const what = pick(ENQUIRY_WHAT, body.what)
  const need = pick(ENQUIRY_NEEDS, body.need)
  const quantity = pick(ENQUIRY_QUANTITIES, body.quantity)
  const neededBy = pick(ENQUIRY_WHEN, body.neededBy)
  const bestTime = pick(ENQUIRY_BEST_TIME, body.bestTime)
  const heard = pick(ENQUIRY_HEARD, body.heard)
  const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'form'
  const message = sentenceFrom(name, { what, need, quantity, neededBy, bestTime }, details)

  const payload = await getPayload({ config: configPromise })

  // At most 3 messages an hour from the same phone number or email
  const since = new Date(Date.now() - HOUR).toISOString()
  const who: Where[] = [{ phone: { equals: phone } }]
  if (email) who.push({ email: { equals: email } })
  const recent = await payload.find({
    collection: 'enquiries',
    where: { and: [{ createdAt: { greater_than: since } }, { or: who }] },
    limit: 4,
    depth: 0,
    overrideAccess: true,
  })
  if (recent.totalDocs >= 3) return fail('You have already sent us a few messages. Please wait a while, or message us on WhatsApp.', 429)

  const me = await getCustomerFromRequest(req)
  await payload.create({
    collection: 'enquiries',
    data: {
      status: 'new',
      name,
      email: email || undefined,
      phone,
      organisation: organisation || undefined,
      interestedIn: what || undefined,
      need: need || undefined,
      quantity: quantity || undefined,
      neededBy: neededBy || undefined,
      bestTime: bestTime || undefined,
      channel,
      message,
      files: files.map((url) => ({ url })),
      heardFrom: heard || undefined,
      ...(me ? { customer: me.id } : {}),
    },
    overrideAccess: true,
  })

  // Emails: a failure here must never lose the enquiry, which is already saved
  try {
    const settings = await payload.findGlobal({ slug: 'contact-settings' })
    await payload.sendEmail({
      to: settings.email || 'info@theprintribe.com',
      subject: `New enquiry from ${name}`,
      html: `<p><strong>${esc(name)}</strong> · ${esc(phone)}${email ? ' · ' + esc(email) : ''}</p>
<p style="white-space:pre-wrap">${esc(message)}</p>${files.map((u) => `<p><a href="${u}">File</a></p>`).join('')}
<p>${channel === 'whatsapp' ? 'They also opened WhatsApp, so a message may arrive there. ' : ''}Open it in the admin under Enquiries.</p>`,
    })
    if (email) {
      await payload.sendEmail({
        to: email,
        subject: 'We got your message | Printribe',
        html: `<p>Hi ${esc(name.split(' ')[0])},</p><p>Thanks for contacting Printribe. We have your message and will reply ${esc(settings.replyTime || 'soon')}.</p><p>Team Printribe</p>`,
      })
    }
  } catch (err) {
    payload.logger.error({ err }, 'Could not send enquiry emails')
  }

  return NextResponse.json({ ok: true })
}
