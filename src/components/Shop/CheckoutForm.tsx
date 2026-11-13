'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import {
  INDIAN_STATES,
  validateAddressLine1,
  validateAddressLine2,
  validateCity,
  validateEmail,
  validateName,
  validatePhone,
  validatePincode,
  type DetailsInput,
} from '@/lib/shop/validation'

const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export type CheckoutSummary = {
  slug: string
  title: string
  image: string | null
  colour: string
  sizes: { size: string; quantity: number }[]
  quantity: number
  unitPrice: number
  subtotal: number
  deliveryFee: number
  total: number
}

type Field = keyof DetailsInput
const RULES: Record<Field, (v: string) => string | null> = {
  name: validateName,
  phone: validatePhone,
  email: validateEmail,
  line1: validateAddressLine1,
  line2: validateAddressLine2,
  city: validateCity,
  state: (v) => (v ? null : 'Choose your state.'),
  pincode: validatePincode,
}

const inputCls = (bad: boolean) =>
  `mt-1 w-full rounded-lg border px-3.5 py-3 text-[16px] text-ink outline-none focus:border-ink ${
    bad ? 'border-error' : 'border-border'
  }`

export const CheckoutForm: React.FC<{ s: CheckoutSummary }> = ({ s }) => {
  const router = useRouter()
  const [v, setV] = useState<DetailsInput>({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (f: Field, val: string) => setV((cur) => ({ ...cur, [f]: val }))
  const blur = (f: Field) => {
    const msg = RULES[f](v[f] ?? '')
    setErrors((cur) => {
      const next = { ...cur }
      if (msg) next[f] = msg
      else delete next[f]
      return next
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const found: Partial<Record<Field, string>> = {}
    ;(Object.keys(RULES) as Field[]).forEach((f) => {
      const m = RULES[f](v[f] ?? '')
      if (m) found[f] = m
    })
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>('[data-invalid="true"]')?.focus()
      return
    }
    setBusy(true)
    try {
      const sizes = Object.fromEntries(s.sizes.map((x) => [x.size, x.quantity]))
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: s.slug, colour: s.colour, sizes, qty: s.quantity, details: v }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        else setFormError(data.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      router.push(`/checkout/payment?o=${encodeURIComponent(data.number)}&t=${encodeURIComponent(data.token)}`)
    } catch {
      setFormError('Could not reach the server. Please check your internet and try again.')
      setBusy(false)
    }
  }

  const text = (f: Field, label: string, opts: { type?: string; auto?: string; hint?: string; optional?: boolean; inputMode?: 'numeric' | 'tel' } = {}) => (
    <label className="block">
      <span className="text-[15px] text-body">
        {label}
        {opts.optional && <span className="text-muted-foreground"> (optional)</span>}
      </span>
      <input
        type={opts.type || 'text'}
        value={v[f] ?? ''}
        autoComplete={opts.auto}
        inputMode={opts.inputMode}
        data-invalid={errors[f] ? 'true' : undefined}
        aria-invalid={!!errors[f]}
        onChange={(e) => set(f, e.target.value)}
        onBlur={() => blur(f)}
        className={inputCls(!!errors[f])}
      />
      {errors[f] ? (
        <span className="mt-1 block text-sm text-error">{errors[f]}</span>
      ) : (
        opts.hint && <span className="mt-1 block text-sm text-muted-foreground">{opts.hint}</span>
      )}
    </label>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
      <form onSubmit={submit} noValidate className="space-y-5">
        <h2 className="font-heading text-2xl">Your details</h2>
        {text('name', 'Full name', { auto: 'name' })}
        <div className="grid gap-5 sm:grid-cols-2">
          {text('phone', 'Mobile number', { type: 'tel', auto: 'tel', inputMode: 'tel', hint: 'We call or WhatsApp only about your order.' })}
          {text('email', 'Email', { type: 'email', auto: 'email', hint: 'Your order updates come here.' })}
        </div>

        <h2 className="font-heading pt-4 text-2xl">Delivery address</h2>
        {text('line1', 'Address', { auto: 'address-line1', hint: 'House or flat number, building, street' })}
        {text('line2', 'Landmark or area', { auto: 'address-line2', optional: true })}
        <div className="grid gap-5 sm:grid-cols-2">
          {text('city', 'City', { auto: 'address-level2' })}
          <label className="block">
            <span className="text-[15px] text-body">State</span>
            <select
              value={v.state}
              data-invalid={errors.state ? 'true' : undefined}
              onChange={(e) => set('state', e.target.value)}
              onBlur={() => blur('state')}
              autoComplete="address-level1"
              className={inputCls(!!errors.state)}
            >
              <option value="">Choose state</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && <span className="mt-1 block text-sm text-error">{errors.state}</span>}
          </label>
        </div>
        <div className="sm:max-w-[240px]">{text('pincode', 'Pincode', { auto: 'postal-code', inputMode: 'numeric' })}</div>

        {formError && (
          <p role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-sky py-3.5 text-[17px] font-medium text-white hover:bg-sky/90 disabled:opacity-60"
        >
          {busy ? 'Checking your details…' : 'Continue to payment'}
        </button>
        <p className="text-center text-sm text-muted-foreground">You will pay by UPI on the next step.</p>
      </form>

      {/* Order summary */}
      <aside className="h-fit rounded-xl border border-border p-6 lg:sticky lg:top-28">
        <h2 className="font-heading text-xl">Your order</h2>
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F3F4F6]">
            {s.image && <img src={s.image} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 text-[15px]">
            <div className="font-heading text-[17px] text-ink">{s.title}</div>
            {s.colour && <div className="text-body">Colour: {s.colour}</div>}
            {s.sizes.length > 0 && <div className="text-body">{s.sizes.map((x) => `${x.size} × ${x.quantity}`).join(', ')}</div>}
          </div>
        </div>
        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-[15px]">
          <div className="flex justify-between text-body">
            <dt>
              {s.quantity} pieces × {rupees(s.unitPrice)}
            </dt>
            <dd>{rupees(s.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-body">
            <dt>Delivery</dt>
            <dd>{s.deliveryFee === 0 ? 'Free' : rupees(s.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-heading text-lg text-ink">
            <dt>Total (GST included)</dt>
            <dd>{rupees(s.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
