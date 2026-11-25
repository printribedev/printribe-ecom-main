import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * A design a customer made in the design studio. The server creates and updates these after re-checking
 * everything (the browser is never trusted). Customers reopen their design with a secret link token.
 * Files and previews live in Cloudflare R2; this document stores the links and the price that was worked out.
 */
export const Designs: CollectionConfig = {
  slug: 'designs',
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'productTitle',
    defaultColumns: ['productTitle', 'colour', 'quantity', 'perPiece', 'status', 'updatedAt'],
    group: 'Shop',
  },
  fields: [
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'saved',
      options: [
        { label: 'Saved', value: 'saved' },
        { label: 'Ordered', value: 'ordered' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'The account this belongs to, if the customer was signed in.' },
    },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
    { name: 'productTitle', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'colour', type: 'text', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'quantity', type: 'number', admin: { readOnly: true } },
        { name: 'baseUnit', type: 'number', admin: { readOnly: true, description: 'Product price per piece' } },
        { name: 'extrasPerPiece', type: 'number', admin: { readOnly: true, description: 'Printing extras per piece' } },
        { name: 'perPiece', type: 'number', admin: { readOnly: true } },
        { name: 'total', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'areasUsed',
      type: 'array',
      admin: { readOnly: true, description: 'Every print area that has a design on it, with the print method chosen.' },
      fields: [
        { name: 'view', type: 'text' },
        { name: 'areaKey', type: 'text' },
        { name: 'areaName', type: 'text' },
        { name: 'size', type: 'text' },
        { name: 'method', type: 'relationship', relationTo: 'print-methods' },
        { name: 'methodTitle', type: 'text' },
        { name: 'extra', type: 'number' },
      ],
    },
    {
      name: 'previews',
      type: 'array',
      admin: { readOnly: true, description: 'Preview picture of the design on the product, one per side.' },
      fields: [
        { name: 'view', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'files',
      type: 'array',
      admin: { readOnly: true, description: 'Original files the customer uploaded. Use these to prepare the print.' },
      fields: [{ name: 'url', type: 'text' }],
    },
    { name: 'views', type: 'json', admin: { readOnly: true, description: 'The design itself, one entry per side (used to reopen it in the studio).' } },
    { name: 'methodByArea', type: 'json', admin: { readOnly: true } },
  ],
}
