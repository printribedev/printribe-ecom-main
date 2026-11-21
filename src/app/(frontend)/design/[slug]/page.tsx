import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { DesignStudio } from '@/components/Studio/DesignStudio'
import type { StudioArea, StudioProduct, StudioViewKey } from '@/lib/studio/types'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

const obj = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  return { title: `Design studio | ${slug.replace(/-/g, ' ')} | Printribe`, robots: { index: false } }
}

export default async function DesignPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 2,
  })
  const product = res.docs[0]
  if (!product) notFound()

  const views = (product.studio?.views || [])
    .map((v) => ({
      view: v.view as StudioViewKey,
      areas: (v.areas || []).map(
        (a, i): StudioArea => ({
          key: a.id || `${v.view}-${i}`,
          name: a.name,
          size: a.size,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          sizeNote: a.sizeNote || '',
        }),
      ),
    }))
    .filter((v) => v.areas.length > 0)

  if (!product.studio?.enabled || views.length === 0) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)]">Designing is not available for this product yet</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-body">You can still order it as it is, or contact us and we will help with your design.</p>
        <Link href={`/products/${slug}`} className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
          Back to the product
        </Link>
      </div>
    )
  }

  const methods = await payload.find({ collection: 'print-methods', where: { active: { equals: true } }, sort: 'order', limit: 50, depth: 0 })

  const data: StudioProduct = {
    slug: product.slug || slug,
    title: product.title,
    price: product.price,
    minQty: product.minQuantity ?? 1,
    tiers: (product.priceTiers || []).map((t) => ({ minQuantity: t.minQuantity, price: t.price })),
    colours: (product.colours || []).map((c) => {
      const mockups: StudioProduct['colours'][number]['mockups'] = {}
      for (const m of c.mockups || []) {
        const img = obj<Media>(m.image)
        if (img?.url) mockups[m.view as StudioViewKey] = img.url
      }
      return { name: c.name, hex: c.hex, mockups }
    }),
    views,
    methods: methods.docs.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description || '',
      small: m.smallPrice,
      medium: m.mediumPrice,
      large: m.largePrice,
    })),
  }
  if (data.colours.length === 0) data.colours = [{ name: 'Default', hex: '#FFFFFF', mockups: {} }]

  return <DesignStudio p={data} />
}
