import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload, type Where } from 'payload'

import { fail, readJson } from '@/lib/account/http'
import { getCustomerFromRequest, sameOrigin } from '@/lib/account/session'
import { estimateItems, MAX_QUOTE_ITEMS, type QuoteItemInput, type QuoteLine } from '@/lib/quote/estimate'
import { normalizePhone, validateEmail, validateName, validatePhone } from '@/lib/shop/validation'
import { ENQUIRY_PREFIX, publicBase } from '@/lib/studio/r2'

const HOUR = 60 * 60 * 1000
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const makeNumber = () => 'Q-' + Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('')
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type Body = {
  items?: QuoteItemInput[]
  name?: string
  phone?: string
  email?: string
  company?: string
  gstNumber?: string
  city?: string
  pincode?: string
  multipleAddresses?: boolean
  timeline?: string
  deadline?: string
  notes?: string
  files?: string[]
  website?: string // hidden trap field for bots
}

/** Saves a quote request. Every item is re-priced here from the database; nothing the browser says about price is used. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<Body>(req)
  if (!body) return fail('Something went wrong. Please try again.')
  if (body.website) return NextResponse.json({ ok: true, number: 'Q-XXXXXX' }) // a bot filled the trap field: save nothing

  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ')
  const phoneRaw = String(body.phone ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const company = String(body.company ?? '').trim().slice(0, 120)
  const gstNumber = String(body.gstNumber ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const city = String(body.city ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
  const pincode = String(body.pincode ?? '').trim()
  const notes = String(body.notes ?? '').trim()
  const timeline = body.timeline === 'deadline' ? 'deadline' : 'standard'
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(body.deadline ?? '')) ? String(body.deadline) : ''
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_QUOTE_ITEMS) : []

  const errors: Record<string, string> = {}
  const nameErr = validateName(name)
  if (nameErr) errors.name = nameErr
  const phoneErr = validatePhone(phoneRaw)
  if (phoneErr) errors.phone = phoneErr
  if (email) {
    const emailErr = validateEmail(email)
    if (emailErr) errors.email = emailErr
  }
  if (gstNumber && !/^[0-9A-Z]{15}$/.test(gstNumber)) errors.gstNumber = 'A GST number has 15 letters and digits. Please check it.'
  if (city.length < 2) errors.city = 'Please enter your city.'
  if (!/^[1-9]\d{5}$/.test(pincode)) errors.pincode = 'Enter a valid 6-digit pincode.'
  if (timeline === 'deadline' && !deadline) errors.deadline = 'Please choose the date you need it by.'
  if (notes.length > 3000) errors.notes = 'Please keep your notes under 3000 characters.'
  if (rawItems.length === 0 && notes.length < 10) errors.notes = 'Add a product to your quote, or tell us what you need here.'
  if (Object.keys(errors).length) return fail('Please check the highlighted details.', 422, { errors })

  const prefix = `${publicBase()}/${ENQUIRY_PREFIX}`
  const files = (Array.isArray(body.files) ? body.files : []).filter((u): u is string => typeof u === 'string')
  if (files.length > 3 || files.some((u) => !u.startsWith(prefix) || u.length > 400 || u.includes('..'))) {
    return fail('One of the files was not uploaded properly. Please remove it and add it again.')
  }

  // Price every item here
  const lines = await estimateItems(rawItems)
  const bad = lines.find((l) => !l.ok)
  if (bad && !bad.ok) return fail(bad.error, 400)
  const good = lines.filter((l): l is QuoteLine => l.ok)
  const estimateTotal = good.reduce((s, l) => s + l.lineTotal, 0)

  const phone = normalizePhone(phoneRaw)
  const payload = await getPayload({ config: configPromise })

  // At most 3 requests an hour from the same phone number or email
  const since = new Date(Date.now() - HOUR).toISOString()
  const who: Where[] = [{ phone: { equals: phone } }]
  if (email) who.push({ email: { equals: email } })
  const recent = await payload.find({ collection: 'quotes', where: { and: [{ createdAt: { greater_than: since } }, { or: who }] }, limit: 4, depth: 0, overrideAccess: true })
  if (recent.totalDocs >= 3) return fail('You have already sent a few quote requests. Please wait a while, or message us on WhatsApp.', 429)

  let quoteNumber = makeNumber()
  for (let i = 0; i < 5; i++) {
    const clash = await payload.find({ collection: 'quotes', where: { quoteNumber: { equals: quoteNumber } }, limit: 1, depth: 0, overrideAccess: true })
    if (!clash.docs.length) break
    quoteNumber = makeNumber()
  }

  const me = await getCustomerFromRequest(req)
  await payload.create({
    collection: 'quotes',
    data: {
      quoteNumber,
      status: 'new',
      name,
      phone,
      email: email || undefined,
      company: company || undefined,
      gstNumber: gstNumber || undefined,
      city,
      pincode,
      multipleAddresses: !!body.multipleAddresses,
      timeline,
      deadline: deadline || undefined,
      notes: notes || undefined,
      files: files.map((url) => ({ url })),
      items: good.map((l) => ({
        productTitle: l.title,
        product: l.productId,
        colour: l.colour,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        printingPerPiece: l.printingPerPiece,
        lineTotal: l.lineTotal,
        design: l.designId,
        designPreview: l.designPreview,
      })),
      estimateTotal,
      ...(me ? { customer: me.id } : {}),
    },
    overrideAccess: true,
  })

  // Emails: a failure must never lose the quote request, which is already saved
  try {
    const settings = await payload.findGlobal({ slug: 'contact-settings' })
    const list = good.map((l) => `<li>${esc(l.title)}${l.colour ? ' (' + esc(l.colour) + ')' : ''} × ${l.quantity} at ${money(l.unitPrice)} = ${money(l.lineTotal)}${l.designId ? ' (studio design)' : ''}</li>`).join('')
    await payload.sendEmail({
      to: settings.email || 'info@theprintribe.com',
      subject: `New quote request ${quoteNumber} from ${name}${company ? ' (' + company + ')' : ''}`,
      html: `<p><strong>${esc(name)}</strong> · ${esc(phone)}${email ? ' · ' + esc(email) : ''}</p><p>${esc(city)} ${esc(pincode)}${body.multipleAddresses ? ' · several delivery addresses' : ''}${timeline === 'deadline' ? ' · needed by ' + esc(deadline) : ''}</p><ul>${list}</ul><p>Estimate: ${money(estimateTotal)} (delivery not included)</p>${notes ? `<p style="white-space:pre-wrap">${esc(notes)}</p>` : ''}<p>Open it in the admin under Quote requests.</p>`,
    })
    if (email) {
      await payload.sendEmail({
        to: email,
        subject: `We got your quote request ${quoteNumber} | Printribe`,
        html: `<p>Hi ${esc(name.split(' ')[0])},</p><p>Thanks for your quote request <strong>${quoteNumber}</strong>. We will send your quote ${esc(settings.replyTime || 'soon')}. No payment is needed now.</p><p>Team Printribe</p>`,
      })
    }
  } catch (err) {
    payload.logger.error({ err }, 'Could not send quote emails')
  }

  return NextResponse.json({ ok: true, number: quoteNumber })
}
