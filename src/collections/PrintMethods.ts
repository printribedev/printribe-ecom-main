import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

/** Ways a design can be put on a product (screen printing, embroidery…) and what each one costs per print area. */
export const PrintMethods: CollectionConfig = {
  slug: 'print-methods',
  labels: { singular: 'Print method', plural: 'Print methods' },
  access: {
    create: authenticated,
    delete: authenticated,
    // Customers see only active methods in the design studio.
    read: ({ req }) => (req.user ? true : { active: { equals: true } }),
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'smallPrice', 'mediumPrice', 'largePrice', 'active'],
    group: 'Shop',
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'For example Screen printing, Embroidery, DTF.' } },
    slugField({ position: undefined }),
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Untick to hide this method from customers.' },
    },
    { name: 'description', type: 'textarea', admin: { description: 'One or two lines shown to the customer, for example what it is best for.' } },
    {
      type: 'row',
      fields: [
        { name: 'smallPrice', type: 'number', required: true, min: 0, defaultValue: 0, admin: { description: 'Extra rupees per piece for one SMALL print area.' } },
        { name: 'mediumPrice', type: 'number', required: true, min: 0, defaultValue: 0, admin: { description: 'Extra rupees per piece for one MEDIUM print area.' } },
        { name: 'largePrice', type: 'number', required: true, min: 0, defaultValue: 0, admin: { description: 'Extra rupees per piece for one LARGE print area.' } },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Smaller numbers show first.' },
    },
  ],
}
