import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ShopBrowser } from '@/components/Shop/ShopBrowser'
import type { ShopCategory, ShopProduct } from '@/components/Shop/types'
import type { Media } from '@/payload-types'

// Always fresh, so products added in the admin appear straight away
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All products | Printribe',
  description: 'Custom apparel and accessories, made to order and delivered on time.',
}

const url = (m: unknown): string | null => {
  if (!m || typeof m !== 'object') return null
  const media = m as Media
  return media.url || null
}

/** "10 to 15 days" -> 15, "7 days" -> 7. Used by the Delivery filter. */
const daysFrom = (text: string | null | undefined): number => {
  const nums = (text || '').match(/\d+/g)?.map(Number) ?? []
  return nums.length ? Math.max(...nums) : 99
}

export default async function ShopPage() {
  const payload = await getPayload({ config: configPromise })

  const [cats, prods] = await Promise.all([
    payload.find({ collection: 'product-categories', limit: 200, depth: 1, pagination: false }),
    payload.find({
      collection: 'products',
      limit: 500,
      depth: 1,
      pagination: false,
      where: { published: { equals: true } },
      sort: 'createdAt',
    }),
  ])

  const id = (v: unknown): number | null =>
    typeof v === 'number' ? v : v && typeof v === 'object' ? (v as { id: number }).id : null

  const categories: ShopCategory[] = cats.docs.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug || String(c.id),
    description: c.description || '',
    image: url(c.image),
    parentId: id(c.parent),
    order: c.order ?? 10,
  }))

  const products: ShopProduct[] = prods.docs.flatMap((p) => {
    const categoryId = id(p.category)
    if (categoryId == null) return []
    return [
      {
        id: p.id,
        title: p.title,
        slug: p.slug || String(p.id),
        price: p.price,
        minQty: p.minQuantity ?? 1,
        deliveryDays: p.deliveryDays || '',
        maxDays: daysFrom(p.deliveryDays),
        image: url(p.images?.[0]?.image),
        hoverImage: url(p.images?.[1]?.image),
        colours: (p.colours || []).map((c) => ({ name: c.name, hex: c.hex })),
        categoryId,
        subCategoryId: id(p.subCategory),
      },
    ]
  })

  return <ShopBrowser categories={categories} products={products} />
}
