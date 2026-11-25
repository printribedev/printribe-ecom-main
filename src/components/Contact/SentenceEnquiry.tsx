'use client'

import React, { useRef, useState } from 'react'

import {
  ENQUIRY_BEST_TIME,
  ENQUIRY_HEARD,
  ENQUIRY_NEEDS,
  ENQUIRY_QUANTITIES,
  ENQUIRY_WHAT,
  ENQUIRY_WHEN,
  sentenceFrom,
} from '@/lib/contact/options'
import { validateName, validatePhone } from '@/lib/shop/validation'

type Errors = Record<string, string>
type Uploaded = { name: string; url: string }

const MAX_FILES = 3
const MAX_MB = 15
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']

/** The look of a blank: underlined, tinted, and readable on the sky-blue block. */
const blankCore =
  'rounded-t-md border-b-[3px] border-white/80 bg-white/15 px-2.5 py-0.5 font-medium text-white outline-none placeholder:text-white/60 hover:bg-white/20 focus:bg-white/25'

/**
 * A text blank that is exactly as wide as what is typed. A hidden copy of the text sets the width,
 * and the real input sits on top of it, so it grows and shrinks as the person types.
 */
const AutoInput: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  autoComplete?: string
  inputMode?: 'tel' | 'text'
  invalid?: boolean
}> = ({ label, value, onChange, placeholder, type = 'text', autoComplete, inputMode, invalid }) => (
  <span className="mx-1 inline-grid max-w-full align-baseline">
    <span aria-hidden className={`${blankCore} invisible col-start-1 row-start-1 overflow-hidden whitespace-pre`}>
      {(value || placeholder) + ' '}
    </span>
    <input
      aria-label={label}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-bad={invalid ? 'true' : undefined}
      aria-invalid={!!invalid}
      className={`${blankCore} col-start-1 row-start-1 w-0 min-w-full ${invalid ? 'border-[#FECACA]' : ''}`}
    />
  </span>
)

