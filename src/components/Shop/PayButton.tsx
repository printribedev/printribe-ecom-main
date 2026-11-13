'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type RazorpayInstance = { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void }
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance
  }
}

const loadScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

/** Opens Razorpay's payment window. The order only becomes Paid after the server verifies Razorpay's signature. */
export const PayButton: React.FC<{ number: string; token: string; amountLabel: string }> = ({ number, token, amountLabel }) => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const goToOrder = () => router.push(`/order/${encodeURIComponent(number)}?t=${encodeURIComponent(token)}`)

  const pay = async () => {
    setError('')
    setBusy(true)
    try {
      const [res, loaded] = await Promise.all([
        fetch('/api/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, token }),
        }),
        loadScript(),
      ])
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'We could not start the payment. Please try again.')
        return setBusy(false)
      }
      if (!loaded || !window.Razorpay) {
        setError('The payment window could not load. Please check your internet and try again.')
        return setBusy(false)
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: 'INR',
        name: 'Printribe',
        description: `Order ${number}`,
        prefill: { name: data.name, email: data.email, contact: data.phone },
        theme: { color: '#0369A1' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          setBusy(true)
          try {
            const v = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ number, token, ...r }),
            })
            if (!v.ok) {
              const e = await v.json().catch(() => ({}))
              setError(e.error || 'We could not confirm your payment.')
              return setBusy(false)
            }
            goToOrder()
          } catch {
            // The payment itself went through; the order page (and Razorpay's webhook) will show the result.
            goToOrder()
          }
        },
      })
      rzp.on('payment.failed', (r) => {
        setError(r.error?.description || 'The payment did not go through. You can try again.')
        setBusy(false)
      })
      rzp.open()
    } catch {
      setError('Could not reach the server. Please check your internet and try again.')
      setBusy(false)
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-[15px] text-error">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="w-full rounded-full bg-sky py-3.5 text-[17px] font-medium text-white hover:bg-sky/90 disabled:opacity-60"
      >
        {busy ? 'Please wait…' : `Pay ${amountLabel}`}
      </button>
      <p className="mt-3 text-center text-sm text-muted-foreground">Secure payment by Razorpay. UPI, cards, netbanking and wallets.</p>
    </div>
  )
}
