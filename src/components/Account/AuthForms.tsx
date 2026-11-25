'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { safeNext } from '@/lib/account/next'

type Errors = Record<string, string>

const input = (bad: boolean) =>
  `mt-1 w-full rounded-lg border px-3.5 py-3 text-[16px] text-ink outline-none focus:border-ink ${bad ? 'border-error' : 'border-border'}`
const primary = 'w-full rounded-full bg-sky py-3.5 text-[17px] font-medium text-white hover:bg-sky/90 disabled:opacity-60'

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: { error?: string; errors?: Errors } }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: { error: 'Could not reach the server. Please check your internet and try again.' } }
  }
}

const Field: React.FC<{
  label: string
  name: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  auto?: string
  optional?: boolean
}> = ({ label, name, type = 'text', value, onChange, error, hint, auto, optional }) => (
  <label className="block">
    <span className="text-[15px] text-body">
      {label}
      {optional && <span className="text-muted-foreground"> (optional)</span>}
    </span>
    <input
      name={name}
      type={type}
      value={value}
      autoComplete={auto}
      aria-invalid={!!error}
      onChange={(e) => onChange(e.target.value)}
      className={input(!!error)}
    />
    {error ? <span className="mt-1 block text-sm text-error">{error}</span> : hint && <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>}
  </label>
)

const FormError: React.FC<{ msg: string }> = ({ msg }) =>
  msg ? (
    <p role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
      {msg}
    </p>
  ) : null

/* ---------- Sign in ---------- */

export const LoginForm: React.FC<{ next?: string }> = ({ next }) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await post('/api/account/login', { email, password })
    if (!r.ok) {
      setError(r.data.error || 'Something went wrong. Please try again.')
      setBusy(false)
      return
    }
    router.push(safeNext(next))
    router.refresh()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Email" name="email" type="email" value={email} onChange={setEmail} auto="email" />
      <Field label="Password" name="password" type="password" value={password} onChange={setPassword} auto="current-password" />
      <FormError msg={error} />
      <button type="submit" disabled={busy} className={primary}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-[15px]">
        <Link href="/account/forgot-password" className="text-sky underline underline-offset-2">
          Forgot your password?
        </Link>
      </p>
    </form>
  )
}

/* ---------- Create account ---------- */

export const RegisterForm: React.FC<{ next?: string }> = ({ next }) => {
  const router = useRouter()
  const [v, setV] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (val: string) => setV((cur) => ({ ...cur, [k]: val }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setBusy(true)
    const r = await post('/api/account/register', v)
    if (!r.ok) {
      setErrors(r.data.errors || {})
      setError(r.data.errors ? '' : r.data.error || 'Something went wrong. Please try again.')
      setBusy(false)
      return
    }
    router.push(safeNext(next))
    router.refresh()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Full name" name="name" value={v.name} onChange={set('name')} error={errors.name} auto="name" />
      <Field label="Email" name="email" type="email" value={v.email} onChange={set('email')} error={errors.email} auto="email" hint="Your order updates and password reset emails go here." />
      <Field label="Mobile number" name="phone" type="tel" value={v.phone} onChange={set('phone')} error={errors.phone} auto="tel" optional />
      <Field label="Password" name="password" type="password" value={v.password} onChange={set('password')} error={errors.password} auto="new-password" hint="At least 8 characters." />
      <FormError msg={error} />
      <button type="submit" disabled={busy} className={primary}>
        {busy ? 'Creating your account…' : 'Create account'}
      </button>
    </form>
  )
}

/* ---------- Forgot password ---------- */

export const ForgotForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await post('/api/account/forgot-password', { email })
    setBusy(false)
    if (!r.ok) return setError(r.data.error || 'Something went wrong. Please try again.')
    setSent(true)
  }

  if (sent)
    return (
      <div className="rounded-xl border border-border p-6 text-[17px] text-body">
        If there is an account for <strong className="text-ink">{email}</strong>, we have sent an email with a link to choose a new password. The link works for one hour.
      </div>
    )

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Email" name="email" type="email" value={email} onChange={setEmail} auto="email" />
      <FormError msg={error} />
      <button type="submit" disabled={busy} className={primary}>
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}

/* ---------- Choose a new password ---------- */

export const ResetForm: React.FC<{ token: string }> = ({ token }) => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await post('/api/account/reset-password', { token, password })
    if (!r.ok) {
      setError(r.data.errors?.password || r.data.error || 'Something went wrong. Please try again.')
      setBusy(false)
      return
    }
    router.push('/account')
    router.refresh()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="New password" name="password" type="password" value={password} onChange={setPassword} auto="new-password" hint="At least 8 characters." />
      <FormError msg={error} />
      <button type="submit" disabled={busy} className={primary}>
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  )
}
