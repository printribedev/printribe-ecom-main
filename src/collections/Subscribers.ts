import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * People who signed up on the website (newsletter or Design Studio waiting list).
 * Visitors can't read or change this list; sign-ups arrive through /api/subscribe.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Subscriber', plural: 'Subscribers' },
  access: {
    create: () => false, // only the sign-up endpoint creates entries
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'createdAt'],
    group: 'Marketing',
  },
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'newsletter',
      options: [
        { label: 'Newsletter', value: 'newsletter' },
        { label: 'Design Studio waiting list', value: 'design-studio' },
      ],
    },
  ],
}
