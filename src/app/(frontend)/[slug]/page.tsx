import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import React, { cache } from 'react'

/** Pages that are planned for later phases. Until each one is built, its link shows "Coming soon". */
const COMING_SOON: Record<string, string> = {
  home: 'Printribe', // shown only if the homepage hasn't been created yet
  'bulk-orders': 'Bulk orders',
  quote: 'Get a quote',
  'design-studio': 'Design Studio',
  about: 'About Printribe',
  contact: 'Contact us',
  terms: 'Terms and conditions',
  privacy: 'Privacy policy',
}
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
  })

  if (!page && decodedSlug in COMING_SOON) {
    // Pages that are planned but not built yet show a friendly holding page instead of an error.
    return (
      <div className="container py-28 text-center">
        <p className="mb-3 text-sm font-medium text-sky">Coming soon</p>
        <h1 className="font-heading text-[clamp(32px,5vw,56px)]">{COMING_SOON[decodedSlug]}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-body">
          We&apos;re building this page. Please check back soon.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white hover:bg-ink/85"
        >
          Back to home
        </Link>
      </div>
    )
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    // The homepage is made of full-width sections that manage their own spacing
    <article className={decodedSlug === 'home' ? '' : 'pt-16 pb-24'}>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
