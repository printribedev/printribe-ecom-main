import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { BulkSection } from '@/components/Contact/BulkSection'
import { OrderLookup } from '@/components/Contact/OrderLookup'
import { SentenceEnquiry } from '@/components/Contact/SentenceEnquiry'
import { getCustomer } from '@/lib/account/session'
import { FAQ } from '@/lib/contact/faq'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Contact us | Printribe',
  description: 'Start a custom merch project, ask about an order, or get free design help from Printribe.',
}

const digits = (s: string) => s.replace(/[^\d]/g, '')

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ContactPage({ searchParams }: Args) {
  const sp = await searchParams
  const bulk = (Array.isArray(sp.topic) ? sp.topic[0] : sp.topic) === 'bulk'
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({ slug: 'contact-settings' })
  const me = await getCustomer()

  const email = settings.email || 'info@theprintribe.com'
  const whatsapp = settings.whatsapp ? digits(settings.whatsapp) : ''
  const phone = settings.phone || ''
  const replyTime = settings.replyTime || 'soon'

  return (
    <div className="container py-12 pb-24">
      <p className="text-[15px] text-muted-foreground">{bulk ? 'Bulk orders' : 'Contact'}</p>
      <h1 className="font-heading mt-1 text-[clamp(36px,5.5vw,64px)] leading-[1.05]">{bulk ? 'Planning a bulk order?' : 'How can we help?'}</h1>
      <p className="mt-4 max-w-xl text-lg text-body">
        {bulk
          ? `Finish the sentence below with what you need and how many. We send a price and mockup, and reply ${replyTime}.`
          : `Finish the sentence below and we will take it from there. Our team replies ${replyTime}.`}
      </p>

      {/* The sentence: the heart of the page */}
      <div className="mt-8">
        <SentenceEnquiry replyTime={replyTime} whatsapp={whatsapp} topic={bulk ? 'bulk' : 'contact'} prefill={me ? { name: me.name, email: me.email, phone: me.phone || '' } : undefined} />
      </div>

      {/* Bulk orders: how it works and real volume prices */}
      <div className="mt-6">
        <BulkSection />
      </div>

      {/* Order help and ways to talk */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section id="order-help" className="scroll-mt-28 rounded-3xl border border-border bg-white p-8">
          <h2 className="font-heading text-2xl">Where is my order?</h2>
          <p className="mt-2 text-lg text-body">Enter your order number (it starts with PT-) and the mobile number you used. Signed in? Your orders are in{' '}
            <Link href="/account" className="text-sky underline underline-offset-2">
              My account
            </Link>
            .
          </p>
          <OrderLookup />
        </section>

        <aside className="rounded-3xl bg-[#F3F4F6] p-8">
          <h2 className="font-heading text-2xl">Prefer to talk?</h2>
          <ul className="mt-5 space-y-5 text-[18px]">
            {whatsapp && (
              <li>
                <span className="block text-sm text-muted-foreground">WhatsApp</span>
                <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi Printribe, I would like to know more about custom merch.')}`} target="_blank" rel="noreferrer" className="font-medium hover:text-sky">
                  Chat with us on WhatsApp
                </a>
              </li>
            )}
            {phone && (
              <li>
                <span className="block text-sm text-muted-foreground">Phone</span>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="font-medium hover:text-sky">
                  {phone}
                </a>
              </li>
            )}
            <li>
              <span className="block text-sm text-muted-foreground">Email</span>
              <a href={`mailto:${email}`} className="font-medium hover:text-sky">
                {email}
              </a>
            </li>
            {settings.hours && (
              <li>
                <span className="block text-sm text-muted-foreground">Hours</span>
                {settings.hours}
              </li>
            )}
            {settings.location && (
              <li>
                <span className="block text-sm text-muted-foreground">Based in</span>
                {settings.location}
              </li>
            )}
          </ul>
        </aside>
      </div>

      {/* More ways in */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Link href="/design" className="rounded-2xl border border-border p-6 hover:bg-[#F9FAFB]">
          <h3 className="font-heading text-xl">Design it yourself</h3>
          <p className="mt-2 text-[16px] text-body">Add your logo or text in the Design Studio and see the price as you go.</p>
        </Link>
        <div className="rounded-2xl border border-border p-6">
          <h3 className="font-heading text-xl">Free design help</h3>
          <p className="mt-2 text-[16px] text-body">Send your idea, logo or a rough sketch in the sentence above (use &quot;Add your email, a logo or more details&quot;). Our designers help get it ready for print.</p>
        </div>
      </div>

      {/* FAQ */}
      <section className="mt-20 max-w-3xl">
        <h2 className="font-heading text-[clamp(26px,3.4vw,36px)]">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-medium">
                {item.q}
                <span aria-hidden className="text-xl transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[17px] text-body">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