/** A dropdown blank that is as wide as the option chosen (a normal dropdown is as wide as its longest option). */
const Select: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  placeholder: string
}> = ({ label, value, onChange, options, placeholder }) => (
  <span className="relative mx-1 inline-grid max-w-full align-baseline">
    <span aria-hidden className={`${blankCore} invisible col-start-1 row-start-1 overflow-hidden whitespace-pre pr-8`}>
      {value || placeholder}
    </span>
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${blankCore} col-start-1 row-start-1 w-0 min-w-full cursor-pointer appearance-none pr-8`}
    >
      <option value="" className="text-ink">
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o} className="text-ink">
          {o}
        </option>
      ))}
    </select>
    <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.55em] opacity-80">
      ▾
    </span>
  </span>
)

export const SentenceEnquiry: React.FC<{
  replyTime: string
  whatsapp?: string
  /** Which page door the customer used (saved with the enquiry): 'contact' or 'bulk'. */
  topic?: 'contact' | 'bulk'
  prefill?: { name?: string; email?: string; phone?: string }
}> = ({ replyTime, whatsapp, topic = 'contact', prefill }) => {
  const [v, setV] = useState({
    name: prefill?.name || '',
    what: '',
    need: '',
    quantity: '',
    neededBy: '',
    phone: prefill?.phone || '',
    bestTime: '',
    email: prefill?.email || '',
    organisation: '',
    gstNumber: '',
    details: '',
    heard: '',
    website: '', // hidden trap field for bots
  })
  const [more, setMore] = useState(false)
  const [files, setFiles] = useState<Uploaded[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [fileMsg, setFileMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<'' | 'form' | 'whatsapp'>('')
  const [done, setDone] = useState<'' | 'form' | 'whatsapp'>('')
  const fileInput = useRef<HTMLInputElement>(null)
  const set = (k: keyof typeof v) => (val: string) => setV((cur) => ({ ...cur, [k]: val }))

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
      setFileMsg(e instanceof Error && e.message !== 'x' ? e.message : 'We could not upload that file. Please try again, or send it on WhatsApp.')
    } finally {
      setUploading(false)
    }
  }

  const send = async (channel: 'form' | 'whatsapp') => {
    setFormError('')
    const found: Errors = {}
    const n = validateName(v.name)
    if (n) found.name = n
    const ph = validatePhone(v.phone)
    if (ph) found.phone = ph
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>('[data-bad="true"]')?.focus()
      return
    }
    // Open the WhatsApp window right now (browsers block pop-ups opened after a wait), fill it in after saving
    const popup = channel === 'whatsapp' && whatsapp ? window.open('about:blank', '_blank') : null
    setBusy(channel)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, files: files.map((f) => f.url), channel, topic }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        popup?.close()
        if (data.errors) setErrors(data.errors)
        else setFormError(data.error || 'Something went wrong. Please try again.')
        setBusy('')
        return
      }
      if (channel === 'whatsapp' && whatsapp) {
        const text = sentenceFrom(v.name, v, v.details)
        const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
        if (popup) popup.location.href = url
        else window.location.href = url
      }
      setDone(channel)
    } catch {
      popup?.close()
      setFormError('Could not reach the server. Please check your internet and try again.')
      setBusy('')
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-3xl bg-sky p-8 text-white md:p-14">
        <h2 className="font-heading text-[clamp(28px,4vw,44px)] leading-tight">Thank you, we have your message.</h2>
        <p className="mt-3 max-w-xl text-lg text-white/90">
          We reply {replyTime}.
          {done === 'whatsapp' ? ' WhatsApp opened with your message already written. Press send there to reach us even faster.' : ''}
        </p>
      </div>
    )
  }

  const bad = (k: string) => (errors[k] ? 'true' : undefined)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void send('form')
      }}
      noValidate
      className="rounded-3xl bg-sky p-7 text-white md:p-14"
    >
      <p className="mb-5 text-[15px] font-medium uppercase tracking-[0.14em] text-white/80">Start a project</p>

      {/* The sentence. Everything but name and phone is a tap. */}
      <p className="font-heading text-[clamp(24px,3.6vw,42px)] leading-[2.05] md:leading-[2.15]">
        Hi, I&apos;m
        <AutoInput label="Your name" placeholder="your name" autoComplete="name" value={v.name} onChange={set('name')} invalid={!!errors.name} />
        . I&apos;d like
        <Select label="What you would like" value={v.what} onChange={set('what')} options={ENQUIRY_WHAT} placeholder="something" />
        for
        <Select label="Who it is for" value={v.need} onChange={set('need')} options={ENQUIRY_NEEDS} placeholder="my team" />, about
        <Select label="How many pieces" value={v.quantity} onChange={set('quantity')} options={ENQUIRY_QUANTITIES} placeholder="how many" />
        pieces, needed
        <Select label="When you need it" value={v.neededBy} onChange={set('neededBy')} options={ENQUIRY_WHEN} placeholder="by when" />. Reach me on
        <AutoInput
          label="Your mobile number"
          placeholder="mobile number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={v.phone}
          onChange={set('phone')}
          invalid={!!errors.phone}
        />
        ,
        <Select label="Best time to contact you" value={v.bestTime} onChange={set('bestTime')} options={ENQUIRY_BEST_TIME} placeholder="anytime" />.
      </p>

      {(errors.name || errors.phone || errors.email || errors.gstNumber || errors.details) && (
        <p role="alert" className="mt-4 inline-block rounded-lg bg-white px-4 py-2.5 text-[15px] text-error">
          {errors.name || errors.phone || errors.email || errors.gstNumber || errors.details}
        </p>
      )}

      {/* Optional extras */}
      <div className="mt-6">
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="text-[16px] font-medium underline underline-offset-4 hover:text-white/80">
          {more ? 'Hide extra details' : 'Add your email, company, GST number, a logo or more details'}
        </button>
        {more && (
          <div className="mt-4 grid gap-4 rounded-2xl bg-white/10 p-5 sm:grid-cols-2">
            <label className="block text-[15px]">
              Company, college or team <span className="text-white/70">(optional)</span>
              <input
                autoComplete="organization"
                value={v.organisation}
                onChange={(e) => set('organisation')(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white px-3.5 py-3 text-[16px] text-ink outline-none"
              />
            </label>
            <label className="block text-[15px]">
              GST number <span className="text-white/70">(optional, for a GST invoice)</span>
              <input
                value={v.gstNumber}
                onChange={(e) => set('gstNumber')(e.target.value.toUpperCase())}
                maxLength={15}
                data-bad={errors.gstNumber ? 'true' : undefined}
                aria-invalid={!!errors.gstNumber}
                className="mt-1 w-full rounded-lg bg-white px-3.5 py-3 text-[16px] uppercase text-ink outline-none"
              />
            </label>
            <label className="block text-[15px]">
              Email <span className="text-white/70">(optional, for a confirmation)</span>
              <input
                type="email"
                autoComplete="email"
                value={v.email}
                onChange={(e) => set('email')(e.target.value)}
                data-bad={bad('email')}
                aria-invalid={!!errors.email}
                className="mt-1 w-full rounded-lg bg-white px-3.5 py-3 text-[16px] text-ink outline-none"
              />
            </label>
            <label className="block text-[15px]">
              Where did you hear about us? <span className="text-white/70">(optional)</span>
              <select value={v.heard} onChange={(e) => set('heard')(e.target.value)} className="mt-1 w-full rounded-lg bg-white px-3.5 py-3 text-[16px] text-ink outline-none">
                <option value="">Choose one</option>
                {ENQUIRY_HEARD.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block text-[15px] sm:col-span-2">
              Anything else we should know? <span className="text-white/70">(optional)</span>
              <textarea
                rows={4}
                value={v.details}
                onChange={(e) => set('details')(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white px-3.5 py-3 text-[16px] text-ink outline-none"
              />
            </label>
            <div className="sm:col-span-2">
              <span className="text-[15px]">
                Logo or design <span className="text-white/70">(up to {MAX_FILES} files, {MAX_MB} MB each)</span>
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading || files.length >= MAX_FILES}
                  className="rounded-full border border-white px-5 py-2.5 text-[15px] font-medium hover:bg-white hover:text-sky disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Attach a file'}
                </button>
                {files.map((f) => (
                  <span key={f.url} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-sm">
                    <span className="max-w-[180px] truncate">{f.name}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((cur) => cur.filter((x) => x.url !== f.url))} className="hover:text-white/70">
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
                <p role="alert" className="mt-2 inline-block rounded bg-white px-3 py-1.5 text-sm text-error">
                  {fileMsg}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trap for bots: hidden from people */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website')(e.target.value)} />
        </label>
      </div>

      {formError && (
        <p role="alert" className="mt-5 inline-block rounded-lg bg-white px-4 py-2.5 text-[15px] text-error">
          {formError}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!!busy || uploading} className="rounded-full bg-white px-8 py-3.5 text-[17px] font-medium text-sky hover:bg-white/90 disabled:opacity-60">
          {busy === 'form' ? 'Sending…' : 'Send it'}
        </button>
        {whatsapp && (
          <button
            type="button"
            onClick={() => void send('whatsapp')}
            disabled={!!busy || uploading}
            className="rounded-full border-2 border-white px-8 py-3 text-[17px] font-medium text-white hover:bg-white hover:text-sky disabled:opacity-60"
          >
            {busy === 'whatsapp' ? 'Opening WhatsApp…' : 'Send on WhatsApp'}
          </button>
        )}
        <span className="text-[15px] text-white/85">We reply {replyTime}.</span>
      </div>
    </form>
  )
}
