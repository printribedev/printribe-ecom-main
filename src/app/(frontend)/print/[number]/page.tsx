import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { PrintButton } from '@/components/Admin/PrintButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Job sheet | Printribe', robots: { index: false, follow: false } }

type Args = { params: Promise<{ number: string }> }

const money = (n?: number | null) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const when = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS: Record<string, string> = {
  'awaiting-payment': 'AWAITING PAYMENT (do not produce yet)',
  paid: 'PAID',
  'in-production': 'IN PRODUCTION',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED (do not produce)',
}

/** A one-page job sheet for the production team: what to make, how to print it, and where to ship it. Staff only. */
export default async function JobSheetPage({ params }: Args) {
  const { number } = await params
  const payload = await getPayload({ config: configPromise })

  // Only signed-in admin users (the team) may open this
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || (user as { collection?: string }).collection !== 'users') {
    redirect(`/admin/login?redirect=${encodeURIComponent(`/print/${number}`)}`)
  }

  const found = await payload.find({ collection: 'orders', where: { orderNumber: { equals: number } }, limit: 1, overrideAccess: true, depth: 0 })
  const o = found.docs[0]
  if (!o) notFound()

  const snap = o.designSnapshot
  const previews = (snap?.previews || []).filter((p) => p.url)
  const files = (snap?.files || []).filter((f) => f.url)
  const areas = snap?.areasUsed || []
  const pieces = o.sizes && o.sizes.length > 0 ? o.sizes : null

  return (
    <div className="print-root fixed inset-0 z-[100] overflow-auto bg-white text-black">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .print-root { position: static !important; overflow: visible !important; }
          header, footer { display: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[820px] px-6 py-8">
        <div className="no-print mb-6 flex items-center justify-between gap-4">
          <a href="/admin/collections/orders" className="text-[15px] underline">
            ← Back to orders
          </a>
          <PrintButton />
        </div>

        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-neutral-600">Printribe job sheet</p>
            <h1 className="font-heading text-4xl">{o.orderNumber}</h1>
            <p className="mt-1 text-sm text-neutral-600">Placed {when(o.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="rounded border-2 border-black px-3 py-1 text-sm font-semibold">{STATUS[o.status] || o.status}</p>
            {o.paidAt && <p className="mt-1 text-sm text-neutral-600">Paid {when(o.paidAt)}</p>}
          </div>
        </header>

        <section className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-heading text-lg">What to make</h2>
            <p className="mt-1 text-[17px] font-medium">{o.productTitle}</p>
            <p>Colour: <strong>{o.colour || '—'}</strong></p>
            <p>Total pieces: <strong>{o.quantity}</strong></p>
            {pieces ? (
              <table className="mt-2 border-collapse text-[15px]">
                <thead>
                  <tr>
                    {pieces.map((s) => (
                      <th key={s.id || s.size} className="border border-black px-3 py-1 text-center">{s.size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {pieces.map((s) => (
                      <td key={s.id || s.size} className="border border-black px-3 py-1 text-center font-semibold">{s.quantity}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : null}
          </div>
          <div>
            <h2 className="font-heading text-lg">Ship to</h2>
            <p className="mt-1 text-[17px] font-medium">{o.customerName}</p>
            <p>
              {o.addressLine1}
              {o.addressLine2 ? `, ${o.addressLine2}` : ''}
              <br />
              {o.city}, {o.state} {o.pincode}
            </p>
            <p className="mt-1">Phone: <strong>{o.phone}</strong></p>
            <p>Email: {o.email}</p>
          </div>
        </section>

        {snap ? (
          <>
            <section className="mt-6">
              <h2 className="font-heading text-lg">Design</h2>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {previews.map((p) => (
                  <figure key={p.url} className="break-inside-avoid">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url!} alt={`${p.view} view`} className="w-full rounded border border-neutral-300 bg-neutral-100 object-contain" />
                    <figcaption className="mt-1 text-center text-sm font-semibold">{cap(p.view)}</figcaption>
                  </figure>
                ))}
              </div>
            </section>

            <section className="mt-6 break-inside-avoid">
              <h2 className="font-heading text-lg">Print areas and methods</h2>
              <table className="mt-2 w-full border-collapse text-[15px]">
                <thead>
                  <tr className="bg-neutral-100 text-left">
                    <th className="border border-black px-3 py-1.5">Side</th>
                    <th className="border border-black px-3 py-1.5">Print area</th>
                    <th className="border border-black px-3 py-1.5">Area size</th>
                    <th className="border border-black px-3 py-1.5">Print method</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((a, i) => (
                    <tr key={i}>
                      <td className="border border-black px-3 py-1.5">{cap(a.view)}</td>
                      <td className="border border-black px-3 py-1.5">{a.areaName}</td>
                      <td className="border border-black px-3 py-1.5">{cap(a.size)}</td>
                      <td className="border border-black px-3 py-1.5 font-semibold">{a.methodTitle || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {files.length > 0 && (
              <section className="mt-6 break-inside-avoid">
                <h2 className="font-heading text-lg">Customer&apos;s original files</h2>
                <ol className="mt-2 list-decimal pl-5 text-[14px]">
                  {files.map((f) => (
                    <li key={f.url} className="break-all">
                      <a href={f.url!} className="underline">{f.url}</a>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        ) : (
          <p className="mt-6 text-neutral-600">This order was not made in the design studio, so there is no custom design attached.</p>
        )}

        <section className="mt-6 break-inside-avoid border-t border-neutral-300 pt-3 text-[15px]">
          <div className="flex flex-wrap justify-between gap-4">
            <p>Order total: <strong>{money(o.total)}</strong> (items {money(o.subtotal)} + delivery {o.deliveryFee ? money(o.deliveryFee) : 'free'})</p>
            {o.courier || o.trackingNumber ? (
              <p>
                Courier: <strong>{o.courier || '—'}</strong> · Tracking: <strong>{o.trackingNumber || '—'}</strong>
              </p>
            ) : null}
          </div>
          {o.internalNotes && (
            <p className="mt-2 whitespace-pre-line">
              <strong>Notes:</strong> {o.internalNotes}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
