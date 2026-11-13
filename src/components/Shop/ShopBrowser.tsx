'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { ShopCategory, ShopProduct } from './types'

const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'fastest'
type Menu = null | 'price' | 'delivery' | 'colours' | 'sort'

/* ---------- Product card ---------- */

const ProductCard: React.FC<{ p: ShopProduct; onQuickAdd: (p: ShopProduct) => void }> = ({ p, onQuickAdd }) => {
  const shown = p.colours.slice(0, 3)
  const extra = p.colours.length - shown.length
  return (
    <div className="group w-[min(78vw,290px)] shrink-0 snap-start sm:w-[calc((100%-3rem)/4)] sm:min-w-[230px]">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
        {p.image ? (
          <img src={p.image} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Photo coming</div>
        )}
        {p.hoverImage && (
          <img
            src={p.hoverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-body">
          <span>
            {p.minQty} minimum · {p.deliveryDays}
          </span>
          {p.colours.length > 0 && (
            <span className="flex items-center gap-1">
              {shown.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ background: c.hex }}
                />
              ))}
              {extra > 0 && <span>+{extra}</span>}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onQuickAdd(p)}
          className="absolute inset-x-3 bottom-10 rounded-full bg-ink py-2.5 text-[15px] font-medium text-white opacity-100 transition-opacity hover:bg-ink/85 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          Quick Add
        </button>
      </div>
      <Link href={`/products/${p.slug}`} className="mt-3 block">
        <div className="font-heading text-[17px] leading-snug text-ink">{p.title}</div>
        <div className="text-[15px] text-muted-foreground">From {rupees(p.price)}</div>
      </Link>
    </div>
  )
}

/* ---------- Quick Add drawer ---------- */

const Drawer: React.FC<{ p: ShopProduct | null; onClose: () => void }> = ({ p, onClose }) => {
  const [qty, setQty] = useState(1)
  useEffect(() => {
    if (p) setQty(p.minQty)
  }, [p])
  useEffect(() => {
    if (!p) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [p, onClose])
  if (!p) return null
  const safeQty = Math.max(p.minQty, qty || p.minQty)
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Quick add">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-heading text-xl">Your order</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-body">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F3F4F6]">
              {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[17px]">{p.title}</div>
              <div className="text-[15px] text-muted-foreground">{rupees(p.price)} per piece, GST included</div>
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="qa-qty" className="text-sm text-body">
                  Quantity
                </label>
                <input
                  id="qa-qty"
                  type="number"
                  min={p.minQty}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
                  onBlur={() => setQty(safeQty)}
                  className="w-24 rounded-lg border border-border px-3 py-2 text-[15px]"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Minimum {p.minQty}. You choose sizes and colours next.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-6 py-5">
          <div className="flex justify-between text-[15px] text-body">
            <span>Design help</span>
            <span>Free</span>
          </div>
          <div className="mt-1 flex justify-between text-[15px] text-body">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="mt-3 flex justify-between font-heading text-lg">
            <span>Total</span>
            <span>{rupees(p.price * safeQty)}</span>
          </div>
          <Link
            href={`/products/${p.slug}`}
            className="mt-4 block rounded-full bg-sky py-3.5 text-center text-[17px] font-medium text-white hover:bg-sky/90"
          >
            Choose sizes and buy
          </Link>
          <Link href={`/products/${p.slug}`} className="mt-3 block text-center text-[15px] text-body underline">
            See full details
          </Link>
        </div>
      </aside>
    </div>
  )
}

/* ---------- Filter pill with dropdown ---------- */

const Pill: React.FC<{
  label: string
  active?: boolean
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}> = ({ label, active, open, onToggle, children }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`rounded-full border px-4 py-2 text-[15px] ${
        active || open ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink hover:border-ink/40'
      }`}
    >
      {label} <span className="text-xs">▾</span>
    </button>
    {open && (
      <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-white p-4 shadow-lg">
        {children}
      </div>
    )}
  </div>
)

/* ---------- Main ---------- */

