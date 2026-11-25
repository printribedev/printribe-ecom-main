import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

const STEPS = [
  { title: 'Tell us what you need', text: 'Finish the sentence above. Add a logo or details if you have them.' },
  { title: 'We send a price and mockup', text: 'Our designers help for free. Mockups typically arrive within 24 hours.' },
  { title: 'You approve and pay', text: 'Check the mockup, confirm the quantity and pay securely online.' },
  { title: 'We print, check and ship', text: 'Every piece is inspected. Standard delivery is 10 to 15 days after payment.' },
]

// True numbers confirmed by the owner (do not change without checking)
const STATS = [
  { value: '1,000+', label: 'customers served' },
  { value: '100,000+', label: 'products delivered' },
  { value: '5+', label: 'years in business' },
]

/** "Ordering in bulk?" part of the Contact page: how it works and the real volume prices from the shop. */
export const BulkSection: React.FC = async () => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({ collection: 'products', where: { published: { equals: true } }, limit: 100, depth: 0, sort: 'title' })
  const withSlabs = res.docs.filter((p) => (p.priceTiers || []).length > 0).slice(0, 6)

  return (
    <section id="bulk" className="scroll-mt-28">
      <div className="rounded-3xl border border-border p-8 md:p-12">
        <p className="text-[15px] font-medium text-sky">Teams, colleges, companies and events</p>
        <h2 className="font-heading mt-2 text-[clamp(28px,4vw,44px)] leading-tight">Ordering in bulk?</h2>
        <p className="mt-3 max-w-2xl text-lg text-body">The more you order, the less each piece costs. Prices for the quantities below are fixed, so you know what you will pay.</p>

        <dl className="mt-8 grid gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="font-heading text-[clamp(30px,4vw,44px)] leading-none">{s.value}</dt>
              <dd className="mt-1 text-[15px] text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-[#F3F4F6] p-5">
              <span className="font-heading text-sm text-sky">Step {i + 1}</span>
              <h3 className="font-heading mt-1 text-lg">{s.title}</h3>
              <p className="mt-1 text-[15px] text-body">{s.text}</p>
            </li>
          ))}
        </ol>

        {withSlabs.length > 0 && (
          <div className="mt-10">
            <h3 className="font-heading text-xl">Volume prices (per piece, GST included)</h3>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="bg-[#F3F4F6]">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">Buy more, pay less</th>
                  </tr>
                </thead>
                <tbody>
                  {withSlabs.map((p) => {
                    const tiers = [...(p.priceTiers || [])].sort((a, b) => a.minQuantity - b.minQuantity)
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <Link href={`/products/${p.slug}`} className="font-medium hover:text-sky">
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {money(p.price)} <span className="text-muted-foreground">({p.minQuantity ?? 1}+)</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {tiers.map((t) => {
                              const save = p.price > 0 ? Math.round((1 - t.price / p.price) * 100) : 0
                              return (
                                <span key={t.minQuantity} className="rounded-full bg-sky-tint px-3 py-1 text-sm text-sky">
                                  {t.minQuantity}+: {money(t.price)}
                                  {save > 0 ? ` · save ${save}%` : ''}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Printing is extra and depends on the print areas and method you choose. You can see it live in the Design Studio.</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/quote" className="inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85">
            Build a quote
          </Link>
          <Link href="/design" className="inline-flex rounded-full border border-ink px-6 py-3 text-[17px] font-medium hover:bg-ink hover:text-white">
            Try the Design Studio
          </Link>
        </div>
      </div>
    </section>
  )
}
