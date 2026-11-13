import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/** Shop-wide settings the owner can change in the admin: delivery fee rule and UPI payment details. */
export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Shop settings',
  access: { read: authenticated, update: authenticated },
  admin: { group: 'Shop' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'deliveryFee',
          type: 'number',
          required: true,
          defaultValue: 75,
          min: 0,
          admin: { description: 'Delivery charge in rupees when the order is below the free-delivery amount.' },
        },
        {
          name: 'freeDeliveryAbove',
          type: 'number',
          required: true,
          defaultValue: 1000,
          min: 0,
          admin: { description: 'Orders with items totalling this much or more get free delivery.' },
        },
      ],
    },
    {
      name: 'upiId',
      type: 'text',
      admin: { description: 'The UPI ID customers pay to, for example printribe@okbank. Required before orders can be taken.' },
    },
    {
      name: 'upiPayeeName',
      type: 'text',
      defaultValue: 'Printribe',
      admin: { description: 'The name shown in the customer’s UPI app.' },
    },
    {
      name: 'paymentNote',
      type: 'textarea',
      admin: { description: 'Optional extra line shown on the payment page, for example a helpline number.' },
    },
  ],
}