export const ShopBrowser: React.FC<{ categories: ShopCategory[]; products: ShopProduct[] }> = ({
  categories,
  products,
}) => {
  const [menu, setMenu] = useState<Menu>(null)
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [maxDays, setMaxDays] = useState(0)
  const [colourPick, setColourPick] = useState<string[]>([])
  const [sort, setSort] = useState<Sort>('featured')
  const [focus, setFocus] = useState<{ type: 'cat' | 'sub'; id: number } | null>(null)
  const [quick, setQuick] = useState<ShopProduct | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Close an open filter menu when the visitor clicks elsewhere
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [])

  const mains = useMemo(
    () => categories.filter((c) => c.parentId == null).sort((a, b) => a.order - b.order),
    [categories],
  )
  const subsOf = (id: number) =>
    categories.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order)
  const allColours = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.colours.map((c) => c.name)))).sort(),
    [products],
  )

  const filtersOn = !!(priceFrom || priceTo || maxDays || colourPick.length || sort !== 'featured' || focus)

  const apply = (list: ShopProduct[]) => {
    const from = parseFloat(priceFrom)
    const to = parseFloat(priceTo)
    let out = list.filter(
      (p) =>
        (isNaN(from) || p.price >= from) &&
        (isNaN(to) || p.price <= to) &&
        (!maxDays || p.maxDays <= maxDays) &&
        (!colourPick.length || p.colours.some((c) => colourPick.includes(c.name))),
    )
    if (sort === 'price-asc') out = [...out].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') out = [...out].sort((a, b) => b.price - a.price)
    if (sort === 'fastest') out = [...out].sort((a, b) => a.maxDays - b.maxDays)
    return out
  }

  const clearAll = () => {
    setPriceFrom('')
    setPriceTo('')
    setMaxDays(0)
    setColourPick([])
    setSort('featured')
    setFocus(null)
    setMenu(null)
  }

  const toggle = (m: Exclude<Menu, null>) => setMenu(menu === m ? null : m)

  // What to show: either a flat grid (filtered / focused) or the category sections
  const flat = useMemo(() => {
    if (!filtersOn) return null
    let list = products
    if (focus?.type === 'cat') list = list.filter((p) => p.categoryId === focus.id)
    if (focus?.type === 'sub') list = list.filter((p) => p.subCategoryId === focus.id)
    return apply(list)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filtersOn, focus, priceFrom, priceTo, maxDays, colourPick, sort])

  const focusTitle = focus ? categories.find((c) => c.id === focus.id)?.title : null

  return (
    <>
      {/* Heading and filters */}
      <div className="container pt-12 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-[clamp(32px,5vw,52px)] leading-none text-ink">All products</h1>
          <div ref={barRef} className="flex flex-wrap items-center gap-2">
            <Pill label="Price" active={!!(priceFrom || priceTo)} open={menu === 'price'} onToggle={() => toggle('price')}>
              <div className="flex gap-3">
                <label className="flex-1 text-xs text-muted-foreground">
                  From (₹)
                  <input
                    type="number"
                    min={0}
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-[15px] text-ink"
                  />
                </label>
                <label className="flex-1 text-xs text-muted-foreground">
                  To (₹)
                  <input
                    type="number"
                    min={0}
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-[15px] text-ink"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPriceFrom('')
                  setPriceTo('')
                }}
                className="mt-3 text-sm text-body underline"
              >
                Clear
              </button>
            </Pill>
            <Pill label="Delivery" active={!!maxDays} open={menu === 'delivery'} onToggle={() => toggle('delivery')}>
              {[0, 7, 10, 15].map((d) => (
                <label key={d} className="flex cursor-pointer items-center gap-2 py-1.5 text-[15px] text-ink">
                  <input type="radio" name="days" checked={maxDays === d} onChange={() => setMaxDays(d)} />
                  {d === 0 ? 'Any time' : `Within ${d} days`}
                </label>
              ))}
            </Pill>
            <Pill label="Colours" active={colourPick.length > 0} open={menu === 'colours'} onToggle={() => toggle('colours')}>
              {allColours.length === 0 && <p className="text-sm text-muted-foreground">No colours yet.</p>}
              <div className="max-h-56 overflow-y-auto">
                {allColours.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-2 py-1.5 text-[15px] text-ink">
                    <input
                      type="checkbox"
                      checked={colourPick.includes(c)}
                      onChange={() =>
                        setColourPick((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))
                      }
                    />
                    {c}
                  </label>
                ))}
              </div>
            </Pill>
            <Pill label="Sort" active={sort !== 'featured'} open={menu === 'sort'} onToggle={() => toggle('sort')}>
              {(
                [
                  ['featured', 'Featured'],
                  ['price-asc', 'Price: low to high'],
                  ['price-desc', 'Price: high to low'],
                  ['fastest', 'Fastest delivery'],
                ] as [Sort, string][]
              ).map(([v, l]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 py-1.5 text-[15px] text-ink">
                  <input type="radio" name="sort" checked={sort === v} onChange={() => setSort(v)} />
                  {l}
                </label>
              ))}
            </Pill>
          </div>
        </div>
      </div>

      {/* Category tiles */}
      {mains.length > 0 && (
        <div className="container">
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {mains.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.slug}`}
                onClick={() => setFocus(null)}
                className="flex w-[88px] shrink-0 flex-col items-center gap-2 text-center text-[13px] text-ink"
              >
                <span className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-xl bg-[#F3F4F6]">
                  {c.image ? (
                    <img src={c.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Photo</span>
                  )}
                </span>
                {c.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filtered or focused view: one grid */}
      {flat && (
        <section className="container py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-[clamp(24px,3vw,32px)]">{focusTitle || 'Results'}</h2>
            <div className="flex items-center gap-4 text-[15px] text-body">
              {flat.length} {flat.length === 1 ? 'product' : 'products'}
              <button type="button" onClick={clearAll} className="underline">
                Clear all
              </button>
            </div>
          </div>
          {flat.length === 0 ? (
            <p className="py-16 text-center text-lg text-body">No products match. Try clearing a filter.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4 [&>div]:w-auto [&>div]:min-w-0">
              {flat.map((p) => (
                <ProductCard key={p.id} p={p} onQuickAdd={setQuick} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Normal view: one section per category */}
      {!flat &&
        mains.map((c) => {
          const items = products.filter((p) => p.categoryId === c.id)
          if (!items.length) return null
          return (
            <section key={c.id} id={`cat-${c.slug}`} className="container scroll-mt-28 py-10">
              <h2 className="font-heading text-[clamp(26px,3.4vw,36px)]">{c.title}</h2>
              {c.description && <p className="mt-2 max-w-xl text-[15px] text-body">{c.description}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {subsOf(c.id).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFocus({ type: 'sub', id: s.id })}
                    className="rounded-full border border-border bg-white px-4 py-1.5 text-[14px] text-ink hover:border-ink/40"
                  >
                    {s.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFocus({ type: 'cat', id: c.id })}
                  className="px-2 text-[14px] text-ink underline"
                >
                  See all →
                </button>
              </div>
              <div className="no-scrollbar mt-6 flex snap-x gap-5 overflow-x-auto pb-2">
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} onQuickAdd={setQuick} />
                ))}
              </div>
            </section>
          )
        })}

      {!flat && products.length === 0 && (
        <p className="container py-24 text-center text-lg text-body">Products are on their way. Please check back soon.</p>
      )}

      <Drawer p={quick} onClose={() => setQuick(null)} />
    </>
  )
}
