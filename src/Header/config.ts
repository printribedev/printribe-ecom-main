import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement strip (top of every page)',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Show the strip' },
        { name: 'badge', type: 'text', defaultValue: 'New', label: 'Small label, e.g. New' },
        { name: 'text', type: 'text', label: 'Message' },
        { name: 'url', type: 'text', label: 'Link (optional)' },
      ],
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Menu',
      fields: [
        link({
          appearances: false,
        }),
        {
          name: 'soon',
          type: 'checkbox',
          label: 'Show a "Soon" tag next to this item',
          defaultValue: false,
        },
      ],
      maxRows: 7,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Main button (top right)',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Get a quote' },
        { name: 'url', type: 'text', defaultValue: '/quote' },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
  versions: false,
}
