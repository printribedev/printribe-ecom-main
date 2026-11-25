import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { PayButton } from '@/components/Shop/PayButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Payment | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export default async function PaymentPage({ searchParams }: Args) {
  const sp = await searchParams
  const number = one(sp.o)
  const token = one(sp.t)

  const payload = await getPayload({ config: configPromise })
  const found =
    number && token
      ? await payload.find({
          collection: 'orders',
          where: { orderNumber: { equals: number }, publicToken: { equals: token } },
          limit: 1,
          overrideAccess: true,
        })
      : null
  const o = found?.docs[0]

  if (!o) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)]">We could not find this order</h1>
        <Link href="/shop" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
          Browse products
        </Link>
      </div>
    )
  }

  // Already paid or processed: show the order status instead
  if (o.status !== 'awaiting-payment') redirect(`/order/${number}?t=${encodeURIComponent(token)}`)

  return (
    <div className="container py-10 pb-20">
      <div className="mx-auto max-w-xl">
        <p className="text-[15px] text-muted-foreground">Order {o.orderNumber}</p>
        <h1 className="font-heading mt-1 text-[clamp(30px,4vw,44px)] leading-tight">Pay for your order</h1>

        <div className="mt-8 rounded-xl border border-border p-6">
          <h2 className="font-heading text-xl">{o.productTitle}</h2>
          <p className="mt-1 text-[15px] text-body">
            {o.colour ? `${o.colour} · ` : ''}
            {o.quantity} pieces
            {o.sizes && o.sizes.length > 0 ? ` (${o.sizes.map((x) => `${x.size} × ${x.quantity}`).join(', ')})` : ''}
          </p>
          {o.designSnapshot?.previews && o.designSnapshot.previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {o.designSnapshot.previews.map((pv) =>
                pv.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={pv.url} src={pv.url} alt={`Your design, ${pv.view || 'side'}`} className="w-full rounded-lg bg-[#F3F4F6] object-contain" />
                ) : null,
              )}
            </div>
          )}
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between text-body"><dt>Items</dt><dd>{money(o.subtotal)}</dd></div>
            <div className="flex justify-between text-body"><dt>Delivery</dt><dd>{o.deliveryFee === 0 ? 'Free' : money(o.deliveryFee)}</dd></div>
            <div className="flex justify-between border-t border-border pt-3 font-heading text-lg text-ink"><dt>Total (GST included)</dt><dd>{money(o.total)}</dd></div>
          </dl>
          <p className="mt-4 text-[15px] text-body">
            Delivering to {o.customerName}, {o.city}, {o.state} {o.pincode}.
          </p>
        </div>

        <div className="mt-6">
          <PayButton number={o.orderNumber} token={token} amountLabel={money(o.total)} />
        </div>
      </div>
    </div>
  )
}
