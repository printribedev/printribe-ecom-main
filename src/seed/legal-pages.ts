/**
 * Copies the built-in Terms and Privacy text into the admin, as editable pages (Pages > terms / privacy).
 * It only CREATES a page that does not exist yet. A page that already exists (and may have been edited) is never touched.
 * Run with:  npm run seed:legal        (uses the database in .env: local by default)
 * To run it on the LIVE site, put the live POSTGRES_URL in the environment for that one command.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'
import type { LegalBlock, LegalDoc } from '../components/Legal/LegalPage'
import { privacy } from '../lib/legal/privacy'
import { terms } from '../lib/legal/terms'

const EMAIL = 'info@theprintribe.com'

const text = (t: string) => ({ type: 'text', version: 1, text: t, format: 0, mode: 'normal', style: '', detail: 0 })

// Splits a sentence so the email address becomes a mailto link.
const inline = (t: string) => {
  const parts = t.split(EMAIL)
  const out: any[] = []
  parts.forEach((part, i) => {
    if (part) out.push(text(part))
    if (i < parts.length - 1)
      out.push({
        type: 'link',
        version: 3,
        direction: 'ltr',
        format: '',
        indent: 0,
        fields: { linkType: 'custom', url: `mailto:${EMAIL}`, newTab: false },
        children: [text(EMAIL)],
      })
  })
  return out
}

const node = (type: string, children: any[], extra: Record<string, unknown> = {}) => ({
  type,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children,
  ...extra,
})

const block = (b: LegalBlock) => {
  if (b.type === 'h3') return node('heading', [text(b.text)], { tag: 'h3' })
  if (b.type === 'ul')
    return node(
      'list',
      b.items.map((it, i) => node('listitem', inline(it), { value: i + 1 })),
      { listType: 'bullet', start: 1, tag: 'ul' },
    )
  return node('paragraph', inline(b.text), { textFormat: 0, textStyle: '' })
}

const lexical = (blocks: LegalBlock[]) => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: blocks.map(block) },
})

async function createPage(payload: Awaited<ReturnType<typeof getPayload>>, slug: string, title: string, doc: LegalDoc) {
  const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  if (existing.docs[0]) {
    console.log(`/${slug}: already exists, left as it is.`)
    return
  }
  await payload.create({
    collection: 'pages',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title,
      slug,
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        {
          blockType: 'textPage',
          updated: doc.updated,
          title: doc.title,
          intro: doc.intro,
          sections: doc.sections.map((s) => ({ heading: s.heading, body: lexical(s.blocks) })),
        },
      ],
    } as any,
  })
  console.log(`/${slug}: created.`)
}

async function run() {
  const payload = await getPayload({ config })
  await createPage(payload, 'terms', 'Terms and Conditions', terms)
  await createPage(payload, 'privacy', 'Privacy Policy', privacy)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
