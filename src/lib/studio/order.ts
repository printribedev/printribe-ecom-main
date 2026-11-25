import 'server-only'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { deliveryFeeFor, unitPriceFor } from '@/lib/shop/pricing'

export type DesignQuote =
  | { ok: false; error: string }
  | {
      ok: true
      product: { id: number; slug: string; title: string; image: string | null; minQty: number }
      colour: string
      productSizes: string[]
      sizes: { size: string; quantity: number }[]
      quantity: number
      printing: number
      unitPrice: number
      subtotal: number
      deliveryFee: number
      total: number
      design: {
        id: number
        token: string
        previews: { view: string; url: string }[]
        files: string[]
        areasUsed: { view: string; areaName: string; size: string; methodTitle: string; extra: number }[]
        views: Record<string, unknown> | null
      }
    }

/**
 * Works out what a studio order costs, from the saved design and the database. Nothing about price comes from the browser.
 * Price per piece = product price for this quantity + the printing extra for every print area used (with today's method prices).
 * `sizeInput` is the sizes chosen at checkout; leave it out to get the quote without sizes (used to show the checkout page).
 */
export async function quoteDesign(token: string, sizeInput?: Record<string, number>): Promise<DesignQuote> {
  if (!token || token.length < 10) return { ok: false, error: 'We could not find your design. Please open it in the studio and try again.' }
  const payload = await getPayload({ config: configPromise })

  const found = await payload.find({ collection: 'designs', where: { token: { equals: token } }, limit: 1, overrideAccess: true, depth: 0 })
  const d = found.docs[0]
  if (!d || d.status !== 'saved') return { ok: false, error: 'We could not find your design. Please open it in the studio and try again.' }

  const productId = typeof d.product === 'object' && d.product ? d.product.id : d.product
  if (!productId) return { ok: false, error: 'This product is not available.' }
  const p = await payload.findByID({ collection: 'products', id: productId, depth: 1, overrideAccess: true }).catch(() => null)
  if (!p || !p.published || !p.studio?.enabled) return { ok: false, error: 'This product can no longer be designed online.' }

  const quantity = Math.floor(d.quantity || 0)
  const minQty = p.minQuantity ?? 1
  if (!Number.isInteger(quantity) || quantity < minQty) return { ok: false, error: `The minimum order for this product is ${minQty} pieces. Please open your design and change the quantity.` }
  if (quantity > 5000) return { ok: false, error: 'For orders this large, please get in touch for a quote.' }

  // Sizes chosen at checkout must be real sizes and add up to the quantity
  const productSizes = (p.sizes || []).map((s) => s.size)
  let sizes: { size: string; quantity: number }[] = []
  if (sizeInput) {
    if (productSizes.length > 0) {
      const entries = Object.entries(sizeInput).filter(([, n]) => Number(n) > 0)
      if (entries.some(([s, n]) => !productSizes.includes(s) || !Number.isInteger(Number(n)))) return { ok: false, error: 'One of the sizes is not available.' }
      sizes = entries.map(([size, q]) => ({ size, quantity: Number(q) }))
      const sum = sizes.reduce((a, b) => a + b.quantity, 0)
      if (sum !== quantity) return { ok: false, error: `Your sizes add up to ${sum} pieces, but your design is for ${quantity}. Please make them match.` }
    }
  }

  // Printing extras, with the CURRENT price of each chosen method
  const rows = d.areasUsed || []
  const methodIds = [...new Set(rows.map((r) => (typeof r.method === 'object' && r.method ? r.method.id : r.method)).filter((x): x is number => typeof x === 'number'))]
  const methods = methodIds.length
    ? (await payload.find({ collection: 'print-methods', where: { id: { in: methodIds } }, limit: 50, overrideAccess: true, depth: 0 })).docs
    : []
  let printing = 0
  const areasUsed: { view: string; areaName: string; size: string; methodTitle: string; extra: number }[] = []
  for (const r of rows) {
    const mid = typeof r.method === 'object' && r.method ? r.method.id : r.method
    const m = methods.find((x) => x.id === mid)
    if (mid != null && (!m || !m.active)) {
      return { ok: false, error: 'A print method used in your design is no longer available. Please open your design and choose another.' }
    }
    const extra = m ? (r.size === 'small' ? m.smallPrice : r.size === 'large' ? m.largePrice : m.mediumPrice) : 0
    printing += extra
    areasUsed.push({ view: r.view || '', areaName: r.areaName || '', size: r.size || '', methodTitle: m?.title || '', extra })
  }
  if (rows.length === 0) return { ok: false, error: 'Your design is empty. Please add text or an image in the studio.' }

  const colours = (p.colours || []).map((c) => c.name)
  const colour = colours.includes(d.colour || '') ? (d.colour as string) : colours[0] || ''

  const settings = await payload.findGlobal({ slug: 'shop-settings' })
  const unitPrice = unitPriceFor(p.price, p.priceTiers, quantity) + printing
  const subtotal = unitPrice * quantity
  const deliveryFee = deliveryFeeFor(subtotal, { fee: settings.deliveryFee ?? 75, freeAbove: settings.freeDeliveryAbove ?? 1000 })

  const firstImage = p.images?.[0]?.image
  const image = firstImage && typeof firstImage === 'object' ? firstImage.url || null : null

  return {
    ok: true,
    product: { id: p.id, slug: p.slug || '', title: p.title, image, minQty },
    colour,
    productSizes,
    sizes,
    quantity,
    printing,
    unitPrice,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    design: {
      id: d.id,
      token,
      previews: (d.previews || []).map((x) => ({ view: x.view || '', url: x.url || '' })).filter((x) => x.url),
      files: (d.files || []).map((x) => x.url || '').filter(Boolean),
      areasUsed,
      views: (d.views as Record<string, unknown> | null) ?? null,
    },
  }
}
