'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { clearBasket, getBasket, setBasket, type BasketItem } from '@/lib/quote/basket'
import { validateEmail, validateName, validatePhone } from '@/lib/shop/validation'

type Line =
  | { ok: false; key: string; error: string }
  | {
      ok: true
      key: string
      kind: 'product' | 'design'
      slug: string
      title: string
      image: string | null
      colour: string
      quantity: number
      minQty: number
      unitPrice: number
      printingPerPiece: number
      lineTotal: number
      designToken?: string
    }
type Errors = Record<string, string>
type Uploaded = { name: string; url: string }

const MAX_FILES = 3
const MAX_MB = 15
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const inputCls = (bad: boolean) => `mt-1 w-full rounded-lg border bg-white px-3.5 py-3 text-[16px] text-ink outline-none focus:border-ink ${bad ? 'border-error' : 'border-border'}`

const keyOf = (i: BasketItem) => (i.kind === 'design' ? `design:${i.token}` : `product:${i.slug}:${i.colour || ''}`)

const Field: React.FC<{ label: string; optional?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ label, optional, error, hint, children }) => (
  <label className="block">
    <span className="text-[15px] text-body">
      {label}
      {optional && <span className="text-muted-foreground"> (optional)</span>}
    </span>
    {children}
    {error ? <span className="mt-1 block text-sm text-error">{error}</span> : hint ? <span className="mt-1 block text-sm text-muted-foreground">{hint}</span> : null}
  </label>
)

