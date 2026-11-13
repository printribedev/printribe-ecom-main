import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your order | Printribe', robots: { index: false } }

type Args = {
  params: Promise<{ number: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_TEXT: Record<string, { title: string; body: string }> = {
  'awaiting-payment': { title: 'Payment pending', body: 'Your payment has not been completed yet. You can pay now to confirm your order.' },
  paid: { title: 'Payment received. Thank you!', body: 'Your order is confirmed and goes into production soon. Keep this page link to check progress.' },
  'in-production': { title: 'Your order is in production', body: 'Your pieces are being made and checked.' },
  shipped: { title: 'Your order has shipped', body: 'It is on its way to you.' },
  delivered: { title: 'Delivered', body: 'We hope you love it.' },
  cancelled: { title: 'This order was cancelled', body: 'If you did not expect this, please contact us.' },
}

export default async function OrderPage({ params, searchParams }: Args) {
  const { number } = await params
  const sp = await searchParams
  const token = (Array.isArray(sp.t) ? sp.t[0] : sp.t) || ''

  const payload = await getPayload({ config: configPromise })
  const res = token
    ? await payload.find({
        collection: 'orders',
        where: { orderNumber: { equals: number }, publicToken: { equals: token } },
        limit: 1,
        overrideAccess: true,
      })
    : null
  const o = res?.docs[0]

  if (!o) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)]">We could not find this order</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-body">Please use the link from your confirmation, or contact us with your order number.</p>
        <Link href="/contact" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
          Contact us
        </Link>
      </div>
    )
  }

  const st = STATUS_TEXT[o.status] || STATUS_TEXT['awaiting-payment']
  const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

  return (
    <div className="container py-12 pb-24">
      <div className="mx-auto max-w-2xl">
        <p className="text-[15px] text-muted-foreground">Order {o.orderNumber}</p>
        <h1 className="font-heading mt-1 text-[clamp(30px,4vw,44px)] leading-tight">{st.title}</h1>
        <p className="mt-3 text-lg text-body">{st.body}</p>

        {o.status === 'awaiting-payment' && (
          <Link
            href={`/checkout/payment?o=${encodeURIComponent(o.orderNumber)}&t=${encodeURIComponent(token)}`}
            className="mt-6 inline-flex rounded-full bg-sky px-6 py-3 text-[17px] font-medium text-white hover:bg-sky/90"
          >
            Pay now
          </Link>
        )}

        <div className="mt-10 rounded-xl border border-border p-6">
          <h2 className="font-heading text-xl">{o.productTitle}</h2>
          <p className="mt-1 text-[15px] text-body">
            {o.colour ? `${o.colour} · ` : ''}
            {o.quantity} pieces
            {o.sizes && o.sizes.length > 0 ? ` (${o.sizes.map((x) => `${x.size} × ${x.quantity}`).join(', ')})` : ''}
          </p>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between text-body"><dt>Items</dt><dd>{money(o.subtotal)}</dd></div>
            <div className="flex justify-between text-body"><dt>Delivery</dt><dd>{o.deliveryFee === 0 ? 'Free' : money(o.deliveryFee)}</dd></div>
            <div className="flex justify-between font-heading text-lg text-ink"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
        </div>

        <div className="mt-6 rounded-xl border border-border p-6 text-[15px] text-body">
          <h2 className="font-heading text-xl text-ink">Delivering to</h2>
          <p className="mt-2">
            {o.customerName}<br />
            {o.addressLine1}{o.addressLine2 ? `, ${o.addressLine2}` : ''}<br />
            {o.city}, {o.state} {o.pincode}<br />
            {o.phone} · {o.email}
          </p>
          {o.trackingNumber && (
            <p className="mt-4 text-ink">
              {o.courier ? `${o.courier}: ` : 'Tracking: '}
              <strong>{o.trackingNumber}</strong>
            </p>
          )}
        </div>

        <p className="mt-8 text-[15px] text-muted-foreground">Save this page link to check your order any time. Standard delivery takes 10 to 15 days after your payment.</p>
      </div>
    </div>
  )
}
