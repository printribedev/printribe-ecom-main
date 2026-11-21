import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

/** The sides of a product a customer can design on. */
const STUDIO_VIEWS = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]

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
        {
          name: 'mockups',
          type: 'array',
          label: 'Design studio photos',
          admin: {
            description:
              'Design studio only: one cut-out photo (no background) of this product in this colour for each side. Upload a PNG or WebP with a transparent background.',
          },
          fields: [
            { name: 'view', type: 'select', required: true, options: STUDIO_VIEWS },
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
          ],
        },
      ],
    },
    {
      name: 'sizes',
      type: 'array',
      admin: { description: 'For example S, M, L, XL.' },
      fields: [{ name: 'size', type: 'text', required: true }],
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'studio',
      type: 'group',
      label: 'Design studio',
      admin: { description: 'Lets customers design this product online. Add the colour photos in the Colours section above.' },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Let customers design this product',
        },
        {
          name: 'views',
          type: 'array',
          label: 'Sides and print areas',
          admin: { description: 'One row per side of the product (for example Front and Back), with the areas where printing is allowed.' },
          fields: [
            { name: 'view', type: 'select', required: true, options: STUDIO_VIEWS },
            {
              name: 'areas',
              type: 'array',
              label: 'Print areas',
              admin: { description: 'Where a design can be placed on this side.' },
              fields: [
                { name: 'name', type: 'text', required: true, admin: { description: 'For example Chest, Full front, Left sleeve.' } },
                {
                  name: 'size',
                  type: 'select',
                  required: true,
                  defaultValue: 'medium',
                  options: [
                    { label: 'Small', value: 'small' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Large', value: 'large' },
                  ],
                  admin: { description: 'Decides the print price (see Print methods).' },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'x', type: 'number', required: true, min: 0, max: 100, admin: { description: 'Left edge, as % of the photo width.' } },
                    { name: 'y', type: 'number', required: true, min: 0, max: 100, admin: { description: 'Top edge, as % of the photo height.' } },
                    { name: 'width', type: 'number', required: true, min: 1, max: 100, admin: { description: 'Width, as % of the photo width.' } },
                    { name: 'height', type: 'number', required: true, min: 1, max: 100, admin: { description: 'Height, as % of the photo height.' } },
                  ],
                },
                {
                  name: 'sizeNote',
                  type: 'text',
                  admin: { description: 'Optional real size shown to customers, for example "Up to 30 x 35 cm".' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