export const QuoteBuilder: React.FC<{ replyTime: string; prefill?: { name?: string; email?: string; phone?: string } }> = ({ replyTime, prefill }) => {
  const [items, setItems] = useState<BasketItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [pricing, setPricing] = useState(false)

  const [v, setV] = useState({
    name: prefill?.name || '',
    phone: prefill?.phone || '',
    email: prefill?.email || '',
    company: '',
    gstNumber: '',
    city: '',
    pincode: '',
    multipleAddresses: false,
    timeline: 'standard' as 'standard' | 'deadline',
    deadline: '',
    notes: '',
    website: '', // hidden trap field for bots
  })
  const [files, setFiles] = useState<Uploaded[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [fileMsg, setFileMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [doneNumber, setDoneNumber] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const set = <K extends keyof typeof v>(k: K) => (val: (typeof v)[K]) => setV((cur) => ({ ...cur, [k]: val }))

  // Load the basket once, then keep prices fresh from the server
  useEffect(() => {
    setItems(getBasket())
    setLoaded(true)
  }, [])

  const itemsKey = useMemo(() => JSON.stringify(items), [items])
  useEffect(() => {
    if (!loaded) return
    if (items.length === 0) {
      setLines([])
      setSubtotal(0)
      return
    }
    let cancelled = false
    setPricing(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/quote/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
        const d = await res.json()
        if (!cancelled && res.ok) {
          setLines(d.lines)
          setSubtotal(d.subtotal)
        }
      } catch {}
      if (!cancelled) setPricing(false)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, loaded])

  const update = (next: BasketItem[]) => {
    setItems(next)
    setBasket(next)
  }
  const remove = (key: string) => update(items.filter((i) => keyOf(i) !== key))
  const setQty = (key: string, qty: number) =>
    update(items.map((i) => (i.kind === 'product' && keyOf(i) === key ? { ...i, qty } : i)))

  const addFile = async (file: File) => {
    setFileMsg('')
    if (files.length >= MAX_FILES) return setFileMsg(`You can attach up to ${MAX_FILES} files.`)
    if (!TYPES.includes(file.type)) return setFileMsg('Please use a PNG, JPG, WebP, SVG or PDF file.')
    if (file.size > MAX_MB * 1024 * 1024) return setFileMsg(`This file is over ${MAX_MB} MB. Please choose a smaller one.`)
    setUploading(true)
    try {
      const r = await fetch('/api/studio/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size, purpose: 'enquiry' }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'x')
      const put = await fetch(d.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!put.ok) throw new Error('x')
      setFiles((cur) => [...cur, { name: file.name, url: d.publicUrl }])
    } catch (e) {
      setFileMsg(e instanceof Error && e.message !== 'x' ? e.message : 'We could not upload that file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const found: Errors = {}
    const n = validateName(v.name)
    if (n) found.name = n
    const ph = validatePhone(v.phone)
    if (ph) found.phone = ph
    if (v.email) {
      const em = validateEmail(v.email)
      if (em) found.email = em
    }
    if (v.city.trim().length < 2) found.city = 'Please enter your city.'
    if (!/^[1-9]\d{5}$/.test(v.pincode.trim())) found.pincode = 'Enter a valid 6-digit pincode.'
    if (v.timeline === 'deadline' && !v.deadline) found.deadline = 'Please choose the date you need it by.'
    if (items.length === 0 && v.notes.trim().length < 10) found.notes = 'Add a product to your quote, or tell us what you need here.'
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, files: files.map((f) => f.url), items }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (d.errors) setErrors(d.errors)
        else setFormError(d.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      clearBasket()
      setDoneNumber(d.number)
    } catch {
      setFormError('Could not reach the server. Please check your internet and try again.')
      setBusy(false)
    }
  }

  if (doneNumber) {
    return (
      <div role="status" className="rounded-3xl bg-sky p-8 text-white md:p-14">
        <p className="text-[15px] font-medium uppercase tracking-[0.14em] text-white/80">Quote request {doneNumber}</p>
        <h2 className="font-heading mt-2 text-[clamp(28px,4vw,44px)] leading-tight">Thank you, we have your request.</h2>
        <p className="mt-3 max-w-xl text-lg text-white/90">We send your quote {replyTime}. No payment is needed now. Keep your quote number handy if you contact us.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="rounded-full bg-white px-6 py-3 text-[17px] font-medium text-sky hover:bg-white/90">
            Keep browsing
          </Link>
          <Link href="/contact" className="rounded-full border-2 border-white px-6 py-3 text-[17px] font-medium hover:bg-white hover:text-sky">
            Contact us
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
      <div className="space-y-12">
        {/* Items */}
        <section>
          <h2 className="font-heading text-2xl">Your items</h2>
          {!loaded ? (
            <p className="mt-4 text-body">Loading…</p>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-lg text-body">Your quote is empty. Add products to see an instant estimate, or just tell us what you need in the notes below.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85">
                  Browse products
                </Link>
                <Link href="/design" className="rounded-full border border-ink px-6 py-3 text-[17px] font-medium hover:bg-ink hover:text-white">
                  Design something
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
              {items.map((it) => {
                const k = keyOf(it)
                const line = lines.find((l) => l.key === k)
                return (
                  <li key={k} className="flex gap-4 p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F3F4F6]">
                      {line && line.ok && line.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.image} alt="" className="h-full w-full object-contain" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {line && !line.ok ? (
                        <p className="text-[15px] text-error">{line.error}</p>
                      ) : line && line.ok ? (
                        <>
                          <div className="font-heading text-[17px]">{line.title}</div>
                          <div className="text-[15px] text-muted-foreground">
                            {line.colour ? `${line.colour} · ` : ''}
                            {line.kind === 'design' ? 'Your studio design' : `${money(line.unitPrice)} per piece`}
                            {line.printingPerPiece > 0 ? ` (printing ${money(line.printingPerPiece)} included)` : ''}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                            {it.kind === 'product' ? (
                              <label className="flex items-center gap-2 text-[15px]">
                                Pieces
                                <input
                                  type="number"
                                  min={line.minQty}
                                  value={it.qty}
                                  onChange={(e) => setQty(k, Math.max(line.minQty, Math.floor(Number(e.target.value)) || line.minQty))}
                                  className="w-24 rounded-lg border border-border px-2.5 py-1.5"
                                />
                              </label>
                            ) : (
                              <span className="text-[15px]">
                                {line.quantity} pieces ·{' '}
                                <Link href={`/design/${line.slug}?d=${encodeURIComponent(it.token)}`} className="text-sky underline underline-offset-2">
                                  Change in the studio
                                </Link>
                              </span>
                            )}
                            <button type="button" onClick={() => remove(k)} className="text-[15px] text-muted-foreground underline underline-offset-2 hover:text-ink">
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-[15px] text-muted-foreground">Checking the price…</p>
                      )}
                    </div>
                    {line && line.ok && <div className="font-heading text-lg">{money(line.lineTotal)}</div>}
                  </li>
                )
              })}
            </ul>
          )}
          {items.length > 0 && (
            <Link href="/shop" className="mt-4 inline-block text-[15px] text-sky underline underline-offset-2">
              + Add another product
            </Link>
          )}
        </section>

        {/* Contact */}
        <section className="space-y-5">
          <h2 className="font-heading text-2xl">Your details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              <input value={v.name} onChange={(e) => set('name')(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} className={inputCls(!!errors.name)} />
            </Field>
            <Field label="Mobile number" error={errors.phone}>
              <input type="tel" value={v.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} className={inputCls(!!errors.phone)} />
            </Field>
            <Field label="Email" optional error={errors.email} hint="We can send your quote here as well.">
              <input type="email" value={v.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} className={inputCls(!!errors.email)} />
            </Field>
            <Field label="Company, college or team" optional>
              <input value={v.company} onChange={(e) => set('company')(e.target.value)} autoComplete="organization" className={inputCls(false)} />
            </Field>
            <Field label="GST number" optional error={errors.gstNumber} hint="For a GST invoice.">
              <input value={v.gstNumber} onChange={(e) => set('gstNumber')(e.target.value.toUpperCase())} maxLength={15} aria-invalid={!!errors.gstNumber} className={`${inputCls(!!errors.gstNumber)} uppercase`} />
            </Field>
          </div>
        </section>

        {/* Delivery and timeline */}
        <section className="space-y-5">
          <h2 className="font-heading text-2xl">Delivery</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" error={errors.city}>
              <input value={v.city} onChange={(e) => set('city')(e.target.value)} autoComplete="address-level2" aria-invalid={!!errors.city} className={inputCls(!!errors.city)} />
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input value={v.pincode} onChange={(e) => set('pincode')(e.target.value)} inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-invalid={!!errors.pincode} className={inputCls(!!errors.pincode)} />
            </Field>
          </div>
          <label className="flex items-start gap-3 text-[16px]">
            <input type="checkbox" checked={v.multipleAddresses} onChange={(e) => set('multipleAddresses')(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>
              Ship to more than one address
              <span className="block text-sm text-muted-foreground">Tell us the addresses in the notes below.</span>
            </span>
          </label>

          <fieldset>
            <legend className="text-[15px] text-body">When do you need it?</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {([
                ['standard', 'Standard', '10 to 15 days after payment'],
                ['deadline', 'I have a deadline', 'We will check what is possible'],
              ] as const).map(([val, title, sub]) => (
                <label key={val} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${v.timeline === val ? 'border-ink bg-[#F3F4F6]' : 'border-border hover:bg-[#F9FAFB]'}`}>
                  <input type="radio" name="timeline" checked={v.timeline === val} onChange={() => set('timeline')(val)} className="mt-1" />
                  <span>
                    <span className="block text-[16px] font-medium">{title}</span>
                    <span className="block text-sm text-muted-foreground">{sub}</span>
                  </span>
                </label>
              ))}
            </div>
            {v.timeline === 'deadline' && (
              <div className="mt-3 max-w-xs">
                <Field label="Needed by" error={errors.deadline}>
                  <input type="date" value={v.deadline} onChange={(e) => set('deadline')(e.target.value)} aria-invalid={!!errors.deadline} className={inputCls(!!errors.deadline)} />
                </Field>
              </div>
            )}
          </fieldset>
        </section>

        {/* Notes and files */}
        <section className="space-y-5">
          <h2 className="font-heading text-2xl">Anything else?</h2>
          <Field label="Notes" optional={items.length > 0} error={errors.notes} hint="Other products, sizes, colours, delivery addresses, special requests.">
            <textarea rows={4} value={v.notes} onChange={(e) => set('notes')(e.target.value)} aria-invalid={!!errors.notes} className={inputCls(!!errors.notes)} />
          </Field>
          <div>
            <span className="text-[15px] text-body">
              Logo or design <span className="text-muted-foreground">(optional, up to {MAX_FILES} files, {MAX_MB} MB each)</span>
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading || files.length >= MAX_FILES} className="rounded-full border border-ink px-5 py-2.5 text-[15px] font-medium hover:bg-ink hover:text-white disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Attach a file'}
              </button>
              {files.map((f) => (
                <span key={f.url} className="inline-flex items-center gap-2 rounded-full bg-[#F3F4F6] px-3.5 py-1.5 text-sm">
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((cur) => cur.filter((x) => x.url !== f.url))} className="text-muted-foreground hover:text-ink">
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void addFile(f)
                e.target.value = ''
              }}
            />
            {fileMsg && (
              <p role="alert" className="mt-2 text-sm text-error">
                {fileMsg}
              </p>
            )}
          </div>
        </section>

        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website')(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-2xl border border-border p-6 lg:sticky lg:top-28">
        <h2 className="font-heading text-xl">Your estimate</h2>
        <dl className="mt-4 space-y-2 text-[15px]">
          {lines.filter((l): l is Extract<Line, { ok: true }> => l.ok).map((l) => (
            <div key={l.key} className="flex justify-between gap-4 text-body">
              <dt className="min-w-0 truncate">
                {l.title} × {l.quantity}
              </dt>
              <dd>{money(l.lineTotal)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 font-heading text-lg text-ink">
            <dt>Items total</dt>
            <dd>{items.length === 0 ? '—' : pricing ? '…' : money(subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-muted-foreground">GST included. Delivery is added in your quote. We confirm everything before you pay.</p>

        {formError && (
          <p role="alert" className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
            {formError}
          </p>
        )}
        <button type="submit" disabled={busy || uploading} className="mt-5 w-full rounded-full bg-sky py-3.5 text-[17px] font-medium text-white hover:bg-sky/90 disabled:opacity-60">
          {busy ? 'Sending…' : 'Request quote'}
        </button>
        <p className="mt-3 text-center text-sm text-body">We send your quote {replyTime}. No payment now.</p>
        <p className="mt-2 text-center text-sm text-muted-foreground">Our designers check every file for print quality and tell you if anything needs fixing.</p>
      </aside>
    </form>
  )
}
