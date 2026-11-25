import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { QuoteBuilder } from '@/components/Quote/QuoteBuilder'
import { getCustomer } from '@/lib/account/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Get a quote | Printribe',
  description: 'Build a quote for custom apparel and accessories. See an instant estimate, send your request, and pay nothing until you approve.',
}

export default async function QuotePage() {
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({ slug: 'contact-settings' })
  const me = await getCustomer()
  const replyTime = settings.replyTime || 'soon'

  return (
    <div className="container py-12 pb-24">
      <p className="text-[15px] text-muted-foreground">Get a quote</p>
      <h1 className="font-heading mt-1 text-[clamp(34px,5vw,56px)] leading-[1.05]">Build your quote</h1>
      <p className="mt-4 max-w-2xl text-lg text-body">
        Add products, see an instant estimate, and send it to us. We send your quote {replyTime}, and you pay nothing until you approve it.
      </p>
      <div className="mt-10">
        <QuoteBuilder replyTime={replyTime} prefill={me ? { name: me.name, email: me.email, phone: me.phone || '' } : undefined} />
      </div>
    </div>
  )
}
