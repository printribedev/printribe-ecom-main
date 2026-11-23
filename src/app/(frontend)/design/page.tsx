import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Media, ProductCategory } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Design Studio | Printribe',
  description: 'Design your own custom apparel and accessories online. Add your logo or text, see it on the product and get the price instantly.',
}

const obj = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export default async function DesignHubPage() {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'products',
    where: { published: { equals: true }, 'studio.enabled': { equals: true } },
    limit: 200,
    depth: 1,
  })

  // Only products that really have a print area set up
  const products = res.docs.filter((p) => (p.studio?.views || []).some((v) => (v.areas || []).length > 0))

  // Group by main category, in the order set in the admin
  const groups = new Map<number, { title: string; order: number; items: typeof products }>()
  for (const p of products) {
    const cat = obj<ProductCategory>(p.category)
    const id = cat?.id ?? 0
    if (!groups.has(id)) groups.set(id, { title: cat?.title || 'More products', order: cat?.order ?? 99, items: [] })
    groups.get(id)!.items.push(p)
  }
  const sections = [...groups.values()].sort((a, b) => a.order - b.order)

  return (
    <div className="container py-12 pb-24">
      <p className="text-[15px] text-muted-foreground">Design Studio</p>
      <h1 className="font-heading mt-1 text-[clamp(34px,5vw,56px)] leading-tight">Let&apos;s make something.</h1>
      <p className="mt-4 max-w-2xl text-lg text-body">
        Pick a product, add your logo or text, and see it on the product with the price updating as you go. Not sure where to start?{' '}
        <Link href="/contact" className="text-sky underline underline-offset-2">
          Our designers help for free.
        </Link>
      </p>

      {sections.length === 0 ? (
        <div className="mt-14 rounded-xl border border-border p-10 text-center">
          <h2 className="font-heading text-2xl">The studio is opening soon</h2>
          <p className="mx-auto mt-2 max-w-md text-body">We are getting our first products ready for designing. You can still order any product as it is, or ask us for design help.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
              Browse products
            </Link>
            <Link href="/contact" className="rounded-full border border-ink px-6 py-3 text-[17px] font-medium text-ink hover:bg-ink hover:text-white">
              Get free design help
            </Link>
          </div>
        </div>
      ) : (
        sections.map((s) => (
          <section key={s.title} className="mt-14">
            <h2 className="font-heading text-2xl">{s.title}</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {s.items.map((p) => {
                const img = obj<Media>(p.images?.[0]?.image)
                return (
                  <div key={p.id}>
                    <Link href={`/design/${p.slug}`} className="group block">
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
                        {img?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Photo coming</div>
                        )}
                      </div>
                      <div className="font-heading mt-3 text-[17px] text-ink">{p.title}</div>
                      <div className="text-[15px] text-muted-foreground">From {money(p.price)}</div>
                    </Link>
                    <Link
                      href={`/design/${p.slug}`}
                      className="mt-3 inline-flex rounded-full bg-ink px-5 py-2 text-[15px] font-medium text-white hover:bg-ink/90"
                    >
                      Design now
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
