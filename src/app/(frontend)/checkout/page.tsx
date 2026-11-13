import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { CheckoutForm } from '@/components/Shop/CheckoutForm'
import { parseSizes, quoteOrder } from '@/lib/shop/order'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Checkout | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function CheckoutPage({ searchParams }: Args) {
  const sp = await searchParams
  const slug = one(sp.product) || ''
  const sizes = parseSizes(one(sp.sizes))
  const quote = slug && sizes ? await quoteOrder({ slug, colour: one(sp.colour), sizes, qty: Number(one(sp.qty)) }) : null

  if (!quote || !quote.ok) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-heading text-[clamp(28px,4vw,40px)]">We could not set up your order</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-body">
          {quote && !quote.ok ? quote.error : 'Please choose a product first.'}
        </p>
        <Link href={slug ? `/products/${slug}` : '/shop'} className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85">
          {slug ? 'Back to the product' : 'Browse products'}
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-10 pb-20">
      <h1 className="font-heading mb-8 text-[clamp(30px,4vw,44px)] leading-tight">Checkout</h1>
      <CheckoutForm
        s={{
          slug: quote.product.slug,
          title: quote.product.title,
          image: quote.product.image,
          colour: quote.colour,
          sizes: quote.sizes,
          quantity: quote.quantity,
          unitPrice: quote.unitPrice,
          subtotal: quote.subtotal,
          deliveryFee: quote.deliveryFee,
          total: quote.total,
        }}
      />
    </div>
  )
}
