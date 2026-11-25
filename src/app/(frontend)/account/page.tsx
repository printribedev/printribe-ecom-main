import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { ClaimOrderForm, DetailsForm, PasswordForm, SignOutButton } from '@/components/Account/AccountTools'
import { getCustomer } from '@/lib/account/session'
import type { Product } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My account | Printribe', robots: { index: false } }

const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const date = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS: Record<string, { label: string; cls: string }> = {
  'awaiting-payment': { label: 'Payment pending', cls: 'bg-[#FEF3C7] text-[#92400E]' },
  paid: { label: 'Paid', cls: 'bg-sky-tint text-sky' },
  'in-production': { label: 'In production', cls: 'bg-sky-tint text-sky' },
  shipped: { label: 'Shipped', cls: 'bg-[#E0E7FF] text-[#3730A3]' },
  delivered: { label: 'Delivered', cls: 'bg-[#F3F4F6] text-ink' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#F3F4F6] text-muted-foreground' },
}

export default async function AccountPage() {
  const me = await getCustomer()
  if (!me) redirect('/account/login?next=/account')

  const payload = await getPayload({ config: configPromise })
  const [orders, designs] = await Promise.all([
    payload.find({ collection: 'orders', where: { customer: { equals: me.id } }, sort: '-createdAt', limit: 100, overrideAccess: true, depth: 0 }),
    payload.find({ collection: 'designs', where: { customer: { equals: me.id }, status: { equals: 'saved' } }, sort: '-updatedAt', limit: 50, overrideAccess: true, depth: 1 }),
  ])
  const first = me.name.split(' ')[0]

  return (
    <div className="container py-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-muted-foreground">My account</p>
          <h1 className="font-heading mt-1 text-[clamp(30px,4vw,44px)] leading-tight">Hi, {first}</h1>
        </div>
        <SignOutButton />
      </div>

      {/* Orders */}
      <section className="mt-12">
        <h2 className="font-heading text-2xl">My orders</h2>
        {orders.docs.length === 0 ? (
          <div className="mt-5 rounded-xl border border-border p-8 text-center">
            <p className="text-lg text-body">You have no orders in this account yet.</p>
            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85">
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
            {orders.docs.map((o) => {
              const st = STATUS[o.status] || STATUS['awaiting-payment']
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5">
                  <div className="min-w-0">
                    <div className="font-heading text-[17px]">{o.productTitle}</div>
                    <div className="text-[15px] text-muted-foreground">
                      {o.orderNumber} · {date(o.createdAt)} · {o.quantity} {o.quantity === 1 ? 'piece' : 'pieces'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>{st.label}</span>
                    <span className="font-heading text-lg">{money(o.total)}</span>
                    <Link
                      href={`/order/${encodeURIComponent(o.orderNumber)}?t=${encodeURIComponent(o.publicToken)}`}
                      className="rounded-full border border-ink px-4 py-2 text-[15px] font-medium hover:bg-ink hover:text-white"
                    >
                      {o.status === 'awaiting-payment' ? 'Pay or view' : 'View'}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-8 rounded-xl bg-[#F3F4F6] p-6">
          <h3 className="font-heading text-lg">Ordered before without signing in?</h3>
          <p className="mb-4 mt-1 text-[15px] text-body">Add that order to this account with its order number and the mobile number you used.</p>
          <ClaimOrderForm />
        </div>
      </section>

      {/* Saved designs */}
      <section className="mt-14">
        <h2 className="font-heading text-2xl">My designs</h2>
        {designs.docs.length === 0 ? (
          <p className="mt-4 text-lg text-body">
            Designs you save in the{' '}
            <Link href="/design" className="text-sky underline underline-offset-2">
              Design Studio
            </Link>{' '}
            while signed in appear here.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {designs.docs.map((d) => {
              const product = d.product && typeof d.product === 'object' ? (d.product as Product) : null
              const preview = d.previews?.[0]?.url
              return (
                <Link key={d.id} href={product ? `/design/${product.slug}?d=${encodeURIComponent(d.token)}` : '/design'} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt={`${d.productTitle} design`} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">No preview</div>
                    )}
                  </div>
                  <div className="font-heading mt-3 text-[17px] text-ink">{d.productTitle}</div>
                  <div className="text-[15px] text-muted-foreground">
                    {d.colour ? `${d.colour} · ` : ''}Saved {date(d.updatedAt)}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Details */}
      <section className="mt-14 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl">My details</h2>
          <div className="mt-5 max-w-md">
            <DetailsForm name={me.name} phone={me.phone || ''} email={me.email} />
          </div>
        </div>
        <div>
          <h2 className="font-heading text-2xl">Change password</h2>
          <div className="mt-5 max-w-md">
            <PasswordForm />
          </div>
        </div>
      </section>
    </div>
  )
}
