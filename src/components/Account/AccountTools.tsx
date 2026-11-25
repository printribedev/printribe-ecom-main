'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Errors = Record<string, string>

const input = (bad: boolean) =>
  `mt-1 w-full rounded-lg border px-3.5 py-3 text-[16px] text-ink outline-none focus:border-ink ${bad ? 'border-error' : 'border-border'}`
const pill = 'rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-white hover:bg-ink/85 disabled:opacity-60'

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: { error?: string; errors?: Errors } }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { ok: res.ok, data: await res.json().catch(() => ({})) }
  } catch {
    return { ok: false, data: { error: 'Could not reach the server. Please try again.' } }
  }
}

export const SignOutButton: React.FC = () => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await post('/api/account/logout', {})
        router.push('/')
        router.refresh()
      }}
      className="rounded-full border border-ink px-5 py-2.5 text-[15px] font-medium text-ink hover:bg-ink hover:text-white disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

/** For an order placed as a guest: add it to this account using the order number and the phone number on it. */
export const ClaimOrderForm: React.FC = () => {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const r = await post('/api/account/claim-order', { orderNumber, phone })
    setBusy(false)
    if (!r.ok) return setMsg({ ok: false, text: r.data.error || 'Something went wrong. Please try again.' })
    setMsg({ ok: true, text: 'Added to your account.' })
    setOrderNumber('')
    setPhone('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="text-[15px] text-body">Order number</span>
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="PT-XXXXXX" className={input(false)} />
      </label>
      <label className="block">
        <span className="text-[15px] text-body">Mobile number on the order</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" className={input(false)} />
      </label>
      <button type="submit" disabled={busy} className={pill}>
        {busy ? 'Adding…' : 'Add order'}
      </button>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-[15px] sm:col-span-3 ${msg.ok ? 'text-body' : 'text-error'}`}>
          {msg.text}
        </p>
      )}
    </form>
  )
}

export const DetailsForm: React.FC<{ name: string; phone: string; email: string }> = ({ name, phone, email }) => {
  const router = useRouter()
  const [v, setV] = useState({ name, phone })
  const [errors, setErrors] = useState<Errors>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setErrors({})
    const r = await post('/api/account/profile', { action: 'details', ...v })
    setBusy(false)
    if (!r.ok) {
      setErrors(r.data.errors || {})
      return setMsg(r.data.errors ? '' : r.data.error || 'Something went wrong.')
    }
    setMsg('Saved.')
    router.refresh()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <label className="block">
        <span className="text-[15px] text-body">Email</span>
        <input value={email} disabled className={`${input(false)} bg-[#F3F4F6] text-muted-foreground`} />
      </label>
      <label className="block">
        <span className="text-[15px] text-body">Full name</span>
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={input(!!errors.name)} />
        {errors.name && <span className="mt-1 block text-sm text-error">{errors.name}</span>}
      </label>
      <label className="block">
        <span className="text-[15px] text-body">Mobile number</span>
        <input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} type="tel" className={input(!!errors.phone)} />
        {errors.phone && <span className="mt-1 block text-sm text-error">{errors.phone}</span>}
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className={pill}>
          {busy ? 'Saving…' : 'Save details'}
        </button>
        {msg && <span role="status" className="text-[15px] text-body">{msg}</span>}
      </div>
    </form>
  )
}

export const PasswordForm: React.FC = () => {
  const [v, setV] = useState({ currentPassword: '', newPassword: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setErrors({})
    const r = await post('/api/account/profile', { action: 'password', ...v })
    setBusy(false)
    if (!r.ok) {
      setErrors(r.data.errors || {})
      return setMsg(r.data.errors ? '' : r.data.error || 'Something went wrong.')
    }
    setV({ currentPassword: '', newPassword: '' })
    setMsg('Password changed. Other devices were signed out.')
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <label className="block">
        <span className="text-[15px] text-body">Current password</span>
        <input type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} className={input(!!errors.currentPassword)} />
        {errors.currentPassword && <span className="mt-1 block text-sm text-error">{errors.currentPassword}</span>}
      </label>
      <label className="block">
        <span className="text-[15px] text-body">New password</span>
        <input type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} className={input(!!errors.newPassword)} />
        {errors.newPassword && <span className="mt-1 block text-sm text-error">{errors.newPassword}</span>}
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className={pill}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
        {msg && <span role="status" className="text-[15px] text-body">{msg}</span>}
      </div>
    </form>
  )
}
