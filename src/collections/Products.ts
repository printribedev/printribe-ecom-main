import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

/** Everything the shop shows about a product. Prices are fixed, so customers see the final price. */
export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: authenticated,
    delete: authenticated,
    // Visitors only see products marked "Published". Signed-in admins see everything.
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'published'],
    group: 'Shop',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ position: undefined }),
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Tick to show this product on the website.' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'product-categories',
      required: true,
      admin: { position: 'sidebar', description: 'Main category, for example Apparel.' },
    },
    {
      name: 'subCategory',
      type: 'relationship',
      relationTo: 'product-categories',
      admin: { position: 'sidebar', description: 'Optional, for example T-shirts.' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Price per piece in rupees, GST included. This is the "From" price on the shop page.' },
    },
    {
      name: 'minQuantity',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      admin: { description: 'Smallest number of pieces a customer can order.' },
    },
    {
      name: 'priceTiers',
      type: 'array',
      admin: {
        description:
          'Optional "buy more, pay less" prices. Example: 25 pieces and above cost 380 each. Leave empty if the price is the same for every quantity.',
      },
      fields: [
        { name: 'minQuantity', type: 'number', required: true, min: 2, admin: { description: 'This price applies from this many pieces.' } },
        { name: 'price', type: 'number', required: true, min: 0, admin: { description: 'Price per piece in rupees.' } },
      ],
    },
    {
      name: 'deliveryDays',
      type: 'text',
      defaultValue: '10 to 15 days',
      admin: { description: 'Shown on the card, for example "10 to 15 days".' },
    },
    {
      name: 'images',
      type: 'array',
      admin: { description: 'The first picture is the main one. The second shows when someone hovers over the card.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'colours',
      type: 'array',
      admin: { description: 'One row per colour. These become the colour dots on the card.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'hex', type: 'text', required: true, admin: { description: 'Colour code such as #1D1D1F' } },
      ],
    },
    {
      name: 'sizes',
      type: 'array',
      admin: { description: 'For example S, M, L, XL.' },
      fields: [{ name: 'size', type: 'text', required: true }],
    },
    { name: 'description', type: 'textarea' },
  ],
}
