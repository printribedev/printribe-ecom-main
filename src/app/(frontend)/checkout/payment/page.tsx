import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import QRCode from 'qrcode'
import React from 'react'

import { PaymentForm } from '@/components/Shop/PaymentForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Payment | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

export default async function PaymentPage({ searchParams }: Args) {
  const sp = await searchParams
  const number = one(sp.o)
  const token = one(sp.t)

  const payload = await getPayload({ config: configPromise })
  const found = number && token
    ? await payload.find({
        collection: 'orders',
        where: { orderNumber: { equals: number }, publicToken: { equals: token } },
        limit: 1,
        overrideAccess: true,
      })
    : null
  const order = found?.docs[0]

  if (!order) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)]">We could not find this order</h1>
        <Link href="/shop" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
          Browse products
        </Link>
      </div>
    )
  }

  // Already paid or processed: go to the order status page
  if (order.status !== 'awaiting-payment') redirect(`/order/${number}?t=${encodeURIComponent(token)}`)

  const settings = await payload.findGlobal({ slug: 'shop-settings' })
  const upiId = (settings.upiId || '').trim()
  const payee = settings.upiPayeeName || 'Printribe'
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${order.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}`
    : ''
  const qr = upiLink ? await QRCode.toDataURL(upiLink, { margin: 1, width: 320 }) : ''

  return (
    <div className="container py-10 pb-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-[15px] text-muted-foreground">Order {order.orderNumber}</p>
        <h1 className="font-heading mt-1 text-[clamp(30px,4vw,44px)] leading-tight">Pay with UPI</h1>
        <p className="mt-2 text-lg text-body">
          Pay the exact amount below, then upload a screenshot so we can confirm it. We start work once your payment is verified.
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div>
            {upiId ? (
              <>
                <div className="rounded-xl border border-border p-4 text-center">
                  <img src={qr} alt={`UPI QR code to pay ₹${order.total}`} className="mx-auto h-auto w-full max-w-[280px]" />
                  <div className="font-heading mt-3 text-3xl text-ink">₹{order.total.toLocaleString('en-IN')}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Pay to {payee}</div>
                  <div className="text-sm text-muted-foreground">UPI ID: {upiId}</div>
                </div>
                <a href={upiLink} className="mt-4 block rounded-full border border-ink py-3 text-center text-[16px] font-medium text-ink hover:bg-ink hover:text-white md:hidden">
                  Open my UPI app
                </a>
                <ol className="mt-5 list-decimal space-y-1 pl-5 text-[15px] text-body">
                  <li>Scan the QR code with any UPI app{upiId ? ' (or tap the button on a phone)' : ''}.</li>
                  <li>Pay exactly ₹{order.total.toLocaleString('en-IN')}.</li>
                  <li>Take a screenshot of the success screen.</li>
                  <li>Upload it here.</li>
                </ol>
              </>
            ) : (
              <div className="rounded-xl border border-border p-5 text-[15px] text-body">
                Payment details are not set up yet. Please contact us with your order number <strong>{order.orderNumber}</strong>.
              </div>
            )}
            {settings.paymentNote && <p className="mt-4 text-[15px] text-body">{settings.paymentNote}</p>}
          </div>

          <PaymentForm number={order.orderNumber} token={token} />
        </div>
      </div>
    </div>
  )
}
