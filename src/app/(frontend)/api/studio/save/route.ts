import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { unitPriceFor } from '@/lib/shop/pricing'
import { putObject, r2Configured } from '@/lib/studio/r2'
import { studioExtras, type AreaSize, type MethodPrices } from '@/lib/studio/pricing'
import type { StudioArea } from '@/lib/studio/types'
import { checkDesign } from '@/lib/studio/validate'

const MAX_BODY = 4_000_000
const MAX_PREVIEW_BYTES = 1_500_000
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

type Body = {
  slug?: string
  token?: string
  colour?: string
  qty?: number
  views?: unknown
  previews?: Record<string, string>
  methodByArea?: Record<string, number>
}

/** Saves a design. The price is worked out HERE from the database; the price the browser shows is never used. */
export async function POST(req: Request) {
  if (!r2Configured()) return bad('Saving designs is not switched on yet.', 503)
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return bad('The design is too large to save.', 413)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return bad('Something went wrong. Please try again.')
  }

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: String(body.slug || '') }, published: { equals: true } },
    limit: 1,
    depth: 0,
  })
  const product = found.docs[0]
  if (!product || !product.studio?.enabled) return bad('This product cannot be designed online.', 404)

  // The print areas of this product, exactly as the studio page builds them
  const areasByView: Record<string, StudioArea[]> = {}
  for (const v of product.studio.views || []) {
    areasByView[v.view] = (v.areas || []).map((a, i) => ({
      key: a.id || `${v.view}-${i}`,
      name: a.name,
      size: a.size,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      sizeNote: a.sizeNote || '',
    }))
  }

  const check = checkDesign(body.views, areasByView)
  if (!check.ok) return bad(check.error)
  const { design } = check

  // Quantity and colour
  const qty = Math.floor(Number(body.qty))
  const minQty = product.minQuantity ?? 1
  if (!Number.isFinite(qty) || qty < minQty || qty > 100000) return bad(`The minimum order is ${minQty} pieces.`)
  const colour = (product.colours || []).find((c) => c.name === body.colour)?.name || product.colours?.[0]?.name || ''

  // Print methods and the price
  const methodDocs = await payload.find({ collection: 'print-methods', where: { active: { equals: true } }, sort: 'order', limit: 50, depth: 0 })
  const methods = methodDocs.docs
  const prices: Record<number, MethodPrices> = Object.fromEntries(
    methods.map((m) => [m.id, { small: m.smallPrice, medium: m.mediumPrice, large: m.largePrice }]),
  )
  const chosen = (areaKey: string) => {
    const id = Number(body.methodByArea?.[areaKey])
    return methods.find((m) => m.id === id) || methods[0] || null
  }
  const areasUsed = design.used.map((u) => {
    const m = chosen(u.areaKey)
    const extra = m ? prices[m.id][u.size as AreaSize] || 0 : 0
    return { ...u, method: m?.id ?? null, methodTitle: m?.title || '', extra }
  })
  const extrasPerPiece = studioExtras(
    areasUsed.map((a) => ({ size: a.size as AreaSize, methodId: a.method })),
    prices,
  )
  const baseUnit = unitPriceFor(product.price, (product.priceTiers || []).map((t) => ({ minQuantity: t.minQuantity, price: t.price })), qty)
  const perPiece = baseUnit + extrasPerPiece
  const total = perPiece * qty

  // Update the customer's own saved design if the token matches, otherwise start a new one
  let existing = null
  if (typeof body.token === 'string' && body.token) {
    const r = await payload.find({ collection: 'designs', where: { token: { equals: body.token } }, limit: 1, overrideAccess: true })
    existing = r.docs[0] && r.docs[0].status === 'saved' ? r.docs[0] : null
  }
  const token = existing ? body.token! : randomBytes(18).toString('base64url')

  // Preview pictures (one per side that has a design)
  const previews: { view: string; url: string }[] = []
  for (const view of Object.keys(design.views)) {
    const dataUrl = body.previews?.[view]
    const m = typeof dataUrl === 'string' ? /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null
    if (!m) continue
    const buf = Buffer.from(m[1], 'base64')
    if (buf.length > MAX_PREVIEW_BYTES || !PNG_MAGIC.every((b, i) => buf[i] === b)) continue
    previews.push({ view, url: await putObject(`designs/${token}/preview-${view}.png`, buf, 'image/png') })
  }

  const data = {
    token,
    status: 'saved' as const,
    product: product.id,
    productTitle: product.title,
    colour,
    quantity: qty,
    baseUnit,
    extrasPerPiece,
    perPiece,
    total,
    areasUsed,
    previews,
    files: design.files.map((url) => ({ url })),
    views: design.views,
    methodByArea: body.methodByArea || {},
  }
  if (existing) await payload.update({ collection: 'designs', id: existing.id, data, overrideAccess: true })
  else await payload.create({ collection: 'designs', data, overrideAccess: true })

  return NextResponse.json({ token, baseUnit, extrasPerPiece, perPiece, total, previews })
}
