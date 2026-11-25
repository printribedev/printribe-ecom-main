import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const QUOTE_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Quote sent', value: 'quoted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Lost', value: 'lost' },
] as const

/**
 * Quote requests from the Quote page. The server creates them (re-pricing every item from the database);
 * only your team can read them. The "Estimate" is the shop's fixed price, so the team can confirm or adjust it in the reply.
 */
export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: { singular: 'Quote request', plural: 'Quote requests' },
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'quoteNumber',
    defaultColumns: ['quoteNumber', 'status', 'name', 'company', 'estimateTotal', 'createdAt'],
    group: 'Shop',
  },
  fields: [
    { name: 'quoteNumber', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', options: [...QUOTE_STATUSES], admin: { position: 'sidebar' } },
    { name: 'customer', type: 'relationship', relationTo: 'customers', admin: { readOnly: true, position: 'sidebar', description: 'Set if they were signed in.' } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'phone', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'email', type: 'email', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'company', type: 'text', admin: { readOnly: true } },
        { name: 'gstNumber', type: 'text', label: 'GST number', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text', admin: { readOnly: true } },
        { name: 'pincode', type: 'text', admin: { readOnly: true } },
        { name: 'multipleAddresses', type: 'checkbox', admin: { readOnly: true, description: 'Wants delivery to more than one address' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'timeline', type: 'text', admin: { readOnly: true, description: 'standard or deadline' } },
        { name: 'deadline', type: 'text', admin: { readOnly: true, description: 'Date they need it by' } },
      ],
    },
    {
      name: 'items',
      type: 'array',
      admin: { readOnly: true, description: 'What they want. Prices are the shop prices at the time of the request.' },
      fields: [
        { name: 'productTitle', type: 'text' },
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'colour', type: 'text' },
        { name: 'quantity', type: 'number' },
        { name: 'unitPrice', type: 'number', admin: { description: 'Per piece, including printing for studio designs' } },
        { name: 'printingPerPiece', type: 'number' },
        { name: 'lineTotal', type: 'number' },
        { name: 'design', type: 'relationship', relationTo: 'designs', admin: { description: 'Set when the item came from the Design Studio' } },
        { name: 'designPreview', type: 'text' },
      ],
    },
    { name: 'estimateTotal', type: 'number', admin: { readOnly: true, description: 'Items total at shop prices, delivery not included' } },
    { name: 'notes', type: 'textarea', admin: { readOnly: true } },
    {
      name: 'files',
      type: 'array',
      admin: { readOnly: true, description: 'Files the customer uploaded (right-click and "Save as" to download).' },
      fields: [{ name: 'url', type: 'text' }],
    },
    { name: 'quotedAmount', type: 'number', admin: { description: 'The amount you quoted, for your own records.' } },
    { name: 'internalNotes', type: 'textarea', admin: { description: 'For your team only.' } },
  ],
}
