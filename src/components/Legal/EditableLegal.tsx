import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LegalPage, type LegalDoc } from '@/components/Legal/LegalPage'

/**
 * Terms and Privacy. If the page exists in the admin (Pages > terms / privacy) it is shown, so the team can edit it there.
 * If it does not exist yet, the built-in text in the code is shown instead, so the page is never empty.
 */
export async function EditableLegal({ slug, fallback }: { slug: string; fallback: LegalDoc }) {
  let page = null
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      draft: false,
      limit: 1,
      pagination: false,
      overrideAccess: false,
      where: { slug: { equals: slug } },
    })
    page = result.docs?.[0] || null
  } catch {
    page = null
  }

  const hasText = page?.layout?.some((b) => b.blockType === 'textPage')
  if (!page || !hasText) return <LegalPage doc={fallback} />

  return (
    <article className="pt-12 pb-24">
      <RenderBlocks blocks={page.layout} />
    </article>
  )
}
