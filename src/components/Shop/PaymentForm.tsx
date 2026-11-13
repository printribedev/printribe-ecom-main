'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

/** The payment step. A screenshot of the payment is REQUIRED; the UPI transaction ID is optional. */
export const PaymentForm: React.FC<{ number: string; token: string }> = ({ number, token }) => {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [utr, setUtr] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f: File | null) => {
    setError('')
    if (f && !/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      setFile(null)
      return setError('Please upload a PNG, JPG or WebP image.')
    }
    if (f && f.size > 5 * 1024 * 1024) {
      setFile(null)
      return setError('The screenshot is too large. Maximum size is 5 MB.')
    }
    setFile(f)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return setError('Please upload a screenshot of your payment.')
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      fd.set('number', number)
      fd.set('token', token)
      fd.set('utr', utr)
      fd.set('file', file)
      const res = await fetch('/api/payment', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      router.push(`/order/${encodeURIComponent(number)}?t=${encodeURIComponent(token)}`)
    } catch {
      setError('Could not reach the server. Please check your internet and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <span className="text-[15px] text-body">Screenshot of your payment (required)</span>
        <label
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center ${
            file ? 'border-sky' : 'border-border hover:border-ink/40'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Your payment screenshot" className="max-h-56 rounded-lg" />
          ) : (
            <span className="text-[15px] text-body">Tap to choose a screenshot from your phone or computer</span>
          )}
          {file && <span className="text-sm text-muted-foreground">{file.name}. Tap to change.</span>}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <label className="block">
        <span className="text-[15px] text-body">
          UPI transaction ID <span className="text-muted-foreground">(optional)</span>
        </span>
        <input
          value={utr}
          onChange={(e) => setUtr(e.target.value.replace(/\s/g, ''))}
          maxLength={25}
          className="mt-1 w-full rounded-lg border border-border px-3.5 py-3 text-[16px] outline-none focus:border-ink"
        />
        <span className="mt-1 block text-sm text-muted-foreground">Also called UTR or reference number, shown in your UPI app after paying.</span>
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !file}
        className="w-full rounded-full bg-sky py-3.5 text-[17px] font-medium text-white hover:bg-sky/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'I have paid, confirm my order'}
      </button>
      {!file && <p className="text-center text-sm text-muted-foreground">Upload your payment screenshot to continue.</p>}
    </form>
  )
}
