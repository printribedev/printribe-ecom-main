import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/** Messages from the Contact page. The server creates these; only your team can read them. */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'need', 'quantity', 'status', 'createdAt'],
    group: 'Shop',
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'customer', type: 'relationship', relationTo: 'customers', admin: { readOnly: true, position: 'sidebar', description: 'Set if they were signed in.' } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'email', type: 'email', admin: { readOnly: true, description: 'Optional: some people only leave a phone number.' } },
        { name: 'phone', type: 'text', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'organisation', type: 'text', admin: { readOnly: true } },
        { name: 'gstNumber', type: 'text', label: 'GST number', admin: { readOnly: true } },
        { name: 'topic', type: 'text', admin: { readOnly: true, description: 'contact = Contact page, bulk = came from Bulk orders' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'interestedIn', type: 'text', admin: { readOnly: true, description: 'What they would like' } },
        { name: 'need', type: 'text', admin: { readOnly: true, description: 'Who it is for' } },
        { name: 'quantity', type: 'text', admin: { readOnly: true } },
        { name: 'neededBy', type: 'text', admin: { readOnly: true, description: 'Date they need it by' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'bestTime', type: 'text', admin: { readOnly: true, description: 'Best time to contact them' } },
        { name: 'channel', type: 'text', admin: { readOnly: true, description: 'form = Send it, whatsapp = they also opened WhatsApp' } },
      ],
    },
    { name: 'message', type: 'textarea', required: true, admin: { readOnly: true } },
    {
      name: 'files',
      type: 'array',
      admin: { readOnly: true, description: 'Logos or designs they uploaded (right-click and "Save as" to download).' },
      fields: [{ name: 'url', type: 'text' }],
    },
    { name: 'heardFrom', type: 'text', admin: { readOnly: true } },
    { name: 'internalNotes', type: 'textarea', admin: { description: 'For your team only.' } },
  ],
}
