import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'about',
      type: 'textarea',
      label: 'Short description (under the logo)',
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Link columns',
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [link({ appearances: false })],
          admin: { initCollapsed: true },
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      label: 'Social links',
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Instagram' } },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'legalText',
      type: 'text',
      label: 'Copyright line',
      defaultValue: '© Printribe. All rights reserved.',
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Legal links (Terms, Privacy…)',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
  versions: false,
}
