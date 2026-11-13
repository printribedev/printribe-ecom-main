/**
 * Adds clearly marked SAMPLE categories and products so the All products page has something to show.
 * Run with:  npm run seed:shop
 * Running it again RESETS the sample products to these values, so edit or delete the samples only once you no longer need them.
 * Prices, colours and delivery times below are placeholders, not real Printribe prices.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function seed() {
  const payload = await getPayload({ config })
  const ctx = { disableRevalidate: true }

  const findOrCreateCat = async (data: { title: string; parent?: number; description?: string; order: number }) => {
    const slug = slugify(data.title)
    const found = await payload.find({ collection: 'product-categories', where: { slug: { equals: slug } }, limit: 1 })
    if (found.docs[0]) return found.docs[0].id
    const made = await payload.create({ collection: 'product-categories', data: { ...data, slug }, context: ctx })
    return made.id
  }

  const apparel = await findOrCreateCat({
    title: 'Apparel',
    order: 1,
    description: 'Custom apparel for teams, events and everyday wear. Made to order, delivered on time.',
  })
  const accessories = await findOrCreateCat({
    title: 'Accessories',
    order: 2,
    description: 'Caps, bags and more, with your design on them.',
  })
  const tshirts = await findOrCreateCat({ title: 'T-shirts', parent: apparel, order: 1 })
  const polos = await findOrCreateCat({ title: 'Polos', parent: apparel, order: 2 })
  const hoodies = await findOrCreateCat({ title: 'Hoodies', parent: apparel, order: 3 })
  const jerseys = await findOrCreateCat({ title: 'Jerseys', parent: apparel, order: 4 })
  const caps = await findOrCreateCat({ title: 'Caps', parent: accessories, order: 1 })
  const bags = await findOrCreateCat({ title: 'Bags', parent: accessories, order: 2 })

  const palette = {
    Black: '#1D1D1F',
    White: '#FFFFFF',
    Navy: '#1E3A5F',
    'Sky blue': '#38BDF8',
    Grey: '#9CA3AF',
    Maroon: '#7F1D1D',
  }
  const col = (...names: (keyof typeof palette)[]) => names.map((n) => ({ name: n, hex: palette[n] }))
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ size }))

  const samples = [
    { title: '[Sample] Classic T-Shirt', category: apparel, subCategory: tshirts, price: 399, minQuantity: 1, priceTiers: [{ minQuantity: 10, price: 369 }, { minQuantity: 25, price: 339 }, { minQuantity: 50, price: 319 }], deliveryDays: '10 to 15 days', colours: col('Black', 'White', 'Navy', 'Sky blue', 'Grey') },
    { title: '[Sample] Premium T-Shirt', category: apparel, subCategory: tshirts, price: 549, minQuantity: 5, deliveryDays: '10 to 15 days', colours: col('Black', 'White', 'Maroon') },
    { title: '[Sample] Classic Polo', category: apparel, subCategory: polos, price: 599, minQuantity: 10, priceTiers: [{ minQuantity: 25, price: 559 }, { minQuantity: 50, price: 519 }], deliveryDays: '10 to 15 days', colours: col('Navy', 'White', 'Black', 'Sky blue') },
    { title: '[Sample] Premium Hoodie', category: apparel, subCategory: hoodies, price: 1199, minQuantity: 5, deliveryDays: '12 to 15 days', colours: col('Black', 'Grey', 'Navy') },
    { title: '[Sample] Team Jersey', category: apparel, subCategory: jerseys, price: 749, minQuantity: 10, deliveryDays: '10 to 15 days', colours: col('Sky blue', 'Navy', 'White') },
    { title: '[Sample] Classic Cap', category: accessories, subCategory: caps, price: 249, minQuantity: 10, deliveryDays: '7 to 10 days', colours: col('Black', 'Navy', 'White') },
    { title: '[Sample] Tote Bag', category: accessories, subCategory: bags, price: 199, minQuantity: 10, deliveryDays: '7 to 10 days', colours: col('White', 'Black') },
  ]

  for (const s of samples) {
    const slug = slugify(s.title)
    const found = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1 })
    const data = { ...s, slug, published: true, sizes, description: 'Sample product. Replace in the admin.' }
    if (found.docs[0]) {
      await payload.update({ collection: 'products', id: found.docs[0].id, data, context: ctx })
      continue
    }
    await payload.create({
      collection: 'products',
      data: { ...s, slug, published: true, sizes, description: 'Sample product. Replace in the admin.' },
      context: ctx,
    })
  }

  payload.logger.info('Sample shop categories and products are in place.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err?.data ? JSON.stringify(err.data, null, 2) : err)
  process.exit(1)
})
