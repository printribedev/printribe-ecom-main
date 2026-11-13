import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const ORDER_STATUSES = [
  { label: 'Awaiting payment', value: 'awaiting-payment' },
  { label: 'Payment submitted (check it)', value: 'payment-submitted' },
  { label: 'Payment verified', value: 'payment-verified' },
  { label: 'In production', value: 'in-production' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

/**
 * One document per customer order. Customers never write to this directly: the server creates it after
 * re-checking the product, quantity and price. Only mark "Payment verified" after you see the money.
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
      name: 'publicToken',
      type: 'text',
      required: true,
      index: true,
      access: { read: () => false },
      admin: { hidden: true },
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
      label: 'Payment',
      fields: [
        {
          name: 'paymentProof',
          type: 'upload',
          relationTo: 'payment-proofs',
          admin: { description: 'Screenshot uploaded by the customer. Check it against your UPI app before verifying.' },
        },
        { name: 'utr', type: 'text', admin: { description: 'UPI transaction ID the customer entered (optional).' } },
        { name: 'paymentSubmittedAt', type: 'date', admin: { readOnly: true } },
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
