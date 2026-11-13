import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

/**
 * Shop categories such as Apparel and Accessories, and the sub-categories inside them
 * (T-shirts, Polos...). A sub-category simply picks a "Parent category".
 */
export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: { singular: 'Shop category', plural: 'Shop categories' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'order'],
    group: 'Shop',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ position: undefined }),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'product-categories',
      admin: {
        description: 'Leave empty for a main category (Apparel). Pick the main category for a sub-category (T-shirts).',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One or two lines shown under the category heading on the All products page.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Picture for the round tile at the top of the All products page.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 10,
      admin: { description: 'Smaller numbers come first.' },
    },
  ],
}
