import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SOURCES = ['newsletter', 'design-studio'] as const

/** Newsletter and Design Studio sign-ups. Saves the email once per list. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase()
  const source = SOURCES.find((s) => s === body?.source)

  // Bots fill the hidden "website" field. Pretend it worked, but save nothing.
  if (body?.website) return NextResponse.json({ ok: true })

  if (!source || email.length > 120 || !EMAIL.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'subscribers',
    where: { and: [{ email: { equals: email } }, { source: { equals: source } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'subscribers',
      data: { email, source },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true })
}
