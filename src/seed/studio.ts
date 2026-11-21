/**
 * Adds clearly marked SAMPLE print methods so the design studio has something to price against.
 * Run with:  npm run seed:studio
 * The prices are placeholders, NOT real Printribe prices. Replace them in the admin (Shop, Print methods).
 * Safe to run again: methods that already exist are left alone.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

const METHODS = [
  { title: '[Sample] Screen printing', description: 'Sample text. Best for bold designs in a few colours.', smallPrice: 20, mediumPrice: 35, largePrice: 55, order: 1 },
  { title: '[Sample] DTF transfer', description: 'Sample text. Full colour designs and photos.', smallPrice: 30, mediumPrice: 50, largePrice: 80, order: 2 },
  { title: '[Sample] Embroidery', description: 'Sample text. Stitched logos with a premium finish.', smallPrice: 45, mediumPrice: 80, largePrice: 130, order: 3 },
]

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function seed() {
  const payload = await getPayload({ config })
  for (const m of METHODS) {
    const found = await payload.find({ collection: 'print-methods', where: { title: { equals: m.title } }, limit: 1, overrideAccess: true })
    if (found.docs[0]) continue
    await payload.create({ collection: 'print-methods', data: { ...m, slug: slugify(m.title), active: true }, context: { disableRevalidate: true } })
  }
  payload.logger.info('Sample print methods are in place.')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
