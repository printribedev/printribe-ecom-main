import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const ORDER_STATUSES = [
  { label: 'Awaiting payment', value: 'awaiting-payment' },
  { label: 'Paid', value: 'paid' },
  { label: 'In production', value: 'in-production' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

/**
 * One document per customer order. Customers never write to this directly: the server creates it after
 * re-checking the product, quantity and price. An order becomes "Paid" automatically, only after Razorpay's
 * payment signature is verified on the server. Ship only orders that show "Paid" (or later).
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customerName', 'productTitle', 'quantity', 'total', 'createdAt'],
    group: 'Shop',
  },
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting-payment',
      options: [...ORDER_STATUSES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'The account this belongs to, if the customer was signed in.' },
    },
    {
      name: 'design',
      type: 'relationship',
      relationTo: 'designs',
      admin: { readOnly: true, position: 'sidebar', description: 'The studio design this order was made from, if any.' },
    },
    {
      name: 'publicToken',
      type: 'text',
      required: true,
      index: true,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'designSnapshot',
      type: 'group',
      label: 'Studio design (frozen copy made when the order was placed)',
      admin: { description: 'What to print. Later changes the customer makes to their saved design do not change this.' },
      fields: [
        { name: 'printingPerPiece', type: 'number', admin: { readOnly: true, description: 'Printing extras per piece, already included in the unit price' } },
        {
          name: 'previews',
          type: 'array',
          admin: { readOnly: true, description: 'Picture of the design on the product, one per side.' },
          fields: [
            { name: 'view', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
        {
          name: 'areasUsed',
          type: 'array',
          admin: { readOnly: true, description: 'Print areas used and the print method for each.' },
          fields: [
            { name: 'view', type: 'text' },
            { name: 'areaName', type: 'text' },
            { name: 'size', type: 'text' },
            { name: 'methodTitle', type: 'text' },
            { name: 'extra', type: 'number' },
          ],
        },
        {
          name: 'files',
          type: 'array',
          admin: { readOnly: true, description: 'Original files the customer uploaded.' },
          fields: [{ name: 'url', type: 'text' }],
        },
        { name: 'views', type: 'json', admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: 'What was ordered',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
        { name: 'productTitle', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'colour', type: 'text', admin: { readOnly: true } },
        {
          name: 'sizes',
          type: 'array',
          admin: { readOnly: true },
          fields: [
            { name: 'size', type: 'text', required: true },
            { name: 'quantity', type: 'number', required: true },
          ],
        },
        { name: 'quantity', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'unitPrice', type: 'number', required: true, admin: { readOnly: true, description: 'Rupees per piece' } },
        { name: 'subtotal', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'deliveryFee', type: 'number', required: true, admin: { readOnly: true } },
        { name: 'total', type: 'number', required: true, admin: { readOnly: true, description: 'Amount the customer must pay' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Customer and delivery address',
      fields: [
        { name: 'customerName', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'addressLine1', type: 'text', required: true },
        { name: 'addressLine2', type: 'text' },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'pincode', type: 'text', required: true },
      ],
    },
    {
      type: 'collapsible',
      label: 'Payment (Razorpay)',
      fields: [
        { name: 'razorpayOrderId', type: 'text', index: true, admin: { readOnly: true } },
        { name: 'razorpayPaymentId', type: 'text', admin: { readOnly: true, description: 'Search this ID in the Razorpay dashboard.' } },
        { name: 'paidAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Shipping',
      fields: [
        { name: 'courier', type: 'text' },
        { name: 'trackingNumber', type: 'text' },
        { name: 'internalNotes', type: 'textarea', admin: { description: 'Only you can see this.' } },
      ],
    },
  ],
}
