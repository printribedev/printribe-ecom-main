import 'server-only'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { deliveryFeeFor, unitPriceFor } from './pricing'

/** Parses "S-12_M-15" into { S: 12, M: 15 }. Returns null if it is malformed. */
export function parseSizes(raw: string | null | undefined): Record<string, number> | null {
  if (!raw) return {}
  const out: Record<string, number> = {}
  for (const part of raw.split('_')) {
    const i = part.lastIndexOf('-')
    if (i <= 0) return null
    const size = part.slice(0, i)
    const n = Number(part.slice(i + 1))
    if (!Number.isInteger(n) || n < 0) return null
    if (n > 0) out[size] = (out[size] || 0) + n
  }
  return out
}

export type OrderQuote =
  | { ok: false; error: string }
  | {
      ok: true
      product: { id: number; slug: string; title: string; image: string | null; minQty: number }
      colour: string
      sizes: { size: string; quantity: number }[]
      quantity: number
      unitPrice: number
      subtotal: number
      deliveryFee: number
      total: number
    }

/** Works out what an order costs from the database. This is the only place prices are decided. */
export async function quoteOrder(input: {
  slug: string
  colour?: string
  sizes?: Record<string, number>
  qty?: number
}): Promise<OrderQuote> {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: input.slug }, published: { equals: true } },
    limit: 1,
    depth: 1,
  })
  const p = res.docs[0]
  if (!p) return { ok: false, error: 'This product is not available.' }

  const productSizes = (p.sizes || []).map((s) => s.size)
  let sizes: { size: string; quantity: number }[] = []
  let quantity: number

  if (productSizes.length > 0) {
    const entries = Object.entries(input.sizes || {}).filter(([, n]) => n > 0)
    if (entries.some(([s]) => !productSizes.includes(s))) return { ok: false, error: 'One of the sizes is not available.' }
    sizes = entries.map(([size, q]) => ({ size, quantity: q }))
    quantity = sizes.reduce((a, b) => a + b.quantity, 0)
  } else {
    quantity = Math.floor(input.qty || 0)
  }

  const minQty = p.minQuantity ?? 1
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: 'Please choose how many pieces you want.' }
  if (quantity < minQty) return { ok: false, error: `The minimum order for this product is ${minQty} pieces.` }
  if (quantity > 5000) return { ok: false, error: 'For orders this large, please get in touch for a quote.' }

  const colours = (p.colours || []).map((c) => c.name)
  let colour = input.colour || ''
  if (colours.length > 0) {
    if (!colours.includes(colour)) colour = colours[0]
  } else colour = ''

  const settings = await payload.findGlobal({ slug: 'shop-settings' })
  const unitPrice = unitPriceFor(p.price, p.priceTiers, quantity)
  const subtotal = unitPrice * quantity
  const deliveryFee = deliveryFeeFor(subtotal, {
    fee: settings.deliveryFee ?? 75,
    freeAbove: settings.freeDeliveryAbove ?? 1000,
  })

  const firstImage = p.images?.[0]?.image
  const image = firstImage && typeof firstImage === 'object' ? firstImage.url || null : null

  return {
    ok: true,
    product: { id: p.id, slug: p.slug || input.slug, title: p.title, image, minQty },
    colour,
    sizes,
    quantity,
    unitPrice,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  }
}
