import 'server-only'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { unitPriceFor } from '@/lib/shop/pricing'
import { quoteDesign } from '@/lib/studio/order'

/** What the customer put in their quote basket. The browser only says WHAT; the price is always worked out here. */
export type QuoteItemInput = { kind: 'product'; slug: string; colour?: string; qty: number } | { kind: 'design'; token: string }

export type QuoteLine = {
  ok: true
  key: string
  kind: 'product' | 'design'
  productId: number
  slug: string
  title: string
  image: string | null
  colour: string
  quantity: number
  minQty: number
  unitPrice: number
  printingPerPiece: number
  lineTotal: number
  designId?: number
  designToken?: string
  designPreview?: string
}
export type QuoteLineError = { ok: false; key: string; error: string }

export const MAX_QUOTE_ITEMS = 20
export const MAX_QUOTE_QTY = 100000

/** Prices each basket item from the database: product price for that quantity, plus printing for studio designs. */
export async function estimateItems(items: QuoteItemInput[]): Promise<(QuoteLine | QuoteLineError)[]> {
  const payload = await getPayload({ config: configPromise })
  const out: (QuoteLine | QuoteLineError)[] = []

  for (const it of items.slice(0, MAX_QUOTE_ITEMS)) {
    if (it.kind === 'design') {
      const key = `design:${it.token}`
      const q = await quoteDesign(String(it.token || ''))
      if (!q.ok) {
        out.push({ ok: false, key, error: q.error })
        continue
      }
      out.push({
        ok: true,
        key,
        kind: 'design',
        productId: q.product.id,
        slug: q.product.slug,
        title: q.product.title,
        image: q.design.previews[0]?.url || q.product.image,
        colour: q.colour,
        quantity: q.quantity,
        minQty: q.product.minQty,
        unitPrice: q.unitPrice,
        printingPerPiece: q.printing,
        lineTotal: q.unitPrice * q.quantity,
        designId: q.design.id,
        designToken: q.design.token,
        designPreview: q.design.previews[0]?.url,
      })
      continue
    }

    const key = `product:${it.slug}:${it.colour || ''}`
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: String(it.slug || '') }, published: { equals: true } },
      limit: 1,
      depth: 1,
    })
    const p = found.docs[0]
    if (!p) {
      out.push({ ok: false, key, error: 'This product is no longer available.' })
      continue
    }
    const minQty = p.minQuantity ?? 1
    const qty = Math.floor(Number(it.qty))
    if (!Number.isFinite(qty) || qty < minQty) {
      out.push({ ok: false, key, error: `The minimum for ${p.title} is ${minQty} pieces.` })
      continue
    }
    if (qty > MAX_QUOTE_QTY) {
      out.push({ ok: false, key, error: 'Please ask for a custom quote for this quantity.' })
      continue
    }
    const colours = (p.colours || []).map((c) => c.name)
    const colour = colours.includes(it.colour || '') ? (it.colour as string) : colours[0] || ''
    const unit = unitPriceFor(p.price, p.priceTiers, qty)
    const first = p.images?.[0]?.image
    out.push({
      ok: true,
      key,
      kind: 'product',
      productId: p.id,
      slug: p.slug || '',
      title: p.title,
      image: first && typeof first === 'object' ? first.url || null : null,
      colour,
      quantity: qty,
      minQty,
      unitPrice: unit,
      printingPerPiece: 0,
      lineTotal: unit * qty,
    })
  }
  return out
}
