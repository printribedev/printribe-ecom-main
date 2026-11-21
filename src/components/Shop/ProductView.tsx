'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export type ProductViewData = {
  slug: string
  title: string
  price: number
  minQty: number
  deliveryDays: string
  tiers: { minQuantity: number; price: number }[]
  images: { url: string; alt: string }[]
  colours: { name: string; hex: string }[]
  sizes: string[]
  /** True when customers can design this product in the design studio. */
  studio?: boolean
}

export const ProductView: React.FC<{ p: ProductViewData }> = ({ p }) => {
  const [active, setActive] = useState(0)
  const [colour, setColour] = useState(p.colours[0]?.name ?? '')
  const hasSizes = p.sizes.length > 0
  const [bySize, setBySize] = useState<Record<string, number>>({})
  const [single, setSingle] = useState(p.minQty)

  const total = hasSizes ? Object.values(bySize).reduce((a, b) => a + b, 0) : single
  const sortedTiers = useMemo(() => [...p.tiers].sort((a, b) => a.minQuantity - b.minQuantity), [p.tiers])
  const unit = useMemo(() => {
    let price = p.price
    for (const t of sortedTiers) if (total >= t.minQuantity) price = t.price
    return price
  }, [p.price, sortedTiers, total])

  const ready = total >= p.minQty
  const setSize = (s: string, n: number) => setBySize((cur) => ({ ...cur, [s]: Math.max(0, n || 0) }))

  const sizesParam = hasSizes
    ? Object.entries(bySize)
        .filter(([, n]) => n > 0)
        .map(([s, n]) => `${s}-${n}`)
        .join('_')
    : ''
  const buyHref =
    `/checkout?product=${encodeURIComponent(p.slug)}&qty=${total}` +
    (colour ? `&colour=${encodeURIComponent(colour)}` : '') +
    (sizesParam ? `&sizes=${encodeURIComponent(sizesParam)}` : '')

  const main = p.images[active]

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      {/* Gallery */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {p.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto sm:max-h-[620px] sm:flex-col sm:overflow-y-auto">
            {p.images.map((im, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show picture ${i + 1}`}
                className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#F3F4F6] ${
                  i === active ? 'ring-2 ring-ink' : ''
                }`}
              >
                <img src={im.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-square flex-1 overflow-hidden rounded-xl bg-[#F3F4F6]">
          {main ? (
            <img src={main.url} alt={main.alt || p.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">Photo coming</div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[13px] text-ink">
            {p.deliveryDays}
          </span>
        </div>
      </div>

      {/* Buy panel */}
      <div>
        <p className="font-heading text-lg text-muted-foreground">Custom printed</p>
        <h1 className="font-heading mt-1 text-[clamp(30px,4vw,44px)] leading-tight text-ink">{p.title}</h1>

        <div className="mt-6 divide-y divide-border border-t border-border">
          {p.colours.length > 0 && (
            <div className="flex items-start justify-between gap-4 py-5">
              <div>
                <div className="text-[15px] text-body">Colours</div>
                <div className="font-medium text-ink">{colour}</div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {p.colours.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={colour === c.name}
                    onClick={() => setColour(c.name)}
                    className={`h-10 w-10 rounded-full border border-black/10 ${
                      colour === c.name ? 'ring-2 ring-ink ring-offset-2' : ''
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="py-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[15px] text-body">{hasSizes ? 'Sizes and quantity' : 'Quantity'}</div>
              <div className="text-sm text-muted-foreground">Minimum {p.minQty} pieces</div>
            </div>
            {hasSizes ? (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {p.sizes.map((s) => (
                  <label key={s} className="block text-center">
                    <span className="mb-1 block text-sm font-medium text-ink">{s}</span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={bySize[s] ? bySize[s] : ''}
                      placeholder="0"
                      onChange={(e) => setSize(s, parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-border px-2 py-2.5 text-center text-[15px]"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="number"
                min={p.minQty}
                value={single}
                onChange={(e) => setSingle(parseInt(e.target.value, 10) || 0)}
                className="mt-3 w-32 rounded-lg border border-border px-3 py-2.5 text-[15px]"
              />
            )}
            <div className="mt-3 text-[15px] text-body">
              {total} {total === 1 ? 'piece' : 'pieces'} selected
              {!ready && total > 0 && <span className="text-error"> · add {p.minQty - total} more to reach the minimum</span>}
            </div>
          </div>

          {sortedTiers.length > 0 && (
            <div className="py-5">
              <div className="text-[15px] text-body">Buy more, pay less</div>
              <ul className="mt-2 space-y-1 text-[15px]">
                <li className="flex justify-between text-ink">
                  <span>{p.minQty} pieces +</span>
                  <span>{rupees(p.price)} each</span>
                </li>
                {sortedTiers.map((t) => (
                  <li key={t.minQuantity} className="flex justify-between text-ink">
                    <span>{t.minQuantity} pieces +</span>
                    <span>
                      {rupees(t.price)} each{' '}
                      <span className="text-sky">Save {Math.round((1 - t.price / p.price) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="py-5">
            <div className="text-[15px] text-body">Delivery</div>
            <div className="mt-1 text-ink">Standard: {p.deliveryDays}. Express available on request.</div>
          </div>
        </div>

        <div className="mt-2">
          <div className="font-heading text-[34px] leading-none text-ink">{rupees(unit * total)}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {rupees(unit)} per piece · {total} {total === 1 ? 'piece' : 'pieces'} · GST included, delivery at checkout
          </div>
        </div>

        {ready ? (
          <Link
            href={buyHref}
            className="mt-5 block rounded-full bg-sky py-3.5 text-center text-[17px] font-medium text-white hover:bg-sky/90"
          >
            Buy now
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 block w-full cursor-not-allowed rounded-full bg-sky/40 py-3.5 text-center text-[17px] font-medium text-white"
          >
            Choose at least {p.minQty} {p.minQty === 1 ? 'piece' : 'pieces'}
          </button>
        )}
        {p.studio && (
          <Link
            href={`/design/${p.slug}`}
            className="mt-3 block rounded-full bg-ink py-3.5 text-center text-[17px] font-medium text-white hover:bg-ink/90"
          >
            Design it yourself
          </Link>
        )}
        <Link
          href="/contact"
          className="mt-3 block rounded-full border border-ink py-3.5 text-center text-[17px] font-medium text-ink hover:bg-ink hover:text-white"
        >
          Get free design help
        </Link>
      </div>
    </div>
  )
}
