'use client'

import React, { useState } from 'react'

const inputCls = 'mt-1 w-full rounded-lg border border-border bg-white px-3.5 py-3 text-[16px] text-ink outline-none focus:border-ink'

/** "Where is my order?": order number + mobile number opens the order page right away. */
export const OrderLookup: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not reach the server. Please check your internet and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      <label className="block text-[15px] text-body">
        Order number
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="PT-XXXXXX" autoCapitalize="characters" className={inputCls} />
      </label>
      <label className="block text-[15px] text-body">
        Mobile number on the order
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" className={inputCls} />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85 disabled:opacity-60">
        {busy ? 'Looking…' : 'Find my order'}
      </button>
    </form>
  )
}
