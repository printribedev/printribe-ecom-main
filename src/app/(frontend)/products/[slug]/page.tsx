import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { ProductView, type ProductViewData } from '@/components/Shop/ProductView'
import type { Media, Product, ProductCategory } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

const obj = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)

async function getProduct(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 2,
  })
  return { payload, product: res.docs[0] || null }
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const { product } = await getProduct(slug)
  if (!product) return { title: 'Product not found | Printribe' }
  return { title: `${product.title} | Printribe`, description: product.description || undefined }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const { payload, product } = await getProduct(slug)
  if (!product) notFound()

  const category = obj<ProductCategory>(product.category)
  const sub = obj<ProductCategory>(product.subCategory)

  const data: ProductViewData = {
    slug: product.slug || slug,
    title: product.title,
    price: product.price,
    minQty: product.minQuantity ?? 1,
    deliveryDays: product.deliveryDays || '',
    tiers: (product.priceTiers || []).map((t) => ({ minQuantity: t.minQuantity, price: t.price })),
    images: (product.images || []).flatMap((i) => {
      const m = obj<Media>(i.image)
      return m?.url ? [{ url: m.url, alt: m.alt || product.title }] : []
    }),
    colours: (product.colours || []).map((c) => ({ name: c.name, hex: c.hex })),
    sizes: (product.sizes || []).map((s) => s.size),
  }

  // More from the same category
  const related = await payload.find({
    collection: 'products',
    where: {
      published: { equals: true },
      id: { not_equals: product.id },
      ...(sub ? { subCategory: { equals: sub.id } } : category ? { category: { equals: category.id } } : {}),
    },
    limit: 4,
    depth: 1,
  })

  return (
    <div className="container py-8 pb-20">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-x-2 text-[15px] text-muted-foreground">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink">All products</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/shop#cat-${category.slug}`} className="hover:text-ink">{category.title}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <ProductView p={data} />

      {product.description && (
        <section className="mt-16 max-w-2xl">
          <h2 className="font-heading text-2xl">About this product</h2>
          <p className="mt-3 whitespace-pre-line text-[17px] text-body">{product.description}</p>
        </section>
      )}

      <section className="mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
        {[
          ['Free design help', 'Send your idea and we help get the design ready.'],
          ['Every piece checked', 'Each order is inspected before it ships.'],
          ['Four print methods', 'Screen printing, embroidery, heat transfer and DTF.'],
        ].map(([t, d]) => (
          <div key={t}>
            <div className="font-heading text-lg">{t}</div>
            <p className="mt-1 text-[15px] text-body">{d}</p>
          </div>
        ))}
      </section>

      {related.docs.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-2xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {related.docs.map((r) => {
              const img = obj<Media>(r.images?.[0]?.image)
              return (
                <Link key={r.id} href={`/products/${r.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
                    {img?.url ? (
                      <img src={img.url} alt={r.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Photo coming</div>
                    )}
                  </div>
                  <div className="font-heading mt-3 text-[17px] text-ink">{r.title}</div>
                  <div className="text-[15px] text-muted-foreground">
                    From ₹{Math.round(r.price).toLocaleString('en-IN')}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
